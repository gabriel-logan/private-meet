package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHttpGet(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("expected method GET, got %s", r.Method)
		}

		if got := r.Header.Get("X-Test"); got != "abc" {
			t.Fatalf("expected header X-Test=abc, got %q", got)
		}

		w.Header().Set("X-Response", "ok")
		w.WriteHeader(http.StatusTeapot)
		_, _ = w.Write([]byte("hello"))
	}))
	defer srv.Close()

	resp, err := app.HttpGet(srv.URL+"/ping", map[string]string{"X-Test": "abc"})
	if err != nil {
		t.Fatalf("HttpGet returned error: %v", err)
	}

	if resp.Status != http.StatusTeapot {
		t.Fatalf("expected status %d, got %d", http.StatusTeapot, resp.Status)
	}

	if !strings.Contains(resp.StatusText, "418") {
		t.Fatalf("expected StatusText to contain 418, got %q", resp.StatusText)
	}

	if resp.Body != "hello" {
		t.Fatalf("expected body %q, got %q", "hello", resp.Body)
	}

	if got := resp.Headers["X-Response"]; got != "ok" {
		t.Fatalf("expected response header X-Response=ok, got %q", got)
	}
}

func TestHttpPostDefaultContentType(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected method POST, got %s", r.Method)
		}

		if got := r.Header.Get("Content-Type"); got != "application/json" {
			t.Fatalf("expected default Content-Type application/json, got %q", got)
		}

		if got := r.Header.Get("X-Test"); got != "abc" {
			t.Fatalf("expected header X-Test=abc, got %q", got)
		}

		b, _ := io.ReadAll(r.Body)

		if string(b) != `{"a":1}` {
			t.Fatalf("expected request body %q, got %q", `{"a":1}`, string(b))
		}

		w.Header().Set("X-Response", "ok")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte("created"))
	}))
	defer srv.Close()

	resp, err := app.HttpPost(srv.URL+"/items", `{"a":1}`, map[string]string{"X-Test": "abc"})
	if err != nil {
		t.Fatalf("HttpPost returned error: %v", err)
	}

	if resp.Status != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, resp.Status)
	}

	if resp.Body != "created" {
		t.Fatalf("expected body %q, got %q", "created", resp.Body)
	}

	if got := resp.Headers["X-Response"]; got != "ok" {
		t.Fatalf("expected response header X-Response=ok, got %q", got)
	}
}

func TestHttpPostCustomContentType(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Content-Type"); got != "text/plain" {
			t.Fatalf("expected Content-Type text/plain, got %q", got)
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer srv.Close()

	resp, err := app.HttpPost(srv.URL, "hi", map[string]string{"Content-Type": "text/plain"})
	if err != nil {
		t.Fatalf("HttpPost returned error: %v", err)
	}

	if resp.Status != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.Status)
	}
}
