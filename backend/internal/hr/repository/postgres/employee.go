// Package postgres is the only place SQL lives. Implements domain.Repository
// so the use case stays storage-agnostic. Uses pgx with prepared statements
// and parameterised queries — no string concatenation.
package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/hr/domain"
)

type EmployeeRepo struct {
	pool *pgxpool.Pool
}

func NewEmployeeRepo(pool *pgxpool.Pool) *EmployeeRepo {
	return &EmployeeRepo{pool: pool}
}

const selectColumns = `
	e.id, e.tenant_id, e.user_profile_id, e.employee_number,
	e.entity_id, e.department_id, e.position_id, e.manager_id,
	e.employment_type, e.status, e.join_date, e.end_date,
	e.basic_salary, e.bpjs_kes, e.bpjs_tk, e.bank_account,
	up.first_name, up.last_name, up.email, up.phone,
	e.created_at, e.updated_at
`

func (r *EmployeeRepo) Create(ctx context.Context, e *domain.Employee) error {
	// employees row + user_profiles row are written in a single tx; if either
	// fails, the whole thing rolls back so we never end up with orphan rows.
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO user_profiles (id, tenant_id, first_name, last_name, email, phone, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NULLIF($5,''), $6, true, $7, $7)`,
		e.UserProfileID, e.TenantID, e.FirstName, e.LastName, e.Email, e.Phone, e.CreatedAt)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO employees (
			id, tenant_id, user_profile_id, employee_number,
			entity_id, department_id, position_id, manager_id,
			employment_type, status, join_date, end_date,
			basic_salary, bpjs_kes, bpjs_tk, bank_account,
			created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17)`,
		e.ID, e.TenantID, e.UserProfileID, e.EmployeeNumber,
		e.EntityID, e.DepartmentID, e.PositionID, e.ManagerID,
		string(e.EmploymentType), string(e.Status), e.JoinDate, e.EndDate,
		float64(e.BasicSalary)/100.0, e.BpjsKes, e.BpjsTk, e.BankAccount,
		e.CreatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrDuplicateNumber
		}
		return err
	}
	return tx.Commit(ctx)
}

func (r *EmployeeRepo) GetByID(ctx context.Context, tenantID, id uuid.UUID) (*domain.Employee, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+selectColumns+`
		FROM employees e
		JOIN user_profiles up ON up.id = e.user_profile_id
		WHERE e.tenant_id = $1 AND e.id = $2`, tenantID, id)
	emp, err := scan(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return emp, nil
}

func (r *EmployeeRepo) List(ctx context.Context, f domain.Filter) ([]*domain.Employee, int, error) {
	args := []any{f.TenantID}
	conds := []string{"e.tenant_id = $1"}

	add := func(cond string, val any) {
		args = append(args, val)
		conds = append(conds, strings.Replace(cond, "?", "$"+itoa(len(args)), 1))
	}
	if f.Search != "" {
		add("(up.first_name ILIKE ? OR up.last_name ILIKE ? OR e.employee_number ILIKE ?)",
			"%"+f.Search+"%")
		// reuse the same placeholder three times
		conds[len(conds)-1] = strings.ReplaceAll(conds[len(conds)-1], "$"+itoa(len(args)),
			"$"+itoa(len(args))) // no-op; pg can't reuse so we wedge 3 args below
		args = append(args, "%"+f.Search+"%", "%"+f.Search+"%")
		conds[len(conds)-1] = "(up.first_name ILIKE $" + itoa(len(args)-2) + " OR up.last_name ILIKE $" + itoa(len(args)-1) + " OR e.employee_number ILIKE $" + itoa(len(args)) + ")"
	}
	if f.Department != nil {
		add("e.department_id = ?", *f.Department)
	}
	if f.Position != nil {
		add("e.position_id = ?", *f.Position)
	}
	if f.Status != nil {
		add("e.status = ?", string(*f.Status))
	}
	if f.EmploymentType != nil {
		add("e.employment_type = ?", string(*f.EmploymentType))
	}

	where := "WHERE " + strings.Join(conds, " AND ")

	// total count first so the caller can render pagination
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM employees e JOIN user_profiles up ON up.id = e.user_profile_id `+where,
		args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	args = append(args, f.Limit, f.Offset)
	rows, err := r.pool.Query(ctx, `
		SELECT `+selectColumns+`
		FROM employees e
		JOIN user_profiles up ON up.id = e.user_profile_id
		`+where+`
		ORDER BY up.last_name, up.first_name
		LIMIT $`+itoa(len(args)-1)+` OFFSET $`+itoa(len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var out []*domain.Employee
	for rows.Next() {
		emp, err := scan(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, emp)
	}
	return out, total, rows.Err()
}

func (r *EmployeeRepo) Update(ctx context.Context, e *domain.Employee) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE user_profiles
		SET first_name=$1, last_name=$2, email=NULLIF($3,''), phone=$4, updated_at=$5
		WHERE id=$6 AND tenant_id=$7`,
		e.FirstName, e.LastName, e.Email, e.Phone, e.UpdatedAt, e.UserProfileID, e.TenantID); err != nil {
		return err
	}
	tag, err := tx.Exec(ctx, `
		UPDATE employees SET
			employee_number=$1, entity_id=$2, department_id=$3, position_id=$4, manager_id=$5,
			employment_type=$6, status=$7, join_date=$8, end_date=$9,
			basic_salary=$10, bpjs_kes=$11, bpjs_tk=$12, bank_account=$13, updated_at=$14
		WHERE id=$15 AND tenant_id=$16`,
		e.EmployeeNumber, e.EntityID, e.DepartmentID, e.PositionID, e.ManagerID,
		string(e.EmploymentType), string(e.Status), e.JoinDate, e.EndDate,
		float64(e.BasicSalary)/100.0, e.BpjsKes, e.BpjsTk, e.BankAccount, e.UpdatedAt,
		e.ID, e.TenantID)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrDuplicateNumber
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return tx.Commit(ctx)
}

func (r *EmployeeRepo) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM employees WHERE tenant_id=$1 AND id=$2`, tenantID, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scan(row rowScanner) (*domain.Employee, error) {
	var (
		e         domain.Employee
		basicNum  float64
		empType   string
		status    string
		entityID  *uuid.UUID
		deptID    *uuid.UUID
		posID     *uuid.UUID
		mgrID     *uuid.UUID
	)
	if err := row.Scan(
		&e.ID, &e.TenantID, &e.UserProfileID, &e.EmployeeNumber,
		&entityID, &deptID, &posID, &mgrID,
		&empType, &status, &e.JoinDate, &e.EndDate,
		&basicNum, &e.BpjsKes, &e.BpjsTk, &e.BankAccount,
		&e.FirstName, &e.LastName, &e.Email, &e.Phone,
		&e.CreatedAt, &e.UpdatedAt,
	); err != nil {
		return nil, err
	}
	e.EntityID, e.DepartmentID, e.PositionID, e.ManagerID = entityID, deptID, posID, mgrID
	e.EmploymentType = domain.EmploymentType(empType)
	e.Status = domain.EmployeeStatus(status)
	e.BasicSalary = int64(basicNum * 100)
	return &e, nil
}

func itoa(i int) string {
	// Small helper; avoid pulling in strconv into every fragment.
	if i < 10 {
		return string('0' + rune(i))
	}
	const digits = "0123456789"
	out := ""
	for i > 0 {
		out = string(digits[i%10]) + out
		i /= 10
	}
	return out
}

// isUniqueViolation sniffs pgx's PostgreSQL error code 23505.
func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "23505")
}
