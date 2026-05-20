package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/portal/domain"
	"github.com/wit/erp-os/internal/portal/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct {
	svc *usecase.ThreadService
}

func NewHandler(svc *usecase.ThreadService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Routes(r chi.Router) {
	r.Get("/threads", h.list)
	r.Post("/threads", h.create)
	r.Get("/threads/{id}", h.get)
	r.Put("/threads/{id}", h.update)
	r.Delete("/threads/{id}", h.delete)
}

type threadDTO struct {
	ID            uuid.UUID  `json:"id"`
	Kind          string     `json:"kind"`
	Topic         *string    `json:"topic,omitempty"`
	LastMessageAt *time.Time `json:"lastMessageAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
}

type writeReq struct {
	Kind          string     `json:"kind"`
	Topic         *string    `json:"topic"`
	LastMessageAt *time.Time `json:"lastMessageAt"`
}

func toDTO(t *domain.Thread) threadDTO {
	return threadDTO{
		ID: t.ID, Kind: string(t.Kind), Topic: t.Topic,
		LastMessageAt: t.LastMessageAt, CreatedAt: t.CreatedAt,
	}
}

func tenantOrErr(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	tenantID, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return uuid.Nil, false
	}
	return tenantID, true
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	filter := domain.Filter{TenantID: tenantID, Limit: limit, Offset: offset}
	if v := q.Get("kind"); v != "" {
		k := domain.Kind(v)
		filter.Kind = &k
	}
	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]threadDTO, 0, len(rows))
	for _, t := range rows {
		out = append(out, toDTO(t))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out, "total": total, "limit": filter.Limit, "offset": filter.Offset})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	t, err := h.svc.Get(r.Context(), tenantID, id)
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
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	var req writeReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	t, err := h.svc.Create(r.Context(), buildInput(tenantID, req))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(t))
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
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
	t, err := h.svc.Update(r.Context(), id, buildInput(tenantID, req))
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
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	if err := h.svc.Delete(r.Context(), tenantID, id); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "delete_failed", err)
		return
	}
	httpx.NoContent(w)
}

func buildInput(tenantID uuid.UUID, req writeReq) usecase.WriteInput {
	return usecase.WriteInput{
		TenantID:      tenantID,
		Kind:          domain.Kind(req.Kind),
		Topic:         req.Topic,
		LastMessageAt: req.LastMessageAt,
	}
}
