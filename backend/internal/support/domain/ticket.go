// Package domain — Support tickets + change requests (CR flagged via boolean).
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityMedium   Severity = "medium"
	SeverityHigh     Severity = "high"
	SeverityCritical Severity = "critical"
)

type Status string

const (
	StatusOpen          Status = "Open"
	StatusInvestigating Status = "Investigating"
	StatusWaitingClient Status = "Waiting Client"
	StatusInProgress    Status = "In Progress"
	StatusResolved      Status = "Resolved"
	StatusClosed        Status = "Closed"
)

// Valid reports whether s is a recognised severity. Lets the HTTP layer reject
// unknown filter values with 400 rather than returning an empty list.
func (s Severity) Valid() bool {
	switch s {
	case SeverityLow, SeverityMedium, SeverityHigh, SeverityCritical:
		return true
	}
	return false
}

// Valid reports whether s is a recognised ticket status.
func (s Status) Valid() bool {
	switch s {
	case StatusOpen, StatusInvestigating, StatusWaitingClient, StatusInProgress, StatusResolved, StatusClosed:
		return true
	}
	return false
}

type Ticket struct {
	ID                   uuid.UUID
	TenantID             uuid.UUID
	Code                 string
	Title                string
	Description          string
	ClientID             *uuid.UUID
	ProjectID            *uuid.UUID
	Severity             Severity
	Status               Status
	AssignedToID         *uuid.UUID
	IsChangeRequest      bool
	EstimatedEffortHours float64
	SLADeadline          *time.Time
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

func (t *Ticket) Validate() error {
	if strings.TrimSpace(t.Code) == "" {
		return errors.New("code is required")
	}
	if strings.TrimSpace(t.Title) == "" {
		return errors.New("title is required")
	}
	return nil
}

type Filter struct {
	TenantID        uuid.UUID
	Search          string
	Status          *Status
	Severity        *Severity
	IsChangeRequest *bool
	ClientID        *uuid.UUID
	Limit           int
	Offset          int
}

type Repository interface {
	Create(ctx context.Context, t *Ticket) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Ticket, error)
	List(ctx context.Context, f Filter) ([]*Ticket, int, error)
	Update(ctx context.Context, t *Ticket) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound      = errors.New("ticket not found")
	ErrDuplicateCode = errors.New("ticket code already exists for this tenant")
)
