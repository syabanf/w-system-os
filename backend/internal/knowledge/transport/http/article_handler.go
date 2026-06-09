package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/knowledge/domain"
	"github.com/wit/erp-os/internal/knowledge/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct {
	svc *usecase.ArticleService
}

func NewHandler(svc *usecase.ArticleService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Routes(r chi.Router) {
	r.Get("/articles", h.list)
	r.Post("/articles", h.create)
	r.Get("/articles/{id}", h.get)
	r.Put("/articles/{id}", h.update)
	r.Delete("/articles/{id}", h.delete)
}

type articleDTO struct {
	ID           uuid.UUID  `json:"id"`
	CategoryID   *uuid.UUID `json:"categoryId,omitempty"`
	Title        string     `json:"title"`
	Slug         string     `json:"slug"`
	Excerpt      string     `json:"excerpt"`
	BodyMarkdown string     `json:"bodyMarkdown"`
	AuthorID     *uuid.UUID `json:"authorId,omitempty"`
	Status       string     `json:"status"`
	Pinned       bool       `json:"pinned"`
	ViewCount    int        `json:"viewCount"`
	PublishedAt  *time.Time `json:"publishedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type writeReq struct {
	CategoryID   *uuid.UUID `json:"categoryId"`
	Title        string     `json:"title"`
	Slug         string     `json:"slug"`
	Excerpt      string     `json:"excerpt"`
	BodyMarkdown string     `json:"bodyMarkdown"`
	AuthorID     *uuid.UUID `json:"authorId"`
	Status       string     `json:"status"`
	Pinned       bool       `json:"pinned"`
}

func toDTO(a *domain.Article) articleDTO {
	return articleDTO{
		ID: a.ID, CategoryID: a.CategoryID, Title: a.Title, Slug: a.Slug,
		Excerpt: a.Excerpt, BodyMarkdown: a.BodyMarkdown, AuthorID: a.AuthorID,
		Status: string(a.Status), Pinned: a.Pinned, ViewCount: a.ViewCount,
		PublishedAt: a.PublishedAt, CreatedAt: a.CreatedAt, UpdatedAt: a.UpdatedAt,
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
	filter := domain.Filter{TenantID: tenantID, Search: q.Get("search"), Limit: limit, Offset: offset}
	if v := q.Get("status"); v != "" {
		s := domain.Status(v)
		if !s.Valid() {
			httpx.Error(w, r, http.StatusBadRequest, "invalid_status", errors.New("invalid status: "+v))
			return
		}
		filter.Status = &s
	}
	if v := q.Get("categoryId"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.CategoryID = &id
		}
	}
	if v := q.Get("pinned"); v != "" {
		b := v == "true" || v == "1"
		filter.Pinned = &b
	}
	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]articleDTO, 0, len(rows))
	for _, a := range rows {
		out = append(out, toDTO(a))
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
	a, err := h.svc.Get(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(a))
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
	a, err := h.svc.Create(r.Context(), buildInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateSlug) {
			httpx.Error(w, r, http.StatusConflict, "duplicate_slug", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(a))
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
	a, err := h.svc.Update(r.Context(), id, buildInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		if errors.Is(err, domain.ErrDuplicateSlug) {
			httpx.Error(w, r, http.StatusConflict, "duplicate_slug", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(a))
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
		TenantID:     tenantID,
		CategoryID:   req.CategoryID,
		Title:        req.Title,
		Slug:         req.Slug,
		Excerpt:      req.Excerpt,
		BodyMarkdown: req.BodyMarkdown,
		AuthorID:     req.AuthorID,
		Status:       domain.Status(req.Status),
		Pinned:       req.Pinned,
	}
}
