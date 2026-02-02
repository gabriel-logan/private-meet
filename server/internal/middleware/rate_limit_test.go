package middleware

import (
	"net/http"
	"testing"
)

func TestShouldSkipRateLimitOptions(t *testing.T) {
	req, _ := http.NewRequest(http.MethodOptions, "http://example.test/", nil)
	if !shouldSkipRateLimit(req) {
		t.Fatalf("expected OPTIONS to skip rate limit")
	}
}

func TestShouldSkipRateLimitAssets(t *testing.T) {
	req, _ := http.NewRequest(http.MethodGet, "http://example.test/assets/app.js", nil)
	if !shouldSkipRateLimit(req) {
		t.Fatalf("expected /assets to skip rate limit")
	}
}
