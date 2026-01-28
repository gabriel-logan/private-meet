package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	serverMux := http.NewServeMux()

	serverMux.HandleFunc("GET /ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, "Failed to upgrade to WebSocket", http.StatusInternalServerError)
			return
		}
		defer conn.Close()

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				break
			}

			err = conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				break
			}
		}
	})

	server := &http.Server{
		Addr:    ":3000",
		Handler: serverMux,
	}

	log.Println("Starting server on http://localhost:3000")
	log.Fatal(server.ListenAndServe())
}
