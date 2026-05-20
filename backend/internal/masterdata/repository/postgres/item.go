package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/masterdata/domain"
)

type ItemRepo struct {
	pool *pgxpool.Pool
}

func NewItemRepo(pool *pgxpool.Pool) *ItemRepo {
	return &ItemRepo{pool: pool}
}

const itemCols = `
	id, tenant_id, category_id, payload, sort_order, is_active, created_at, updated_at
`

func (r *ItemRepo) Create(ctx context.Context, i *domain.Item) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO md_items (
			id, tenant_id, category_id, payload, sort_order, is_active, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
		i.ID, i.TenantID, i.CategoryID, []byte(i.Payload), i.SortOrder, i.IsActive, i.CreatedAt)
	return err
}

func (r *ItemRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Item, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+itemCols+` FROM md_items WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	i, err := scanItem(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrItemNotFound
		}
		return nil, err
	}
	return i, nil
}

func (r *ItemRepo) List(ctx context.Context, f domain.ItemFilter) ([]*domain.Item, int, error) {
	args := []any{f.TenantID, f.CategoryID}
	conds := []string{"tenant_id = $1", "category_id = $2"}
	if f.IsActive != nil {
		args = append(args, *f.IsActive)
		conds = append(conds, "is_active = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM md_items `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+itemCols+` FROM md_items `+where+
			` ORDER BY sort_order, created_at LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Item
	for rows.Next() {
		i, err := scanItem(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, i)
	}
	return out, total, rows.Err()
}

func (r *ItemRepo) Update(ctx context.Context, i *domain.Item) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE md_items SET
			category_id=$1, payload=$2, sort_order=$3, is_active=$4, updated_at=$5
		WHERE tenant_id=$6 AND id=$7`,
		i.CategoryID, []byte(i.Payload), i.SortOrder, i.IsActive, i.UpdatedAt,
		i.TenantID, i.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrItemNotFound
	}
	return nil
}

func (r *ItemRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM md_items WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrItemNotFound
	}
	return nil
}

func scanItem(row rowScanner) (*domain.Item, error) {
	var (
		i       domain.Item
		payload []byte
	)
	if err := row.Scan(
		&i.ID, &i.TenantID, &i.CategoryID, &payload, &i.SortOrder, &i.IsActive,
		&i.CreatedAt, &i.UpdatedAt,
	); err != nil {
		return nil, err
	}
	i.Payload = append(i.Payload[:0], payload...)
	return &i, nil
}
