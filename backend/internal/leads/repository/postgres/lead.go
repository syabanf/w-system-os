package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/leads/domain"
)

type LeadRepo struct{ pool *pgxpool.Pool }

func NewLeadRepo(p *pgxpool.Pool) *LeadRepo { return &LeadRepo{pool: p} }

// deal_value is numeric(15,2); read back as exact int64 minor units.
const cols = `
	id, tenant_id, company_name, contact_person, contact_email, (deal_value*100)::bigint,
	stage, source, probability, follow_up_date, owner_id, notes, won_client_id,
	created_at, updated_at
`

func (r *LeadRepo) Create(ctx context.Context, l *domain.Lead) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO leads (
			id, tenant_id, company_name, contact_person, contact_email, deal_value,
			stage, source, probability, follow_up_date, owner_id, notes, won_client_id,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,NULLIF($5,''),$6::numeric/100,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
		l.ID, l.TenantID, l.CompanyName, l.ContactPerson, l.ContactEmail,
		l.DealValue, string(l.Stage), l.Source, l.Probability,
		l.FollowUpDate, l.OwnerID, l.Notes, l.WonClientID, l.CreatedAt)
	return err
}

func (r *LeadRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Lead, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+cols+` FROM leads WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	l, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return l, nil
}

func (r *LeadRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Lead, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id=$1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "company_name ILIKE $"+strconv.Itoa(len(args)))
	}
	if f.Stage != nil {
		args = append(args, string(*f.Stage))
		conds = append(conds, "stage=$"+strconv.Itoa(len(args)))
	}
	if f.Source != "" {
		args = append(args, f.Source)
		conds = append(conds, "source=$"+strconv.Itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM leads `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, `SELECT `+cols+` FROM leads `+where+` ORDER BY created_at DESC LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Lead
	for rows.Next() {
		l, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, l)
	}
	return out, total, rows.Err()
}

func (r *LeadRepo) Update(ctx context.Context, l *domain.Lead) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE leads SET company_name=$1, contact_person=$2, contact_email=NULLIF($3,''),
			deal_value=$4::numeric/100, stage=$5, source=$6, probability=$7, follow_up_date=$8,
			owner_id=$9, notes=$10, won_client_id=$11, updated_at=$12
		WHERE tenant_id=$13 AND id=$14`,
		l.CompanyName, l.ContactPerson, l.ContactEmail, l.DealValue,
		string(l.Stage), l.Source, l.Probability, l.FollowUpDate, l.OwnerID, l.Notes,
		l.WonClientID, l.UpdatedAt, l.TenantID, l.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *LeadRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM leads WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Lead, error) {
	var (
		l     domain.Lead
		owner *uuid.UUID
		won   *uuid.UUID
		stage string
	)
	if err := row.Scan(
		&l.ID, &l.TenantID, &l.CompanyName, &l.ContactPerson, &l.ContactEmail, &l.DealValue,
		&stage, &l.Source, &l.Probability, &l.FollowUpDate, &owner, &l.Notes, &won,
		&l.CreatedAt, &l.UpdatedAt,
	); err != nil {
		return nil, err
	}
	l.OwnerID, l.WonClientID = owner, won
	l.Stage = domain.Stage(stage)
	return &l, nil
}
