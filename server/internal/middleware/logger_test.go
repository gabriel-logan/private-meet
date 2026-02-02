package middleware

import (
	"net/http"
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
