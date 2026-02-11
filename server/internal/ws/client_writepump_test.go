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

func TestClientWritePumpWritesBinaryAndCloses(t *testing.T) {
	initWSIntegrationEnv(t)

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		c := &Client{conn: conn, send: make(chan []byte, 1)}
		go c.writePump()

		c.send <- []byte(`{"type":"test","data":null}`)
		close(c.send)
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

	_ = conn.SetReadDeadline(time.Now().Add(time.Second))
	mt, b, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read: %v", err)
	}

	if mt != websocket.BinaryMessage {
		t.Fatalf("expected binary message, got %d", mt)
	}

	if string(b) != `{"type":"test","data":null}` {
		t.Fatalf("unexpected payload: %s", string(b))
	}

	_ = conn.SetReadDeadline(time.Now().Add(time.Second))
	_, _, _ = conn.ReadMessage()
}
