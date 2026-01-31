package main

import (
	"log"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/httpapi"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
)

func main() {
	// Initialize logger - uses log package internally
	config.InitLogger()

	// Load environment variables
	env := config.InitEnv()

	// Initialize WebSocket hub
	hub := ws.NewHub()
	go hub.Run() // Start the hub in a separate goroutine

	// Initialize HTTP router
	r := httpapi.NewRouter(hub)

	server := &http.Server{
		Addr:    ":" + env.ServerPort,
		Handler: r,
	}

	log.Println("Starting server on http://localhost:" + env.ServerPort)
	log.Println("Running in " + env.GoEnv + " mode")
	log.Fatal(server.ListenAndServe())
}
