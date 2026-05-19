// Package middleware ships the cross-cutting HTTP middleware: request ID,
// access logging, panic recovery, tenant scoping, CORS for the Next.js frontend.
package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/hlog"
)

// Stack wires the standard middleware order. Apply via router.Use(Stack(log, tenant)...).
func Stack(log zerolog.Logger, defaultTenant string) []func(http.Handler) http.Handler {
	return []func(http.Handler) http.Handler{
		hlog.NewHandler(log),
		hlog.RequestIDHandler("req_id", "X-Request-Id"),
		hlog.AccessHandler(func(r *http.Request, status, size int, dur time.Duration) {
			hlog.FromRequest(r).Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", status).
				Int("size", size).
				Dur("dur", dur).
				Msg("http")
		}),
		middleware.Recoverer,
		middleware.RealIP,
		TenantContext(defaultTenant),
		CORS(),
	}
}

type ctxKey string

const TenantKey ctxKey = "tenant_id"

// TenantContext lifts the X-Tenant-Id header onto the request context.
// Falls back to defaultTenant when the header is missing (dev / single-tenant).
func TenantContext(defaultTenant string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tenant := r.Header.Get("X-Tenant-Id")
			if tenant == "" {
				tenant = defaultTenant
			}
			if _, err := uuid.Parse(tenant); err != nil {
				tenant = defaultTenant
			}
			ctx := context.WithValue(r.Context(), TenantKey, tenant)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// TenantFrom pulls the tenant id out of the context; empty string if absent.
func TenantFrom(ctx context.Context) string {
	v, _ := ctx.Value(TenantKey).(string)
	return v
}

// CORS lets the Next.js dev server (and configured frontend origin) call the API.
func CORS() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Tenant-Id, X-Request-Id")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
