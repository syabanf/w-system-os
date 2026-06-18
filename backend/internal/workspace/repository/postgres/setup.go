package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/workspace/domain"
)

type SetupRepo struct{ pool *pgxpool.Pool }

func NewSetupRepo(p *pgxpool.Pool) *SetupRepo { return &SetupRepo{pool: p} }

func (r *SetupRepo) Get(ctx context.Context, tenantID uuid.UUID) (*domain.Setup, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT tenant_id, enabled_modules, is_complete, created_at, updated_at
		FROM workspace_setup WHERE tenant_id=$1`, tenantID)
	var s domain.Setup
	// pgx scans a Postgres text[] straight into a Go []string.
	if err := row.Scan(&s.TenantID, &s.EnabledModules, &s.IsComplete, &s.CreatedAt, &s.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *SetupRepo) Upsert(ctx context.Context, s *domain.Setup) error {
	// One row per tenant — re-saving updates in place. created_at is preserved
	// (only set on first insert); updated_at always advances.
	_, err := r.pool.Exec(ctx, `
		INSERT INTO workspace_setup (tenant_id, enabled_modules, is_complete, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$4)
		ON CONFLICT (tenant_id) DO UPDATE SET
			enabled_modules = EXCLUDED.enabled_modules,
			is_complete     = EXCLUDED.is_complete,
			updated_at      = EXCLUDED.updated_at`,
		s.TenantID, s.EnabledModules, s.IsComplete, s.UpdatedAt)
	return err
}
