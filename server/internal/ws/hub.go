package ws

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/google/uuid"
)

type inboundMessage struct {
	client *Client
	msg    Message
}

type Hub struct {
	clients map[*Client]bool
	rooms   map[string]map[*Client]bool

	register   chan *Client
	unregister chan *Client
	inbound    chan inboundMessage
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		inbound:    make(chan inboundMessage, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.clients[c] = true

			if c.Rooms == nil {
				c.Rooms = make(map[string]bool)
			}

			h.joinRoom("user:"+c.UserID, c)

		case c := <-h.unregister:
			delete(h.clients, c)

			affectedRooms := make([]string, 0, len(c.Rooms))
			for room := range c.Rooms {
				affectedRooms = append(affectedRooms, room)
				h.removeClientFromRoom(room, c)
			}

			for _, room := range affectedRooms {
				h.broadcastRoomUsersSnapshot(room)
			}

			close(c.send)

		case in := <-h.inbound:
			h.handleInbound(in.client, &in.msg)
		}
	}
}

func (h *Hub) isClientInRoom(room string, c *Client) bool {
	return c.Rooms != nil && c.Rooms[room]
}

func (h *Hub) joinRoom(room string, c *Client) {
	if h.rooms[room] == nil {
		h.rooms[room] = make(map[*Client]bool)
	}

	h.rooms[room][c] = true
	c.Rooms[room] = true
}

func (h *Hub) removeClientFromRoom(room string, c *Client) {
	if h.rooms[room] != nil {
		delete(h.rooms[room], c)
		if len(h.rooms[room]) == 0 {
			delete(h.rooms, room)
		}
	}

	if c.Rooms != nil {
		delete(c.Rooms, room)
	}
}

func (h *Hub) handleInbound(c *Client, msg *Message) {
	switch msg.Type {
	case MessageChatJoin:
		h.joinRoom(msg.Room, c)
		h.broadcastRoomUsersSnapshot(msg.Room)

	case MessageChatLeave:
		h.removeClientFromRoom(msg.Room, c)
		h.broadcastRoomUsersSnapshot(msg.Room)

	case MessageChatMessage:
		if !h.isClientInRoom(msg.Room, c) {
			c.sendError("You are not in this room")
			return
		}

		var payload ChatPayload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			c.sendError("Invalid chat message payload")
			return
		}

		payload.Message = strings.TrimSpace(payload.Message)
		if payload.Message == "" {
			c.sendError("Message cannot be empty")
			return
		}

		if len([]rune(payload.Message)) > maxChatRunes {
			c.sendError("Message too long")
			return
		}

		msg.Data = mustJSON(payload)

		h.broadcastToRoom(msg.Room, msg)

	case MessageChatTyping:
		if !h.isClientInRoom(msg.Room, c) {
			c.sendError("You are not in this room")
			return
		}

		var payload ChatTypingPayload
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			c.sendError("Invalid typing payload")
			return
		}

		msg.Data = mustJSON(payload)

		h.broadcastToRoom(msg.Room, msg)

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

	default:
		c.sendError("Invalid message type")
	}
}

func (h *Hub) broadcastToRoom(room string, msg *Message) {
	clients := h.rooms[room]
	if clients == nil {
		return
	}

	payload := mustJSON(msg)
	for c := range clients {
		select {
		case c.send <- payload:
		default:
		}
	}
}

func (h *Hub) broadcastRoomUsersSnapshot(room string) {
	clientsMap := h.rooms[room]

	if clientsMap == nil {
		return
	}

	clients := make([]*Client, 0, len(clientsMap))
	users := make([]RoomUser, 0, len(clientsMap))

	for c := range clientsMap {
		clients = append(clients, c)
		users = append(users, RoomUser{
			UserID:   c.UserID,
			Username: c.Username,
		})
	}

	payload := mustJSON(&Message{
		Type: MessageRoomUsers,
		Room: room,
		Data: mustJSON(RoomUsersPayload{Users: users}),
	})

	for _, c := range clients {
		select {
		case c.send <- payload:
		default:
		}
	}
}

func mustJSON(v any) []byte {
	b, err := json.Marshal(v)

	if err != nil {
		log.Println("json marshal error:", err)
		return []byte(`{"type":"general.error","data":{"error":"internal error"}}`)
	}

	return b
}
