package ws

import (
	"encoding/json"
	"log"
)

func mustJSON(v any) []byte {
	b, err := json.Marshal(v)

	if err != nil {
		log.Println("json marshal error:", err)
		return []byte(`{"type":"general.error","data":{"error":"internal error"}}`)
	}

	return b
}
