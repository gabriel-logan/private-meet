package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
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

type clientState struct {
	Limiters    map[string]*rate.Limiter
	BannedUntil time.Time
	LastSeen    time.Time
}

var (
	mu      sync.Mutex
	clients = map[string]*clientState{}
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

func getClient(ip string) *clientState {
	mu.Lock()
	defer mu.Unlock()

	c, exists := clients[ip]
	if !exists {
		limiters := map[string]*rate.Limiter{}
		for method, cfg := range RateLimits {
			limiters[method] = rate.NewLimiter(cfg.Limiter.Limit(), cfg.Limiter.Burst())
		}

		c = &clientState{
			Limiters:    limiters,
			BannedUntil: time.Time{},
			LastSeen:    time.Now(),
		}

		clients[ip] = c
	}

	c.LastSeen = time.Now()
	return c
}

func isBanned(c *clientState) bool {
	return time.Now().Before(c.BannedUntil)
}

func banClient(c *clientState, seconds int) {
	c.BannedUntil = time.Now().Add(time.Duration(seconds) * time.Second)
}

func cleanupOldClients() {
	for {
		time.Sleep(1 * time.Minute)

		mu.Lock()
		for ip, c := range clients {
			if time.Since(c.LastSeen) > 5*time.Minute {
				delete(clients, ip)
			}
		}
		mu.Unlock()
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

			mu.Lock()
			banned := isBanned(client)
			mu.Unlock()
			if banned {
				w.Header().Set("Retry-After", "1")
				http.Error(w, "Too Many Requests (temp ban)", http.StatusTooManyRequests)
				return
			}

			limiter := client.Limiters[r.Method]
			if limiter == nil {
				// Defensive: should always exist if RateLimits has this method.
				limiter = rate.NewLimiter(cfg.Limiter.Limit(), cfg.Limiter.Burst())
				mu.Lock()
				client.Limiters[r.Method] = limiter
				mu.Unlock()
			}

			if !limiter.Allow() {
				mu.Lock()
				banClient(client, cfg.BanTime)
				mu.Unlock()
				w.Header().Set("Retry-After", "1")
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
