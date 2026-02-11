package ws

import (
	"log"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		env := config.GetEnv()

		if env.GoEnv == "development" {
			return true
		}

		origin := r.Header.Get("Origin")

		allowedOrigin := env.AllowedOrigin

		return origin == allowedOrigin
	},
}

func ServeWS(manager *Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")

		claims, err := security.ValidateJWT(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := claims.GetSubject()
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		username, err := claims.GetUsername()
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			http.Error(w, "Could not open WebSocket connection", http.StatusBadRequest)
			return
		}

		client := &Client{
			hub:      nil,
			conn:     conn,
			send:     make(chan []byte, 32),
			UserID:   userID,
			Username: username,
		}

		go client.writePump()
		go client.readPump(manager)
	}
}
