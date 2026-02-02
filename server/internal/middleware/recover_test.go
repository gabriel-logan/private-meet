package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRecoverConvertsPanicTo500(t *testing.T) {
	h := Recover()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
}
