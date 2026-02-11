package ws

import (
	"fmt"
	"log"
	"strings"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte

	UserID   string
	Username string

	droppedMessages int32
}

func (c *Client) resetDroppedMessages() {
	atomic.StoreInt32(&c.droppedMessages, 0)
}

func (c *Client) incDroppedMessages() int32 {
	return atomic.AddInt32(&c.droppedMessages, 1)
}

const (
	writeWait          = 10 * time.Second
	pongWait           = 60 * time.Second
	pingPeriod         = (pongWait * 9) / 10
	maxWSMessageBytes  = 64 * 1024
	maxChatRunes       = 5000
	maxRoomIDLength    = 128
	maxProtocolErrors  = 10
	maxDroppedMessages = 5
)

func (c *Client) safeSend(msg []byte) bool {
	select {
	case c.send <- msg:
		return true
	default:
		return false
	}
}

func (c *Client) sendError(message string) bool {
	return c.safeSend(newErrorMessage(message))
}

func (c *Client) readPump(manager *Manager) { // nosonar
	defer func() {
		if manager != nil {
			manager.DisconnectClient(c)
		}

		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxWSMessageBytes)
	if err := c.conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Println("WebSocket set read deadline error:", err)
		return
	}
	c.conn.SetPongHandler(func(string) error {
		if err := c.conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
			log.Println("WebSocket set read deadline error:", err)
			return err
		}

		return nil
	})

	protocolErrors := 0

	fail := func(message string) bool {
		protocolErrors++

		if protocolErrors >= maxProtocolErrors {
			return false
		}

		return c.sendError(message)
	}

	for {
		var msg Message
		if err := c.conn.ReadJSON(&msg); err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Println("WebSocket closed:", err)
			} else {
				log.Println("WebSocket read error:", err)
			}

			break
		}

		if !msg.Type.IsValid() {
			if !fail("Invalid message type") {
				break
			}

			continue
		}

		if msg.Type == MessageUtilsGenerateRoomID {
			newRoomID := uuid.NewString()

			c.safeSend(
				newMessage(
					MessageUtilsGenerateRoomID,
					"",
					[]byte(`{"roomID":"`+newRoomID+`"}`),
					"system",
				),
			)

			continue
		}

		msg.Room = strings.TrimSpace(msg.Room)

		if msg.Room == "" {
			if !fail("Room ID is required") {
				break
			}

			continue
		}

		if len([]rune(msg.Room)) > maxRoomIDLength {
			if !fail(fmt.Sprintf("Room ID too long (maximum is %d characters)", maxRoomIDLength)) {
				break
			}

			continue
		}

		hub := manager.GetHubForRoom(msg.Room)

		// From here on, the hub is the single writer/owner of room state.
		// We only validate basic protocol shape here.
		select {
		case hub.inbound <- &inboundMessage{client: c, msg: &msg}:
		default:
			// Backpressure: if the hub is overloaded, drop the message.
			// This keeps the connection responsive under load.
			if !fail("Server busy") {
				continue
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			err := c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err != nil {
				log.Println("WebSocket set write deadline error:", err)
				return
			}

			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}

			if err = c.conn.WriteMessage(websocket.BinaryMessage, msg); err != nil {
				log.Println("WebSocket write message error:", err)
				return
			}

		case <-ticker.C:
			err := c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err != nil {
				log.Println("WebSocket set write deadline error:", err)
				return
			}

			if err = c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Println("WebSocket write ping error:", err)
				return
			}
		}
	}
}
