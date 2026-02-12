package ws

import (
	"net/http"
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

func initTestEnv(t *testing.T, goEnv string, allowedOrigin string) {
	t.Helper()

	ensureInternalDotEnvFile(t)

	t.Setenv("GO_ENV", goEnv)
	t.Setenv("HUB_SHARDS_QUANTITY", "1")
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", "PrivateMeet")
	t.Setenv("ALLOWED_ORIGINS", allowedOrigin)
	t.Setenv("SERVER_PORT", "8080")
	t.Setenv("JWT_SECRET", "testsecret")
	t.Setenv("JWT_EXPIRATION", "1h")
	t.Setenv("CONTEXT_TIMEOUT", "10s")

	_ = config.InitEnv()
}

func TestUpgraderCheckOriginDevelopmentAlwaysTrue(t *testing.T) {
	initTestEnv(t, "development", "https://allowed.example")

	req, _ := http.NewRequest(http.MethodGet, "http://example.test/ws", nil)
	req.Header.Set("Origin", "https://evil.example")

	if !upgrader.CheckOrigin(req) {
		t.Fatalf("expected development mode to allow any origin")
	}
}

func TestUpgraderCheckOriginProductionMatchesAllowed(t *testing.T) {
	initTestEnv(t, "production", "https://allowed.example")

	reqAllowed, _ := http.NewRequest(http.MethodGet, "http://example.test/ws", nil)
	reqAllowed.Header.Set("Origin", "https://allowed.example")
	if !upgrader.CheckOrigin(reqAllowed) {
		t.Fatalf("expected allowed origin to pass")
	}

	reqDenied, _ := http.NewRequest(http.MethodGet, "http://example.test/ws", nil)
	reqDenied.Header.Set("Origin", "https://evil.example")
	if upgrader.CheckOrigin(reqDenied) {
		t.Fatalf("expected mismatched origin to fail")
	}
}
