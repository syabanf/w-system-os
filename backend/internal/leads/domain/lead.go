// Package domain — Sales pipeline. Leads convert to clients on win.
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Stage string

const (
	StageNew         Stage = "New Lead"
	StageQualified   Stage = "Qualified"
	StageDiscovery   Stage = "Discovery"
	StageProposal    Stage = "Proposal Sent"
	StageNegotiation Stage = "Negotiation"
	StageWon         Stage = "Won"
	StageLost        Stage = "Lost"
)

// Valid reports whether s is a recognised pipeline stage. Used by the HTTP
// layer to reject unknown filter values with 400 instead of silently
// returning an empty list.
func (s Stage) Valid() bool {
	switch s {
	case StageNew, StageQualified, StageDiscovery, StageProposal, StageNegotiation, StageWon, StageLost:
		return true
	}
	return false
}

type Lead struct {
	ID            uuid.UUID
	TenantID      uuid.UUID
	CompanyName   string
	ContactPerson string
	ContactEmail  string
	DealValue     int64 // IDR cents
	Stage         Stage
	Source        string
	Probability   int
	FollowUpDate  *time.Time
	OwnerID       *uuid.UUID
	Notes         string
	WonClientID   *uuid.UUID
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (l *Lead) Validate() error {
	if strings.TrimSpace(l.CompanyName) == "" {
		return errors.New("company name is required")
	}
	if l.Probability < 0 || l.Probability > 100 {
		return errors.New("probability must be 0-100")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Search   string
	Stage    *Stage
	Source   string
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, l *Lead) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Lead, error)
	List(ctx context.Context, f Filter) ([]*Lead, int, error)
	Update(ctx context.Context, l *Lead) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var ErrNotFound = errors.New("lead not found")
