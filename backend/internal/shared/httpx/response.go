// Package httpx is the tiny HTTP helpers every handler uses — JSON write,
// error envelope, request decode. Keeps handlers free of repetitive plumbing.
package httpx

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/rs/zerolog/hlog"
)

type Envelope struct {
	Data  any    `json:"data,omitempty"`
	Error string `json:"error,omitempty"`
	Code  string `json:"code,omitempty"`
}

func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

func OK(w http.ResponseWriter, data any) {
	JSON(w, http.StatusOK, Envelope{Data: data})
}

func Created(w http.ResponseWriter, data any) {
	JSON(w, http.StatusCreated, Envelope{Data: data})
}

func NoContent(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNoContent)
}

// Error writes a structured error envelope and logs via the request-scoped logger.
func Error(w http.ResponseWriter, r *http.Request, status int, code string, err error) {
	msg := "internal_error"
	if err != nil {
		msg = err.Error()
	}
	hlog.FromRequest(r).Warn().
		Int("status", status).
		Str("code", code).
		Err(err).
		Msg("request failed")
	JSON(w, status, Envelope{Error: msg, Code: code})
}

func Decode(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return errors.New("invalid request body: " + err.Error())
	}
	return nil
}
