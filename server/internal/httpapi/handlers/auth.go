package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/google/uuid"
)

const maxUsernameLength = 32

func SignIn(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), config.GetEnv().ContextTimeout)
	defer cancel()

	userID := uuid.NewString()
	username := "Guest"

	var signInBody struct {
		Username string `json:"username"`
	}

	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&signInBody); err != nil && err != io.EOF {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
	}

	select {
	case <-ctx.Done():
		http.Error(w, "Request cancelled", http.StatusRequestTimeout)
		return
	default:
	}

	if name := strings.TrimSpace(signInBody.Username); name != "" {
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
	if err = json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}
