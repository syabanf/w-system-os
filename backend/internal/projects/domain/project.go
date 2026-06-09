// Package domain — Project portfolio. Epics/sprints/tasks tables exist in
// migration 015 — wire additional handlers as separate use cases when needed.
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusDiscovery   Status = "Discovery"
	StatusPlanning    Status = "Planning"
	StatusInDev       Status = "In Development"
	StatusQA          Status = "QA"
	StatusUAT         Status = "UAT"
	StatusDelivered   Status = "Delivered"
	StatusMaintenance Status = "Maintenance"
)

// Valid reports whether s is a recognised project status. Lets the HTTP layer
// reject unknown filter values with 400 rather than returning an empty list.
func (s Status) Valid() bool {
	switch s {
	case StatusDiscovery, StatusPlanning, StatusInDev, StatusQA, StatusUAT, StatusDelivered, StatusMaintenance:
		return true
	}
	return false
}

type Project struct {
	ID               uuid.UUID
	TenantID         uuid.UUID
	Code             string
	Name             string
	ClientID         *uuid.UUID
	Status           Status
	Progress         int
	Budget           int64 // IDR cents
	ActualCost       int64
	RiskLevel        string
	StartDate        *time.Time
	EndDate          *time.Time
	ProjectManagerID *uuid.UUID
	Health           string
	TechStack        []string
	OpenTickets      int
	ChangeRequests   int
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

func (p *Project) Validate() error {
	if strings.TrimSpace(p.Code) == "" {
		return errors.New("code is required")
	}
	if strings.TrimSpace(p.Name) == "" {
		return errors.New("name is required")
	}
	if p.Progress < 0 || p.Progress > 100 {
		return errors.New("progress must be 0-100")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Search   string
	Status   *Status
	Health   string
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, p *Project) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Project, error)
	List(ctx context.Context, f Filter) ([]*Project, int, error)
	Update(ctx context.Context, p *Project) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound      = errors.New("project not found")
	ErrDuplicateCode = errors.New("project code already exists for this tenant")
)
