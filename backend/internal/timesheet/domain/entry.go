// Package domain — Timesheet bounded context. Time entries logged per user/project.
package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusDraft     Status = "draft"
	StatusSubmitted Status = "submitted"
	StatusApproved  Status = "approved"
	StatusRejected  Status = "rejected"
)

// Valid reports whether s is a recognised entry status. Lets the HTTP layer
// reject unknown filter values with 400 rather than returning an empty list.
func (s Status) Valid() bool {
	switch s {
	case StatusDraft, StatusSubmitted, StatusApproved, StatusRejected:
		return true
	}
	return false
}

type Entry struct {
	ID             uuid.UUID
	TenantID       uuid.UUID
	UserProfileID  uuid.UUID
	ProjectID      *uuid.UUID
	TaskID         *uuid.UUID
	Date           time.Time
	StartTime      *string // "HH:MM"
	EndTime        *string // "HH:MM"
	Hours          float64
	ActivityType   string
	Billable       bool
	Description    string
	Status         Status
	ApprovedBy     *uuid.UUID
	ApprovedAt     *time.Time
	RejectedReason string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (e *Entry) Validate() error {
	if e.UserProfileID == uuid.Nil {
		return errors.New("userProfileId is required")
	}
	if e.Date.IsZero() {
		return errors.New("date is required")
	}
	if e.Hours < 0 {
		return errors.New("hours cannot be negative")
	}
	switch e.Status {
	case StatusDraft, StatusSubmitted, StatusApproved, StatusRejected, "":
	default:
		return errors.New("invalid status")
	}
	return nil
}

type Filter struct {
	TenantID      uuid.UUID
	UserProfileID *uuid.UUID
	ProjectID     *uuid.UUID
	Status        *Status
	DateFrom      *time.Time
	DateTo        *time.Time
	Billable      *bool
	Limit         int
	Offset        int
}

type Repository interface {
	Create(ctx context.Context, e *Entry) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Entry, error)
	List(ctx context.Context, f Filter) ([]*Entry, int, error)
	Update(ctx context.Context, e *Entry) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound = errors.New("entry not found")
)
