package handlers_test

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabriel-logan/private-meet/server/internal/httpapi/handlers"
)

type failingHealthWriter struct {
	header http.Header
	code   int
}

func (w *failingHealthWriter) Header() http.Header {
	if w.header == nil {
		w.header = make(http.Header)
	}
	return w.header
}

func (w *failingHealthWriter) WriteHeader(statusCode int) {
	w.code = statusCode
}

func (w *failingHealthWriter) Write(_ []byte) (int, error) {
	return 0, errors.New("write error")
}

func TestHealth(t *testing.T) {
	req := httptest.NewRequest("GET", "/health", nil)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(handlers.Health)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}
}

func TestHealthWriteError(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := &failingHealthWriter{}

	handlers.Health(w, req)

	if w.code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.code)
	}
}
