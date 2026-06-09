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
	"github.com/wit/erp-os/internal/timesheet/domain"
	"github.com/wit/erp-os/internal/timesheet/usecase"
)

type Handler struct {
	svc *usecase.EntryService
}

func NewHandler(svc *usecase.EntryService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Routes(r chi.Router) {
	r.Get("/entries", h.list)
	r.Post("/entries", h.create)
	r.Get("/entries/{id}", h.get)
	r.Put("/entries/{id}", h.update)
	r.Delete("/entries/{id}", h.delete)
}

type entryDTO struct {
	ID             uuid.UUID  `json:"id"`
	UserProfileID  uuid.UUID  `json:"userProfileId"`
	ProjectID      *uuid.UUID `json:"projectId,omitempty"`
	TaskID         *uuid.UUID `json:"taskId,omitempty"`
	Date           time.Time  `json:"date"`
	StartTime      *string    `json:"startTime,omitempty"`
	EndTime        *string    `json:"endTime,omitempty"`
	Hours          float64    `json:"hours"`
	ActivityType   string     `json:"activityType"`
	Billable       bool       `json:"billable"`
	Description    string     `json:"description"`
	Status         string     `json:"status"`
	ApprovedBy     *uuid.UUID `json:"approvedBy,omitempty"`
	ApprovedAt     *time.Time `json:"approvedAt,omitempty"`
	RejectedReason string     `json:"rejectedReason,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type writeReq struct {
	UserProfileID  uuid.UUID  `json:"userProfileId"`
	ProjectID      *uuid.UUID `json:"projectId"`
	TaskID         *uuid.UUID `json:"taskId"`
	Date           time.Time  `json:"date"`
	StartTime      *string    `json:"startTime"`
	EndTime        *string    `json:"endTime"`
	Hours          float64    `json:"hours"`
	ActivityType   string     `json:"activityType"`
	Billable       bool       `json:"billable"`
	Description    string     `json:"description"`
	Status         string     `json:"status"`
	ApprovedBy     *uuid.UUID `json:"approvedBy"`
	ApprovedAt     *time.Time `json:"approvedAt"`
	RejectedReason string     `json:"rejectedReason"`
}

func toDTO(e *domain.Entry) entryDTO {
	return entryDTO{
		ID: e.ID, UserProfileID: e.UserProfileID, ProjectID: e.ProjectID, TaskID: e.TaskID,
		Date: e.Date, StartTime: e.StartTime, EndTime: e.EndTime, Hours: e.Hours,
		ActivityType: e.ActivityType, Billable: e.Billable, Description: e.Description,
		Status: string(e.Status), ApprovedBy: e.ApprovedBy, ApprovedAt: e.ApprovedAt,
		RejectedReason: e.RejectedReason, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
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
	if v := q.Get("userProfileId"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.UserProfileID = &id
		}
	}
	if v := q.Get("projectId"); v != "" {
		if id, err := uuid.Parse(v); err == nil {
			filter.ProjectID = &id
		}
	}
	if v := q.Get("status"); v != "" {
		s := domain.Status(v)
		if !s.Valid() {
			httpx.Error(w, r, http.StatusBadRequest, "invalid_status", errors.New("invalid status: "+v))
			return
		}
		filter.Status = &s
	}
	if v := q.Get("dateFrom"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			filter.DateFrom = &t
		}
	}
	if v := q.Get("dateTo"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			filter.DateTo = &t
		}
	}
	if v := q.Get("billable"); v != "" {
		b := v == "true" || v == "1"
		filter.Billable = &b
	}
	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]entryDTO, 0, len(rows))
	for _, e := range rows {
		out = append(out, toDTO(e))
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
	e, err := h.svc.Get(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(e))
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
	e, err := h.svc.Create(r.Context(), buildInput(tenantID, req))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(e))
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
	e, err := h.svc.Update(r.Context(), id, buildInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(e))
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
		TenantID:       tenantID,
		UserProfileID:  req.UserProfileID,
		ProjectID:      req.ProjectID,
		TaskID:         req.TaskID,
		Date:           req.Date,
		StartTime:      req.StartTime,
		EndTime:        req.EndTime,
		Hours:          req.Hours,
		ActivityType:   req.ActivityType,
		Billable:       req.Billable,
		Description:    req.Description,
		Status:         domain.Status(req.Status),
		ApprovedBy:     req.ApprovedBy,
		ApprovedAt:     req.ApprovedAt,
		RejectedReason: req.RejectedReason,
	}
}
