package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabriel-logan/private-meet/server/internal/httpapi/handlers"
)

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
