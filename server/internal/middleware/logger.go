package middleware

import (
	"log"
	"net"
	"net/http"
	"strconv"
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

func sanitizeLogField(value string) string {
	replaced := strings.ReplaceAll(value, "\n", "")
	replaced = strings.ReplaceAll(replaced, "\r", "")

	return strconv.QuoteToASCII(replaced)
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

			if strings.HasPrefix(path, "/assets/") ||
				path == "/favicon.ico" ||
				path == "/robots.txt" ||
				path == "/logo.svg" ||
				path == "/favicon.svg" {
				return
			}

			if strings.Contains(ua, "Render/") && path == "/health" {
				return
			}

			duration := time.Since(start)
			safeIP := sanitizeLogField(clientIP(r))
			safeMethod := sanitizeLogField(r.Method)
			safePath := sanitizeLogField(path)
			safeUA := sanitizeLogField(ua)

			log.Printf( // #nosec G706 -- all user-controlled fields are sanitized via sanitizeLogField
				"%s %s %s | %d | %dB | %s | %s",
				safeIP,
				safeMethod,
				safePath,
				rw.status,
				rw.bytes,
				duration,
				safeUA,
			)
		})
	}
}
