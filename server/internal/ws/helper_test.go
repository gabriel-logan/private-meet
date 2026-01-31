package ws

import (
	"encoding/json"
	"testing"
)

func TestNewMessageValidJSONData(t *testing.T) {
	data := json.RawMessage(`{"key":"value"}`)

	msgBytes := newMessage(
		MessageType("test.type"),
		"room1",
		data,
		"user1",
	)

	var msg Message
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if msg.Type != "test.type" {
		t.Errorf("expected type 'test.type', got %s", msg.Type)
	}

	if msg.Room != "room1" {
		t.Errorf("expected room 'room1', got %s", msg.Room)
	}

	if msg.From != "user1" {
		t.Errorf("expected from 'user1', got %s", msg.From)
	}

	if string(msg.Data) != `{"key":"value"}` {
		t.Errorf("unexpected data: %s", msg.Data)
	}
}

func TestNewMessageInvalidJSONData(t *testing.T) {
	// JSON truncado
	data := json.RawMessage(`{"key":`)

	msgBytes := newMessage(
		MessageType("test.type"),
		"room1",
		data,
		"user1",
	)

	var msg map[string]any
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("response must still be valid JSON")
	}

	if msg["type"] != "general.error" {
		t.Errorf("expected general.error, got %v", msg["type"])
	}
}

func TestNewMessageJSONInjectionInData(t *testing.T) {
	data := json.RawMessage(`{"ok":true},"admin":true`)

	msgBytes := newMessage(
		MessageType("test.type"),
		"",
		data,
		"user1",
	)

	var msg map[string]any
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("response must be valid JSON")
	}

	if msg["type"] != "general.error" {
		t.Errorf("expected injection to be blocked")
	}
}

func TestNewErrorMessagePreventsInjection(t *testing.T) {
	payload := `" },"admin":true,"x":"y`

	msgBytes := newErrorMessage(payload)

	var msg struct {
		Data map[string]any `json:"data"`
	}

	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("invalid JSON generated: %v", err)
	}

	if _, exists := msg.Data["admin"]; exists {
		t.Errorf("JSON injection detected: admin field should not exist")
	}

	if msg.Data["error"] != payload {
		t.Errorf("error message altered or not preserved safely")
	}
}

func TestNewMessageAlwaysReturnsValidJSON(t *testing.T) {
	cases := []json.RawMessage{
		[]byte(``),
		[]byte(`{`),
		[]byte(`"`),
		[]byte(`null`),
		[]byte(`[]`),
	}

	for _, c := range cases {
		msgBytes := newMessage(
			MessageType("x"),
			"",
			c,
			"user",
		)

		if !json.Valid(msgBytes) {
			t.Fatalf("returned invalid JSON for input: %q", c)
		}
	}
}

func TestNewMessageFuzzLikeInputs(t *testing.T) {
	inputs := []string{
		`{"a":1}`,
		`{"a":"\"}`,
		`{"a":[}`,
		`{"a":null}`,
		`{"a":true}`,
		`{"a":{}}`,
	}

	for _, in := range inputs {
		data := json.RawMessage(in)

		msgBytes := newMessage(
			MessageType("test"),
			"",
			data,
			"user",
		)

		if !json.Valid(msgBytes) {
			t.Errorf("invalid JSON output for input %q", in)
		}
	}
}

func TestNewMessageValidByteData(t *testing.T) {
	data := []byte(`{"key":"value"}`)

	msgBytes := newMessage(
		MessageType("test.type"),
		"room1",
		data,
		"user1",
	)

	var msg Message
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if msg.Type != "test.type" {
		t.Errorf("expected type 'test.type', got %s", msg.Type)
	}

	if msg.Room != "room1" {
		t.Errorf("expected room 'room1', got %s", msg.Room)
	}

	if msg.From != "user1" {
		t.Errorf("expected from 'user1', got %s", msg.From)
	}

	if string(msg.Data) != `{"key":"value"}` {
		t.Errorf("unexpected data: %s", msg.Data)
	}
}

func TestNewMessageInvalidByteData(t *testing.T) {
	// JSON truncado
	data := []byte(`{"key":`)

	msgBytes := newMessage(
		MessageType("test.type"),
		"room1",
		data,
		"user1",
	)

	var msg map[string]any
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("response must still be valid JSON")
	}

	if msg["type"] != "general.error" {
		t.Errorf("expected general.error, got %v", msg["type"])
	}
}

func TestNewMessageByteJSONInjectionInData(t *testing.T) {
	data := []byte(`{"ok":true},"admin":true`)

	msgBytes := newMessage(
		MessageType("test.type"),
		"",
		data,
		"user1",
	)

	var msg map[string]any
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("response must be valid JSON")
	}

	if msg["type"] != "general.error" {
		t.Errorf("expected injection to be blocked")
	}
}

func TestNewErrorMessageValidByteData(t *testing.T) {
	message := "An error occurred"

	msgBytes := newErrorMessage(message)

	var msg Message
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if msg.Type != MessageError {
		t.Errorf("expected type 'general.error', got %s", msg.Type)
	}

	if msg.From != "system" {
		t.Errorf("expected from 'system', got %s", msg.From)
	}

	var data map[string]string
	if err := json.Unmarshal(msg.Data, &data); err != nil {
		t.Fatalf("expected no error unmarshaling data, got %v", err)
	}

	if data["error"] != message {
		t.Errorf("expected error message '%s', got '%s'", message, data["error"])
	}
}

func TestNewErrorMessagePreventsInjectionWithBytes(t *testing.T) {
	payload := []byte(`" },"admin":true`)

	msgBytes := newErrorMessage(string(payload))

	var msg struct {
		Data map[string]any `json:"data"`
	}

	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("invalid JSON generated: %v", err)
	}

	if _, exists := msg.Data["admin"]; exists {
		t.Errorf("JSON injection detected: admin field should not exist")
	}

	if msg.Data["error"] != string(payload) {
		t.Errorf("error message altered or not preserved safely")
	}
}

func TestNewErrorMessageAlwaysReturnsValidJSON(t *testing.T) {
	messages := []string{
		"",
		"{",
		`"`,
		"null",
		"[]",
	}

	for _, msg := range messages {
		msgBytes := newErrorMessage(msg)

		if !json.Valid(msgBytes) {
			t.Fatalf("returned invalid JSON for message: %q", msg)
		}
	}
}

func TestNewMessageNilData(t *testing.T) {
	msgBytes := newMessage(
		MessageType("test.type"),
		"room1",
		nil,
		"user1",
	)

	var msg Message
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if string(msg.Data) != "null" {
		t.Errorf("expected data to be 'null', got %s", msg.Data)
	}
}
