package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/performance/domain"
)

type TemplateRepo struct{ pool *pgxpool.Pool }

func NewTemplateRepo(p *pgxpool.Pool) *TemplateRepo { return &TemplateRepo{pool: p} }

const cols = `
	id, tenant_id, name, description, period_kind, period_year, period_custom_label,
	period_start, period_end, rating_scale_max, status, created_by, created_at, updated_at
`

func (r *TemplateRepo) Create(ctx context.Context, t *domain.Template) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO performance_360_templates (
			id, tenant_id, name, description, period_kind, period_year, period_custom_label,
			period_start, period_end, rating_scale_max, status, created_by, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
		t.ID, t.TenantID, t.Name, t.Description, string(t.PeriodKind), t.PeriodYear,
		t.PeriodCustomLabel, t.PeriodStart, t.PeriodEnd, t.RatingScaleMax, string(t.Status),
		t.CreatedBy, t.CreatedAt)
	return err
}

func (r *TemplateRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Template, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+cols+` FROM performance_360_templates WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	t, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *TemplateRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Template, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id=$1"}
	if f.Status != nil {
		args = append(args, string(*f.Status))
		conds = append(conds, "status=$"+strconv.Itoa(len(args)))
	}
	if f.Year != nil {
		args = append(args, *f.Year)
		conds = append(conds, "period_year=$"+strconv.Itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM performance_360_templates `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, `SELECT `+cols+` FROM performance_360_templates `+where+` ORDER BY period_year DESC, created_at DESC LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Template
	for rows.Next() {
		t, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *TemplateRepo) Update(ctx context.Context, t *domain.Template) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE performance_360_templates SET name=$1, description=$2, period_kind=$3, period_year=$4,
			period_custom_label=$5, period_start=$6, period_end=$7, rating_scale_max=$8, status=$9,
			updated_at=$10
		WHERE tenant_id=$11 AND id=$12`,
		t.Name, t.Description, string(t.PeriodKind), t.PeriodYear,
		t.PeriodCustomLabel, t.PeriodStart, t.PeriodEnd, t.RatingScaleMax, string(t.Status),
		t.UpdatedAt, t.TenantID, t.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TemplateRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM performance_360_templates WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Template, error) {
	var (
		t      domain.Template
		kind   string
		status string
		cb     *uuid.UUID
	)
	if err := row.Scan(
		&t.ID, &t.TenantID, &t.Name, &t.Description, &kind, &t.PeriodYear,
		&t.PeriodCustomLabel, &t.PeriodStart, &t.PeriodEnd, &t.RatingScaleMax, &status,
		&cb, &t.CreatedAt, &t.UpdatedAt,
	); err != nil {
		return nil, err
	}
	t.PeriodKind = domain.PeriodKind(kind)
	t.Status = domain.Status(status)
	t.CreatedBy = cb
	return &t, nil
}
