// Package domain — Performance 360 templates (parent entity for questions
// and submissions). Migration 011 has the full schema; we expose templates
// first and stub questions/submissions for later iterations.
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type PeriodKind string

const (
	PeriodAnnual    PeriodKind = "annual"
	PeriodSemester  PeriodKind = "semester"
	PeriodQuarterly PeriodKind = "quarterly"
	PeriodCustom    PeriodKind = "custom"
)

type Status string

const (
	StatusDraft    Status = "draft"
	StatusActive   Status = "active"
	StatusClosed   Status = "closed"
	StatusArchived Status = "archived"
)

// Valid reports whether s is a recognised template status. Lets the HTTP layer
// reject unknown filter values with 400 rather than returning an empty list.
func (s Status) Valid() bool {
	switch s {
	case StatusDraft, StatusActive, StatusClosed, StatusArchived:
		return true
	}
	return false
}

type Template struct {
	ID                uuid.UUID
	TenantID          uuid.UUID
	Name              string
	Description       string
	PeriodKind        PeriodKind
	PeriodYear        int
	PeriodCustomLabel string
	PeriodStart       *time.Time
	PeriodEnd         *time.Time
	RatingScaleMax    int
	Status            Status
	CreatedBy         *uuid.UUID
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (t *Template) Validate() error {
	if strings.TrimSpace(t.Name) == "" {
		return errors.New("name is required")
	}
	if t.RatingScaleMax < 2 {
		return errors.New("rating scale must be at least 2")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Status   *Status
	Year     *int
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, t *Template) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Template, error)
	List(ctx context.Context, f Filter) ([]*Template, int, error)
	Update(ctx context.Context, t *Template) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var ErrNotFound = errors.New("template not found")
