package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
	"github.com/wit/erp-os/internal/transactions/domain"
	"github.com/wit/erp-os/internal/transactions/usecase"
)

type Handler struct{ svc *usecase.InvoiceService }

func NewHandler(svc *usecase.InvoiceService) *Handler { return &Handler{svc: svc} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/invoices", h.list)
	r.Post("/invoices", h.create)
	r.Get("/invoices/{id}", h.get)
	r.Put("/invoices/{id}", h.update)
	r.Delete("/invoices/{id}", h.delete)
}

type dto struct {
	ID         uuid.UUID  `json:"id"`
	Number     string     `json:"number"`
	ClientID   uuid.UUID  `json:"clientId"`
	ProjectID  *uuid.UUID `json:"projectId,omitempty"`
	IssueDate  string     `json:"issueDate"`
	DueDate    string     `json:"dueDate"`
	Amount     int64      `json:"amount"`
	PaidAmount int64      `json:"paidAmount"`
	Status     string     `json:"status"`
	Currency   string     `json:"currency"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

type writeReq struct {
	Number     string     `json:"number"`
	ClientID   uuid.UUID  `json:"clientId"`
	ProjectID  *uuid.UUID `json:"projectId"`
	IssueDate  string     `json:"issueDate"`
	DueDate    string     `json:"dueDate"`
	Amount     int64      `json:"amount"`
	PaidAmount int64      `json:"paidAmount"`
	Status     string     `json:"status"`
	Currency   string     `json:"currency"`
}

func toDTO(i *domain.Invoice) dto {
	return dto{
		ID: i.ID, Number: i.Number, ClientID: i.ClientID, ProjectID: i.ProjectID,
		IssueDate: i.IssueDate.Format("2006-01-02"), DueDate: i.DueDate.Format("2006-01-02"),
		Amount: i.Amount, PaidAmount: i.PaidAmount,
		Status: string(i.Status), Currency: i.Currency,
		CreatedAt: i.CreatedAt, UpdatedAt: i.UpdatedAt,
	}
}

func tenantOrErr(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	tid, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return uuid.Nil, false
	}
	return tid, true
}

func parseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	f := domain.Filter{TenantID: tid, Search: q.Get("search"), Limit: limit, Offset: offset}
	if v := q.Get("status"); v != "" {
		s := domain.InvoiceStatus(v)
		f.Status = &s
	}
	if v := q.Get("clientId"); v != "" {
		id, perr := uuid.Parse(v)
		if perr == nil {
			f.ClientID = &id
		}
	}
	rows, total, err := h.svc.List(r.Context(), f)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]dto, 0, len(rows))
	for _, i := range rows {
		out = append(out, toDTO(i))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out, "total": total, "limit": f.Limit, "offset": f.Offset})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	i, err := h.svc.Get(r.Context(), tid, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(i))
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	var req writeReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	i, err := h.svc.Create(r.Context(), build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateNumber) {
			httpx.Error(w, r, http.StatusConflict, "duplicate", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(i))
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	var req writeReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	i, err := h.svc.Update(r.Context(), id, build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(i))
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	if err := h.svc.Delete(r.Context(), tid, id); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "delete_failed", err)
		return
	}
	httpx.NoContent(w)
}

func build(tid uuid.UUID, req writeReq) usecase.WriteInput {
	return usecase.WriteInput{
		TenantID: tid, Number: req.Number, ClientID: req.ClientID, ProjectID: req.ProjectID,
		IssueDate: parseDate(req.IssueDate), DueDate: parseDate(req.DueDate),
		Amount: req.Amount, PaidAmount: req.PaidAmount,
		Status: domain.InvoiceStatus(req.Status), Currency: req.Currency,
	}
}
