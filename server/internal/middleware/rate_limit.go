package middleware

import (
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/time/rate"
)

type MethodLimit struct {
	Limiter *rate.Limiter
	BanTime int
}

var RateLimits = map[string]MethodLimit{
	"GET": {
		Limiter: rate.NewLimiter(10, 20),
		BanTime: 10,
	},
	"POST": {
		Limiter: rate.NewLimiter(3, 6),
		BanTime: 30,
	},
}

const retryAfterHeader = "Retry-After"

type clientState struct {
	Limiters map[string]*rate.Limiter

	BannedUntilUnixNano atomic.Int64
	LastSeenUnixNano    atomic.Int64
}

var (
	clients sync.Map
	once    sync.Once
)

func clientIPForRateLimit(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}

	if rip := r.Header.Get("X-Real-IP"); rip != "" {
		return strings.TrimSpace(rip)
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host
}

func shouldSkipRateLimit(r *http.Request) bool {
	if r.Method == http.MethodOptions {
		return true
	}

	if websocket.IsWebSocketUpgrade(r) {
		return true
	}

	path := r.URL.Path
	if path == "/ws" {
		return true
	}

	if strings.HasPrefix(path, "/assets/") ||
		path == "/favicon.ico" ||
		path == "/robots.txt" ||
		path == "/logo.svg" ||
		path == "/favicon.svg" {
		return true
	}

	return false
}

func newClientState(now time.Time) *clientState {
	limiters := make(map[string]*rate.Limiter, len(RateLimits))
	for method, cfg := range RateLimits {
		limiters[method] = rate.NewLimiter(cfg.Limiter.Limit(), cfg.Limiter.Burst())
	}

	c := &clientState{Limiters: limiters}
	c.LastSeenUnixNano.Store(now.UnixNano())
	c.BannedUntilUnixNano.Store(0)

	return c
}

func getClient(ip string, now time.Time) *clientState {
	if v, ok := clients.Load(ip); ok {
		c := v.(*clientState)
		c.LastSeenUnixNano.Store(now.UnixNano())
		return c
	}

	c := newClientState(now)

	actual, loaded := clients.LoadOrStore(ip, c)

	if loaded {
		c = actual.(*clientState)
		c.LastSeenUnixNano.Store(now.UnixNano())
	}

	return c
}

func isBanned(c *clientState, now time.Time) bool {
	until := c.BannedUntilUnixNano.Load()

	return until != 0 && now.UnixNano() < until
}

func banClient(c *clientState, now time.Time, seconds int) {
	until := now.Add(time.Duration(seconds) * time.Second).UnixNano()

	c.BannedUntilUnixNano.Store(until)
}

func cleanupOldClients() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		cutoff := now.Add(-10 * time.Minute).UnixNano()

		clients.Range(func(key, value any) bool {
			c := value.(*clientState)
			lastSeen := c.LastSeenUnixNano.Load()
			if lastSeen < cutoff {
				clients.Delete(key)
			}
			return true
		})
	}
}

func writeRetryAfter(w http.ResponseWriter, c *clientState, now time.Time) {
	until := c.BannedUntilUnixNano.Load()

	retry := (until - now.UnixNano()) / int64(time.Second)
	if retry < 1 {
		retry = 1
	}

	w.Header().Set(retryAfterHeader, strconv.FormatInt(retry, 10))
}

func RateLimit() Middleware {
	once.Do(func() {
		go cleanupOldClients()
	})

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if shouldSkipRateLimit(r) {
				next.ServeHTTP(w, r)
				return
			}

			cfg, exists := RateLimits[r.Method]
			if !exists {
				next.ServeHTTP(w, r)
				return
			}

			now := time.Now()
			ip := clientIPForRateLimit(r)
			client := getClient(ip, now)
			if isBanned(client, now) {
				writeRetryAfter(w, client, now)
				http.Error(w, "Too Many Requests (temp ban)", http.StatusTooManyRequests)
				return
			}

			limiter := client.Limiters[r.Method]
			if limiter == nil {
				writeRetryAfter(w, client, now)
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			if !limiter.Allow() {
				banClient(client, now, cfg.BanTime)
				writeRetryAfter(w, client, now)
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
