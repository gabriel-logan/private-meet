package ws

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/gabriel-logan/private-meet/server/internal/config"
	"github.com/gabriel-logan/private-meet/server/internal/security"
	"github.com/gorilla/websocket"
)

func initWSIntegrationEnv(t *testing.T) {
	t.Helper()

	ensureInternalDotEnvFile(t)

	// Keep it permissive: we don't want origin checks to interfere.
	t.Setenv("GO_ENV", "development")
	t.Setenv("HUB_SHARDS_QUANTITY", "2")
	t.Setenv("USE_LOCAL_TLS", "false")
	t.Setenv("APP_NAME", "PrivateMeet")
	t.Setenv("ALLOWED_ORIGINS", "http://example.test")
	t.Setenv("SERVER_PORT", "8080")
	t.Setenv("JWT_SECRET", "testsecret")
	t.Setenv("JWT_EXPIRATION", "1h")
	t.Setenv("CONTEXT_TIMEOUT", "10s")

	_ = config.InitEnv()
}

func newWSServer(t *testing.T) (*httptest.Server, *Manager) {
	t.Helper()

	m := NewManager(2)

	mux := http.NewServeMux()
	mux.Handle("/ws", ServeWS(m))

	srv := httptest.NewServer(mux)

	return srv, m
}

func dialWS(t *testing.T, baseURL string, token string) (*websocket.Conn, func()) {
	t.Helper()

	u, err := url.Parse(baseURL)
	if err != nil {
		t.Fatalf("parse url: %v", err)
	}

	u.Scheme = strings.Replace(u.Scheme, "http", "ws", 1)
	u.Path = "/ws"
	u.RawQuery = url.Values{"token": []string{token}}.Encode()

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), http.Header{"Origin": []string{"http://example.test"}})
	if err != nil {
		t.Fatalf("dial ws: %v", err)
	}

	cleanup := func() {
		_ = conn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "bye"), time.Now().Add(time.Second))
		_ = conn.Close()
	}

	return conn, cleanup
}

func readJSONMessage(t *testing.T, conn *websocket.Conn, timeout time.Duration) Message {
	t.Helper()

	_ = conn.SetReadDeadline(time.Now().Add(timeout))

	_, b, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read message: %v", err)
	}

	var msg Message
	if err := json.Unmarshal(b, &msg); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	return msg
}

func readUntilType(t *testing.T, conn *websocket.Conn, timeout time.Duration, want MessageType) Message {
	t.Helper()

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		msg := readJSONMessage(t, conn, time.Until(deadline))
		if msg.Type == want {
			return msg
		}
	}

	t.Fatalf("timed out waiting for message type %q", want)
	return Message{}
}

func TestServeWSUnauthorizedWhenMissingToken(t *testing.T) {
	initWSIntegrationEnv(t)

	mux := http.NewServeMux()
	mux.Handle("/ws", ServeWS(NewManager(1)))

	srv := httptest.NewServer(mux)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/ws")
	if err != nil {
		t.Fatalf("http get: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestServeWSUnauthorizedWhenInvalidToken(t *testing.T) {
	initWSIntegrationEnv(t)

	mux := http.NewServeMux()
	mux.Handle("/ws", ServeWS(NewManager(1)))

	srv := httptest.NewServer(mux)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/ws?token=not-a-jwt")
	if err != nil {
		t.Fatalf("http get: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestServeWSUpgradeErrorWhenNoHijacker(t *testing.T) {
	initWSIntegrationEnv(t)

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	manager := NewManager(1)
	h := ServeWS(manager)

	req := httptest.NewRequest(http.MethodGet, "http://example.test/ws?token="+url.QueryEscape(token), nil)
	req.Header.Set("Origin", "http://example.test")

	// ResponseRecorder does not implement http.Hijacker, so the upgrade must fail.
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestWebSocketJoinAndChatMessageRoundTrip(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	// Join should trigger room.users snapshot.
	if err := conn.WriteJSON(Message{Type: MessageChatJoin, Room: "r1", Data: json.RawMessage(`null`)}); err != nil {
		t.Fatalf("write join: %v", err)
	}

	msg := readUntilType(t, conn, time.Second, MessageRoomUsers)
	if msg.Type != MessageRoomUsers {
		t.Fatalf("expected room.users, got %q", msg.Type)
	}

	// Send a chat message and expect it echoed.
	if err := conn.WriteJSON(Message{Type: MessageChatMessage, Room: "r1", Data: json.RawMessage(`{"message":"hi"}`), From: "spoof"}); err != nil {
		t.Fatalf("write chat: %v", err)
	}

	got := readJSONMessage(t, conn, time.Second)
	if got.Type != MessageChatMessage {
		t.Fatalf("expected chat.message, got %q", got.Type)
	}
	if got.From != "u1" {
		t.Fatalf("expected server to set from=u1, got %q", got.From)
	}
}

func TestWebSocketUtilsGenerateRoomID(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	// This message intentionally has no room.
	if err := conn.WriteJSON(Message{Type: MessageUtilsGenerateRoomID, Data: json.RawMessage(`null`)}); err != nil {
		t.Fatalf("write generateRoomID: %v", err)
	}

	msg := readJSONMessage(t, conn, time.Second)
	if msg.Type != MessageUtilsGenerateRoomID {
		t.Fatalf("expected utils.generateRoomID, got %q", msg.Type)
	}
}

func TestWebSocketProtocolValidationErrors(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	// Invalid type
	if err := conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"bad.type","data":null}`)); err != nil {
		t.Fatalf("write invalid type: %v", err)
	}
	msg := readUntilType(t, conn, time.Second, MessageError)
	if msg.Type != MessageError {
		t.Fatalf("expected general.error")
	}

	// Missing room (chat.join requires room)
	if err := conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"chat.join","room":"","data":null}`)); err != nil {
		t.Fatalf("write missing room: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageError)

	// Room too long
	longRoom := strings.Repeat("a", maxRoomIDLength+1)
	if err := conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"chat.join","room":"`+longRoom+`","data":null}`)); err != nil {
		t.Fatalf("write long room: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageError)
}

func TestWebSocketTypingAndWebRTCFlow(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	// Join
	if err := conn.WriteJSON(Message{Type: MessageChatJoin, Room: "r1", Data: json.RawMessage(`null`)}); err != nil {
		t.Fatalf("write join: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageRoomUsers)

	// Typing true
	if err := conn.WriteJSON(Message{Type: MessageChatTyping, Room: "r1", Data: json.RawMessage(`{"typing":true}`)}); err != nil {
		t.Fatalf("write typing: %v", err)
	}

	gotTyping := readUntilType(t, conn, time.Second, MessageChatTyping)
	if gotTyping.From != "u1" {
		t.Fatalf("expected typing from=u1, got %q", gotTyping.From)
	}

	// WebRTC offer
	if err := conn.WriteJSON(Message{Type: MessageWebRTCOffer, Room: "r1", Data: json.RawMessage(`{"sdp":"x","to":"peer2"}`)}); err != nil {
		t.Fatalf("write offer: %v", err)
	}

	gotOffer := readUntilType(t, conn, time.Second, MessageWebRTCOffer)
	if gotOffer.From != "u1" {
		t.Fatalf("expected offer from=u1, got %q", gotOffer.From)
	}
}

func TestWebSocketInvalidPayloadsReturnErrors(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	// Join
	if err := conn.WriteJSON(Message{Type: MessageChatJoin, Room: "r1", Data: json.RawMessage(`null`)}); err != nil {
		t.Fatalf("write join: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageRoomUsers)

	// Invalid typing payload
	if err := conn.WriteJSON(Message{Type: MessageChatTyping, Room: "r1", Data: json.RawMessage(`{"typing":"nope"}`)}); err != nil {
		t.Fatalf("write invalid typing: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageError)

	// Invalid chat payload
	if err := conn.WriteJSON(Message{Type: MessageChatMessage, Room: "r1", Data: json.RawMessage(`{"message":123}`)}); err != nil {
		t.Fatalf("write invalid chat: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageError)

	// Missing webrtc recipient
	if err := conn.WriteJSON(Message{Type: MessageWebRTCOffer, Room: "r1", Data: json.RawMessage(`{"sdp":"x","to":""}`)}); err != nil {
		t.Fatalf("write missing to: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageError)
}

func TestWebSocketLeaveThenMessageReturnsNotInRoomError(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	if err := conn.WriteJSON(Message{Type: MessageChatJoin, Room: "r1", Data: json.RawMessage(`null`)}); err != nil {
		t.Fatalf("write join: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageRoomUsers)

	if err := conn.WriteJSON(Message{Type: MessageChatLeave, Room: "r1", Data: json.RawMessage(`null`)}); err != nil {
		t.Fatalf("write leave: %v", err)
	}

	// After leave, a room-scoped message should yield the server error.
	if err := conn.WriteJSON(Message{Type: MessageChatTyping, Room: "r1", Data: json.RawMessage(`{"typing":false}`)}); err != nil {
		t.Fatalf("write typing: %v", err)
	}
	_ = readUntilType(t, conn, time.Second, MessageError)
}

func TestWebSocketProtocolErrorsEventuallyCloseConnection(t *testing.T) {
	initWSIntegrationEnv(t)

	srv, _ := newWSServer(t)
	defer srv.Close()

	token, err := security.GenerateJWT("u1", "alice")
	if err != nil {
		t.Fatalf("generate jwt: %v", err)
	}

	conn, cleanup := dialWS(t, srv.URL, token)
	defer cleanup()

	// Send invalid message types until protocolErrors reaches maxProtocolErrors.
	for i := 0; i < maxProtocolErrors+1; i++ {
		_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"bad.type","data":null}`))
	}

	// We should observe the connection closing (read should error eventually).
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			return
		}
	}
}
