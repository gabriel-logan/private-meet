package ws

import (
	"encoding/json"
	"strings"
	"unicode/utf8"

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

			h.clientJoinRoom("user:"+c.UserID, c)

		case c := <-h.unregister:
			delete(h.clients, c)

			affectedRooms := h.clientLeaveAllRooms(c)

			for _, room := range affectedRooms {
				h.clientBroadcastRoomUsersSnapshot(room)
			}

			close(c.send)

		case in := <-h.inbound:
			h.handleInbound(in.client, &in.msg)
		}
	}
}

func (h *Hub) handleInbound(c *Client, msg *Message) {
	// Ensure From is always server-controlled.
	msg.From = c.UserID

	switch msg.Type {
	case MessageChatJoin:
		h.clientJoinRoom(msg.Room, c)
		h.clientBroadcastRoomUsersSnapshot(msg.Room)

	case MessageChatLeave:
		h.clientLeaveRoom(msg.Room, c)
		h.clientBroadcastRoomUsersSnapshot(msg.Room)

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

		if utf8.RuneCountInString(payload.Message) > maxChatRunes {
			c.sendError("Message is too long")
			return
		}

		h.clientBroadcastToRoom(msg.Room, msg)

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

		h.clientBroadcastToRoom(msg.Room, msg)

	case MessageUtilsGenerateRoomID:
		newRoomID := uuid.NewString()

		c.safeSend(
			newMessage(
				MessageUtilsGenerateRoomID,
				"",
				[]byte(`{"roomID":"`+newRoomID+`"}`),
				"system",
			),
		)

	default:
		c.sendError("Invalid message type")
	}
}

func (h *Hub) isClientInRoom(room string, c *Client) bool {
	clients := h.rooms[room]

	if clients == nil {
		return false
	}

	return clients[c]
}

func (h *Hub) clientJoinRoom(room string, c *Client) {
	if h.rooms[room] == nil {
		h.rooms[room] = make(map[*Client]bool)
	}

	h.rooms[room][c] = true
}

func (h *Hub) clientLeaveRoom(room string, c *Client) {
	if h.rooms[room] != nil {
		delete(h.rooms[room], c)
		if len(h.rooms[room]) == 0 {
			delete(h.rooms, room)
		}
	}
}

func (h *Hub) clientLeaveAllRooms(c *Client) []string {
	affected := make([]string, 0)

	for room, members := range h.rooms {
		if !members[c] {
			continue
		}

		delete(members, c)

		affected = append(affected, room)

		if len(members) == 0 {
			delete(h.rooms, room)
		}
	}

	return affected
}

func (h *Hub) clientBroadcastToRoom(room string, msg *Message) {
	clients := h.rooms[room]
	if clients == nil {
		return
	}

	payload := newMessage(msg.Type, msg.Room, msg.Data, msg.From)

	for c := range clients {
		select {
		case c.send <- payload:
			c.droppedMessages = 0
		default:
			c.droppedMessages++

			if c.droppedMessages >= maxDroppedMessages {
				select {
				case h.unregister <- c:
				default:
				}
			}
		}
	}
}

func (h *Hub) clientBroadcastRoomUsersSnapshot(room string) {
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

	data, err := json.Marshal(RoomUsersPayload{Users: users})
	if err != nil {
		for _, c := range clients {
			c.safeSend(newErrorMessage("internal error"))
		}

		return
	}

	payload := newMessage(
		MessageRoomUsers,
		room,
		data,
		"system",
	)

	for _, c := range clients {
		c.safeSend(payload)
	}
}
