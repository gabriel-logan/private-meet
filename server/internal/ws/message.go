package ws

import "encoding/json"

type Message struct {
	Type string          `json:"type"`
	Room string          `json:"room,omitempty"`
	Data json.RawMessage `json:"data"`
	From string          `json:"from,omitempty"`
}

type ChatPayload struct {
	Message string `json:"message"`
}
