package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/projects/domain"
)

type ProjectRepo struct{ pool *pgxpool.Pool }

func NewProjectRepo(p *pgxpool.Pool) *ProjectRepo { return &ProjectRepo{pool: p} }

const cols = `
	id, tenant_id, code, name, client_id, status, progress, budget, actual_cost,
	risk_level, start_date, end_date, project_manager_id, health, tech_stack,
	open_tickets, change_requests, created_at, updated_at
`

func (r *ProjectRepo) Create(ctx context.Context, p *domain.Project) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO projects (
			id, tenant_id, code, name, client_id, status, progress, budget, actual_cost,
			risk_level, start_date, end_date, project_manager_id, health, tech_stack,
			open_tickets, change_requests, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18)`,
		p.ID, p.TenantID, p.Code, p.Name, p.ClientID, string(p.Status), p.Progress,
		float64(p.Budget)/100.0, float64(p.ActualCost)/100.0, p.RiskLevel,
		p.StartDate, p.EndDate, p.ProjectManagerID, p.Health, p.TechStack,
		p.OpenTickets, p.ChangeRequests, p.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "23505") {
		return domain.ErrDuplicateCode
	}
	return err
}

func (r *ProjectRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Project, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+cols+` FROM projects WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	p, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *ProjectRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Project, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id=$1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "(name ILIKE $"+strconv.Itoa(len(args))+" OR code ILIKE $"+strconv.Itoa(len(args))+")")
	}
	if f.Status != nil {
		args = append(args, string(*f.Status))
		conds = append(conds, "status=$"+strconv.Itoa(len(args)))
	}
	if f.Health != "" {
		args = append(args, f.Health)
		conds = append(conds, "health=$"+strconv.Itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM projects `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, `SELECT `+cols+` FROM projects `+where+` ORDER BY name LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Project
	for rows.Next() {
		p, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, rows.Err()
}

func (r *ProjectRepo) Update(ctx context.Context, p *domain.Project) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE projects SET code=$1, name=$2, client_id=$3, status=$4, progress=$5,
			budget=$6, actual_cost=$7, risk_level=$8, start_date=$9, end_date=$10,
			project_manager_id=$11, health=$12, tech_stack=$13, open_tickets=$14,
			change_requests=$15, updated_at=$16
		WHERE tenant_id=$17 AND id=$18`,
		p.Code, p.Name, p.ClientID, string(p.Status), p.Progress,
		float64(p.Budget)/100.0, float64(p.ActualCost)/100.0, p.RiskLevel,
		p.StartDate, p.EndDate, p.ProjectManagerID, p.Health, p.TechStack,
		p.OpenTickets, p.ChangeRequests, p.UpdatedAt, p.TenantID, p.ID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			return domain.ErrDuplicateCode
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *ProjectRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM projects WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Project, error) {
	var (
		p           domain.Project
		clientID    *uuid.UUID
		pmID        *uuid.UUID
		statusStr   string
		budgetNum   float64
		actualNum   float64
	)
	if err := row.Scan(
		&p.ID, &p.TenantID, &p.Code, &p.Name, &clientID, &statusStr, &p.Progress,
		&budgetNum, &actualNum, &p.RiskLevel, &p.StartDate, &p.EndDate, &pmID,
		&p.Health, &p.TechStack, &p.OpenTickets, &p.ChangeRequests,
		&p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		return nil, err
	}
	p.ClientID, p.ProjectManagerID = clientID, pmID
	p.Status = domain.Status(statusStr)
	p.Budget = int64(budgetNum * 100)
	p.ActualCost = int64(actualNum * 100)
	return &p, nil
}
