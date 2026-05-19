package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/projects/domain"
)

type ProjectService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewProjectService(r domain.Repository) *ProjectService {
	return &ProjectService{repo: r, now: time.Now}
}

type WriteInput struct {
	TenantID         uuid.UUID
	Code             string
	Name             string
	ClientID         *uuid.UUID
	Status           domain.Status
	Progress         int
	Budget           int64
	ActualCost       int64
	RiskLevel        string
	StartDate        *time.Time
	EndDate          *time.Time
	ProjectManagerID *uuid.UUID
	Health           string
	TechStack        []string
	OpenTickets      int
	ChangeRequests   int
}

func (s *ProjectService) Create(ctx context.Context, in WriteInput) (*domain.Project, error) {
	if in.Status == "" {
		in.Status = domain.StatusDiscovery
	}
	if in.Health == "" {
		in.Health = "green"
	}
	if in.RiskLevel == "" {
		in.RiskLevel = "low"
	}
	now := s.now()
	p := &domain.Project{
		ID: uuid.New(), TenantID: in.TenantID,
		Code: strings.TrimSpace(in.Code), Name: strings.TrimSpace(in.Name),
		ClientID: in.ClientID, Status: in.Status, Progress: in.Progress,
		Budget: in.Budget, ActualCost: in.ActualCost, RiskLevel: in.RiskLevel,
		StartDate: in.StartDate, EndDate: in.EndDate, ProjectManagerID: in.ProjectManagerID,
		Health: in.Health, TechStack: in.TechStack, OpenTickets: in.OpenTickets,
		ChangeRequests: in.ChangeRequests, CreatedAt: now, UpdatedAt: now,
	}
	if err := p.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Project, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *ProjectService) List(ctx context.Context, f domain.Filter) ([]*domain.Project, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *ProjectService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Project, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.Code = strings.TrimSpace(in.Code)
	existing.Name = strings.TrimSpace(in.Name)
	existing.ClientID = in.ClientID
	if in.Status != "" {
		existing.Status = in.Status
	}
	existing.Progress = in.Progress
	existing.Budget = in.Budget
	existing.ActualCost = in.ActualCost
	if in.RiskLevel != "" {
		existing.RiskLevel = in.RiskLevel
	}
	existing.StartDate = in.StartDate
	existing.EndDate = in.EndDate
	existing.ProjectManagerID = in.ProjectManagerID
	if in.Health != "" {
		existing.Health = in.Health
	}
	existing.TechStack = in.TechStack
	existing.OpenTickets = in.OpenTickets
	existing.ChangeRequests = in.ChangeRequests
	existing.UpdatedAt = s.now()
	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *ProjectService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
