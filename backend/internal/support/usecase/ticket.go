package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/support/domain"
)

type TicketService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewTicketService(r domain.Repository) *TicketService {
	return &TicketService{repo: r, now: time.Now}
}

type WriteInput struct {
	TenantID             uuid.UUID
	Code                 string
	Title                string
	Description          string
	ClientID             *uuid.UUID
	ProjectID            *uuid.UUID
	Severity             domain.Severity
	Status               domain.Status
	AssignedToID         *uuid.UUID
	IsChangeRequest      bool
	EstimatedEffortHours float64
	SLADeadline          *time.Time
}

func (s *TicketService) Create(ctx context.Context, in WriteInput) (*domain.Ticket, error) {
	if in.Status == "" {
		in.Status = domain.StatusOpen
	}
	if in.Severity == "" {
		in.Severity = domain.SeverityMedium
	}
	now := s.now()
	t := &domain.Ticket{
		ID: uuid.New(), TenantID: in.TenantID,
		Code: strings.TrimSpace(in.Code), Title: strings.TrimSpace(in.Title),
		Description: in.Description, ClientID: in.ClientID, ProjectID: in.ProjectID,
		Severity: in.Severity, Status: in.Status, AssignedToID: in.AssignedToID,
		IsChangeRequest: in.IsChangeRequest, EstimatedEffortHours: in.EstimatedEffortHours,
		SLADeadline: in.SLADeadline, CreatedAt: now, UpdatedAt: now,
	}
	if err := t.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TicketService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Ticket, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *TicketService) List(ctx context.Context, f domain.Filter) ([]*domain.Ticket, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *TicketService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Ticket, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.Code = strings.TrimSpace(in.Code)
	existing.Title = strings.TrimSpace(in.Title)
	existing.Description = in.Description
	existing.ClientID = in.ClientID
	existing.ProjectID = in.ProjectID
	if in.Severity != "" {
		existing.Severity = in.Severity
	}
	if in.Status != "" {
		existing.Status = in.Status
	}
	existing.AssignedToID = in.AssignedToID
	existing.IsChangeRequest = in.IsChangeRequest
	existing.EstimatedEffortHours = in.EstimatedEffortHours
	existing.SLADeadline = in.SLADeadline
	existing.UpdatedAt = s.now()
	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *TicketService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
