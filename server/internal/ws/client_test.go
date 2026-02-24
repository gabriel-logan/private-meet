package ws

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestClientSafeSendNonBlocking(t *testing.T) {
	c := &Client{send: make(chan []byte)}

	if ok := c.safeSend([]byte("hi")); ok {
		t.Fatalf("expected safeSend to fail on unbuffered channel with no receiver")
	}

	c2 := &Client{send: make(chan []byte, 1)}
	if ok := c2.safeSend([]byte("hi")); !ok {
		t.Fatalf("expected safeSend to succeed on buffered channel")
	}
}

func TestClientReadPumpReturnsWhenReadDeadlineFails(t *testing.T) {
	initWSIntegrationEnv(t)

	mux := http.NewServeMux()
	done := make(chan struct{})
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		_ = conn.Close()

		c := &Client{conn: conn, send: make(chan []byte, 1), UserID: "u1", Username: "alice"}
		c.readPump(nil)
		close(done)
	})

	srv := httptest.NewServer(mux)
	defer srv.Close()

	u, err := url.Parse(srv.URL)
	if err != nil {
		t.Fatalf("parse url: %v", err)
	}
	u.Scheme = strings.Replace(u.Scheme, "http", "ws", 1)
	u.Path = "/ws"

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), http.Header{"Origin": []string{"http://example.test"}})
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatalf("readPump did not return")
	}
}
