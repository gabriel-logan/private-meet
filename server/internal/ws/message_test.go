package ws

import "testing"

func TestMessageTypeIsValid(t *testing.T) {
	if !MessageChatMessage.IsValid() {
		t.Fatalf("expected chat.message to be valid")
	}

	if MessageType("nope").IsValid() {
		t.Fatalf("expected unknown type to be invalid")
	}
}
