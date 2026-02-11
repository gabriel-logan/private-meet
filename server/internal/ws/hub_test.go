package ws

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"
)

func eventually(t *testing.T, timeout time.Duration, fn func() bool, msg string) {
	t.Helper()

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if fn() {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}

	t.Fatalf("timeout waiting: %s", msg)
}

func TestHubDoesNotExitOnNotInRoomErrors(t *testing.T) {
	h := NewHub()
	go h.Run()

	c := &Client{send: make(chan []byte, 32), UserID: "u1", Username: "n1"}

	// Send a chat message without joining the room first.
	msg1 := Message{
		Type: MessageChatMessage,
		Room: "r1",
		Data: json.RawMessage(`{"message":"hi"}`),
	}
	h.inbound <- &inboundMessage{client: c, msg: &msg1}

	select {
	case b := <-c.send:
		// We expect an error message but don't require exact wording.
		var m Message
		if err := json.Unmarshal(b, &m); err != nil {
			t.Fatalf("failed to unmarshal server response: %v", err)
		}
		if m.Type != MessageError {
			t.Fatalf("expected error message, got %q", m.Type)
		}
	case <-time.After(250 * time.Millisecond):
		t.Fatalf("expected an error response")
	}

	// Now join; the hub must still be alive and process this.
	msg2 := Message{Type: MessageChatJoin, Room: "r1", Data: json.RawMessage(`null`)}
	h.inbound <- &inboundMessage{client: c, msg: &msg2}

	eventually(t, 500*time.Millisecond, func() bool {
		return h.isClientInRoom("r1", c)
	}, "client to be in room after join")
}

func TestManagerDisconnectClientRemovesFromAllHubs(t *testing.T) {
	m := NewManager(4)

	c := &Client{send: make(chan []byte, 128), UserID: "u1", Username: "n1"}

	roomA := "room-a"
	hubA := m.GetHubForRoom(roomA)

	roomB := ""
	var hubB *Hub
	for i := 0; i < 5000; i++ {
		candidate := fmt.Sprintf("room-b-%d", i)
		h := m.GetHubForRoom(candidate)
		if h != hubA {
			roomB = candidate
			hubB = h
			break
		}
	}
	if roomB == "" || hubB == nil {
		t.Fatalf("failed to find two rooms mapping to different hubs")
	}

	// Join both rooms (potentially different shards).
	joinA := Message{Type: MessageChatJoin, Room: roomA, Data: json.RawMessage(`null`)}
	hubA.inbound <- &inboundMessage{client: c, msg: &joinA}
	joinB := Message{Type: MessageChatJoin, Room: roomB, Data: json.RawMessage(`null`)}
	hubB.inbound <- &inboundMessage{client: c, msg: &joinB}

	eventually(t, 500*time.Millisecond, func() bool {
		return hubA.isClientInRoom(roomA, c)
	}, "client to be in roomA")
	eventually(t, 500*time.Millisecond, func() bool {
		return hubB.isClientInRoom(roomB, c)
	}, "client to be in roomB")

	m.DisconnectClient(c)

	eventually(t, 500*time.Millisecond, func() bool {
		return !hubA.isClientInRoom(roomA, c)
	}, "client to be removed from roomA")
	eventually(t, 500*time.Millisecond, func() bool {
		return !hubB.isClientInRoom(roomB, c)
	}, "client to be removed from roomB")
}
