package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/portal/domain"
)

type ThreadRepo struct {
	pool *pgxpool.Pool
}

func NewThreadRepo(pool *pgxpool.Pool) *ThreadRepo {
	return &ThreadRepo{pool: pool}
}

const cols = `
	id, tenant_id, kind, topic, last_message_at, created_at
`

func (r *ThreadRepo) Create(ctx context.Context, t *domain.Thread) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO chat_threads (
			id, tenant_id, kind, topic, last_message_at, created_at)
		VALUES ($1,$2,$3,$4,$5,$6)`,
		t.ID, t.TenantID, string(t.Kind), t.Topic, t.LastMessageAt, t.CreatedAt)
	return err
}

func (r *ThreadRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Thread, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+cols+` FROM chat_threads WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	t, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *ThreadRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Thread, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id = $1"}
	if f.Kind != nil {
		args = append(args, string(*f.Kind))
		conds = append(conds, "kind = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM chat_threads `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+cols+` FROM chat_threads `+where+
			` ORDER BY last_message_at DESC NULLS LAST, created_at DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Thread
	for rows.Next() {
		t, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *ThreadRepo) Update(ctx context.Context, t *domain.Thread) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE chat_threads SET
			kind=$1, topic=$2, last_message_at=$3
		WHERE tenant_id=$4 AND id=$5`,
		string(t.Kind), t.Topic, t.LastMessageAt, t.TenantID, t.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *ThreadRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM chat_threads WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Thread, error) {
	var (
		t    domain.Thread
		kind string
	)
	if err := row.Scan(
		&t.ID, &t.TenantID, &kind, &t.Topic, &t.LastMessageAt, &t.CreatedAt,
	); err != nil {
		return nil, err
	}
	t.Kind = domain.Kind(kind)
	return &t, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
