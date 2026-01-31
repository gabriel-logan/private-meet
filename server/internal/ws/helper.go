package ws

import (
	"encoding/json"
	"log"
)

func newMessage(msgType MessageType, room string, data json.RawMessage, from string) []byte {
	if data == nil {
		data = json.RawMessage(`null`)
	}

	if !json.Valid(data) {
		log.Println("invalid json data for message")
		return []byte(`{"type":"general.error","data":{"error":"internal error"},"from":"system"}`)
	}

	msg := &Message{
		Type: msgType,
		Data: data,
		From: from,
	}

	if room != "" {
		msg.Room = room
	}

	v, err := json.Marshal(msg)
	if err != nil {
		log.Println("json marshal error:", err)
		return []byte(`{"type":"general.error","data":{"error":"internal error"},"from":"system"}`)
	}

	return v
}

func newErrorMessage(message string) []byte {
	payload, err := json.Marshal(map[string]string{"error": message})
	if err != nil {
		log.Println("json marshal error:", err)
		return []byte(`{"type":"general.error","data":{"error":"internal error"},"from":"system"}`)
	}

	return newMessage(
		MessageError,
		"",
		payload,
		"system",
	)
}
