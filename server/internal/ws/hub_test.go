package ws

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"
)

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

	select {
	case b := <-c.send:
		var m Message
		if err := json.Unmarshal(b, &m); err != nil {
			t.Fatalf("failed to unmarshal join response: %v", err)
		}
		if m.Type != MessageRoomUsers || m.Room != "r1" {
			t.Fatalf("expected room.users for r1, got %q (%q)", m.Type, m.Room)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatalf("expected room.users snapshot after join")
	}
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

	// Wait for the two room.users snapshots (one per join).
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
		t.Fatalf("expected room.users snapshots for both rooms")
	}

	m.DisconnectClient(c)

	probeNotInRoom := func(hub *Hub, room string) {
		t.Helper()
		probeDeadline := time.Now().Add(time.Second)
		for time.Now().Before(probeDeadline) {
			msg := Message{Type: MessageChatMessage, Room: room, Data: json.RawMessage(`{"message":"hi"}`)}
			hub.inbound <- &inboundMessage{client: c, msg: &msg}

			select {
			case b := <-c.send:
				var m Message
				if err := json.Unmarshal(b, &m); err != nil {
					continue
				}
				if m.Type == MessageError {
					return
				}
				// If still joined, we may see chat.message echoed; keep probing.
			case <-time.After(10 * time.Millisecond):
			}
		}
		t.Fatalf("expected not-in-room error for %q", room)
	}

	probeNotInRoom(hubA, roomA)
	probeNotInRoom(hubB, roomB)
}

func TestHubRunIgnoresNilEvents(t *testing.T) {
	h := NewHub()
	go h.Run()

	h.disconnect <- nil
	h.inbound <- nil
	h.inbound <- &inboundMessage{}

	time.Sleep(20 * time.Millisecond)
}

func TestHubHelperBranchesForMissingRooms(t *testing.T) {
	h := NewHub()
	c := &Client{send: make(chan []byte, 1), UserID: "u1", Username: "alice"}

	h.clientLeaveRoom("missing", c)
	h.clientBroadcastToRoom("missing", &Message{Type: MessageChatMessage, Room: "missing", Data: json.RawMessage(`{"message":"x"}`), From: "u1"})
	h.clientBroadcastRoomUsersSnapshot("missing")

	affected := h.clientLeaveAllRooms(c)
	if len(affected) != 0 {
		t.Fatalf("expected no affected rooms")
	}
}

func TestHubDisconnectChannelFullKeepsRunning(t *testing.T) {
	h := &Hub{
		rooms:      make(map[string]map[*Client]bool),
		disconnect: make(chan *Client, 1),
		inbound:    make(chan *inboundMessage, 1),
	}

	victim := &Client{send: make(chan []byte), UserID: "u1", Username: "alice"}
	h.clientJoinRoom("r1", victim)

	h.disconnect <- &Client{UserID: "occupied"}

	msg := &Message{Type: MessageChatMessage, Room: "r1", Data: json.RawMessage(`{"message":"hi"}`), From: "u1"}
	for i := 0; i < maxDroppedMessages; i++ {
		h.clientBroadcastToRoom("r1", msg)
	}

	if len(h.disconnect) != 1 {
		t.Fatalf("expected disconnect channel to remain full")
	}
}
