package ws

import (
	"log"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		env := config.GetEnv()

		if env.GoEnv == "development" {
			return true
		}

		allowedOrigins := env.AllowedOrigins

		if allowedOrigins[0] == "*" {
			return true
		}

		origin := r.Header.Get("Origin")

		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				return true
			}
		}

		return false
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
			hub:             nil,
			conn:            conn,
			send:            make(chan []byte, 8),
			UserID:          userID,
			Username:        username,
			droppedMessages: 0,
			limiter:         rate.NewLimiter(10, 15),
		}

		go client.writePump()
		go client.readPump(manager)
	}
}
