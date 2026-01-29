package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
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
	Rooms    map[string]bool
}

const (
	writeWait         = 10 * time.Second
	pongWait          = 60 * time.Second
	pingPeriod        = (pongWait * 9) / 10
	maxWSMessageBytes = 64 * 1024
	maxChatRunes      = 5000
	maxRoomIDLength   = 128
	maxProtocolErrors = 10
)

func (c *Client) IsInRoom(room string) bool {
	c.hub.mu.RLock()

	defer c.hub.mu.RUnlock()

	return c.Rooms[room]
}

func (c *Client) safeSend(msg []byte) bool {
	select {
	case c.send <- msg:
		return true
	default:
		return false
	}
}

func (c *Client) sendError(message string) bool {
	response := struct {
		Type MessageType `json:"type"`
		Data any         `json:"data"`
	}{
		Type: MessageError,
		Data: map[string]string{
			"error": message,
		},
	}

	return c.safeSend(mustJSON(&response))
}

func (c *Client) readPump() { // nosonar
	defer func() {
		select {
		case c.hub.unregister <- c:
		default:
		}
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxWSMessageBytes)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
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
			// Handle close errors gracefully
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Println("WebSocket closed:", err)
			} else {
				log.Println("WebSocket read error:", err)
			}

			break
		}

		if !msg.Type.IsValid() {
			continue
		}

		if msg.Room == "" && msg.Type != MessageUtilsGenerateRoomID {
			continue
		}

		if len([]rune(msg.Room)) > maxRoomIDLength {
			if !fail(fmt.Sprintf("Room ID too long (maximum is %d characters)", maxRoomIDLength)) {
				return
			}

			continue
		}

		msg.From = c.UserID

		switch msg.Type {
		case MessageChatJoin:
			c.hub.JoinRoom(msg.Room, c)

			users := c.hub.GetRoomUsers(msg.Room)

			c.hub.broadcast <- &Message{
				Type: MessageRoomUsers,
				Room: msg.Room,
				Data: mustJSON(RoomUsersPayload{Users: users}),
			}

		case MessageChatLeave:
			c.hub.LeaveRoom(msg.Room, c)

			users := c.hub.GetRoomUsers(msg.Room)

			c.hub.broadcast <- &Message{
				Type: MessageRoomUsers,
				Room: msg.Room,
				Data: mustJSON(RoomUsersPayload{Users: users}),
			}

		case MessageChatMessage:
			if !c.IsInRoom(msg.Room) {
				continue
			}

			var payload ChatPayload
			if err := json.Unmarshal(msg.Data, &payload); err != nil {
				continue
			}

			payload.Message = strings.TrimSpace(payload.Message)
			if payload.Message == "" {
				if !fail("Message cannot be empty") {
					return
				}

				continue
			}

			if len([]rune(payload.Message)) > maxChatRunes {
				if !fail(fmt.Sprintf("Message too long (maximum is %d characters)", maxChatRunes)) {
					return
				}

				continue
			}

			msg.Data = mustJSON(payload)

			c.hub.broadcast <- &msg

		case MessageChatTyping:
			if !c.IsInRoom(msg.Room) {
				continue
			}

			var payload ChatTypingPayload
			if err := json.Unmarshal(msg.Data, &payload); err != nil {
				continue
			}

			msg.Data = mustJSON(payload)

			c.hub.broadcast <- &msg

		case MessageUtilsGenerateRoomID:
			newRoomID := uuid.NewString()

			response := struct {
				Type MessageType `json:"type"`
				Data any         `json:"data"`
			}{
				Type: MessageUtilsGenerateRoomID,
				Data: map[string]string{"roomID": newRoomID},
			}

			c.safeSend(mustJSON(&response))
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
				if err = c.conn.WriteMessage(websocket.CloseMessage, nil); err != nil {
					log.Println("WebSocket write close error:", err)
				}

				return
			}

			if err = c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
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
