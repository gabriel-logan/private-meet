package middleware

import (
	"log"
	"net"
	"net/http"
	"strings"
	"time"
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
			start := time.Now()

			rw := &responseWriter{
				ResponseWriter: w,
			}

			next.ServeHTTP(rw, r)

			duration := time.Since(start)

			ip := clientIP(r)
			method := r.Method
			path := r.URL.Path
			status := rw.status
			bytes := rw.bytes
			ua := r.UserAgent()

			log.Printf(
				"%s %s %s | %d | %dB | %s | %s",
				ip,
				method,
				path,
				status,
				bytes,
				duration,
				ua,
			)
		})
	}
}
