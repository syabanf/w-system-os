package postgres

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/admin/domain"
	"github.com/wit/erp-os/internal/shared/pgerr"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

const cols = `
	id, tenant_id, email, password_hash, mfa_secret, user_profile_id,
	is_active, last_login_at, failed_attempts, locked_until, created_at, updated_at
`

func (r *UserRepo) Create(ctx context.Context, u *domain.User) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO auth_users (
			id, tenant_id, email, password_hash, mfa_secret, user_profile_id,
			is_active, last_login_at, failed_attempts, locked_until, created_at, updated_at)
		VALUES ($1,$2,$3,NULLIF($4,''),NULLIF($5,''),$6,$7,$8,$9,$10,$11,$11)`,
		u.ID, u.TenantID, u.Email, u.PasswordHash, u.MFASecret, u.UserProfileID,
		u.IsActive, u.LastLoginAt, u.FailedAttempts, u.LockedUntil, u.CreatedAt)
	if err != nil && pgerr.IsUniqueViolation(err) {
		return domain.ErrDuplicateEmail
	}
	return err
}

func (r *UserRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+cols+` FROM auth_users WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	u, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return u, nil
}

func (r *UserRepo) List(ctx context.Context, f domain.Filter) ([]*domain.User, int, error) {
	args := []any{f.TenantID}
	conds := []string{"tenant_id = $1"}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		conds = append(conds, "email ILIKE $"+itoa(len(args)))
	}
	if f.IsActive != nil {
		args = append(args, *f.IsActive)
		conds = append(conds, "is_active = $"+itoa(len(args)))
	}
	where := "WHERE " + strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM auth_users `+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx,
		`SELECT `+cols+` FROM auth_users `+where+` ORDER BY email LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []*domain.User
	for rows.Next() {
		u, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, u)
	}
	return out, total, rows.Err()
}

func (r *UserRepo) Update(ctx context.Context, u *domain.User) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE auth_users SET
			email=$1, password_hash=NULLIF($2,''), mfa_secret=NULLIF($3,''), user_profile_id=$4,
			is_active=$5, last_login_at=$6, failed_attempts=$7, locked_until=$8, updated_at=$9
		WHERE tenant_id=$10 AND id=$11`,
		u.Email, u.PasswordHash, u.MFASecret, u.UserProfileID,
		u.IsActive, u.LastLoginAt, u.FailedAttempts, u.LockedUntil, u.UpdatedAt,
		u.TenantID, u.ID)
	if err != nil {
		if pgerr.IsUniqueViolation(err) {
			return domain.ErrDuplicateEmail
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *UserRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM auth_users WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface{ Scan(...any) error }

func scan(row rowScanner) (*domain.User, error) {
	var (
		u            domain.User
		passwordHash *string
		mfaSecret    *string
	)
	if err := row.Scan(
		&u.ID, &u.TenantID, &u.Email, &passwordHash, &mfaSecret, &u.UserProfileID,
		&u.IsActive, &u.LastLoginAt, &u.FailedAttempts, &u.LockedUntil,
		&u.CreatedAt, &u.UpdatedAt,
	); err != nil {
		return nil, err
	}
	if passwordHash != nil {
		u.PasswordHash = *passwordHash
	}
	if mfaSecret != nil {
		u.MFASecret = *mfaSecret
	}
	return &u, nil
}

func itoa(i int) string { return strconv.Itoa(i) }
