package handlers

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func ServeSPA(w http.ResponseWriter, r *http.Request) {
	spaDir := "../web/dist"

	absSpaDir, err := filepath.Abs(filepath.Clean(spaDir))
	if err != nil {
		log.Printf("Error resolving SPA directory: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	indexPath := filepath.Join(absSpaDir, "index.html")

	relPath := filepath.Clean(r.URL.Path)
	relPath = strings.TrimPrefix(relPath, "/")

	requestedPath := filepath.Join(absSpaDir, relPath)
	absRequestedPath, err := filepath.Abs(requestedPath)
	if err != nil {
		http.ServeFile(w, r, indexPath)
		return
	}

	if absRequestedPath != absSpaDir &&
		!strings.HasPrefix(absRequestedPath, absSpaDir+string(os.PathSeparator)) {
		http.ServeFile(w, r, indexPath)
		return
	}

	info, err := os.Stat(absRequestedPath)
	if err != nil || info.IsDir() {
		http.ServeFile(w, r, indexPath)
		return
	}

	http.ServeFile(w, r, absRequestedPath)
}
