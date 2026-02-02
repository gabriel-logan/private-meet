package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestChainOrder(t *testing.T) {
	order := make([]string, 0)

	m1 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "m1")
			next.ServeHTTP(w, r)
		})
	}

	m2 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "m2")
			next.ServeHTTP(w, r)
		})
	}

	final := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		order = append(order, "final")
		w.WriteHeader(http.StatusOK)
	})

	h := Chain(m1, m2)(final)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	expected := []string{"m1", "m2", "final"}
	if len(order) != len(expected) {
		t.Fatalf("unexpected order: %#v", order)
	}
	for i := range expected {
		if order[i] != expected[i] {
			t.Fatalf("unexpected order: %#v", order)
		}
	}
}
