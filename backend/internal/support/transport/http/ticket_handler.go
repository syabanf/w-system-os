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
	"github.com/wit/erp-os/internal/support/domain"
	"github.com/wit/erp-os/internal/support/usecase"
)

type Handler struct{ svc *usecase.TicketService }

func NewHandler(svc *usecase.TicketService) *Handler { return &Handler{svc: svc} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/tickets", h.list)
	r.Post("/tickets", h.create)
	r.Get("/tickets/{id}", h.get)
	r.Put("/tickets/{id}", h.update)
	r.Delete("/tickets/{id}", h.delete)
}

type dto struct {
	ID                   uuid.UUID  `json:"id"`
	Code                 string     `json:"code"`
	Title                string     `json:"title"`
	Description          string     `json:"description"`
	ClientID             *uuid.UUID `json:"clientId,omitempty"`
	ProjectID            *uuid.UUID `json:"projectId,omitempty"`
	Severity             string     `json:"severity"`
	Status               string     `json:"status"`
	AssignedToID         *uuid.UUID `json:"assignedToId,omitempty"`
	IsChangeRequest      bool       `json:"isChangeRequest"`
	EstimatedEffortHours float64    `json:"estimatedEffortHours"`
	SLADeadline          *time.Time `json:"slaDeadline,omitempty"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}

type writeReq struct {
	Code                 string     `json:"code"`
	Title                string     `json:"title"`
	Description          string     `json:"description"`
	ClientID             *uuid.UUID `json:"clientId"`
	ProjectID            *uuid.UUID `json:"projectId"`
	Severity             string     `json:"severity"`
	Status               string     `json:"status"`
	AssignedToID         *uuid.UUID `json:"assignedToId"`
	IsChangeRequest      bool       `json:"isChangeRequest"`
	EstimatedEffortHours float64    `json:"estimatedEffortHours"`
	SLADeadline          *time.Time `json:"slaDeadline"`
}

func toDTO(t *domain.Ticket) dto {
	return dto{
		ID: t.ID, Code: t.Code, Title: t.Title, Description: t.Description,
		ClientID: t.ClientID, ProjectID: t.ProjectID,
		Severity: string(t.Severity), Status: string(t.Status),
		AssignedToID: t.AssignedToID, IsChangeRequest: t.IsChangeRequest,
		EstimatedEffortHours: t.EstimatedEffortHours, SLADeadline: t.SLADeadline,
		CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt,
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
		s := domain.Status(v)
		f.Status = &s
	}
	if v := q.Get("severity"); v != "" {
		s := domain.Severity(v)
		f.Severity = &s
	}
	if v := q.Get("isChangeRequest"); v != "" {
		b := v == "true"
		f.IsChangeRequest = &b
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
	for _, t := range rows {
		out = append(out, toDTO(t))
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
	t, err := h.svc.Get(r.Context(), tid, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(t))
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
	t, err := h.svc.Create(r.Context(), build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateCode) {
			httpx.Error(w, r, http.StatusConflict, "duplicate", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(t))
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
	t, err := h.svc.Update(r.Context(), id, build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(t))
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
		TenantID: tid, Code: req.Code, Title: req.Title, Description: req.Description,
		ClientID: req.ClientID, ProjectID: req.ProjectID,
		Severity: domain.Severity(req.Severity), Status: domain.Status(req.Status),
		AssignedToID: req.AssignedToID, IsChangeRequest: req.IsChangeRequest,
		EstimatedEffortHours: req.EstimatedEffortHours, SLADeadline: req.SLADeadline,
	}
}
