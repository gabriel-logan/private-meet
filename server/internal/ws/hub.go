package ws

import (
	"encoding/json"
	"sync"
)

type Hub struct {
	clients map[*Client]bool
	rooms   map[string]map[*Client]bool

	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message

	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case c := <-h.register:
			h.mu.Lock()
			h.clients[c] = true
			h.mu.Unlock()

			h.JoinRoom("user:"+c.UserID, c)

		case c := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, c)

			affectedRooms := make([]string, 0, len(c.Rooms))
			for room := range c.Rooms {
				affectedRooms = append(affectedRooms, room)
				delete(h.rooms[room], c)
			}

			// Broadcast updated presence snapshots for rooms the client was in.
			// We cannot send on h.broadcast here (it would deadlock because Run is the receiver),
			// so we write directly to clients' send channels.
			for _, room := range affectedRooms {
				h.broadcastRoomUsersSnapshotLocked(room)
			}

			close(c.send)

			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			clients := h.rooms[msg.Room]
			for c := range clients {
				select {
				case c.send <- mustJSON(msg):
				default:
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) JoinRoom(room string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.rooms[room] == nil {
		h.rooms[room] = make(map[*Client]bool)
	}

	h.rooms[room][c] = true
	c.Rooms[room] = true
}

func (h *Hub) LeaveRoom(room string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	delete(h.rooms[room], c)
	delete(c.Rooms, room)
}

func (h *Hub) GetRoomUsers(room string) []RoomUser {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clients := h.rooms[room]
	if clients == nil {
		return nil
	}

	users := make([]RoomUser, 0, len(clients))
	for c := range clients {
		users = append(users, RoomUser{UserID: c.UserID, Username: c.Username})
	}

	return users
}

func (h *Hub) broadcastRoomUsersSnapshotLocked(room string) {
	clients := h.rooms[room]
	if clients == nil {
		return
	}

	users := make([]RoomUser, 0, len(clients))
	for c := range clients {
		users = append(users, RoomUser{UserID: c.UserID, Username: c.Username})
	}

	payload := mustJSON(&Message{
		Type: MessageRoomUsers,
		Room: room,
		Data: mustJSON(RoomUsersPayload{Users: users}),
	})
	for c := range clients {
		select {
		case c.send <- payload:
		default:
		}
	}
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}
