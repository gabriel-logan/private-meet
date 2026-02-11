package main

import (
	"log"
	"net/http"
	"runtime"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/httpapi"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
)

func main() {
	// Initialize logger - uses log package internally
	config.InitLogger()

	// Load environment variables
	env := config.InitEnv()

	// Initialize WebSocket manager
	manager := ws.NewManager(runtime.NumCPU() * 4)

	// Initialize HTTP router
	r := httpapi.NewRouter(manager)

	server := &http.Server{
		Addr:    ":" + env.ServerPort,
		Handler: r,
	}

	log.Println("Starting server on http://localhost:" + env.ServerPort)
	log.Printf("Running in %s mode with TLS: %t \n", env.GoEnv, env.UseLocalTLS)

	if env.UseLocalTLS {
		log.Fatal(server.ListenAndServeTLS("../cert/fake_cert.pem", "../cert/fake_key.pem"))
	} else {
		log.Fatal(server.ListenAndServe())
	}
}
