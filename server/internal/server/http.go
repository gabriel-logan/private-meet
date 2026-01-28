package server

import (
	"encoding/json"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/middleware"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
	"github.com/google/uuid"
)

func NewRouter(hub *ws.Hub) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /ws", ws.ServeWS(hub))
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	mux.HandleFunc("POST /auth/sign-in", func(w http.ResponseWriter, r *http.Request) {
		accessToken, err := security.GenerateJWT(uuid.NewString(), "guest")
		if err != nil {
			http.Error(w, "Failed to generate access token", http.StatusInternalServerError)
			return
		}

		response := map[string]string{
			"accessToken": accessToken,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})
	mux.Handle("/", http.FileServer(http.Dir("./web/build/")))

	return middleware.CORSMiddleware(mux)
}
