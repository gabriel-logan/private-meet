package ws

import "hash/fnv"

type Manager struct {
	hubs []*Hub
}

func NewManager(shards int) *Manager {
	if shards <= 0 {
		shards = 1
	}

	hubs := make([]*Hub, shards)

	for i := 0; i < shards; i++ {
		h := NewHub()

		hubs[i] = h

		go h.Run()
	}

	return &Manager{hubs: hubs}
}

func (m *Manager) GetHubForRoom(room string) *Hub {
	h := fnv.New32a()

	if _, err := h.Write([]byte(room)); err != nil {
		return m.hubs[0]
	}

	idx := int(h.Sum32()) % len(m.hubs)

	return m.hubs[idx]
}

func (m *Manager) DisconnectClient(c *Client) {
	if c == nil {
		return
	}

	for _, hub := range m.hubs {
		if hub == nil {
			continue
		}

		select {
		case hub.disconnect <- c:
		default:
		}
	}
}
