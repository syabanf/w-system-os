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

const cols = `
	id, tenant_id, name, industry, region, primary_contact, contact_email,
	account_owner_id, contract_value, retainer_active, active_projects,
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
		VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,''),$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)`,
		c.ID, c.TenantID, c.Name, c.Industry, c.Region, c.PrimaryContact, c.ContactEmail,
		c.AccountOwnerID, float64(c.ContractValue)/100.0, c.RetainerActive, c.ActiveProjects,
		c.SatisfactionScore, string(c.Health), c.RenewalDate, c.JoinedAt, c.LogoColor,
		c.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "23505") {
		return domain.ErrDuplicateName
	}
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
			account_owner_id=$6, contract_value=$7, retainer_active=$8, active_projects=$9,
			satisfaction_score=$10, health=$11, renewal_date=$12, joined_at=$13, logo_color=$14,
			updated_at=$15
		WHERE tenant_id=$16 AND id=$17`,
		c.Name, c.Industry, c.Region, c.PrimaryContact, c.ContactEmail,
		c.AccountOwnerID, float64(c.ContractValue)/100.0, c.RetainerActive, c.ActiveProjects,
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
		c          domain.Client
		ownerID    *uuid.UUID
		health     string
		valueNum   float64
		renewal    *struct{} // placeholder; pgx scans nullable date into *time.Time below
	)
	_ = renewal
	if err := row.Scan(
		&c.ID, &c.TenantID, &c.Name, &c.Industry, &c.Region, &c.PrimaryContact, &c.ContactEmail,
		&ownerID, &valueNum, &c.RetainerActive, &c.ActiveProjects,
		&c.SatisfactionScore, &health, &c.RenewalDate, &c.JoinedAt, &c.LogoColor,
		&c.CreatedAt, &c.UpdatedAt,
	); err != nil {
		return nil, err
	}
	c.AccountOwnerID = ownerID
	c.Health = domain.Health(health)
	c.ContractValue = int64(valueNum * 100)
	return &c, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
