package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/masterdata/domain"
)

type CategoryRepo struct {
	pool *pgxpool.Pool
}

func NewCategoryRepo(pool *pgxpool.Pool) *CategoryRepo {
	return &CategoryRepo{pool: pool}
}

const categoryCols = `
	id, tenant_id, code, module_id, label, description,
	fields, display_keys, is_system, is_active, created_at, updated_at
`

func (r *CategoryRepo) Create(ctx context.Context, c *domain.Category) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO md_categories (
			id, tenant_id, code, module_id, label, description,
			fields, display_keys, is_system, is_active, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
		c.ID, c.TenantID, c.Code, c.ModuleID, c.Label, c.Description,
		[]byte(c.Fields), c.DisplayKeys, c.IsSystem, c.IsActive, c.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "23505") {
		return domain.ErrDuplicateCategoryCode
	}
	return err
}

func (r *CategoryRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Category, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+categoryCols+` FROM md_categories WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	c, err := scanCategory(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrCategoryNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *CategoryRepo) List(ctx context.Context, f domain.CategoryFilter) ([]*domain.Category, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id = $1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "(label ILIKE $"+itoa(len(args))+" OR code ILIKE $"+itoa(len(args))+")")
	}
	if f.ModuleID != nil {
		args = append(args, *f.ModuleID)
		conds = append(conds, "module_id = $"+itoa(len(args)))
	}
	if f.IsActive != nil {
		args = append(args, *f.IsActive)
		conds = append(conds, "is_active = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM md_categories `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+categoryCols+` FROM md_categories `+where+` ORDER BY label LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Category
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	return out, total, rows.Err()
}

func (r *CategoryRepo) Update(ctx context.Context, c *domain.Category) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE md_categories SET
			code=$1, module_id=$2, label=$3, description=$4,
			fields=$5, display_keys=$6, is_system=$7, is_active=$8, updated_at=$9
		WHERE tenant_id=$10 AND id=$11`,
		c.Code, c.ModuleID, c.Label, c.Description,
		[]byte(c.Fields), c.DisplayKeys, c.IsSystem, c.IsActive, c.UpdatedAt,
		c.TenantID, c.ID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return domain.ErrDuplicateCategoryCode
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrCategoryNotFound
	}
	return nil
}

func (r *CategoryRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM md_categories WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrCategoryNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scanCategory(row rowScanner) (*domain.Category, error) {
	var (
		c      domain.Category
		fields []byte
	)
	if err := row.Scan(
		&c.ID, &c.TenantID, &c.Code, &c.ModuleID, &c.Label, &c.Description,
		&fields, &c.DisplayKeys, &c.IsSystem, &c.IsActive, &c.CreatedAt, &c.UpdatedAt,
	); err != nil {
		return nil, err
	}
	c.Fields = append(c.Fields[:0], fields...)
	return &c, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
