package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gabriel-logan/private-meet/server/internal/httpapi"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	hub := ws.NewHub()
	go hub.Run()

	r := httpapi.NewRouter(hub)

	serverPort := os.Getenv("SERVER_PORT")

	server := &http.Server{
		Addr:    ":" + serverPort,
		Handler: r,
	}

	log.Println("Starting server on http://localhost:" + serverPort)
	log.Fatal(server.ListenAndServe())
}
