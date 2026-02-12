package handlers

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func ServeSPA(w http.ResponseWriter, r *http.Request) {
	distPath := "../client/frontend/dist"

	distAbs, err := filepath.Abs(distPath)
	if err != nil {
		log.Printf("failed to get absolute path of dist directory: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	reqPath := filepath.Clean(r.URL.Path)

	absPath := filepath.Join(distAbs, reqPath)

	if !strings.HasPrefix(absPath, distAbs) {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}

	if info, err := os.Stat(absPath); err == nil && !info.IsDir() {
		http.ServeFile(w, r, absPath)
		return
	}

	http.ServeFile(w, r, filepath.Join(distAbs, "index.html"))
}
