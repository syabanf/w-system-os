package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/clients/domain"
)

type ClientService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewClientService(repo domain.Repository) *ClientService {
	return &ClientService{repo: repo, now: time.Now}
}

type WriteInput struct {
	TenantID          uuid.UUID
	Name              string
	Industry          string
	Region            string
	PrimaryContact    string
	ContactEmail      string
	AccountOwnerID    *uuid.UUID
	ContractValue     int64
	RetainerActive    bool
	ActiveProjects    int
	SatisfactionScore int
	Health            domain.Health
	RenewalDate       *time.Time
	JoinedAt          *time.Time
	LogoColor         string
}

func (s *ClientService) Create(ctx context.Context, in WriteInput) (*domain.Client, error) {
	if in.Health == "" {
		in.Health = domain.HealthStable
	}
	now := s.now()
	c := &domain.Client{
		ID:                uuid.New(),
		TenantID:          in.TenantID,
		Name:              strings.TrimSpace(in.Name),
		Industry:          in.Industry,
		Region:            in.Region,
		PrimaryContact:    in.PrimaryContact,
		ContactEmail:      strings.TrimSpace(in.ContactEmail),
		AccountOwnerID:    in.AccountOwnerID,
		ContractValue:     in.ContractValue,
		RetainerActive:    in.RetainerActive,
		ActiveProjects:    in.ActiveProjects,
		SatisfactionScore: in.SatisfactionScore,
		Health:            in.Health,
		RenewalDate:       in.RenewalDate,
		JoinedAt:          in.JoinedAt,
		LogoColor:         in.LogoColor,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	if err := c.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *ClientService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Client, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *ClientService) List(ctx context.Context, f domain.Filter) ([]*domain.Client, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	return s.repo.List(ctx, f)
}

func (s *ClientService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Client, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.Name = strings.TrimSpace(in.Name)
	existing.Industry = in.Industry
	existing.Region = in.Region
	existing.PrimaryContact = in.PrimaryContact
	existing.ContactEmail = strings.TrimSpace(in.ContactEmail)
	existing.AccountOwnerID = in.AccountOwnerID
	existing.ContractValue = in.ContractValue
	existing.RetainerActive = in.RetainerActive
	existing.ActiveProjects = in.ActiveProjects
	existing.SatisfactionScore = in.SatisfactionScore
	if in.Health != "" {
		existing.Health = in.Health
	}
	existing.RenewalDate = in.RenewalDate
	existing.JoinedAt = in.JoinedAt
	existing.LogoColor = in.LogoColor
	existing.UpdatedAt = s.now()

	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *ClientService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
