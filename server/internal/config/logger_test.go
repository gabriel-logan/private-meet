package config

import (
	"bytes"
	"regexp"
	"testing"
)

func TestPMWriterFormatsMessage(t *testing.T) {
	buf := new(bytes.Buffer)

	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("ERROR something happened\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	out := buf.String()

	// Example: [PM-error] 2026/02/02 - 12:34:56 | ERROR something happened
	re := regexp.MustCompile(`^\[PM-error\] \d{4}/\d{2}/\d{2} - \d{2}:\d{2}:\d{2} \| ERROR something happened\n$`)
	if !re.MatchString(out) {
		t.Fatalf("unexpected format: %q", out)
	}
}
