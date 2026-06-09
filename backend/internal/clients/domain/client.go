// Package domain — Clients bounded context. Customer accounts WIT bills/serves.
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Health string

const (
	HealthExcellent Health = "excellent"
	HealthStable    Health = "stable"
	HealthAtRisk    Health = "at-risk"
	HealthChurnRisk Health = "churn-risk"
)

// Valid reports whether h is a recognised health value. Lets the HTTP layer
// reject unknown filter values with 400 rather than returning an empty list.
func (h Health) Valid() bool {
	switch h {
	case HealthExcellent, HealthStable, HealthAtRisk, HealthChurnRisk:
		return true
	}
	return false
}

type Client struct {
	ID                uuid.UUID
	TenantID          uuid.UUID
	Name              string
	Industry          string
	Region            string
	PrimaryContact    string
	ContactEmail      string
	AccountOwnerID    *uuid.UUID
	ContractValue     int64 // IDR cents
	RetainerActive    bool
	ActiveProjects    int
	SatisfactionScore int
	Health            Health
	RenewalDate       *time.Time
	JoinedAt          *time.Time
	LogoColor         string
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (c *Client) Validate() error {
	if strings.TrimSpace(c.Name) == "" {
		return errors.New("name is required")
	}
	switch c.Health {
	case HealthExcellent, HealthStable, HealthAtRisk, HealthChurnRisk, "":
	default:
		return errors.New("invalid health")
	}
	if c.SatisfactionScore < 0 || c.SatisfactionScore > 100 {
		return errors.New("satisfaction score out of range")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Search   string
	Health   *Health
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, c *Client) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Client, error)
	List(ctx context.Context, f Filter) ([]*Client, int, error)
	Update(ctx context.Context, c *Client) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

// ErrNotFound is returned when a client row is absent for the tenant. There is
// deliberately no ErrDuplicateName: clients.name carries no UNIQUE constraint,
// so a "duplicate name" conflict can never originate from the database.
var ErrNotFound = errors.New("client not found")
