package handlers

import "net/http"

func Health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write([]byte("OK")); err != nil {
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
		return
	}
}
