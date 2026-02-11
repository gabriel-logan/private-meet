package ws

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"
)

// This test is meant to be exercised with `go test -race`.
// It stresses concurrent broadcasts from different hub shards to the same client.
func TestRaceBroadcastAcrossHubs(t *testing.T) {
	m := NewManager(4)

	c := &Client{send: make(chan []byte, 4096), UserID: "u1", Username: "n1"}

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

	joinA := Message{Type: MessageChatJoin, Room: roomA, Data: json.RawMessage(`null`)}
	hubA.inbound <- &inboundMessage{client: c, msg: &joinA}
	joinB := Message{Type: MessageChatJoin, Room: roomB, Data: json.RawMessage(`null`)}
	hubB.inbound <- &inboundMessage{client: c, msg: &joinB}

	// Confirm joins via room.users snapshots (no direct map reads).
	seen := map[string]bool{}
	deadline := time.Now().Add(time.Second)
	for len(seen) < 2 && time.Now().Before(deadline) {
		select {
		case b := <-c.send:
			var m Message
			if err := json.Unmarshal(b, &m); err != nil {
				continue
			}
			if m.Type == MessageRoomUsers {
				seen[m.Room] = true
			}
		case <-time.After(10 * time.Millisecond):
		}
	}
	if !seen[roomA] || !seen[roomB] {
		t.Fatalf("expected joins to complete")
	}

	// Drain messages so broadcasts don't block; races will still surface under -race.
	stopDrain := make(chan struct{})
	go func() {
		for {
			select {
			case <-stopDrain:
				return
			case <-c.send:
			}
		}
	}()
	defer close(stopDrain)

	payload := json.RawMessage(`{"message":"hi"}`)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for i := 0; i < 2000; i++ {
			msg := Message{Type: MessageChatMessage, Room: roomA, Data: payload}
			hubA.inbound <- &inboundMessage{client: c, msg: &msg}
		}
	}()

	for i := 0; i < 2000; i++ {
		msg := Message{Type: MessageChatMessage, Room: roomB, Data: payload}
		hubB.inbound <- &inboundMessage{client: c, msg: &msg}
	}

	select {
	case <-done:
	case <-time.After(3 * time.Second):
		t.Fatalf("timed out")
	}
}
