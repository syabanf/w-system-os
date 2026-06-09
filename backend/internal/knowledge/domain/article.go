// Package domain — Knowledge bounded context. Internal wiki articles.
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
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
	StatusArchived  Status = "archived"
)

// Valid reports whether s is a recognised article status. Lets the HTTP layer
// reject unknown filter values with 400 rather than returning an empty list.
func (s Status) Valid() bool {
	switch s {
	case StatusDraft, StatusPublished, StatusArchived:
		return true
	}
	return false
}

type Article struct {
	ID           uuid.UUID
	TenantID     uuid.UUID
	CategoryID   *uuid.UUID
	Title        string
	Slug         string
	Excerpt      string
	BodyMarkdown string
	AuthorID     *uuid.UUID
	Status       Status
	Pinned       bool
	ViewCount    int
	PublishedAt  *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (a *Article) Validate() error {
	if strings.TrimSpace(a.Title) == "" {
		return errors.New("title is required")
	}
	if strings.TrimSpace(a.Slug) == "" {
		return errors.New("slug is required")
	}
	if strings.TrimSpace(a.BodyMarkdown) == "" {
		return errors.New("body is required")
	}
	switch a.Status {
	case StatusDraft, StatusPublished, StatusArchived, "":
	default:
		return errors.New("invalid status")
	}
	return nil
}

type Filter struct {
	TenantID   uuid.UUID
	Search     string
	CategoryID *uuid.UUID
	Status     *Status
	Pinned     *bool
	Limit      int
	Offset     int
}

type Repository interface {
	Create(ctx context.Context, a *Article) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Article, error)
	List(ctx context.Context, f Filter) ([]*Article, int, error)
	Update(ctx context.Context, a *Article) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound      = errors.New("article not found")
	ErrDuplicateSlug = errors.New("article slug already exists for this tenant")
)
