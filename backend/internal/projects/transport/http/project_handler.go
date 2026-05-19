package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/projects/domain"
	"github.com/wit/erp-os/internal/projects/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct{ svc *usecase.ProjectService }

func NewHandler(svc *usecase.ProjectService) *Handler { return &Handler{svc: svc} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/projects", h.list)
	r.Post("/projects", h.create)
	r.Get("/projects/{id}", h.get)
	r.Put("/projects/{id}", h.update)
	r.Delete("/projects/{id}", h.delete)
}

type dto struct {
	ID               uuid.UUID  `json:"id"`
	Code             string     `json:"code"`
	Name             string     `json:"name"`
	ClientID         *uuid.UUID `json:"clientId,omitempty"`
	Status           string     `json:"status"`
	Progress         int        `json:"progress"`
	Budget           int64      `json:"budget"`
	ActualCost       int64      `json:"actualCost"`
	RiskLevel        string     `json:"riskLevel"`
	StartDate        *string    `json:"startDate,omitempty"`
	EndDate          *string    `json:"endDate,omitempty"`
	ProjectManagerID *uuid.UUID `json:"projectManagerId,omitempty"`
	Health           string     `json:"health"`
	TechStack        []string   `json:"techStack"`
	OpenTickets      int        `json:"openTickets"`
	ChangeRequests   int        `json:"changeRequests"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type writeReq struct {
	Code             string     `json:"code"`
	Name             string     `json:"name"`
	ClientID         *uuid.UUID `json:"clientId"`
	Status           string     `json:"status"`
	Progress         int        `json:"progress"`
	Budget           int64      `json:"budget"`
	ActualCost       int64      `json:"actualCost"`
	RiskLevel        string     `json:"riskLevel"`
	StartDate        string     `json:"startDate"`
	EndDate          string     `json:"endDate"`
	ProjectManagerID *uuid.UUID `json:"projectManagerId"`
	Health           string     `json:"health"`
	TechStack        []string   `json:"techStack"`
	OpenTickets      int        `json:"openTickets"`
	ChangeRequests   int        `json:"changeRequests"`
}

func toDTO(p *domain.Project) dto {
	d := dto{
		ID: p.ID, Code: p.Code, Name: p.Name, ClientID: p.ClientID,
		Status: string(p.Status), Progress: p.Progress,
		Budget: p.Budget, ActualCost: p.ActualCost, RiskLevel: p.RiskLevel,
		ProjectManagerID: p.ProjectManagerID, Health: p.Health, TechStack: p.TechStack,
		OpenTickets: p.OpenTickets, ChangeRequests: p.ChangeRequests,
		CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt,
	}
	if p.StartDate != nil {
		s := p.StartDate.Format("2006-01-02")
		d.StartDate = &s
	}
	if p.EndDate != nil {
		s := p.EndDate.Format("2006-01-02")
		d.EndDate = &s
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
	f := domain.Filter{TenantID: tid, Search: q.Get("search"), Health: q.Get("health"), Limit: limit, Offset: offset}
	if v := q.Get("status"); v != "" {
		s := domain.Status(v)
		f.Status = &s
	}
	rows, total, err := h.svc.List(r.Context(), f)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]dto, 0, len(rows))
	for _, p := range rows {
		out = append(out, toDTO(p))
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
	p, err := h.svc.Get(r.Context(), tid, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(p))
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
	p, err := h.svc.Create(r.Context(), build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateCode) {
			httpx.Error(w, r, http.StatusConflict, "duplicate", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(p))
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
	p, err := h.svc.Update(r.Context(), id, build(tid, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(p))
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
		TenantID: tid, Code: req.Code, Name: req.Name, ClientID: req.ClientID,
		Status: domain.Status(req.Status), Progress: req.Progress,
		Budget: req.Budget, ActualCost: req.ActualCost, RiskLevel: req.RiskLevel,
		StartDate: parseDate(req.StartDate), EndDate: parseDate(req.EndDate),
		ProjectManagerID: req.ProjectManagerID, Health: req.Health, TechStack: req.TechStack,
		OpenTickets: req.OpenTickets, ChangeRequests: req.ChangeRequests,
	}
}
