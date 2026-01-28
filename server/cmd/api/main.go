package main

import (
	"log"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/server"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
)

func main() {
	hub := ws.NewHub()
	go hub.Run()

	r := server.NewRouter(hub)

	server := &http.Server{
		Addr:    ":3000",
		Handler: r,
	}

	log.Println("Starting server on http://localhost:3000")
	log.Fatal(server.ListenAndServe())
}
