package security_test

import (
	"crypto"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/golang-jwt/jwt/v5"
)

const (
	testUserID   = "user-123"
	testUsername = "alice"
	errGenerate  = "GenerateJWT error: %v"
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

func signToken(t *testing.T, method jwt.SigningMethod, secret string, claims *security.CustomClaims) string {
	t.Helper()

	tok := jwt.NewWithClaims(method, claims)
	s, err := tok.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return s
}

func TestCustomClaimsGetUsernameEmpty(t *testing.T) {
	claims := &security.CustomClaims{}
	_, err := claims.GetUsername()
	if !errors.Is(err, jwt.ErrTokenInvalidClaims) {
		t.Fatalf("expected ErrTokenInvalidClaims, got %v", err)
	}
}

func TestCustomClaimsGetUsernameSuccess(t *testing.T) {
	claims := &security.CustomClaims{Username: "alice"}
	username, err := claims.GetUsername()
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if username != "alice" {
		t.Fatalf("expected alice, got %q", username)
	}
}

func TestGenerateJwtExpirationTimeDefaultsTo12h(t *testing.T) {
	start := time.Now()
	exp := security.GenerateJwtExpirationTime(0)
	end := time.Now()

	min := start.Add(12*time.Hour - 2*time.Second)
	max := end.Add(12*time.Hour + 2*time.Second)
	if exp.Before(min) || exp.After(max) {
		t.Fatalf("expected expiration around now+12h, got %v (window %v..%v)", exp, min, max)
	}
}

func TestGenerateAndValidateJWTRoundTrip(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", 1*time.Hour)

	token, err := security.GenerateJWT(testUserID, testUsername)
	if err != nil {
		t.Fatalf(errGenerate, err)
	}

	claims, err := security.ValidateJWT(token)
	if err != nil {
		t.Fatalf("ValidateJWT error: %v", err)
	}
	if claims.Subject != testUserID {
		t.Fatalf("expected subject %s, got %q", testUserID, claims.Subject)
	}
	if claims.Username != testUsername {
		t.Fatalf("expected username %s, got %q", testUsername, claims.Username)
	}
	if claims.Issuer != "PrivateMeet" {
		t.Fatalf("expected issuer PrivateMeet, got %q", claims.Issuer)
	}
	if claims.ExpiresAt == nil || claims.ExpiresAt.Time.Before(time.Now()) {
		t.Fatalf("expected non-expired token")
	}
	if claims.IssuedAt == nil || claims.IssuedAt.Time.After(time.Now().Add(2*time.Second)) {
		t.Fatalf("expected issued-at not in the future")
	}
}

func TestValidateJWTInvalidSignature(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "secretA", 1*time.Hour)
	token, err := security.GenerateJWT(testUserID, testUsername)
	if err != nil {
		t.Fatalf(errGenerate, err)
	}

	initTestEnv(t, "PrivateMeet", "secretB", 1*time.Hour)
	_, err = security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenSignatureInvalid) {
		t.Fatalf("expected ErrTokenSignatureInvalid, got %v", err)
	}
}

func TestValidateJWTInvalidIssuer(t *testing.T) {
	initTestEnv(t, "IssuerA", "testsecret", 1*time.Hour)
	token, err := security.GenerateJWT(testUserID, testUsername)
	if err != nil {
		t.Fatalf(errGenerate, err)
	}

	initTestEnv(t, "IssuerB", "testsecret", 1*time.Hour)
	_, err = security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenInvalidIssuer) {
		t.Fatalf("expected ErrTokenInvalidIssuer, got %v", err)
	}
}

func TestValidateJWTExpired(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", -3*time.Hour)
	token, err := security.GenerateJWT(testUserID, testUsername)
	if err != nil {
		t.Fatalf(errGenerate, err)
	}

	_, err = security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenExpired) {
		t.Fatalf("expected ErrTokenExpired, got %v", err)
	}
}

func TestValidateJWTIssuedAtInFuture(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", 1*time.Hour)

	claims := &security.CustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(10 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			Issuer:    "PrivateMeet",
			Subject:   testUserID,
		},
		Username: testUsername,
	}

	token := signToken(t, jwt.SigningMethodHS256, "testsecret", claims)
	_, err := security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenNotValidYet) {
		t.Fatalf("expected ErrTokenNotValidYet, got %v", err)
	}
}

func TestValidateJWTWrongSigningMethod(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", 1*time.Hour)

	claims := &security.CustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			Issuer:    "PrivateMeet",
			Subject:   testUserID,
		},
		Username: testUsername,
	}

	token := signToken(t, jwt.SigningMethodHS512, "testsecret", claims)
	_, err := security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenSignatureInvalid) {
		t.Fatalf("expected ErrTokenSignatureInvalid, got %v", err)
	}
}

func TestValidateJWTMissingExpiresAt(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", 1*time.Hour)

	claims := &security.CustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
			Issuer:   "PrivateMeet",
			Subject:  testUserID,
		},
		Username: testUsername,
	}

	token := signToken(t, jwt.SigningMethodHS256, "testsecret", claims)
	_, err := security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenExpired) {
		t.Fatalf("expected ErrTokenExpired, got %v", err)
	}
}

func TestValidateJWTMissingIssuedAt(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", 1*time.Hour)

	claims := &security.CustomClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			Issuer:    "PrivateMeet",
			Subject:   testUserID,
		},
		Username: testUsername,
	}

	token := signToken(t, jwt.SigningMethodHS256, "testsecret", claims)
	_, err := security.ValidateJWT(token)
	if !errors.Is(err, jwt.ErrTokenNotValidYet) {
		t.Fatalf("expected ErrTokenNotValidYet, got %v", err)
	}
}

func TestGenerateJWTSignError(t *testing.T) {
	initTestEnv(t, "PrivateMeet", "testsecret", 1*time.Hour)

	originalHash := jwt.SigningMethodHS256.Hash
	jwt.SigningMethodHS256.Hash = crypto.Hash(0)
	t.Cleanup(func() {
		jwt.SigningMethodHS256.Hash = originalHash
	})

	_, err := security.GenerateJWT(testUserID, testUsername)
	if err == nil {
		t.Fatalf("expected signing error")
	}
}
