package domain

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Item struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	CategoryID uuid.UUID
	Payload    json.RawMessage
	SortOrder  int
	IsActive   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (i *Item) Validate() error {
	if i.CategoryID == uuid.Nil {
		return errors.New("categoryId is required")
	}
	if len(i.Payload) == 0 {
		return errors.New("payload is required")
	}
	return nil
}

type ItemFilter struct {
	TenantID   uuid.UUID
	CategoryID uuid.UUID
	IsActive   *bool
	Limit      int
	Offset     int
}

type ItemRepository interface {
	Create(ctx context.Context, i *Item) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Item, error)
	List(ctx context.Context, f ItemFilter) ([]*Item, int, error)
	Update(ctx context.Context, i *Item) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrItemNotFound = errors.New("item not found")
)
