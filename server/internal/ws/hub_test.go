package ws

import "testing"

func TestHubJoinLeaveRoom(t *testing.T) {
	h := NewHub()
	c := &Client{UserID: "u1", Username: "name", send: make(chan []byte, 1)}

	h.clientJoinRoom("room1", c)
	if !h.isClientInRoom("room1", c) {
		t.Fatalf("expected client to be in room")
	}

	h.clientLeaveRoom("room1", c)
	if h.isClientInRoom("room1", c) {
		t.Fatalf("expected client to be removed from room")
	}
}
