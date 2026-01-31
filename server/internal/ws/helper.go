package ws

import (
	"encoding/json"
	"log"
)

func mustMarshalJSON(v any) []byte {
	b, err := json.Marshal(v)

	if err != nil {
		log.Println("json marshal error:", err)
		return []byte(`{"type":"general.error","data":{"error":"internal error"}}`)
	}

	return b
}

func newMessage(msgType MessageType, room string, data any, from string) []byte {
	msg := &Message{
		Type: msgType,
		Data: mustMarshalJSON(data),
		From: from,
	}

	if room != "" {
		msg.Room = room
	}

	return mustMarshalJSON(msg)
}

func newErrorMessage(message string) []byte {
	return newMessage(
		MessageError,
		"",
		map[string]string{"error": message},
		"system",
	)
}
