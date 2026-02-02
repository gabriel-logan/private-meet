package ws

import (
	"encoding/json"
	"log"
)

var internalErrorMessage = []byte(`{"type":"general.error","data":{"error":"internal error"},"from":"system"}`)

func newMessage(msgType MessageType, room string, data json.RawMessage, from string) []byte {
	if data == nil {
		data = json.RawMessage(`null`)
	}

	if !json.Valid(data) {
		log.Println("invalid json data for message")
		return internalErrorMessage
	}

	msg := &Message{
		Type: msgType,
		Data: data,
		From: from,
		Room: room,
	}

	v, err := json.Marshal(msg)
	if err != nil {
		log.Println("json marshal error:", err)
		return internalErrorMessage
	}

	return v
}

func newErrorMessage(message string) []byte {
	payload, err := json.Marshal(map[string]string{"error": message})
	if err != nil {
		log.Println("json marshal error:", err)
		return internalErrorMessage
	}

	return newMessage(
		MessageError,
		"",
		payload,
		"system",
	)
}
