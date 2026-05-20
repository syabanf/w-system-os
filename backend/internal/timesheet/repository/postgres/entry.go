package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/timesheet/domain"
)

type EntryRepo struct {
	pool *pgxpool.Pool
}

func NewEntryRepo(pool *pgxpool.Pool) *EntryRepo {
	return &EntryRepo{pool: pool}
}

const cols = `
	id, tenant_id, user_profile_id, project_id, task_id, date,
	to_char(start_time, 'HH24:MI'), to_char(end_time, 'HH24:MI'),
	hours, activity_type, billable, description, status,
	approved_by, approved_at, rejected_reason, created_at, updated_at
`

func (r *EntryRepo) Create(ctx context.Context, e *domain.Entry) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO time_entries (
			id, tenant_id, user_profile_id, project_id, task_id, date,
			start_time, end_time, hours, activity_type, billable, description,
			status, approved_by, approved_at, rejected_reason, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7::time,$8::time,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)`,
		e.ID, e.TenantID, e.UserProfileID, e.ProjectID, e.TaskID, e.Date,
		e.StartTime, e.EndTime, e.Hours, e.ActivityType, e.Billable, e.Description,
		string(e.Status), e.ApprovedBy, e.ApprovedAt, e.RejectedReason, e.CreatedAt)
	return err
}

func (r *EntryRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Entry, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+cols+` FROM time_entries WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	e, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return e, nil
}

func (r *EntryRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Entry, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id = $1"}
	if f.UserProfileID != nil {
		args = append(args, *f.UserProfileID)
		conds = append(conds, "user_profile_id = $"+itoa(len(args)))
	}
	if f.ProjectID != nil {
		args = append(args, *f.ProjectID)
		conds = append(conds, "project_id = $"+itoa(len(args)))
	}
	if f.Status != nil {
		args = append(args, string(*f.Status))
		conds = append(conds, "status = $"+itoa(len(args)))
	}
	if f.DateFrom != nil {
		args = append(args, *f.DateFrom)
		conds = append(conds, "date >= $"+itoa(len(args)))
	}
	if f.DateTo != nil {
		args = append(args, *f.DateTo)
		conds = append(conds, "date <= $"+itoa(len(args)))
	}
	if f.Billable != nil {
		args = append(args, *f.Billable)
		conds = append(conds, "billable = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM time_entries `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+cols+` FROM time_entries `+where+
			` ORDER BY date DESC, created_at DESC LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.Entry
	for rows.Next() {
		e, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, e)
	}
	return out, total, rows.Err()
}

func (r *EntryRepo) Update(ctx context.Context, e *domain.Entry) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE time_entries SET
			user_profile_id=$1, project_id=$2, task_id=$3, date=$4,
			start_time=$5::time, end_time=$6::time, hours=$7, activity_type=$8,
			billable=$9, description=$10, status=$11, approved_by=$12,
			approved_at=$13, rejected_reason=$14, updated_at=$15
		WHERE tenant_id=$16 AND id=$17`,
		e.UserProfileID, e.ProjectID, e.TaskID, e.Date,
		e.StartTime, e.EndTime, e.Hours, e.ActivityType,
		e.Billable, e.Description, string(e.Status), e.ApprovedBy,
		e.ApprovedAt, e.RejectedReason, e.UpdatedAt,
		e.TenantID, e.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *EntryRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM time_entries WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.Entry, error) {
	var (
		e         domain.Entry
		status    string
		startTime *string
		endTime   *string
	)
	if err := row.Scan(
		&e.ID, &e.TenantID, &e.UserProfileID, &e.ProjectID, &e.TaskID, &e.Date,
		&startTime, &endTime,
		&e.Hours, &e.ActivityType, &e.Billable, &e.Description, &status,
		&e.ApprovedBy, &e.ApprovedAt, &e.RejectedReason, &e.CreatedAt, &e.UpdatedAt,
	); err != nil {
		return nil, err
	}
	e.Status = domain.Status(status)
	e.StartTime = startTime
	e.EndTime = endTime
	return &e, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
