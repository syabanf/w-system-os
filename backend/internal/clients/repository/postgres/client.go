package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/clients/domain"
)

type ClientRepo struct {
	pool *pgxpool.Pool
}

func NewClientRepo(pool *pgxpool.Pool) *ClientRepo {
	return &ClientRepo{pool: pool}
}

// Money is stored as numeric(15,2) but carried in Go as int64 minor units.
// (contract_value*100)::bigint reads it back exactly (no float round-trip);
// writes bind the int64 and divide by 100 in SQL ($n::numeric/100).
//
// active_projects is derived live from the projects table so it can't drift
// from reality (the stored column, if any, is ignored on read).
const cols = `
	id, tenant_id, name, industry, region, primary_contact, contact_email,
	account_owner_id, (contract_value*100)::bigint, retainer_active,
	(SELECT COUNT(*) FROM projects p WHERE p.client_id = clients.id AND p.tenant_id = clients.tenant_id)::int,
	satisfaction_score, health, renewal_date, joined_at, logo_color,
	created_at, updated_at
`

func (r *ClientRepo) Create(ctx context.Context, c *domain.Client) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO clients (
			id, tenant_id, name, industry, region, primary_contact, contact_email,
			account_owner_id, contract_value, retainer_active, active_projects,
			satisfaction_score, health, renewal_date, joined_at, logo_color,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,''),$8,$9::numeric/100,$10,$11,$12,$13,$14,$15,$16,$17,$17)`,
		c.ID, c.TenantID, c.Name, c.Industry, c.Region, c.PrimaryContact, c.ContactEmail,
		c.AccountOwnerID, c.ContractValue, c.RetainerActive, c.ActiveProjects,
		c.SatisfactionScore, string(c.Health), c.RenewalDate, c.JoinedAt, c.LogoColor,
		c.CreatedAt)
	return err
}

func (r *ClientRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Client, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+cols+` FROM clients WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	c, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *ClientRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Client, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id = $1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "name ILIKE $"+itoa(len(args)))
	}
	if f.Health != nil {
		args = append(args, string(*f.Health))
		conds = append(conds, "health = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM clients `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+cols+` FROM clients `+where+` ORDER BY name LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Client
	for rows.Next() {
		c, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	return out, total, rows.Err()
}

func (r *ClientRepo) Update(ctx context.Context, c *domain.Client) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE clients SET
			name=$1, industry=$2, region=$3, primary_contact=$4, contact_email=NULLIF($5,''),
			account_owner_id=$6, contract_value=$7::numeric/100, retainer_active=$8, active_projects=$9,
			satisfaction_score=$10, health=$11, renewal_date=$12, joined_at=$13, logo_color=$14,
			updated_at=$15
		WHERE tenant_id=$16 AND id=$17`,
		c.Name, c.Industry, c.Region, c.PrimaryContact, c.ContactEmail,
		c.AccountOwnerID, c.ContractValue, c.RetainerActive, c.ActiveProjects,
		c.SatisfactionScore, string(c.Health), c.RenewalDate, c.JoinedAt, c.LogoColor,
		c.UpdatedAt, c.TenantID, c.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *ClientRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM clients WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Client, error) {
	var (
		c       domain.Client
		ownerID *uuid.UUID
		health  string
	)
	if err := row.Scan(
		&c.ID, &c.TenantID, &c.Name, &c.Industry, &c.Region, &c.PrimaryContact, &c.ContactEmail,
		&ownerID, &c.ContractValue, &c.RetainerActive, &c.ActiveProjects,
		&c.SatisfactionScore, &health, &c.RenewalDate, &c.JoinedAt, &c.LogoColor,
		&c.CreatedAt, &c.UpdatedAt,
	); err != nil {
		return nil, err
	}
	c.AccountOwnerID = ownerID
	c.Health = domain.Health(health)
	return &c, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
