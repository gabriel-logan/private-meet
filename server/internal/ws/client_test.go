package ws

import "testing"

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
