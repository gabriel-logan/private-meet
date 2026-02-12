package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/httpapi/handlers"
)

func ensureInternalDotEnvFile(t *testing.T) {
	t.Helper()

	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to getwd: %v", err)
	}

	path := filepath.Clean(filepath.Join(wd, "..", ".env"))

	if _, err := os.Stat(path); err == nil {
		return
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("failed to create dir for .env: %v", err)
	}
	if err := os.WriteFile(path, []byte("\n"), 0o600); err != nil {
		t.Fatalf("failed to write .env: %v", err)
	}

	t.Cleanup(func() {
		_ = os.Remove(path)
	})
}

func initTestEnv(t *testing.T, appName, secret string, jwtExpiration time.Duration) {
	t.Helper()
	ensureInternalDotEnvFile(t)

	t.Setenv("GO_ENV", "test")
	t.Setenv("HUB_SHARDS_QUANTITY", "1")
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", appName)
	t.Setenv("ALLOWED_ORIGINS", "http://localhost")
	t.Setenv("SERVER_PORT", "8080")
	t.Setenv("JWT_SECRET", secret)
	t.Setenv("JWT_EXPIRATION", jwtExpiration.String())
	t.Setenv("CONTEXT_TIMEOUT", (5 * time.Second).String())

	_ = config.InitEnv()
}

func TestSignIn(t *testing.T) {
	initTestEnv(t, "TestApp", "testsecret", 15*time.Minute)

	req := httptest.NewRequest("GET", "/sign-in", nil)
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(handlers.SignIn)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}

func TestSignInDefaultGuest(t *testing.T) {
	initTestEnv(t, "TestApp", "testsecret", 15*time.Minute)

	req := httptest.NewRequest(http.MethodPost, "/sign-in", nil)
	rr := httptest.NewRecorder()

	handlers.SignIn(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var resp handlers.AuthResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid JSON response")
	}

	if resp.Username != "Guest" {
		t.Errorf("expected Guest, got %s", resp.Username)
	}

	if resp.AccessToken == "" {
		t.Errorf("expected access token")
	}
}

func TestSignInWithUsername(t *testing.T) {
	initTestEnv(t, "TestApp", "testsecret", 15*time.Minute)

	body := strings.NewReader(`{"username":"Alice"}`)
	req := httptest.NewRequest(http.MethodPost, "/sign-in", body)
	rr := httptest.NewRecorder()

	handlers.SignIn(rr, req)

	var resp handlers.AuthResponse
	_ = json.Unmarshal(rr.Body.Bytes(), &resp)

	if resp.Username != "Alice" {
		t.Errorf("expected Alice, got %s", resp.Username)
	}
}

func TestSignInInvalidJSON(t *testing.T) {
	initTestEnv(t, "TestApp", "testsecret", 15*time.Minute)

	body := strings.NewReader(`{"username":`)
	req := httptest.NewRequest(http.MethodPost, "/sign-in", body)
	rr := httptest.NewRecorder()

	handlers.SignIn(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestSignInUsernameTooLong(t *testing.T) {
	initTestEnv(t, "TestApp", "testsecret", 15*time.Minute)

	longName := strings.Repeat("a", 33) // assuming maxUsernameLength is 32
	body := strings.NewReader(`{"username":"` + longName + `"}`)
	req := httptest.NewRequest(http.MethodPost, "/sign-in", body)
	rr := httptest.NewRecorder()

	handlers.SignIn(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestSignInContextDone(t *testing.T) {
	initTestEnv(t, "TestApp", "testsecret", 15*time.Minute)

	req := httptest.NewRequest(http.MethodPost, "/sign-in", nil)
	ctx, cancel := context.WithTimeout(req.Context(), 1*time.Minute)
	cancel() // Cancel the context immediately
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()

	handlers.SignIn(rr, req)

	if rr.Code != http.StatusRequestTimeout {
		t.Errorf("expected 408, got %d", rr.Code)
	}
}
