package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const (
	hdrXTest     = "X-Test"
	hdrXResponse = "X-Response"
	hdrXMulti    = "X-Multi"
	hdrCT        = "Content-Type"

	ctJSON  = "application/json"
	ctPlain = "text/plain"

	fmtExpectedStatus = "expected status %d, got %d"
)

func newTruncatedBodyServer(t *testing.T) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hj, ok := w.(http.Hijacker)
		if !ok {
			t.Fatalf("ResponseWriter does not support hijacking")
		}

		conn, buf, err := hj.Hijack()
		if err != nil {
			t.Fatalf("hijack failed: %v", err)
		}
		defer conn.Close()

		// Declare a larger Content-Length than what we actually send,
		// so reading the body triggers an error (typically unexpected EOF).
		_, _ = fmt.Fprintf(buf, "HTTP/1.1 200 OK\r\n")
		_, _ = fmt.Fprintf(buf, "Content-Type: text/plain\r\n")
		_, _ = fmt.Fprintf(buf, "Content-Length: 10\r\n")
		_, _ = fmt.Fprintf(buf, "\r\n")
		_, _ = fmt.Fprintf(buf, "abc")
		_ = buf.Flush()
	}))
}

func TestHttpGet(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("expected method GET, got %s", r.Method)
		}

		if got := r.Header.Get(hdrXTest); got != "abc" {
			t.Fatalf("expected header %s=abc, got %q", hdrXTest, got)
		}

		w.Header().Set(hdrXResponse, "ok")
		w.Header().Add(hdrXMulti, "a")
		w.Header().Add(hdrXMulti, "b")
		w.WriteHeader(http.StatusTeapot)
		_, _ = w.Write([]byte("hello"))
	}))
	defer srv.Close()

	resp, err := app.HttpGet(srv.URL+"/ping", map[string]string{hdrXTest: "abc"})
	if err != nil {
		t.Fatalf("HttpGet returned error: %v", err)
	}

	if resp.Status != http.StatusTeapot {
		t.Fatalf(fmtExpectedStatus, http.StatusTeapot, resp.Status)
	}

	if !strings.Contains(resp.StatusText, "418") {
		t.Fatalf("expected StatusText to contain 418, got %q", resp.StatusText)
	}

	if resp.Body != "hello" {
		t.Fatalf("expected body %q, got %q", "hello", resp.Body)
	}

	if got := resp.Headers[hdrXResponse]; got != "ok" {
		t.Fatalf("expected response header %s=ok, got %q", hdrXResponse, got)
	}

	if got := resp.Headers[hdrXMulti]; got != "a,b" {
		t.Fatalf("expected response header %s=a,b, got %q", hdrXMulti, got)
	}
}

func TestHttpGetInvalidURL(t *testing.T) {
	app := NewApp()

	resp, err := app.HttpGet("http://[::1", map[string]string{hdrXTest: "abc"})
	if err == nil {
		t.Fatalf("expected error for invalid URL, got nil (resp=%v)", resp)
	}
}

func TestHttpGetClientDoError(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	// Close before making the request so Dial fails.
	srv.Close()

	resp, err := app.HttpGet(srv.URL, map[string]string{hdrXTest: "abc"})
	if err == nil {
		t.Fatalf("expected error from client.Do, got nil (resp=%v)", resp)
	}
}

func TestHttpGetReadBodyError(t *testing.T) {
	app := NewApp()

	srv := newTruncatedBodyServer(t)
	defer srv.Close()

	resp, err := app.HttpGet(srv.URL, map[string]string{hdrXTest: "abc"})
	if err == nil {
		t.Fatalf("expected read error, got nil (resp=%v)", resp)
	}
}

func TestHttpPostDefaultContentType(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected method POST, got %s", r.Method)
		}

		if got := r.Header.Get(hdrCT); got != ctJSON {
			t.Fatalf("expected default Content-Type %s, got %q", ctJSON, got)
		}

		if got := r.Header.Get(hdrXTest); got != "abc" {
			t.Fatalf("expected header %s=abc, got %q", hdrXTest, got)
		}

		b, _ := io.ReadAll(r.Body)

		if string(b) != `{"a":1}` {
			t.Fatalf("expected request body %q, got %q", `{"a":1}`, string(b))
		}

		w.Header().Set(hdrXResponse, "ok")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte("created"))
	}))
	defer srv.Close()

	resp, err := app.HttpPost(srv.URL+"/items", `{"a":1}`, map[string]string{hdrXTest: "abc"})
	if err != nil {
		t.Fatalf("HttpPost returned error: %v", err)
	}

	if resp.Status != http.StatusCreated {
		t.Fatalf(fmtExpectedStatus, http.StatusCreated, resp.Status)
	}

	if resp.Body != "created" {
		t.Fatalf("expected body %q, got %q", "created", resp.Body)
	}

	if got := resp.Headers[hdrXResponse]; got != "ok" {
		t.Fatalf("expected response header %s=ok, got %q", hdrXResponse, got)
	}
}

func TestHttpPostCustomContentType(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(hdrCT); got != ctPlain {
			t.Fatalf("expected Content-Type %s, got %q", ctPlain, got)
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer srv.Close()

	resp, err := app.HttpPost(srv.URL, "hi", map[string]string{hdrCT: ctPlain})
	if err != nil {
		t.Fatalf("HttpPost returned error: %v", err)
	}

	if resp.Status != http.StatusOK {
		t.Fatalf(fmtExpectedStatus, http.StatusOK, resp.Status)
	}
}

func TestHttpPostInvalidURL(t *testing.T) {
	app := NewApp()

	resp, err := app.HttpPost("http://[::1", "hi", map[string]string{hdrCT: ctPlain})
	if err == nil {
		t.Fatalf("expected error for invalid URL, got nil (resp=%v)", resp)
	}
}

func TestHttpPostClientDoError(t *testing.T) {
	app := NewApp()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	srv.Close()

	resp, err := app.HttpPost(srv.URL, "hi", map[string]string{hdrCT: ctPlain})
	if err == nil {
		t.Fatalf("expected error from client.Do, got nil (resp=%v)", resp)
	}
}

func TestHttpPostReadBodyError(t *testing.T) {
	app := NewApp()

	srv := newTruncatedBodyServer(t)
	defer srv.Close()

	resp, err := app.HttpPost(srv.URL, "hi", map[string]string{hdrCT: ctPlain})
	if err == nil {
		t.Fatalf("expected read error, got nil (resp=%v)", resp)
	}
}
