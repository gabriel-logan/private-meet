package ws

import (
	"encoding/json"
	"log"
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
		broadcast:  make(chan *Message, 256),
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
			h.mu.Unlock()

			// Broadcast updated presence snapshots for rooms the client was in.
			// We cannot send on h.broadcast here (it would deadlock because Run is the receiver),
			// so we write directly to clients' send channels.
			for _, room := range affectedRooms {
				h.broadcastRoomUsersSnapshot(room)
			}

			close(c.send)

		case msg := <-h.broadcast:
			payload := mustJSON(msg)

			h.mu.RLock()
			clients := h.rooms[msg.Room]

			for c := range clients {
				select {
				case c.send <- payload:
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

	if len(h.rooms[room]) == 0 {
		delete(h.rooms, room)
	}
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

func (h *Hub) broadcastRoomUsersSnapshot(room string) {
	h.mu.RLock()

	clientsMap := h.rooms[room]

	if clientsMap == nil {
		h.mu.RUnlock()
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

	h.mu.RUnlock()

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
