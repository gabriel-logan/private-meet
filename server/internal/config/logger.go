package config

import (
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"
)

func InitLogger() {
	log.SetFlags(0)
	log.SetOutput(&pmWriter{out: os.Stdout})
}

type pmWriter struct {
	out io.Writer
}

func (w *pmWriter) Write(p []byte) (n int, err error) {
	msg := strings.TrimRight(string(p), "\n")

	upper := strings.ToUpper(msg)

	level := "INFO"
	if strings.HasPrefix(upper, "DEBUG") {
		level = "DEBUG"
	} else if strings.HasPrefix(upper, "WARN") || strings.HasPrefix(upper, "WARNING") {
		level = "WARNING"
	} else if strings.HasPrefix(upper, "ERROR") || strings.HasPrefix(upper, "FATAL") {
		level = "ERROR"
	}

	var prefix string
	switch level {
	case "DEBUG":
		prefix = "[PM-debug]"
	case "INFO":
		prefix = "[PM]"
	case "WARNING":
		prefix = "[PM-warning]"
	case "ERROR":
		prefix = "[PM-error]"
	}

	timestamp := time.Now().Format("2006/01/02 - 15:04:05")

	formatted := fmt.Sprintf("%s %s | %s\n", prefix, timestamp, msg)

	return w.out.Write([]byte(formatted))
}
