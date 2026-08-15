package handlers

import (
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

func ServeSPA(w http.ResponseWriter, r *http.Request) {
	distPath := "../client/web-desktop/frontend/dist"

	distAbs, err := filepath.Abs(distPath)
	if err != nil {
		log.Printf("failed to get absolute path of dist directory: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	reqPath := path.Clean("/" + r.URL.Path)
	relativePath := strings.TrimPrefix(reqPath, "/")
	if relativePath == "" {
		relativePath = "index.html"
	}

	absPath := filepath.Join(distAbs, filepath.FromSlash(relativePath))
	if !strings.HasPrefix(absPath, distAbs+string(filepath.Separator)) {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}

	if info, err := os.Stat(absPath); err == nil && !info.IsDir() { // #nosec G703 -- absPath validated to stay within distAbs
		http.ServeFile(w, r, absPath)
		return
	}

	http.ServeFile(w, r, filepath.Join(distAbs, "index.html"))
}
