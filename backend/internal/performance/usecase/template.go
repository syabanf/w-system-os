package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/performance/domain"
)

type TemplateService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewTemplateService(r domain.Repository) *TemplateService {
	return &TemplateService{repo: r, now: time.Now}
}

type WriteInput struct {
	TenantID          uuid.UUID
	Name              string
	Description       string
	PeriodKind        domain.PeriodKind
	PeriodYear        int
	PeriodCustomLabel string
	PeriodStart       *time.Time
	PeriodEnd         *time.Time
	RatingScaleMax    int
	Status            domain.Status
}

func (s *TemplateService) Create(ctx context.Context, in WriteInput) (*domain.Template, error) {
	if in.PeriodKind == "" {
		in.PeriodKind = domain.PeriodAnnual
	}
	if in.PeriodYear == 0 {
		in.PeriodYear = s.now().Year()
	}
	if in.Status == "" {
		in.Status = domain.StatusDraft
	}
	if in.RatingScaleMax == 0 {
		in.RatingScaleMax = 5
	}
	now := s.now()
	t := &domain.Template{
		ID: uuid.New(), TenantID: in.TenantID,
		Name: strings.TrimSpace(in.Name), Description: in.Description,
		PeriodKind: in.PeriodKind, PeriodYear: in.PeriodYear,
		PeriodCustomLabel: in.PeriodCustomLabel, PeriodStart: in.PeriodStart, PeriodEnd: in.PeriodEnd,
		RatingScaleMax: in.RatingScaleMax, Status: in.Status,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := t.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TemplateService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Template, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *TemplateService) List(ctx context.Context, f domain.Filter) ([]*domain.Template, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *TemplateService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Template, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.Name = strings.TrimSpace(in.Name)
	existing.Description = in.Description
	if in.PeriodKind != "" {
		existing.PeriodKind = in.PeriodKind
	}
	if in.PeriodYear != 0 {
		existing.PeriodYear = in.PeriodYear
	}
	existing.PeriodCustomLabel = in.PeriodCustomLabel
	existing.PeriodStart = in.PeriodStart
	existing.PeriodEnd = in.PeriodEnd
	if in.RatingScaleMax > 0 {
		existing.RatingScaleMax = in.RatingScaleMax
	}
	if in.Status != "" {
		existing.Status = in.Status
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

func (s *TemplateService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
