package ws

import (
	"encoding/json"
	"strings"
	"unicode/utf8"
)

type inboundMessage struct {
	client *Client
	msg    *Message
}

type Hub struct {
	rooms map[string]map[*Client]bool

	disconnect chan *Client
	inbound    chan *inboundMessage
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]map[*Client]bool),

		disconnect: make(chan *Client, 1024*4),
		inbound:    make(chan *inboundMessage, 1024*10),
	}
}

func (h *Hub) Run() { // nosonar
	for {
		select {
		case c := <-h.disconnect:
			if c == nil {
				continue
			}

			affectedRooms := h.clientLeaveAllRooms(c)

			for _, room := range affectedRooms {
				h.clientBroadcastRoomUsersSnapshot(room)
			}

		case in := <-h.inbound:
			if in == nil || in.client == nil || in.msg == nil {
				continue
			}

			c := in.client
			msg := in.msg

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
					c.sendError("You can't send a message to this room")
					continue
				}

				var payload ChatData
				if err := json.Unmarshal(msg.Data, &payload); err != nil {
					c.sendError("Invalid chat message payload")
					continue
				}

				payload.Message = strings.TrimSpace(payload.Message)
				if payload.Message == "" {
					c.sendError("Message cannot be empty")
					continue
				}

				if utf8.RuneCountInString(payload.Message) > maxChatRunes {
					c.sendError("Message is too long")
					continue
				}

				h.clientBroadcastToRoom(msg.Room, msg)

			case MessageChatTyping:
				if !h.isClientInRoom(msg.Room, c) {
					c.sendError("You can't send typing notifications to this room")
					continue
				}

				var payload ChatTypingData
				if err := json.Unmarshal(msg.Data, &payload); err != nil {
					c.sendError("Invalid typing payload")
					continue
				}

				h.clientBroadcastToRoom(msg.Room, msg)

			case MessageWebRTCOffer, MessageWebRTCAnswer, MessageWebRTCIceCandidate:
				if !h.isClientInRoom(msg.Room, c) {
					c.sendError("You can't send WebRTC messages to this room")
					continue
				}

				to := ""

				switch msg.Type {
				case MessageWebRTCOffer:
					var payload WebRTCOfferData
					if err := json.Unmarshal(msg.Data, &payload); err != nil {
						c.sendError("Invalid WebRTC offer payload")
						continue
					}

					to = strings.TrimSpace(payload.To)

				case MessageWebRTCAnswer:
					var payload WebRTCAnswerData
					if err := json.Unmarshal(msg.Data, &payload); err != nil {
						c.sendError("Invalid WebRTC answer payload")
						continue
					}

					to = strings.TrimSpace(payload.To)

				case MessageWebRTCIceCandidate:
					var payload WebRTCIceCandidateData
					if err := json.Unmarshal(msg.Data, &payload); err != nil {
						c.sendError("Invalid WebRTC ICE candidate payload")
						continue
					}

					to = strings.TrimSpace(payload.To)
				}

				if to == "" {
					c.sendError("Missing WebRTC recipient")
					continue
				}

				h.clientBroadcastToRoom(msg.Room, msg)

			default:
				c.sendError("Invalid message type")
			}
		}
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
	clients := h.rooms[room]

	if clients == nil {
		return
	}

	delete(clients, c)

	if len(clients) == 0 {
		delete(h.rooms, room)
	}
}

func (h *Hub) clientLeaveAllRooms(c *Client) []string {
	affectedRooms := make([]string, 0)

	for room, members := range h.rooms {
		if !members[c] {
			continue
		}

		delete(members, c)

		affectedRooms = append(affectedRooms, room)

		if len(members) == 0 {
			delete(h.rooms, room)
		}
	}

	return affectedRooms
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
			c.resetDroppedMessages()
		default:
			if c.incDroppedMessages() >= maxDroppedMessages {
				select {
				case h.disconnect <- c:
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

	data, err := json.Marshal(RoomUsersData{Users: users})
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
