package httpapi

import (
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/httpapi/handlers"
	"github.com/gabriel-logan/private-meet/server/internal/middleware"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
)

func NewRouter(hub *ws.Hub) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /ws", ws.ServeWS(hub))
	mux.HandleFunc("GET /health", handlers.Health)
	mux.HandleFunc("POST /auth/sign-in", handlers.SignIn)
	mux.HandleFunc("GET /", handlers.ServeSPA)

	if config.GetEnv().GoEnv == "development" {
		return middleware.Apply(mux, middleware.Logger(), middleware.CORS())
	} else {
		return middleware.Apply(mux, middleware.Logger())
	}
}
