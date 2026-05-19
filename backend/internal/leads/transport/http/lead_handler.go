package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/leads/domain"
	"github.com/wit/erp-os/internal/leads/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct{ svc *usecase.LeadService }

func NewHandler(svc *usecase.LeadService) *Handler { return &Handler{svc: svc} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/leads", h.list)
	r.Post("/leads", h.create)
	r.Get("/leads/{id}", h.get)
	r.Put("/leads/{id}", h.update)
	r.Delete("/leads/{id}", h.delete)
}

type dto struct {
	ID            uuid.UUID  `json:"id"`
	CompanyName   string     `json:"companyName"`
	ContactPerson string     `json:"contactPerson"`
	ContactEmail  string     `json:"contactEmail"`
	DealValue     int64      `json:"dealValue"`
	Stage         string     `json:"stage"`
	Source        string     `json:"source"`
	Probability   int        `json:"probability"`
	FollowUpDate  *string    `json:"followUpDate,omitempty"`
	OwnerID       *uuid.UUID `json:"ownerId,omitempty"`
	Notes         string     `json:"notes"`
	WonClientID   *uuid.UUID `json:"wonClientId,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

type writeReq struct {
	CompanyName   string     `json:"companyName"`
	ContactPerson string     `json:"contactPerson"`
	ContactEmail  string     `json:"contactEmail"`
	DealValue     int64      `json:"dealValue"`
	Stage         string     `json:"stage"`
	Source        string     `json:"source"`
	Probability   int        `json:"probability"`
	FollowUpDate  string     `json:"followUpDate"`
	OwnerID       *uuid.UUID `json:"ownerId"`
	Notes         string     `json:"notes"`
}

func toDTO(l *domain.Lead) dto {
	d := dto{
		ID: l.ID, CompanyName: l.CompanyName, ContactPerson: l.ContactPerson,
		ContactEmail: l.ContactEmail, DealValue: l.DealValue, Stage: string(l.Stage),
		Source: l.Source, Probability: l.Probability, OwnerID: l.OwnerID,
		Notes: l.Notes, WonClientID: l.WonClientID, CreatedAt: l.CreatedAt, UpdatedAt: l.UpdatedAt,
	}
	if l.FollowUpDate != nil {
		s := l.FollowUpDate.Format("2006-01-02")
		d.FollowUpDate = &s
	}
	return d
}

func tenantOrErr(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	tid, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return uuid.Nil, false
	}
	return tid, true
}

func parseDate(s string) *time.Time {
	if s == "" {
		return nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil
	}
	return &t
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	f := domain.Filter{TenantID: tid, Search: q.Get("search"), Source: q.Get("source"), Limit: limit, Offset: offset}
	if v := q.Get("stage"); v != "" {
		s := domain.Stage(v)
		f.Stage = &s
	}
	rows, total, err := h.svc.List(r.Context(), f)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]dto, 0, len(rows))
	for _, l := range rows {
		out = append(out, toDTO(l))
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
	l, err := h.svc.Get(r.Context(), tid, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(l))
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
	l, err := h.svc.Create(r.Context(), build(tid, req))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(l))
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
	l, err := h.svc.Update(r.Context(), id, build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(l))
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
		TenantID: tid, CompanyName: req.CompanyName, ContactPerson: req.ContactPerson,
		ContactEmail: req.ContactEmail, DealValue: req.DealValue, Stage: domain.Stage(req.Stage),
		Source: req.Source, Probability: req.Probability, FollowUpDate: parseDate(req.FollowUpDate),
		OwnerID: req.OwnerID, Notes: req.Notes,
	}
}
