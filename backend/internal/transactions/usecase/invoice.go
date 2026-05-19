package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/transactions/domain"
)

type InvoiceService struct {
	repo domain.Repository
	now  func() time.Time
}

func NewInvoiceService(r domain.Repository) *InvoiceService {
	return &InvoiceService{repo: r, now: time.Now}
}

type WriteInput struct {
	TenantID   uuid.UUID
	Number     string
	ClientID   uuid.UUID
	ProjectID  *uuid.UUID
	IssueDate  time.Time
	DueDate    time.Time
	Amount     int64
	PaidAmount int64
	Status     domain.InvoiceStatus
	Currency   string
}

func (s *InvoiceService) Create(ctx context.Context, in WriteInput) (*domain.Invoice, error) {
	if in.Status == "" {
		in.Status = domain.InvoiceDraft
	}
	if in.Currency == "" {
		in.Currency = "IDR"
	}
	now := s.now()
	i := &domain.Invoice{
		ID: uuid.New(), TenantID: in.TenantID,
		Number: strings.TrimSpace(in.Number), ClientID: in.ClientID, ProjectID: in.ProjectID,
		IssueDate: in.IssueDate, DueDate: in.DueDate,
		Amount: in.Amount, PaidAmount: in.PaidAmount,
		Status: in.Status, Currency: in.Currency,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := i.Validate(); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, i); err != nil {
		return nil, err
	}
	return i, nil
}

func (s *InvoiceService) Get(ctx context.Context, tenantID, id uuid.UUID) (*domain.Invoice, error) {
	return s.repo.GetByID(ctx, tenantID, id)
}

func (s *InvoiceService) List(ctx context.Context, f domain.Filter) ([]*domain.Invoice, int, error) {
	if f.Limit <= 0 || f.Limit > 200 {
		f.Limit = 50
	}
	return s.repo.List(ctx, f)
}

func (s *InvoiceService) Update(ctx context.Context, id uuid.UUID, in WriteInput) (*domain.Invoice, error) {
	existing, err := s.repo.GetByID(ctx, in.TenantID, id)
	if err != nil {
		return nil, err
	}
	existing.Number = strings.TrimSpace(in.Number)
	existing.ClientID = in.ClientID
	existing.ProjectID = in.ProjectID
	if !in.IssueDate.IsZero() {
		existing.IssueDate = in.IssueDate
	}
	if !in.DueDate.IsZero() {
		existing.DueDate = in.DueDate
	}
	existing.Amount = in.Amount
	existing.PaidAmount = in.PaidAmount
	if in.Status != "" {
		existing.Status = in.Status
	}
	if in.Currency != "" {
		existing.Currency = in.Currency
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

func (s *InvoiceService) Delete(ctx context.Context, tenantID, id uuid.UUID) error {
	return s.repo.Delete(ctx, tenantID, id)
}
