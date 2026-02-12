package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gabriel-logan/private-meet/server/internal/config"
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
}

func initTestEnv(t *testing.T) {
	t.Helper()

	ensureInternalDotEnvFile(t)

	t.Setenv("GO_ENV", "development")
	t.Setenv("HUB_SHARDS_QUANTITY", "1")
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", "PrivateMeet")
	t.Setenv("ALLOWED_ORIGINS", "http://localhost")
	t.Setenv("SERVER_PORT", "8080")
	t.Setenv("JWT_SECRET", "testsecret")
	t.Setenv("JWT_EXPIRATION", "1h")
	t.Setenv("CONTEXT_TIMEOUT", "10s")

	_ = config.InitEnv()
}

func TestCORSAddsHeaders(t *testing.T) {
	initTestEnv(t)

	h := CORS()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)

	h.ServeHTTP(rec, req)

	if rec.Header().Get("Access-Control-Allow-Origin") != "http://localhost" {
		t.Fatalf("expected allow-origin header")
	}
}

func TestCORSHandlesOptions(t *testing.T) {
	initTestEnv(t)

	h := CORS()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next should not be called for OPTIONS")
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodOptions, "http://example.test/", nil)

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}
