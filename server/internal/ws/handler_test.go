package ws

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/golang-jwt/jwt/v5"
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

func TestUpgraderCheckOriginProductionWildcard(t *testing.T) {
	initTestEnv(t, "production", "*")

	req, _ := http.NewRequest(http.MethodGet, "http://example.test/ws", nil)
	req.Header.Set("Origin", "https://any.example")

	if !upgrader.CheckOrigin(req) {
		t.Fatalf("expected wildcard origin to pass")
	}
}

func signedCustomClaims(t *testing.T, claims *security.CustomClaims) string {
	t.Helper()
	env := config.GetEnv()
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := tok.SignedString([]byte(env.JwtSecret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return s
}

func TestServeWSWithoutSubjectFallsThroughToUpgradeError(t *testing.T) {
	initTestEnv(t, "development", "http://example.test")

	token := signedCustomClaims(t, &security.CustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "PrivateMeet",
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
		Username: "alice",
	})

	req := httptest.NewRequest(http.MethodGet, "http://example.test/ws?token="+token, nil)
	rec := httptest.NewRecorder()

	ServeWS(NewManager(1)).ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestServeWSUnauthorizedWhenUsernameMissing(t *testing.T) {
	initTestEnv(t, "development", "http://example.test")

	token := signedCustomClaims(t, &security.CustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "PrivateMeet",
			Subject:   "u1",
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
		Username: "",
	})

	req := httptest.NewRequest(http.MethodGet, "http://example.test/ws?token="+token, nil)
	rec := httptest.NewRecorder()

	ServeWS(NewManager(1)).ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}
