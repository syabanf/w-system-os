package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/masterdata/domain"
)

type ItemService struct {
	repo domain.ItemRepository
	now  func() time.Time
}

func NewItemService(repo domain.ItemRepository) *ItemService {
	return &ItemService{repo: repo, now: time.Now}
}

type ItemWriteInput struct {
	TenantID   uuid.UUID
	CategoryID uuid.UUID
	Payload    json.RawMessage
	SortOrder  int
	IsActive   *bool
}

func (s *ItemService) Create(ctx context.Context, in ItemWriteInput) (*domain.Item, error) {
	now := s.now()
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	i := &domain.Item{
		ID:         uuid.New(),
		TenantID:   in.TenantID,
		CategoryID: in.CategoryID,
		Payload:    in.Payload,
		SortOrder:  in.SortOrder,
		IsActive:   active,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := i.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, i); err != nil {
		return nil, err
	}
	return i, nil
}

func (s *ItemService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Item, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *ItemService) List(ctx context.Context, f domain.ItemFilter) ([]*domain.Item, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *ItemService) Update(ctx context.Context, id uuid.UUID, in ItemWriteInput) (*domain.Item, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	if in.CategoryID != uuid.Nil {
		existing.CategoryID = in.CategoryID
	}
	if len(in.Payload) > 0 {
		existing.Payload = in.Payload
	}
	existing.SortOrder = in.SortOrder
	if in.IsActive != nil {
		existing.IsActive = *in.IsActive
	}
	existing.UpdatedAt = s.now()

	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *ItemService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
