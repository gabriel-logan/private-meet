package main

import (
	"log"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/httpapi"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
)

func main() {
	env := config.InitEnv()

	hub := ws.NewHub()
	go hub.Run()

	r := httpapi.NewRouter(hub)

	serverPort := env.ServerPort

	server := &http.Server{
		Addr:    ":" + serverPort,
		Handler: r,
	}

	log.Println("Starting server on http://localhost:" + serverPort)
	log.Println("Running in " + env.GoEnv + " mode")
	log.Fatal(server.ListenAndServe())
}
