package middleware

import (
	"bytes"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClientIPPrefersXForwardedFor(t *testing.T) {
	req, _ := http.NewRequest(http.MethodGet, "http://example.test/", nil)
	req.RemoteAddr = "10.0.0.1:1234"
	req.Header.Set("X-Forwarded-For", "203.0.113.10, 70.41.3.18")

	got := clientIP(req)
	if got != "203.0.113.10" {
		t.Fatalf("expected first X-Forwarded-For ip, got %q", got)
	}
}

func TestLoggerSkipsWebSocketUpgrade(t *testing.T) {
	var called bool
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/ws", nil)
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Upgrade", "websocket")

	Logger()(next).ServeHTTP(rr, req)

	if !called {
		t.Fatalf("expected next to be called")
	}

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}
}

func TestLoggerSkipsStaticAssetPaths(t *testing.T) {
	buf := &bytes.Buffer{}
	prevOut := log.Writer()
	prevFlags := log.Flags()
	log.SetOutput(buf)
	log.SetFlags(0)
	t.Cleanup(func() {
		log.SetOutput(prevOut)
		log.SetFlags(prevFlags)
	})

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/assets/app.js", nil)
	req.RemoteAddr = "203.0.113.1:1234"

	Logger()(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200")
	}

	if buf.Len() != 0 {
		t.Fatalf("expected no log output for assets, got %q", buf.String())
	}
}

func TestLoggerSkipsRenderHealthCheck(t *testing.T) {
	buf := &bytes.Buffer{}
	prevOut := log.Writer()
	prevFlags := log.Flags()
	log.SetOutput(buf)
	log.SetFlags(0)
	t.Cleanup(func() {
		log.SetOutput(prevOut)
		log.SetFlags(prevFlags)
	})

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/health", nil)
	req.Header.Set("User-Agent", "Render/1.0")
	req.RemoteAddr = "203.0.113.2:1234"

	Logger()(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200")
	}

	if buf.Len() != 0 {
		t.Fatalf("expected no log output for Render health, got %q", buf.String())
	}
}

func TestLoggerLogsNormalRequests(t *testing.T) {
	buf := &bytes.Buffer{}
	prevOut := log.Writer()
	prevFlags := log.Flags()
	log.SetOutput(buf)
	log.SetFlags(0)
	t.Cleanup(func() {
		log.SetOutput(prevOut)
		log.SetFlags(prevFlags)
	})

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte("hello"))
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "http://example.test/api", nil)
	req.Header.Set("User-Agent", "test-agent")
	req.Header.Set("X-Real-IP", "198.51.100.9")

	Logger()(next).ServeHTTP(rr, req)

	out := buf.String()
	if !strings.Contains(out, "POST") || !strings.Contains(out, "/api") {
		t.Fatalf("expected log to include method and path, got %q", out)
	}

	if !strings.Contains(out, "201") {
		t.Fatalf("expected log to include status code, got %q", out)
	}
}
