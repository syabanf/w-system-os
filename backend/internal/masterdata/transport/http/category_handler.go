package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/masterdata/domain"
	"github.com/wit/erp-os/internal/masterdata/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
)

type CategoryHandler struct {
	svc *usecase.CategoryService
}

func NewCategoryHandler(svc *usecase.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

func (h *CategoryHandler) Routes(r chi.Router) {
	r.Get("/categories", h.list)
	r.Post("/categories", h.create)
	r.Get("/categories/{id}", h.get)
	r.Put("/categories/{id}", h.update)
	r.Delete("/categories/{id}", h.delete)
}

type categoryDTO struct {
	ID          uuid.UUID       `json:"id"`
	Code        string          `json:"code"`
	ModuleID    *uuid.UUID      `json:"moduleId,omitempty"`
	Label       string          `json:"label"`
	Description string          `json:"description"`
	Fields      json.RawMessage `json:"fields"`
	DisplayKeys []string        `json:"displayKeys"`
	IsSystem    bool            `json:"isSystem"`
	IsActive    bool            `json:"isActive"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

type categoryWriteReq struct {
	Code        string          `json:"code"`
	ModuleID    *uuid.UUID      `json:"moduleId"`
	Label       string          `json:"label"`
	Description string          `json:"description"`
	Fields      json.RawMessage `json:"fields"`
	DisplayKeys []string        `json:"displayKeys"`
	IsSystem    bool            `json:"isSystem"`
	IsActive    *bool           `json:"isActive"`
}

func toCategoryDTO(c *domain.Category) categoryDTO {
	fields := c.Fields
	if len(fields) == 0 {
		fields = json.RawMessage(`[]`)
	}
	keys := c.DisplayKeys
	if keys == nil {
		keys = []string{}
	}
	return categoryDTO{
		ID: c.ID, Code: c.Code, ModuleID: c.ModuleID, Label: c.Label,
		Description: c.Description, Fields: fields, DisplayKeys: keys,
		IsSystem: c.IsSystem, IsActive: c.IsActive,
		CreatedAt: c.CreatedAt, UpdatedAt: c.UpdatedAt,
	}
}

func (h *CategoryHandler) list(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	filter := domain.CategoryFilter{TenantID: tenantID, Search: q.Get("search"), Limit: limit, Offset: offset}
	if v := q.Get("moduleId"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.ModuleID = &id
		}
	}
	if v := q.Get("isActive"); v != "" {
		b := v == "true" || v == "1"
		filter.IsActive = &b
	}
	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]categoryDTO, 0, len(rows))
	for _, c := range rows {
		out = append(out, toCategoryDTO(c))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out, "total": total, "limit": filter.Limit, "offset": filter.Offset})
}

func (h *CategoryHandler) get(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	c, err := h.svc.Get(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, domain.ErrCategoryNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toCategoryDTO(c))
}

func (h *CategoryHandler) create(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	var req categoryWriteReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	c, err := h.svc.Create(r.Context(), buildCategoryInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateCategoryCode) {
			httpx.Error(w, r, http.StatusConflict, "duplicate_code", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toCategoryDTO(c))
}

func (h *CategoryHandler) update(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	var req categoryWriteReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	c, err := h.svc.Update(r.Context(), id, buildCategoryInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrCategoryNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		if errors.Is(err, domain.ErrDuplicateCategoryCode) {
			httpx.Error(w, r, http.StatusConflict, "duplicate_code", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toCategoryDTO(c))
}

func (h *CategoryHandler) delete(w http.ResponseWriter, r *http.Request) {
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
		if errors.Is(err, domain.ErrCategoryNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "delete_failed", err)
		return
	}
	httpx.NoContent(w)
}

func buildCategoryInput(tenantID uuid.UUID, req categoryWriteReq) usecase.CategoryWriteInput {
	return usecase.CategoryWriteInput{
		TenantID:    tenantID,
		Code:        req.Code,
		ModuleID:    req.ModuleID,
		Label:       req.Label,
		Description: req.Description,
		Fields:      req.Fields,
		DisplayKeys: req.DisplayKeys,
		IsSystem:    req.IsSystem,
		IsActive:    req.IsActive,
	}
}
