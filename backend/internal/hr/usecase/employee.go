// Package usecase orchestrates domain entities + ports. No HTTP, no SQL.
// Every public method is one application use case the HTTP/gRPC layer can
// hit. Keeps business rules + side-effect sequencing in one place.
package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/hr/domain"
)

type EmployeeService struct {
	repo domain.Repository
	now  func() time.Time // injected so tests can fake clock
}

func NewEmployeeService(repo domain.Repository) *EmployeeService {
	return &EmployeeService{repo: repo, now: time.Now}
}

// CreateInput is the data the HTTP handler hands us. Mirrors the domain.Employee
// fields but omits identity + audit timestamps that we own.
type CreateInput struct {
	TenantID       uuid.UUID
	FirstName      string
	LastName       string
	Email          string
	Phone          string
	EmployeeNumber string
	EntityID       *uuid.UUID
	DepartmentID   *uuid.UUID
	PositionID     *uuid.UUID
	ManagerID      *uuid.UUID
	EmploymentType domain.EmploymentType
	Status         domain.EmployeeStatus
	JoinDate       time.Time
	BasicSalary    int64
	BpjsKes        bool
	BpjsTk         bool
	BankAccount    string
}

func (s *EmployeeService) Create(ctx context.Context, in CreateInput) (*domain.Employee, error) {
	if in.EmploymentType == "" {
		in.EmploymentType = domain.Permanent
	}
	if in.Status == "" {
		in.Status = domain.StatusActive
	}
	if in.JoinDate.IsZero() {
		in.JoinDate = s.now()
	}

	now := s.now()
	emp := &domain.Employee{
		ID:             uuid.New(),
		TenantID:       in.TenantID,
		UserProfileID:  uuid.New(), // repo will provision the user_profile row in the same tx
		EmployeeNumber: strings.TrimSpace(in.EmployeeNumber),
		EntityID:       in.EntityID,
		DepartmentID:   in.DepartmentID,
		PositionID:     in.PositionID,
		ManagerID:      in.ManagerID,
		EmploymentType: in.EmploymentType,
		Status:         in.Status,
		JoinDate:       in.JoinDate,
		BasicSalary:    in.BasicSalary,
		BpjsKes:        in.BpjsKes,
		BpjsTk:         in.BpjsTk,
		BankAccount:    in.BankAccount,
		FirstName:      strings.TrimSpace(in.FirstName),
		LastName:       strings.TrimSpace(in.LastName),
		Email:          strings.TrimSpace(in.Email),
		Phone:          strings.TrimSpace(in.Phone),
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := emp.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, emp); err != nil {
		return nil, err
	}
	return emp, nil
}

func (s *EmployeeService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Employee, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *EmployeeService) List(ctx context.Context, f domain.Filter) ([]*domain.Employee, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	return s.repo.List(ctx, f)
}

// UpdateInput mirrors CreateInput but with the ID; lets a PATCH overwrite the
// entire mutable surface. Partial updates can be layered later.
type UpdateInput struct {
	ID uuid.UUID
	CreateInput
}

func (s *EmployeeService) Update(ctx context.Context, in UpdateInput) (*domain.Employee, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, in.ID)
	if err != nil {
		return nil, err
	}

	existing.FirstName = strings.TrimSpace(in.FirstName)
	existing.LastName = strings.TrimSpace(in.LastName)
	existing.Email = strings.TrimSpace(in.Email)
	existing.Phone = strings.TrimSpace(in.Phone)
	existing.EmployeeNumber = strings.TrimSpace(in.EmployeeNumber)
	existing.EntityID = in.EntityID
	existing.DepartmentID = in.DepartmentID
	existing.PositionID = in.PositionID
	existing.ManagerID = in.ManagerID
	if in.EmploymentType != "" {
		existing.EmploymentType = in.EmploymentType
	}
	if in.Status != "" {
		existing.Status = in.Status
	}
	if !in.JoinDate.IsZero() {
		existing.JoinDate = in.JoinDate
	}
	existing.BasicSalary = in.BasicSalary
	existing.BpjsKes = in.BpjsKes
	existing.BpjsTk = in.BpjsTk
	existing.BankAccount = in.BankAccount
	existing.UpdatedAt = s.now()

	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *EmployeeService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
