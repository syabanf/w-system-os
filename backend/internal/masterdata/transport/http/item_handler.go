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

type ItemHandler struct {
	svc *usecase.ItemService
}

func NewItemHandler(svc *usecase.ItemService) *ItemHandler {
	return &ItemHandler{svc: svc}
}

func (h *ItemHandler) Routes(r chi.Router) {
	r.Get("/items", h.list)
	r.Post("/items", h.create)
	r.Get("/items/{id}", h.get)
	r.Put("/items/{id}", h.update)
	r.Delete("/items/{id}", h.delete)
}

type itemDTO struct {
	ID         uuid.UUID       `json:"id"`
	CategoryID uuid.UUID       `json:"categoryId"`
	Payload    json.RawMessage `json:"payload"`
	SortOrder  int             `json:"sortOrder"`
	IsActive   bool            `json:"isActive"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
}

type itemWriteReq struct {
	CategoryID uuid.UUID       `json:"categoryId"`
	Payload    json.RawMessage `json:"payload"`
	SortOrder  int             `json:"sortOrder"`
	IsActive   *bool           `json:"isActive"`
}

func toItemDTO(i *domain.Item) itemDTO {
	payload := i.Payload
	if len(payload) == 0 {
		payload = json.RawMessage(`{}`)
	}
	return itemDTO{
		ID: i.ID, CategoryID: i.CategoryID, Payload: payload,
		SortOrder: i.SortOrder, IsActive: i.IsActive,
		CreatedAt: i.CreatedAt, UpdatedAt: i.UpdatedAt,
	}
}

func (h *ItemHandler) list(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	q := r.URL.Query()
	categoryIDStr := q.Get("categoryId")
	if categoryIDStr == "" {
		httpx.Error(w, r, http.StatusBadRequest, "missing_category_id", errors.New("categoryId query param is required"))
		return
	}
	categoryID, err := uuid.Parse(categoryIDStr)
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_category_id", err)
		return
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	filter := domain.ItemFilter{TenantID: tenantID, CategoryID: categoryID, Limit: limit, Offset: offset}
	if v := q.Get("isActive"); v != "" {
		b := v == "true" || v == "1"
		filter.IsActive = &b
	}
	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]itemDTO, 0, len(rows))
	for _, i := range rows {
		out = append(out, toItemDTO(i))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": out, "total": total, "limit": filter.Limit, "offset": filter.Offset})
}

func (h *ItemHandler) get(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	i, err := h.svc.Get(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, domain.ErrItemNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toItemDTO(i))
}

func (h *ItemHandler) create(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	var req itemWriteReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	i, err := h.svc.Create(r.Context(), buildItemInput(tenantID, req))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toItemDTO(i))
}

func (h *ItemHandler) update(w http.ResponseWriter, r *http.Request) {
	tenantID, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	var req itemWriteReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	i, err := h.svc.Update(r.Context(), id, buildItemInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrItemNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toItemDTO(i))
}

func (h *ItemHandler) delete(w http.ResponseWriter, r *http.Request) {
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
		if errors.Is(err, domain.ErrItemNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "delete_failed", err)
		return
	}
	httpx.NoContent(w)
}

func buildItemInput(tenantID uuid.UUID, req itemWriteReq) usecase.ItemWriteInput {
	return usecase.ItemWriteInput{
		TenantID:   tenantID,
		CategoryID: req.CategoryID,
		Payload:    req.Payload,
		SortOrder:  req.SortOrder,
		IsActive:   req.IsActive,
	}
}
