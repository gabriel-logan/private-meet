package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
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
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", appName)
	t.Setenv("ALLOWED_ORIGIN", "http://localhost")
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
