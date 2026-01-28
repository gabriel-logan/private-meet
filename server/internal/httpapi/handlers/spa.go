package handlers

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func ServeSPA(w http.ResponseWriter, r *http.Request) {
	spaDir := "../web/dist"
	indexPath := filepath.Join(spaDir, "index.html")

	// Get the absolute path of the requested file
	requestedPath := filepath.Join(spaDir, r.URL.Path)

	// Check if the requested file exists
	if _, err := os.Stat(requestedPath); os.IsNotExist(err) {
		// If not, serve the index.html file
		http.ServeFile(w, r, indexPath)
		return
	} else if err != nil {
		// If there's an error other than non-existence, log it and return a 500
		log.Printf("Error checking file %s: %v", requestedPath, err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// If the file exists, serve it
	http.ServeFile(w, r, requestedPath)
}
