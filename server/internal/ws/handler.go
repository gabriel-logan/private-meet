package ws

import (
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWS(hub *Hub) http.HandlerFunc {
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
			return
		}

		client := &Client{
			hub:      hub,
			conn:     conn,
			send:     make(chan []byte, 256),
			UserID:   userID,
			Username: username,
			Rooms:    make(map[string]bool),
		}

		hub.register <- client

		go client.writePump()
		go client.readPump()
	}
}
