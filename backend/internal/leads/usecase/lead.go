package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/leads/domain"
)

type LeadService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewLeadService(r domain.Repository) *LeadService { return &LeadService{repo: r, now: time.Now} }

type WriteInput struct {
	TenantID      uuid.UUID
	CompanyName   string
	ContactPerson string
	ContactEmail  string
	DealValue     int64
	Stage         domain.Stage
	Source        string
	Probability   int
	FollowUpDate  *time.Time
	OwnerID       *uuid.UUID
	Notes         string
	WonClientID   *uuid.UUID
}

func (s *LeadService) Create(ctx context.Context, in WriteInput) (*domain.Lead, error) {
	if in.Stage == "" {
		in.Stage = domain.StageNew
	}
	now := s.now()
	l := &domain.Lead{
		ID: uuid.New(), TenantID: in.TenantID,
		CompanyName:   strings.TrimSpace(in.CompanyName),
		ContactPerson: in.ContactPerson, ContactEmail: strings.TrimSpace(in.ContactEmail),
		DealValue: in.DealValue, Stage: in.Stage, Source: in.Source,
		Probability: in.Probability, FollowUpDate: in.FollowUpDate, OwnerID: in.OwnerID, Notes: in.Notes,
		WonClientID: in.WonClientID,
		CreatedAt:   now, UpdatedAt: now,
	}
	if err := l.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, l); err != nil {
		return nil, err
	}
	return l, nil
}

func (s *LeadService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Lead, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *LeadService) List(ctx context.Context, f domain.Filter) ([]*domain.Lead, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	return s.repo.List(ctx, f)
}

func (s *LeadService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Lead, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.CompanyName = strings.TrimSpace(in.CompanyName)
	existing.ContactPerson = in.ContactPerson
	existing.ContactEmail = strings.TrimSpace(in.ContactEmail)
	existing.DealValue = in.DealValue
	if in.Stage != "" {
		existing.Stage = in.Stage
	}
	existing.Source = in.Source
	existing.Probability = in.Probability
	existing.FollowUpDate = in.FollowUpDate
	existing.OwnerID = in.OwnerID
	existing.Notes = in.Notes
	existing.WonClientID = in.WonClientID
	existing.UpdatedAt = s.now()
	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *LeadService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
