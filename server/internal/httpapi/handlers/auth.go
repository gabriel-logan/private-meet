package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/google/uuid"
)

var SignInBody struct {
	Username string `json:"username"`
}

const maxUsernameLength = 32

func SignIn(w http.ResponseWriter, r *http.Request) {
	userID := uuid.NewString()
	username := "Guest"

	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&SignInBody); err != nil && err != io.EOF {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
	}

	if name := strings.TrimSpace(SignInBody.Username); name != "" {
		if len([]rune(name)) > maxUsernameLength {
			http.Error(w, fmt.Sprintf("Username too long (maximum is %d characters)", maxUsernameLength), http.StatusBadRequest)
			return
		}

		username = name
	}

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
