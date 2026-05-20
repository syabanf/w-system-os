package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/knowledge/domain"
)

type ArticleRepo struct {
	pool *pgxpool.Pool
}

func NewArticleRepo(pool *pgxpool.Pool) *ArticleRepo {
	return &ArticleRepo{pool: pool}
}

const cols = `
	id, tenant_id, category_id, title, slug, excerpt, body_markdown,
	author_id, status, pinned, view_count, published_at, created_at, updated_at
`

func (r *ArticleRepo) Create(ctx context.Context, a *domain.Article) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO knowledge_articles (
			id, tenant_id, category_id, title, slug, excerpt, body_markdown,
			author_id, status, pinned, view_count, published_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
		a.ID, a.TenantID, a.CategoryID, a.Title, a.Slug, a.Excerpt, a.BodyMarkdown,
		a.AuthorID, string(a.Status), a.Pinned, a.ViewCount, a.PublishedAt, a.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "23505") {
		return domain.ErrDuplicateSlug
	}
	return err
}

func (r *ArticleRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Article, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+cols+` FROM knowledge_articles WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	a, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return a, nil
}

func (r *ArticleRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Article, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id = $1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "(title ILIKE $"+itoa(len(args))+" OR excerpt ILIKE $"+itoa(len(args))+")")
	}
	if f.CategoryID != nil {
		args = append(args, *f.CategoryID)
		conds = append(conds, "category_id = $"+itoa(len(args)))
	}
	if f.Status != nil {
		args = append(args, string(*f.Status))
		conds = append(conds, "status = $"+itoa(len(args)))
	}
	if f.Pinned != nil {
		args = append(args, *f.Pinned)
		conds = append(conds, "pinned = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM knowledge_articles `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+cols+` FROM knowledge_articles `+where+
			` ORDER BY pinned DESC, updated_at DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Article
	for rows.Next() {
		a, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, a)
	}
	return out, total, rows.Err()
}

func (r *ArticleRepo) Update(ctx context.Context, a *domain.Article) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE knowledge_articles SET
			category_id=$1, title=$2, slug=$3, excerpt=$4, body_markdown=$5,
			author_id=$6, status=$7, pinned=$8, published_at=$9, updated_at=$10
		WHERE tenant_id=$11 AND id=$12`,
		a.CategoryID, a.Title, a.Slug, a.Excerpt, a.BodyMarkdown,
		a.AuthorID, string(a.Status), a.Pinned, a.PublishedAt, a.UpdatedAt,
		a.TenantID, a.ID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return domain.ErrDuplicateSlug
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *ArticleRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM knowledge_articles WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Article, error) {
	var (
		a      domain.Article
		status string
	)
	if err := row.Scan(
		&a.ID, &a.TenantID, &a.CategoryID, &a.Title, &a.Slug, &a.Excerpt, &a.BodyMarkdown,
		&a.AuthorID, &status, &a.Pinned, &a.ViewCount, &a.PublishedAt,
		&a.CreatedAt, &a.UpdatedAt,
	); err != nil {
		return nil, err
	}
	a.Status = domain.Status(status)
	return &a, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
