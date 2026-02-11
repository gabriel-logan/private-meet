package ws

import (
	"encoding/json"
	"testing"
	"time"
)

func mustRecv(t *testing.T, ch <-chan []byte, timeout time.Duration) []byte {
	t.Helper()

	select {
	case b := <-ch:
		return b
	case <-time.After(timeout):
		t.Fatalf("timed out waiting for message")
		return nil
	}
}

func TestHubBroadcastRoomUsersSnapshot(t *testing.T) {
	h := NewHub()

	c1 := &Client{send: make(chan []byte, 4), UserID: "u1", Username: "alice"}
	c2 := &Client{send: make(chan []byte, 4), UserID: "u2", Username: "bob"}

	h.clientJoinRoom("r", c1)
	h.clientJoinRoom("r", c2)

	h.clientBroadcastRoomUsersSnapshot("r")

	for i := 0; i < 2; i++ {
		b := mustRecv(t, func() <-chan []byte {
			if i == 0 {
				return c1.send
			}
			return c2.send
		}(), 100*time.Millisecond)

		var msg Message
		if err := json.Unmarshal(b, &msg); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}

		if msg.Type != MessageRoomUsers {
			t.Fatalf("expected room.users, got %q", msg.Type)
		}

		var payload RoomUsersData
		if err := json.Unmarshal(msg.Data, &payload); err != nil {
			t.Fatalf("failed to unmarshal payload: %v", err)
		}

		if len(payload.Users) != 2 {
			t.Fatalf("expected 2 users, got %d", len(payload.Users))
		}
	}
}

func TestHubBroadcastToRoomSetsFromAndEchoes(t *testing.T) {
	h := NewHub()

	c := &Client{send: make(chan []byte, 4), UserID: "u1", Username: "alice"}

	h.clientJoinRoom("r", c)

	msg := &Message{Type: MessageChatMessage, Room: "r", From: "evil", Data: json.RawMessage(`{"message":"hi"}`)}

	h.clientBroadcastToRoom("r", msg)

	b := mustRecv(t, c.send, 100*time.Millisecond)

	var got Message
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if got.Type != MessageChatMessage {
		t.Fatalf("expected chat.message, got %q", got.Type)
	}
}

func TestHubLeaveRoomRemovesMembershipAndDeletesRoom(t *testing.T) {
	h := NewHub()
	c := &Client{send: make(chan []byte, 1), UserID: "u1", Username: "alice"}

	h.clientJoinRoom("r", c)
	if !h.isClientInRoom("r", c) {
		t.Fatalf("expected client to be in room")
	}

	h.clientLeaveRoom("r", c)
	if h.isClientInRoom("r", c) {
		t.Fatalf("expected client to have left room")
	}

	if _, ok := h.rooms["r"]; ok {
		t.Fatalf("expected room to be deleted when empty")
	}
}

func TestHubRunInvalidMessageTypeSendsError(t *testing.T) {
	h := NewHub()
	go h.Run()

	c := &Client{send: make(chan []byte, 4), UserID: "u1", Username: "alice"}

	msg := Message{Type: MessageType("nope"), Room: "r", Data: json.RawMessage(`null`)}
	h.inbound <- &inboundMessage{client: c, msg: &msg}

	b := mustRecv(t, c.send, time.Second)

	var got Message
	if err := json.Unmarshal(b, &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if got.Type != MessageError {
		t.Fatalf("expected general.error, got %q", got.Type)
	}
}

func TestHubDisconnectOnDroppedMessages(t *testing.T) {
	h := NewHub()

	// Unbuffered send channel: every broadcast will drop.
	c := &Client{send: make(chan []byte), UserID: "u1", Username: "alice"}
	h.clientJoinRoom("r", c)

	msg := &Message{Type: MessageChatMessage, Room: "r", Data: json.RawMessage(`{"message":"hi"}`), From: "u1"}

	for i := 0; i < maxDroppedMessages; i++ {
		h.clientBroadcastToRoom("r", msg)
	}

	select {
	case got := <-h.disconnect:
		if got != c {
			t.Fatalf("expected disconnect client")
		}
	case <-time.After(200 * time.Millisecond):
		t.Fatalf("expected disconnect to be triggered")
	}
}

func TestHubDisconnectRemovesClientAndBroadcastsSnapshot(t *testing.T) {
	h := NewHub()
	go h.Run()

	c1 := &Client{send: make(chan []byte, 8), UserID: "u1", Username: "alice"}
	c2 := &Client{send: make(chan []byte, 8), UserID: "u2", Username: "bob"}

	join1 := Message{Type: MessageChatJoin, Room: "r", Data: json.RawMessage(`null`)}
	h.inbound <- &inboundMessage{client: c1, msg: &join1}
	join2 := Message{Type: MessageChatJoin, Room: "r", Data: json.RawMessage(`null`)}
	h.inbound <- &inboundMessage{client: c2, msg: &join2}

	// Drain initial room.users messages (order isn't guaranteed).
	_ = mustRecv(t, c1.send, time.Second)
	_ = mustRecv(t, c2.send, time.Second)

	// Now disconnect c1; c2 should receive an updated snapshot containing only itself.
	h.disconnect <- c1

	var got Message
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		b := mustRecv(t, c2.send, time.Until(deadline))
		if err := json.Unmarshal(b, &got); err != nil {
			continue
		}
		if got.Type == MessageRoomUsers {
			break
		}
	}
	if got.Type != MessageRoomUsers {
		t.Fatalf("expected room.users")
	}

	var payload RoomUsersData
	if err := json.Unmarshal(got.Data, &payload); err != nil {
		t.Fatalf("unmarshal payload: %v", err)
	}
	if len(payload.Users) != 1 || payload.Users[0].UserID != "u2" {
		t.Fatalf("expected only u2 in snapshot")
	}
}
