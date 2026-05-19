// Package domain — Transactions / AR. Invoices first; payments/POs/expenses
// follow the same pattern when wired up (migration 017 already provisions
// their tables).
package domain

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type InvoiceStatus string

const (
	InvoiceDraft   InvoiceStatus = "draft"
	InvoiceSent    InvoiceStatus = "sent"
	InvoicePaid    InvoiceStatus = "paid"
	InvoiceOverdue InvoiceStatus = "overdue"
	InvoiceVoid    InvoiceStatus = "void"
)

type Invoice struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	Number     string
	ClientID   uuid.UUID
	ProjectID  *uuid.UUID
	IssueDate  time.Time
	DueDate    time.Time
	Amount     int64 // IDR cents
	PaidAmount int64
	Status     InvoiceStatus
	Currency   string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (i *Invoice) Validate() error {
	if strings.TrimSpace(i.Number) == "" {
		return errors.New("number is required")
	}
	if i.Amount < 0 {
		return errors.New("amount cannot be negative")
	}
	if i.PaidAmount < 0 || i.PaidAmount > i.Amount {
		return errors.New("paid amount out of range")
	}
	return nil
}

type Filter struct {
	TenantID uuid.UUID
	Search   string
	Status   *InvoiceStatus
	ClientID *uuid.UUID
	Limit    int
	Offset   int
}

type Repository interface {
	Create(ctx context.Context, i *Invoice) error
	GetByID(ctx context.Context, tenantID, id uuid.UUID) (*Invoice, error)
	List(ctx context.Context, f Filter) ([]*Invoice, int, error)
	Update(ctx context.Context, i *Invoice) error
	Delete(ctx context.Context, tenantID, id uuid.UUID) error
}

var (
	ErrNotFound        = errors.New("invoice not found")
	ErrDuplicateNumber = errors.New("invoice number already exists for this tenant")
)
