package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/google/uuid"
)

func SignIn(w http.ResponseWriter, r *http.Request) {
	userID := uuid.NewString()
	username := "Guest"

	accessToken, err := security.GenerateJWT(userID, username)
	if err != nil {
		http.Error(w, "Failed to generate access token", http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"accessToken": accessToken,
		"tokenType":   "Bearer",
		"userId":      userID,
		"username":    username,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
