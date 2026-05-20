// Package domain — Portal bounded context. Employee chat threads.
package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Kind string

const (
	KindDirect Kind = "direct"
	KindGroup  Kind = "group"
	KindHR     Kind = "hr"
)

type Thread struct {
	ID            uuid.UUID
	TenantID      uuid.UUID
	Kind          Kind
	Topic         *string
	LastMessageAt *time.Time
	CreatedAt     time.Time
}

func (t *Thread) Validate() error {
	switch t.Kind {
	case KindDirect, KindGroup, KindHR, "":
	default:
		return errors.New("invalid kind")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Kind     *Kind
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, t *Thread) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Thread, error)
	List(ctx context.Context, f Filter) ([]*Thread, int, error)
	Update(ctx context.Context, t *Thread) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound = errors.New("thread not found")
)
