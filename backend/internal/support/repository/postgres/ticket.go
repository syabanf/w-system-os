package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/shared/pgerr"
	"github.com/wit/erp-os/internal/support/domain"
)

type TicketRepo struct{ pool *pgxpool.Pool }

func NewTicketRepo(p *pgxpool.Pool) *TicketRepo { return &TicketRepo{pool: p} }

const cols = `
	id, tenant_id, code, title, description, client_id, project_id, severity,
	status, assigned_to_id, is_change_request, estimated_effort_hours, sla_deadline,
	created_at, updated_at
`

func (r *TicketRepo) Create(ctx context.Context, t *domain.Ticket) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO support_tickets (
			id, tenant_id, code, title, description, client_id, project_id, severity,
			status, assigned_to_id, is_change_request, estimated_effort_hours, sla_deadline,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
		t.ID, t.TenantID, t.Code, t.Title, t.Description, t.ClientID, t.ProjectID,
		string(t.Severity), string(t.Status), t.AssignedToID, t.IsChangeRequest,
		t.EstimatedEffortHours, t.SLADeadline, t.CreatedAt)
	if err != nil && pgerr.IsUniqueViolation(err) {
		return domain.ErrDuplicateCode
	}
	return err
}

func (r *TicketRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Ticket, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+cols+` FROM support_tickets WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	t, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *TicketRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Ticket, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id=$1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "(title ILIKE $"+strconv.Itoa(len(args))+" OR code ILIKE $"+strconv.Itoa(len(args))+")")
	}
	if f.Status != nil {
		args = append(args, string(*f.Status))
		conds = append(conds, "status=$"+strconv.Itoa(len(args)))
	}
	if f.Severity != nil {
		args = append(args, string(*f.Severity))
		conds = append(conds, "severity=$"+strconv.Itoa(len(args)))
	}
	if f.IsChangeRequest != nil {
		args = append(args, *f.IsChangeRequest)
		conds = append(conds, "is_change_request=$"+strconv.Itoa(len(args)))
	}
	if f.ClientID != nil {
		args = append(args, *f.ClientID)
		conds = append(conds, "client_id=$"+strconv.Itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM support_tickets `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, `SELECT `+cols+` FROM support_tickets `+where+` ORDER BY sla_deadline NULLS LAST, created_at DESC LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Ticket
	for rows.Next() {
		t, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *TicketRepo) Update(ctx context.Context, t *domain.Ticket) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE support_tickets SET code=$1, title=$2, description=$3, client_id=$4, project_id=$5,
			severity=$6, status=$7, assigned_to_id=$8, is_change_request=$9,
			estimated_effort_hours=$10, sla_deadline=$11, updated_at=$12
		WHERE tenant_id=$13 AND id=$14`,
		t.Code, t.Title, t.Description, t.ClientID, t.ProjectID,
		string(t.Severity), string(t.Status), t.AssignedToID, t.IsChangeRequest,
		t.EstimatedEffortHours, t.SLADeadline, t.UpdatedAt, t.TenantID, t.ID)
	if err != nil {
		if pgerr.IsUniqueViolation(err) {
			return domain.ErrDuplicateCode
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TicketRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM support_tickets WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Ticket, error) {
	var (
		t          domain.Ticket
		clientID   *uuid.UUID
		projectID  *uuid.UUID
		assignedID *uuid.UUID
		sev        string
		st         string
		effort     *float64
	)
	if err := row.Scan(
		&t.ID, &t.TenantID, &t.Code, &t.Title, &t.Description, &clientID, &projectID,
		&sev, &st, &assignedID, &t.IsChangeRequest, &effort, &t.SLADeadline,
		&t.CreatedAt, &t.UpdatedAt,
	); err != nil {
		return nil, err
	}
	t.ClientID, t.ProjectID, t.AssignedToID = clientID, projectID, assignedID
	t.Severity = domain.Severity(sev)
	t.Status = domain.Status(st)
	if effort != nil {
		t.EstimatedEffortHours = *effort
	}
	return &t, nil
}
