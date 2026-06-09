package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/performance/domain"
	"github.com/wit/erp-os/internal/performance/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct{ svc *usecase.TemplateService }

func NewHandler(svc *usecase.TemplateService) *Handler { return &Handler{svc: svc} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/templates", h.list)
	r.Post("/templates", h.create)
	r.Get("/templates/{id}", h.get)
	r.Put("/templates/{id}", h.update)
	r.Delete("/templates/{id}", h.delete)
}

type dto struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	PeriodKind        string    `json:"periodKind"`
	PeriodYear        int       `json:"periodYear"`
	PeriodCustomLabel string    `json:"periodCustomLabel"`
	PeriodStart       *string   `json:"periodStart,omitempty"`
	PeriodEnd         *string   `json:"periodEnd,omitempty"`
	RatingScaleMax    int       `json:"ratingScaleMax"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type writeReq struct {
	Name              string `json:"name"`
	Description       string `json:"description"`
	PeriodKind        string `json:"periodKind"`
	PeriodYear        int    `json:"periodYear"`
	PeriodCustomLabel string `json:"periodCustomLabel"`
	PeriodStart       string `json:"periodStart"`
	PeriodEnd         string `json:"periodEnd"`
	RatingScaleMax    int    `json:"ratingScaleMax"`
	Status            string `json:"status"`
}

func toDTO(t *domain.Template) dto {
	d := dto{
		ID: t.ID, Name: t.Name, Description: t.Description,
		PeriodKind: string(t.PeriodKind), PeriodYear: t.PeriodYear,
		PeriodCustomLabel: t.PeriodCustomLabel,
		RatingScaleMax:    t.RatingScaleMax, Status: string(t.Status),
		CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt,
	}
	if t.PeriodStart != nil {
		s := t.PeriodStart.Format("2006-01-02")
		d.PeriodStart = &s
	}
	if t.PeriodEnd != nil {
		s := t.PeriodEnd.Format("2006-01-02")
		d.PeriodEnd = &s
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
	f := domain.Filter{TenantID: tid, Limit: limit, Offset: offset}
	if v := q.Get("status"); v != "" {
		s := domain.Status(v)
		if !s.Valid() {
			httpx.Error(w, r, http.StatusBadRequest, "invalid_status", errors.New("invalid status: "+v))
			return
		}
		f.Status = &s
	}
	if v := q.Get("year"); v != "" {
		y, perr := strconv.Atoi(v)
		if perr == nil {
			f.Year = &y
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
		TenantID: tid, Name: req.Name, Description: req.Description,
		PeriodKind: domain.PeriodKind(req.PeriodKind), PeriodYear: req.PeriodYear,
		PeriodCustomLabel: req.PeriodCustomLabel,
		PeriodStart:       parseDate(req.PeriodStart), PeriodEnd: parseDate(req.PeriodEnd),
		RatingScaleMax: req.RatingScaleMax, Status: domain.Status(req.Status),
	}
}
