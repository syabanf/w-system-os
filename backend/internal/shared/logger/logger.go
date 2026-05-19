// Package logger wraps zerolog with the conventions every WIT service uses:
// structured JSON in prod, pretty console in dev, service-name + env tagged.
package logger

import (
	"io"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

func New(service, level string, pretty bool) zerolog.Logger {
	lvl, err := zerolog.ParseLevel(strings.ToLower(level))
	if err != nil {
		lvl = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(lvl)
	zerolog.TimeFieldFormat = time.RFC3339Nano

	var out io.Writer = os.Stdout
	if pretty {
		out = zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	}
	return zerolog.New(out).
		With().
		Timestamp().
		Str("service", service).
		Logger()
}
