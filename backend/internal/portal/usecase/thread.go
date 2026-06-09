package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/portal/domain"
)

type ThreadService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewThreadService(repo domain.Repository) *ThreadService {
	return &ThreadService{repo: repo, now: time.Now}
}

type WriteInput struct {
	TenantID      uuid.UUID
	Kind          domain.Kind
	Topic         *string
	LastMessageAt *time.Time
}

func (s *ThreadService) Create(ctx context.Context, in WriteInput) (*domain.Thread, error) {
	if in.Kind == "" {
		in.Kind = domain.KindDirect
	}
	topic := in.Topic
	if topic != nil {
		trimmed := strings.TrimSpace(*topic)
		if trimmed == "" {
			topic = nil
		} else {
			topic = &trimmed
		}
	}
	now := s.now()
	t := &domain.Thread{
		ID:            uuid.New(),
		TenantID:      in.TenantID,
		Kind:          in.Kind,
		Topic:         topic,
		LastMessageAt: in.LastMessageAt,
		CreatedAt:     now,
	}
	if err := t.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *ThreadService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Thread, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *ThreadService) List(ctx context.Context, f domain.Filter) ([]*domain.Thread, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	return s.repo.List(ctx, f)
}

func (s *ThreadService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Thread, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	if in.Kind != "" {
		existing.Kind = in.Kind
	}
	if in.Topic != nil {
		trimmed := strings.TrimSpace(*in.Topic)
		if trimmed == "" {
			existing.Topic = nil
		} else {
			existing.Topic = &trimmed
		}
	}
	if in.LastMessageAt != nil {
		existing.LastMessageAt = in.LastMessageAt
	}

	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *ThreadService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
