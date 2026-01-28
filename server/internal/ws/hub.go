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

			// canal pessoal para notificações
			h.JoinRoom("user:"+c.UserID, c)

		case c := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, c)
			for room := range c.Rooms {
				delete(h.rooms[room], c)
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

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}
