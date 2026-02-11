package middleware

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"
	"time"

	"golang.org/x/time/rate"
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

func resetRateLimitState(t *testing.T) {
	t.Helper()
	cleanupStopOnce.Do(func() {
		close(cleanupStopChan)
	})

	clients.Range(func(key, _ any) bool {
		clients.Delete(key)
		return true
	})

	once = sync.Once{}
}

func TestClientIPForRateLimitPrefersForwardedHeaders(t *testing.T) {
	req, _ := http.NewRequest(http.MethodGet, "http://example.test/", nil)
	req.RemoteAddr = "10.0.0.1:1234"
	req.Header.Set("X-Forwarded-For", "203.0.113.10, 70.41.3.18")

	got := clientIPForRateLimit(req)
	if got != "203.0.113.10" {
		t.Fatalf("expected first X-Forwarded-For ip, got %q", got)
	}

	req.Header.Del("X-Forwarded-For")
	req.Header.Set("X-Real-IP", "198.51.100.5")
	got = clientIPForRateLimit(req)
	if got != "198.51.100.5" {
		t.Fatalf("expected X-Real-IP, got %q", got)
	}
}

func TestNewClientStateCopiesLimiters(t *testing.T) {
	restore := RateLimits
	RateLimits = map[string]MethodLimit{
		"GET":  {Limiter: rate.NewLimiter(1, 2), BanTime: 1},
		"POST": {Limiter: rate.NewLimiter(3, 4), BanTime: 1},
	}
	t.Cleanup(func() { RateLimits = restore })

	now := time.Now()
	c := newClientState(now)

	if c.Limiters["GET"].Limit() != 1 || c.Limiters["GET"].Burst() != 2 {
		t.Fatalf("expected GET limiter copied")
	}

	if c.Limiters["POST"].Limit() != 3 || c.Limiters["POST"].Burst() != 4 {
		t.Fatalf("expected POST limiter copied")
	}
}

func TestGetClientReusesStateAndUpdatesLastSeen(t *testing.T) {
	resetRateLimitState(t)

	now := time.Now()
	c1 := getClient("1.2.3.4", now)
	before := c1.LastSeenUnixNano.Load()

	c2 := getClient("1.2.3.4", now.Add(10*time.Second))
	after := c2.LastSeenUnixNano.Load()

	if c1 != c2 {
		t.Fatalf("expected same client state")
	}

	if after <= before {
		t.Fatalf("expected last seen to be updated")
	}
}

func TestBanClientIsBannedAndRetryAfterHeader(t *testing.T) {
	now := time.Now()
	c := newClientState(now)

	banClient(c, now, 10)
	if !isBanned(c, now.Add(1*time.Second)) {
		t.Fatalf("expected client to be banned")
	}

	rr := httptest.NewRecorder()
	writeRetryAfter(rr, c, now)

	v := rr.Header().Get(retryAfterHeader)
	if v == "" {
		t.Fatalf("expected Retry-After header")
	}

	n, err := strconv.Atoi(v)
	if err != nil || n < 1 {
		t.Fatalf("expected Retry-After >= 1, got %q", v)
	}
}

func TestCleanupOldClientsLoopRemovesStaleEntries(t *testing.T) {
	resetRateLimitState(t)

	now := time.Now()
	stale := newClientState(now)
	stale.LastSeenUnixNano.Store(now.Add(-11 * time.Minute).UnixNano())

	fresh := newClientState(now)
	fresh.LastSeenUnixNano.Store(now.Add(-1 * time.Minute).UnixNano())

	clients.Store("stale", stale)
	clients.Store("fresh", fresh)

	tick := make(chan time.Time, 1)
	stop := make(chan struct{})
	done := make(chan struct{})

	go func() {
		cleanupOldClientsLoop(tick, stop)
		close(done)
	}()

	tick <- time.Now()

	deadline := time.Now().Add(250 * time.Millisecond)
	for time.Now().Before(deadline) {
		if _, ok := clients.Load("stale"); !ok {
			break
		}
		time.Sleep(2 * time.Millisecond)
	}

	close(stop)
	<-done

	if _, ok := clients.Load("stale"); ok {
		t.Fatalf("expected stale entry to be deleted")
	}
	if _, ok := clients.Load("fresh"); !ok {
		t.Fatalf("expected fresh entry to remain")
	}
}

func TestCleanupOldClientsStopsWhenStopClosed(t *testing.T) {
	resetRateLimitState(t)

	done := make(chan struct{})
	go func() {
		cleanupOldClients()
		close(done)
	}()

	select {
	case <-done:
		return
	case <-time.After(200 * time.Millisecond):
		t.Fatalf("expected cleanupOldClients to stop")
	}
}

func TestRateLimitBannedClientReturns429(t *testing.T) {
	resetRateLimitState(t)

	// Ensure we have a config for GET.
	restore := RateLimits

	RateLimits = map[string]MethodLimit{
		"GET": {Limiter: rate.NewLimiter(1, 1), BanTime: 1},
	}

	t.Cleanup(func() { RateLimits = restore })

	now := time.Now()
	ip := "203.0.113.7"

	c := newClientState(now)
	c.BannedUntilUnixNano.Store(now.Add(10 * time.Second).UnixNano())
	clients.Store(ip, c)

	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)
	req.RemoteAddr = ip + ":1234"

	RateLimit()(next).ServeHTTP(rr, req)

	if nextCalled {
		t.Fatalf("expected request to be blocked")
	}

	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}

	if rr.Header().Get(retryAfterHeader) == "" {
		t.Fatalf("expected Retry-After header")
	}
}

func TestRateLimitNilLimiterReturns429(t *testing.T) {
	resetRateLimitState(t)

	restore := RateLimits
	RateLimits = map[string]MethodLimit{
		"GET": {Limiter: rate.NewLimiter(1, 1), BanTime: 1},
	}
	t.Cleanup(func() { RateLimits = restore })

	now := time.Now()
	ip := "203.0.113.8"

	c := newClientState(now)
	c.Limiters[http.MethodGet] = nil
	clients.Store(ip, c)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)
	req.RemoteAddr = ip + ":1234"

	RateLimit()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})).ServeHTTP(rr, req)

	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}

	if rr.Header().Get(retryAfterHeader) == "" {
		t.Fatalf("expected Retry-After header")
	}
}

func TestRateLimitLimitExceededBansClient(t *testing.T) {
	resetRateLimitState(t)

	restore := RateLimits
	RateLimits = map[string]MethodLimit{
		"GET": {Limiter: rate.NewLimiter(1, 1), BanTime: 10},
	}
	t.Cleanup(func() { RateLimits = restore })

	now := time.Now()
	ip := "203.0.113.9"

	c := newClientState(now)
	// Force Allow() to fail.
	c.Limiters[http.MethodGet] = rate.NewLimiter(0, 0)
	clients.Store(ip, c)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)
	req.RemoteAddr = ip + ":1234"

	RateLimit()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})).ServeHTTP(rr, req)

	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}

	if c.BannedUntilUnixNano.Load() == 0 {
		t.Fatalf("expected client to be banned")
	}
}

func TestRateLimitUnknownMethodPassesThrough(t *testing.T) {
	resetRateLimitState(t)

	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	rr := httptest.NewRecorder()
	req := httptest.NewRequest("PUT", "http://example.test/", nil)
	req.RemoteAddr = "203.0.113.10:1234"

	RateLimit()(next).ServeHTTP(rr, req)

	if !nextCalled {
		t.Fatalf("expected passthrough for unknown method")
	}

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
