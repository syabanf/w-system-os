package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/transactions/domain"
)

type InvoiceRepo struct{ pool *pgxpool.Pool }

func NewInvoiceRepo(p *pgxpool.Pool) *InvoiceRepo { return &InvoiceRepo{pool: p} }

const cols = `
	id, tenant_id, number, client_id, project_id, issue_date, due_date,
	amount, paid_amount, status, currency, created_at, updated_at
`

func (r *InvoiceRepo) Create(ctx context.Context, i *domain.Invoice) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO invoices (
			id, tenant_id, number, client_id, project_id, issue_date, due_date,
			amount, paid_amount, status, currency, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
		i.ID, i.TenantID, i.Number, i.ClientID, i.ProjectID, i.IssueDate, i.DueDate,
		float64(i.Amount)/100.0, float64(i.PaidAmount)/100.0, string(i.Status), i.Currency,
		i.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "23505") {
		return domain.ErrDuplicateNumber
	}
	return err
}

func (r *InvoiceRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Invoice, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+cols+` FROM invoices WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	i, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return i, nil
}

func (r *InvoiceRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Invoice, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id=$1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "number ILIKE $"+strconv.Itoa(len(args)))
	}
	if f.Status != nil {
		args = append(args, string(*f.Status))
		conds = append(conds, "status=$"+strconv.Itoa(len(args)))
	}
	if f.ClientID != nil {
		args = append(args, *f.ClientID)
		conds = append(conds, "client_id=$"+strconv.Itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM invoices `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, `SELECT `+cols+` FROM invoices `+where+` ORDER BY issue_date DESC LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Invoice
	for rows.Next() {
		i, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, i)
	}
	return out, total, rows.Err()
}

func (r *InvoiceRepo) Update(ctx context.Context, i *domain.Invoice) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE invoices SET number=$1, client_id=$2, project_id=$3, issue_date=$4, due_date=$5,
			amount=$6, paid_amount=$7, status=$8, currency=$9, updated_at=$10
		WHERE tenant_id=$11 AND id=$12`,
		i.Number, i.ClientID, i.ProjectID, i.IssueDate, i.DueDate,
		float64(i.Amount)/100.0, float64(i.PaidAmount)/100.0, string(i.Status), i.Currency,
		i.UpdatedAt, i.TenantID, i.ID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return domain.ErrDuplicateNumber
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *InvoiceRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM invoices WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Invoice, error) {
	var (
		i         domain.Invoice
		projectID *uuid.UUID
		st        string
		amount    float64
		paid      float64
	)
	if err := row.Scan(
		&i.ID, &i.TenantID, &i.Number, &i.ClientID, &projectID, &i.IssueDate, &i.DueDate,
		&amount, &paid, &st, &i.Currency, &i.CreatedAt, &i.UpdatedAt,
	); err != nil {
		return nil, err
	}
	i.ProjectID = projectID
	i.Status = domain.InvoiceStatus(st)
	i.Amount = int64(amount * 100)
	i.PaidAmount = int64(paid * 100)
	return &i, nil
}
