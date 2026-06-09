// Package domain — Masterdata bounded context. Generic lookup categories & items.
package domain

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID       uuid.UUID
	TenantID uuid.UUID
	Code     string
	// ModuleID is the frontend AppModuleId namespace ("leads", "finance", …),
	// stored as varchar(40) NOT NULL — not a UUID.
	ModuleID    string
	Label       string
	Description string
	Fields      json.RawMessage
	DisplayKeys []string
	IsSystem    bool
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (c *Category) Validate() error {
	if strings.TrimSpace(c.Code) == "" {
		return errors.New("code is required")
	}
	if strings.TrimSpace(c.Label) == "" {
		return errors.New("label is required")
	}
	if strings.TrimSpace(c.ModuleID) == "" {
		return errors.New("moduleId is required")
	}
	return nil
}

type CategoryFilter struct {
	TenantID uuid.UUID
	Search   string
	ModuleID *string
	IsActive *bool
	Limit    int
	Offset   int
}

type CategoryRepository interface {
	Create(ctx context.Context, c *Category) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Category, error)
	List(ctx context.Context, f CategoryFilter) ([]*Category, int, error)
	Update(ctx context.Context, c *Category) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrCategoryNotFound      = errors.New("category not found")
	ErrDuplicateCategoryCode = errors.New("category code already exists for this tenant")
)
