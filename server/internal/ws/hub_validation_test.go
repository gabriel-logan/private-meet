package ws

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func readServerMsg(t *testing.T, c *Client) Message {
	t.Helper()
	select {
	case b := <-c.send:
		var msg Message
		if err := json.Unmarshal(b, &msg); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		return msg
	case <-time.After(time.Second):
		t.Fatalf("timeout waiting for server message")
		return Message{}
	}
}

func TestHubRunValidationErrorsInRoom(t *testing.T) {
	h := NewHub()
	go h.Run()

	c := &Client{send: make(chan []byte, 64), UserID: "u1", Username: "alice"}

	// join
	join := Message{Type: MessageChatJoin, Room: "r", Data: json.RawMessage(`null`)}
	h.inbound <- &inboundMessage{client: c, msg: &join}
	_ = readServerMsg(t, c) // room.users

	// invalid typing payload
	typingBad := Message{Type: MessageChatTyping, Room: "r", Data: json.RawMessage(`{"typing":"x"}`)}
	h.inbound <- &inboundMessage{client: c, msg: &typingBad}
	if msg := readServerMsg(t, c); msg.Type != MessageError {
		t.Fatalf("expected error")
	}

	// invalid chat payload type
	chatBad := Message{Type: MessageChatMessage, Room: "r", Data: json.RawMessage(`{"message":123}`)}
	h.inbound <- &inboundMessage{client: c, msg: &chatBad}
	if msg := readServerMsg(t, c); msg.Type != MessageError {
		t.Fatalf("expected error")
	}

	// empty message
	chatEmpty := Message{Type: MessageChatMessage, Room: "r", Data: json.RawMessage(`{"message":"   "}`)}
	h.inbound <- &inboundMessage{client: c, msg: &chatEmpty}
	if msg := readServerMsg(t, c); msg.Type != MessageError {
		t.Fatalf("expected error")
	}

	// too long
	tooLong := strings.Repeat("a", maxChatRunes+1)
	chatTooLong := Message{Type: MessageChatMessage, Room: "r", Data: json.RawMessage(`{"message":"` + tooLong + `"}`)}
	h.inbound <- &inboundMessage{client: c, msg: &chatTooLong}
	if msg := readServerMsg(t, c); msg.Type != MessageError {
		t.Fatalf("expected error")
	}

	// invalid webrtc answer payload (to is wrong type)
	webrtcBad := Message{Type: MessageWebRTCAnswer, Room: "r", Data: json.RawMessage(`{"sdp":"desc","to":123}`)}
	h.inbound <- &inboundMessage{client: c, msg: &webrtcBad}
	if msg := readServerMsg(t, c); msg.Type != MessageError {
		t.Fatalf("expected error")
	}

	// missing recipient
	webrtcNoTo := Message{Type: MessageWebRTCIceCandidate, Room: "r", Data: json.RawMessage(`{"candidate":"x","to":"  "}`)}
	h.inbound <- &inboundMessage{client: c, msg: &webrtcNoTo}
	if msg := readServerMsg(t, c); msg.Type != MessageError {
		t.Fatalf("expected error")
	}
}
