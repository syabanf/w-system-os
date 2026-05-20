package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/admin/domain"
)

type UserService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewUserService(repo domain.Repository) *UserService {
	return &UserService{repo: repo, now: time.Now}
}

type WriteInput struct {
	TenantID      uuid.UUID
	Email         string
	Password      string
	MFASecret     string
	UserProfileID *uuid.UUID
	IsActive      *bool
}

func (s *UserService) Create(ctx context.Context, in WriteInput) (*domain.User, error) {
	now := s.now()
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}
	u := &domain.User{
		ID:            uuid.New(),
		TenantID:      in.TenantID,
		Email:         strings.ToLower(strings.TrimSpace(in.Email)),
		PasswordHash:  in.Password, // TODO: hash with argon2id
		MFASecret:     in.MFASecret,
		UserProfileID: in.UserProfileID,
		IsActive:      active,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	if err := u.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.User, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *UserService) List(ctx context.Context, f domain.Filter) ([]*domain.User, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *UserService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.User, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	if in.Email != "" {
		existing.Email = strings.ToLower(strings.TrimSpace(in.Email))
	}
	if in.Password != "" {
		// TODO: hash with argon2id
		existing.PasswordHash = in.Password
	}
	if in.MFASecret != "" {
		existing.MFASecret = in.MFASecret
	}
	existing.UserProfileID = in.UserProfileID
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

func (s *UserService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
