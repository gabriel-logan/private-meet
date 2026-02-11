package httpapi

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/ws"
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
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", "PrivateMeet")
	t.Setenv("ALLOWED_ORIGIN", "http://localhost")
	t.Setenv("SERVER_PORT", "8080")
	t.Setenv("JWT_SECRET", "testsecret")
	t.Setenv("JWT_EXPIRATION", "1h")
	t.Setenv("CONTEXT_TIMEOUT", "10s")

	_ = config.InitEnv()
}

func TestNewRouterAddsCORSInDevelopment(t *testing.T) {
	initTestEnv(t)

	manager := ws.NewManager(1)
	r := NewRouter(manager)

	req := httptest.NewRequest(http.MethodOptions, "http://example.test/health", nil)
	rec := httptest.NewRecorder()

	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, rec.Code)
	}

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost" {
		t.Fatalf("expected Access-Control-Allow-Origin header, got %q", got)
	}
}
