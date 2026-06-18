// Package domain — Workspace bounded context. Per-tenant shell setup: which
// app modules are enabled and whether the first-run wizard has been completed.
// Mirrors the frontend setup wizard's persisted state so it can move
// server-side without changing the contract.
package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Setup struct {
	TenantID uuid.UUID
	// EnabledModules holds frontend AppModuleId values ("dashboard", "leads", …),
	// not UUIDs — they namespace shell modules, not database rows.
	EnabledModules []string
	IsComplete     bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// Repository persists one Setup row per tenant.
type Repository interface {
	Get(ctx context.Context, tenantID uuid.UUID) (*Setup, error)
	Upsert(ctx context.Context, s *Setup) error
}

var ErrNotFound = errors.New("workspace setup not found")
