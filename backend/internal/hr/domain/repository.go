package domain

import (
	"context"

	"github.com/google/uuid"
)

// Repository is the persistence port. Implementations (Postgres, in-memory
// for tests, gRPC client for cross-service calls) live outside this package.
type Repository interface {
	Create(ctx context.Context, e *Employee) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Employee, error)
	List(ctx context.Context, f Filter) ([]*Employee, int, error)
	Update(ctx context.Context, e *Employee) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}
