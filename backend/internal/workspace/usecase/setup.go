// Package usecase holds the workspace-setup application logic: read the
// per-tenant setup (with a sensible default when none exists) and save it,
// enforcing the same invariants as the frontend wizard.
package usecase

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/workspace/domain"
)

// RequiredModule is always enabled — the shell needs an executive landing
// surface, so the dashboard can't be switched off (mirrors the frontend's
// REQUIRED_MODULES). Enforced here so the rule holds for any client.
const RequiredModule = "dashboard"

type Service struct {
	repo domain.Repository
	now  func() time.Time
}

func NewService(repo domain.Repository) *Service {
	return &Service{repo: repo, now: time.Now}
}

// Get returns the tenant's saved setup, or a default (nothing persisted yet,
// first-run not complete) so the endpoint always answers with a usable shape.
func (s *Service) Get(ctx context.Context, tenantID uuid.UUID) (*domain.Setup, error) {
	setup, err := s.repo.Get(ctx, tenantID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			now := s.now()
			return &domain.Setup{
				TenantID:       tenantID,
				EnabledModules: []string{},
				IsComplete:     false,
				CreatedAt:      now,
				UpdatedAt:      now,
			}, nil
		}
		return nil, err
	}
	return setup, nil
}

type SaveInput struct {
	TenantID       uuid.UUID
	EnabledModules []string
	IsComplete     bool
}

func (s *Service) Save(ctx context.Context, in SaveInput) (*domain.Setup, error) {
	now := s.now()
	setup := &domain.Setup{
		TenantID:       in.TenantID,
		EnabledModules: normalize(in.EnabledModules),
		IsComplete:     in.IsComplete,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := s.repo.Upsert(ctx, setup); err != nil {
		return nil, err
	}
	return setup, nil
}

// normalize trims, drops blanks, de-duplicates (preserving first-seen order),
// and forces the required module on — matching the frontend normalizeEnabled().
func normalize(ids []string) []string {
	seen := make(map[string]bool, len(ids)+1)
	out := make([]string, 0, len(ids)+1)
	add := func(id string) {
		id = strings.TrimSpace(id)
		if id == "" || seen[id] {
			return
		}
		seen[id] = true
		out = append(out, id)
	}
	add(RequiredModule)
	for _, id := range ids {
		add(id)
	}
	return out
}
