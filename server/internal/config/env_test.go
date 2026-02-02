package config

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func runHelperProcess(t *testing.T, env map[string]string) (string, error) {
	t.Helper()

	cmd := exec.Command(os.Args[0], "-test.run=TestHelperProcess")
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "GO_WANT_HELPER_PROCESS=1")

	for k, v := range env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}

	out, err := cmd.CombinedOutput()

	return string(out), err
}

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

func TestHelperProcess(t *testing.T) {
	if os.Getenv("GO_WANT_HELPER_PROCESS") != "1" {
		return
	}

	helper := os.Getenv("HELPER_NAME")
	key := os.Getenv("TARGET_KEY")

	switch helper {
	case "mustExistBool":
		_ = mustExistBool(key)
	case "mustExistString":
		_ = mustExistString(key)
	case "mustExistDuration":
		_ = mustExistDuration(key)
	case "GetEnv":
		_ = GetEnv()
	default:
		os.Exit(0)
	}

	os.Exit(0)
}

func TestMustExistStringValid(t *testing.T) {
	key := "TEST_MUST_EXIST_STRING"
	expectedValue := "test_value"

	t.Setenv(key, expectedValue)

	value := mustExistString(key)
	if value != expectedValue {
		t.Errorf("Expected %s, got %s", expectedValue, value)
	}
}

func TestMustExistStringMissing(t *testing.T) {
	key := "TEST_MUST_EXIST_STRING_MISSING"

	out, err := runHelperProcess(t, map[string]string{
		"HELPER_NAME": "mustExistString",
		"TARGET_KEY":  key,
	})
	if err == nil {
		t.Fatalf("expected subprocess to fail (log.Fatal), got nil error; output=%q", out)
	}
	if !strings.Contains(out, EnvironmentPrefixMsg+key+" is required") {
		t.Fatalf("expected fatal message to mention missing env var; output=%q", out)
	}
}

func TestMustExistBoolTrue(t *testing.T) {
	key := "TEST_MUST_EXIST_BOOL_TRUE"
	expectedValue := "true"

	t.Setenv(key, expectedValue)

	value := mustExistBool(key)
	if value != true {
		t.Errorf("Expected true, got %v", value)
	}
}

func TestMustExistBoolFalse(t *testing.T) {
	key := "TEST_MUST_EXIST_BOOL_FALSE"
	expectedValue := "false"

	t.Setenv(key, expectedValue)

	value := mustExistBool(key)
	if value != false {
		t.Errorf("Expected false, got %v", value)
	}
}

func TestMustExistBoolMissing(t *testing.T) {
	key := "TEST_MUST_EXIST_BOOL_MISSING"

	out, err := runHelperProcess(t, map[string]string{
		"HELPER_NAME": "mustExistBool",
		"TARGET_KEY":  key,
	})

	if err == nil {
		t.Fatalf("expected subprocess to fail (log.Fatal), got nil error; output=%q", out)
	}

	if !strings.Contains(out, EnvironmentPrefixMsg+key+" is required") {
		t.Fatalf("expected fatal message to mention missing env var; output=%q", out)
	}
}

func TestMustExistDurationValid(t *testing.T) {
	key := "TEST_MUST_EXIST_DURATION"
	expectedValue := "5s"

	t.Setenv(key, expectedValue)

	value := mustExistDuration(key)
	if value != 5*time.Second {
		t.Errorf("Expected 5s, got %v", value)
	}
}

func TestMustExistDurationMissing(t *testing.T) {
	key := "TEST_MUST_EXIST_DURATION_MISSING"

	out, err := runHelperProcess(t, map[string]string{
		"HELPER_NAME": "mustExistDuration",
		"TARGET_KEY":  key,
	})
	if err == nil {
		t.Fatalf("expected subprocess to fail (log.Fatal), got nil error; output=%q", out)
	}
	if !strings.Contains(out, EnvironmentPrefixMsg+key+" is required") {
		t.Fatalf("expected fatal message to mention missing env var; output=%q", out)
	}
}

func TestMustExistDurationInvalid(t *testing.T) {
	key := "TEST_MUST_EXIST_DURATION_INVALID"
	invalidValue := "invalid_duration"

	out, err := runHelperProcess(t, map[string]string{
		"HELPER_NAME": "mustExistDuration",
		"TARGET_KEY":  key,
		key:           invalidValue,
	})
	if err == nil {
		t.Fatalf("expected subprocess to fail (log.Fatal), got nil error; output=%q", out)
	}
	if !strings.Contains(out, EnvironmentPrefixMsg+key+" must be a valid duration") {
		t.Fatalf("expected fatal message to mention invalid duration; output=%q", out)
	}
}

func TestInitEnv(t *testing.T) {
	ensureInternalDotEnvFile(t)

	t.Setenv("GO_ENV", "test")
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", "TestApp")
	t.Setenv("ALLOWED_ORIGIN", "http://localhost")
	t.Setenv("SERVER_PORT", "8080")
	t.Setenv("JWT_SECRET", "testsecret")
	t.Setenv("JWT_EXPIRATION", "1h")
	t.Setenv("CONTEXT_TIMEOUT", "10s")

	env := InitEnv()

	if env.GoEnv != "test" {
		t.Errorf("Expected GO_ENV to be 'test', got '%s'", env.GoEnv)
	}

	if env.UseLocalTLS != false {
		t.Errorf("Expected USE_LOCAL_TLS to be false, got '%v'", env.UseLocalTLS)
	}

	if env.AppName != "TestApp" {
		t.Errorf("Expected APP_NAME to be 'TestApp', got '%s'", env.AppName)
	}

	if env.AllowedOrigin != "http://localhost" {
		t.Errorf("Expected ALLOWED_ORIGIN to be 'http://localhost', got '%s'", env.AllowedOrigin)
	}

	if env.ServerPort != "8080" {
		t.Errorf("Expected SERVER_PORT to be '8080', got '%s'", env.ServerPort)
	}

	if env.JwtSecret != "testsecret" {
		t.Errorf("Expected JWT_SECRET to be 'testsecret', got '%s'", env.JwtSecret)
	}

	if env.JwtExpiration != time.Hour {
		t.Errorf("Expected JWT_EXPIRATION to be 1h, got '%v'", env.JwtExpiration)
	}

	if env.ContextTimeout != 10*time.Second {
		t.Errorf("Expected CONTEXT_TIMEOUT to be 10s, got '%v'", env.ContextTimeout)
	}
}

func TestGetEnvValid(t *testing.T) {
	env = &Env{
		GoEnv:          "test",
		UseLocalTLS:    false,
		AppName:        "TestApp",
		AllowedOrigin:  "http://localhost",
		ServerPort:     "8080",
		JwtSecret:      "testsecret",
		JwtExpiration:  time.Hour,
		ContextTimeout: 10 * time.Second,
	}

	got := GetEnv()

	if got.GoEnv != "test" {
		t.Errorf("Expected GO_ENV to be 'test', got '%s'", got.GoEnv)
	}

	if got.UseLocalTLS != false {
		t.Errorf("Expected USE_LOCAL_TLS to be false, got '%v'", got.UseLocalTLS)
	}

	if got.AppName != "TestApp" {
		t.Errorf("Expected APP_NAME to be 'TestApp', got '%s'", got.AppName)
	}

	if got.AllowedOrigin != "http://localhost" {
		t.Errorf("Expected ALLOWED_ORIGIN to be 'http://localhost', got '%s'", got.AllowedOrigin)
	}

	if got.ServerPort != "8080" {
		t.Errorf("Expected SERVER_PORT to be '8080', got '%s'", got.ServerPort)
	}

	if got.JwtSecret != "testsecret" {
		t.Errorf("Expected JWT_SECRET to be 'testsecret', got '%s'", got.JwtSecret)
	}

	if got.JwtExpiration != time.Hour {
		t.Errorf("Expected JWT_EXPIRATION to be 1h, got '%v'", got.JwtExpiration)
	}

	if got.ContextTimeout != 10*time.Second {
		t.Errorf("Expected CONTEXT_TIMEOUT to be 10s, got '%v'", got.ContextTimeout)
	}
}

func TestGetEnvUninitialized(t *testing.T) {
	env = nil

	out, err := runHelperProcess(t, map[string]string{
		"HELPER_NAME": "GetEnv",
		"TARGET_KEY":  "",
	})
	if err == nil {
		t.Fatalf("expected subprocess to fail (log.Fatal), got nil error; output=%q", out)
	}
	if !strings.Contains(out, "env not initialized") {
		t.Fatalf("expected fatal message to mention uninitialized env; output=%q", out)
	}
}
