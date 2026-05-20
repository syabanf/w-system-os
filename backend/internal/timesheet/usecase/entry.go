package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/timesheet/domain"
)

type EntryService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewEntryService(repo domain.Repository) *EntryService {
	return &EntryService{repo: repo, now: time.Now}
}

type WriteInput struct {
	TenantID       uuid.UUID
	UserProfileID  uuid.UUID
	ProjectID      *uuid.UUID
	TaskID         *uuid.UUID
	Date           time.Time
	StartTime      *string
	EndTime        *string
	Hours          float64
	ActivityType   string
	Billable       bool
	Description    string
	Status         domain.Status
	ApprovedBy     *uuid.UUID
	ApprovedAt     *time.Time
	RejectedReason string
}

func (s *EntryService) Create(ctx context.Context, in WriteInput) (*domain.Entry, error) {
	if in.Status == "" {
		in.Status = domain.StatusDraft
	}
	now := s.now()
	e := &domain.Entry{
		ID:             uuid.New(),
		TenantID:       in.TenantID,
		UserProfileID:  in.UserProfileID,
		ProjectID:      in.ProjectID,
		TaskID:         in.TaskID,
		Date:           in.Date,
		StartTime:      in.StartTime,
		EndTime:        in.EndTime,
		Hours:          in.Hours,
		ActivityType:   strings.TrimSpace(in.ActivityType),
		Billable:       in.Billable,
		Description:    in.Description,
		Status:         in.Status,
		ApprovedBy:     in.ApprovedBy,
		ApprovedAt:     in.ApprovedAt,
		RejectedReason: in.RejectedReason,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := e.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *EntryService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Entry, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *EntryService) List(ctx context.Context, f domain.Filter) ([]*domain.Entry, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *EntryService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Entry, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	if in.UserProfileID != uuid.Nil {
		existing.UserProfileID = in.UserProfileID
	}
	existing.ProjectID = in.ProjectID
	existing.TaskID = in.TaskID
	if !in.Date.IsZero() {
		existing.Date = in.Date
	}
	existing.StartTime = in.StartTime
	existing.EndTime = in.EndTime
	existing.Hours = in.Hours
	existing.ActivityType = strings.TrimSpace(in.ActivityType)
	existing.Billable = in.Billable
	existing.Description = in.Description
	if in.Status != "" {
		existing.Status = in.Status
	}
	existing.ApprovedBy = in.ApprovedBy
	existing.ApprovedAt = in.ApprovedAt
	existing.RejectedReason = in.RejectedReason
	existing.UpdatedAt = s.now()

	if err := existing.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *EntryService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
