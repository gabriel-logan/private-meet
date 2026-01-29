package middleware

import (
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type responseWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.status = statusCode
	rw.ResponseWriter.WriteHeader(statusCode)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.status == 0 {
		rw.status = http.StatusOK
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.bytes += n
	return n, err
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}

	if rip := r.Header.Get("X-Real-IP"); rip != "" {
		return rip
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host
}

func Logger() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if websocket.IsWebSocketUpgrade(r) {
				next.ServeHTTP(w, r)
				return
			}

			start := time.Now()

			rw := &responseWriter{
				ResponseWriter: w,
			}

			next.ServeHTTP(rw, r)

			ua := r.UserAgent()
			path := r.URL.Path

			if strings.Contains(ua, "Render/") && path == "/health" {
				return
			}

			duration := time.Since(start)

			log.Printf(
				"%s %s %s | %d | %dB | %s | %s",
				clientIP(r),
				r.Method,
				path,
				rw.status,
				rw.bytes,
				duration,
				ua,
			)
		})
	}
}
