// Package domain holds the HR aggregate roots and value objects. Pure Go,
// no SQL, no HTTP — depends on nothing but the standard library so it stays
// portable across deployment shapes (modular monolith ↔ standalone service).
package domain

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type EmploymentType string

const (
	Permanent EmploymentType = "Permanent"
	Contract  EmploymentType = "Contract"
	Probation EmploymentType = "Probation"
	Intern    EmploymentType = "Intern"
)

type EmployeeStatus string

const (
	StatusActive     EmployeeStatus = "active"
	StatusProbation  EmployeeStatus = "probation"
	StatusOnLeave    EmployeeStatus = "on-leave"
	StatusResigned   EmployeeStatus = "resigned"
	StatusTerminated EmployeeStatus = "terminated"
)

// Employee is the aggregate root. user_profiles.id is the natural identity
// (1:1 with the profile), but employees.id stays our internal handle so we
// can change profile→employee mapping later without breaking foreign keys.
type Employee struct {
	ID              uuid.UUID
	TenantID        uuid.UUID
	UserProfileID   uuid.UUID
	EmployeeNumber  string
	EntityID        *uuid.UUID
	DepartmentID    *uuid.UUID
	PositionID      *uuid.UUID
	ManagerID       *uuid.UUID
	EmploymentType  EmploymentType
	Status          EmployeeStatus
	JoinDate        time.Time
	EndDate         *time.Time
	BasicSalary     int64 // stored as IDR cents to avoid float drift; converts cleanly to numeric(15,2)
	BpjsKes         bool
	BpjsTk          bool
	BankAccount     string

	// Denormalised display fields hydrated from user_profiles in repo joins.
	// Kept on the aggregate so the use case can return a fully populated DTO
	// without callers needing a second round trip.
	FirstName string
	LastName  string
	Email     string
	Phone     string

	CreatedAt time.Time
	UpdatedAt time.Time
}

// Validate enforces invariants the database can't (cheaply) express. Catches
// stupid input before we burn a transaction.
func (e *Employee) Validate() error {
	if strings.TrimSpace(e.FirstName) == "" {
		return errors.New("first name is required")
	}
	if strings.TrimSpace(e.LastName) == "" {
		return errors.New("last name is required")
	}
	if strings.TrimSpace(e.EmployeeNumber) == "" {
		return errors.New("employee number is required")
	}
	switch e.EmploymentType {
	case Permanent, Contract, Probation, Intern:
	default:
		return errors.New("invalid employment type")
	}
	switch e.Status {
	case StatusActive, StatusProbation, StatusOnLeave, StatusResigned, StatusTerminated:
	default:
		return errors.New("invalid status")
	}
	if e.BasicSalary < 0 {
		return errors.New("basic salary cannot be negative")
	}
	return nil
}

// Filter is the query shape the HTTP layer accepts and the repository serves.
// Lives in the domain layer so usecase + repo share one definition.
type Filter struct {
	TenantID      uuid.UUID
	Search        string // matches first/last name + employee number
	Department    *uuid.UUID
	Position      *uuid.UUID
	Status        *EmployeeStatus
	EmploymentType *EmploymentType
	Limit         int
	Offset        int
}
