package middleware

import (
	"net"
	"net/http"
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

func getClient(ip string) *clientState {
	now := time.Now()

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

func isBanned(c *clientState) bool {
	until := c.BannedUntilUnixNano.Load()
	if until == 0 {
		return false
	}
	return time.Now().UnixNano() < until
}

func banClient(c *clientState, seconds int) {
	until := time.Now().Add(time.Duration(seconds) * time.Second).UnixNano()
	c.BannedUntilUnixNano.Store(until)
}

func cleanupOldClients() {
	for {
		time.Sleep(1 * time.Minute)

		now := time.Now().UnixNano()
		cutoff := int64(5 * time.Minute)
		clients.Range(func(key, value any) bool {
			ip := key.(string)
			c := value.(*clientState)
			last := c.LastSeenUnixNano.Load()
			if last != 0 && now-last > cutoff {
				clients.Delete(ip)
			}
			return true
		})
	}
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

			ip := clientIPForRateLimit(r)
			client := getClient(ip)
			if isBanned(client) {
				w.Header().Set(retryAfterHeader, "1")
				http.Error(w, "Too Many Requests (temp ban)", http.StatusTooManyRequests)
				return
			}

			limiter := client.Limiters[r.Method]
			if limiter == nil {
				w.Header().Set(retryAfterHeader, "1")
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			if !limiter.Allow() {
				banClient(client, cfg.BanTime)
				w.Header().Set(retryAfterHeader, "1")
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
