package usecase

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/masterdata/domain"
)

type CategoryService struct {
	repo domain.CategoryRepository
	now  func() time.Time
}

func NewCategoryService(repo domain.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo, now: time.Now}
}

type CategoryWriteInput struct {
	TenantID    uuid.UUID
	Code        string
	ModuleID    string
	Label       string
	Description string
	Fields      json.RawMessage
	DisplayKeys []string
	IsSystem    bool
	IsActive    *bool
}

func (s *CategoryService) Create(ctx context.Context, in CategoryWriteInput) (*domain.Category, error) {
	now := s.now()
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	fields := in.Fields
	if len(fields) == 0 {
		fields = json.RawMessage(`[]`)
	}
	displayKeys := in.DisplayKeys
	if displayKeys == nil {
		displayKeys = []string{}
	}
	c := &domain.Category{
		ID:          uuid.New(),
		TenantID:    in.TenantID,
		Code:        strings.TrimSpace(in.Code),
		ModuleID:    in.ModuleID,
		Label:       strings.TrimSpace(in.Label),
		Description: in.Description,
		Fields:      fields,
		DisplayKeys: displayKeys,
		IsSystem:    in.IsSystem,
		IsActive:    active,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := c.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *CategoryService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Category, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *CategoryService) List(ctx context.Context, f domain.CategoryFilter) ([]*domain.Category, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	return s.repo.List(ctx, f)
}

func (s *CategoryService) Update(ctx context.Context, id uuid.UUID, in CategoryWriteInput) (*domain.Category, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	if in.Code != "" {
		existing.Code = strings.TrimSpace(in.Code)
	}
	existing.ModuleID = in.ModuleID
	if in.Label != "" {
		existing.Label = strings.TrimSpace(in.Label)
	}
	existing.Description = in.Description
	if len(in.Fields) > 0 {
		existing.Fields = in.Fields
	}
	if in.DisplayKeys != nil {
		existing.DisplayKeys = in.DisplayKeys
	}
	existing.IsSystem = in.IsSystem
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

func (s *CategoryService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
