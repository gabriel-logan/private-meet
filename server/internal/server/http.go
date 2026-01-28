package server

import (
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/ws"
)

func NewRouter(hub *ws.Hub) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /ws", ws.ServeWS(hub))

	return mux
}
