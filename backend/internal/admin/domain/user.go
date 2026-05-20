// Package domain — Admin bounded context. Auth users (IAM).
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID             uuid.UUID
	TenantID       uuid.UUID
	Email          string
	PasswordHash   string
	MFASecret      string
	UserProfileID  *uuid.UUID
	IsActive       bool
	LastLoginAt    *time.Time
	FailedAttempts int
	LockedUntil    *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (u *User) Validate() error {
	email := strings.TrimSpace(u.Email)
	if email == "" {
		return errors.New("email is required")
	}
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return errors.New("invalid email")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Search   string
	IsActive *bool
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, u *User) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*User, error)
	List(ctx context.Context, f Filter) ([]*User, int, error)
	Update(ctx context.Context, u *User) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound       = errors.New("user not found")
	ErrDuplicateEmail = errors.New("user email already exists")
)
