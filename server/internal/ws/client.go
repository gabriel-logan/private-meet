package ws

import (
	"encoding/json"
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
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

func (c *Client) readPump() { // nosonar
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(1024)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg Message
		if err := c.conn.ReadJSON(&msg); err != nil {
			break
		}

		msg.From = c.UserID

		if !msg.Type.IsValid() {
			return
		}

		if msg.Room == "" && msg.Type != MessageUtilsGenerateRoomID {
			return
		}

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
			var payload ChatPayload
			if err := json.Unmarshal(msg.Data, &payload); err != nil {
				return
			}

			payload.Message = strings.TrimSpace(payload.Message)
			if payload.Message == "" {
				return
			}

			msg.Data = mustJSON(payload)

			c.hub.broadcast <- &msg

		case MessageChatTyping:
			var payload ChatTypingPayload
			if err := json.Unmarshal(msg.Data, &payload); err != nil {
				return
			}

			msg.Data = mustJSON(payload)

			c.hub.broadcast <- &msg

		case MessageUtilsGenerateRoomID:
			newRoomID := uuid.NewString()

			response := Message{
				Type: MessageUtilsGenerateRoomID,
				Data: mustJSON(struct {
					RoomID string `json:"roomID"`
				}{
					RoomID: newRoomID,
				}),
			}

			c.send <- mustJSON(&response)
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
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))

			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}

			c.conn.WriteMessage(websocket.TextMessage, msg)

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			c.conn.WriteMessage(websocket.PingMessage, nil)
		}
	}
}
