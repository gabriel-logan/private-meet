package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResponseWriterWriteSetsStatusAndCountsBytes(t *testing.T) {
	rr := httptest.NewRecorder()
	rw := &responseWriter{ResponseWriter: rr}

	n, err := rw.Write([]byte("hello"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if n != 5 {
		t.Fatalf("expected 5 bytes written, got %d", n)
	}

	if rw.status != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rw.status)
	}

	if rw.bytes != 5 {
		t.Fatalf("expected bytes=5, got %d", rw.bytes)
	}
}

func TestResponseWriterWriteHeaderStoresStatus(t *testing.T) {
	rr := httptest.NewRecorder()
	rw := &responseWriter{ResponseWriter: rr}

	rw.WriteHeader(http.StatusTeapot)
	_, _ = rw.Write([]byte("x"))

	if rw.status != http.StatusTeapot {
		t.Fatalf("expected status 418, got %d", rw.status)
	}

	if rw.bytes != 1 {
		t.Fatalf("expected bytes=1, got %d", rw.bytes)
	}
}
