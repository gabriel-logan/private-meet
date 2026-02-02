package config

import (
	"bytes"
	"errors"
	"io"
	"log"
	"os"
	"regexp"
	"testing"
)

func assertLogLine(t *testing.T, got string, expectedPrefix string, expectedMessage string) {
	t.Helper()

	re := regexp.MustCompile(
		"^" + regexp.QuoteMeta(expectedPrefix) +
			` \d{4}/\d{2}/\d{2} - \d{2}:\d{2}:\d{2} \| ` +
			regexp.QuoteMeta(expectedMessage) +
			"\\n$",
	)
	if !re.MatchString(got) {
		t.Fatalf("unexpected format: %q", got)
	}
}

func TestPMWriterFormatsError(t *testing.T) {
	buf := new(bytes.Buffer)

	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("ERROR something happened\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	assertLogLine(t, buf.String(), "[PM-error]", "ERROR something happened")
}

func TestPMWriterFormatsFatalAsError(t *testing.T) {
	buf := new(bytes.Buffer)
	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("FATAL boom\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	assertLogLine(t, buf.String(), "[PM-error]", "FATAL boom")
}

func TestPMWriterFormatsWarning(t *testing.T) {
	buf := new(bytes.Buffer)
	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("WARNING careful\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	assertLogLine(t, buf.String(), "[PM-warning]", "WARNING careful")
}

func TestPMWriterFormatsInfoByDefault(t *testing.T) {
	buf := new(bytes.Buffer)
	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("hello world\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	assertLogLine(t, buf.String(), "[PM]", "hello world")
}

func TestPMWriterFormatsDebug(t *testing.T) {
	buf := new(bytes.Buffer)
	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("DEBUG details\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	assertLogLine(t, buf.String(), "[PM-debug]", "DEBUG details")
}

func TestPMWriterTrimsTrailingNewlines(t *testing.T) {
	buf := new(bytes.Buffer)
	w := &pmWriter{out: buf}

	_, err := w.Write([]byte("ERROR multiple\n\n\n"))
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	assertLogLine(t, buf.String(), "[PM-error]", "ERROR multiple")
}

type errWriter struct{}

func (errWriter) Write(p []byte) (n int, err error) {
	return 0, errors.New("write failed")
}

func TestPMWriterPropagatesWriteError(t *testing.T) {
	w := &pmWriter{out: errWriter{}}
	_, err := w.Write([]byte("hello\n"))
	if err == nil {
		t.Fatalf("expected error")
	}
}

func TestInitLoggerSetsFlagsAndWriter(t *testing.T) {
	oldFlags := log.Flags()
	oldWriter := log.Writer()
	if oldWriter == nil {
		oldWriter = io.Discard
	}

	t.Cleanup(func() {
		log.SetFlags(oldFlags)
		log.SetOutput(oldWriter)
	})

	InitLogger()

	if log.Flags() != 0 {
		t.Fatalf("expected log flags 0, got %d", log.Flags())
	}

	got := log.Writer()
	w, ok := got.(*pmWriter)
	if !ok {
		t.Fatalf("expected log writer to be *pmWriter, got %T", got)
	}
	if w.out != os.Stdout {
		t.Fatalf("expected pmWriter to wrap os.Stdout")
	}
}
