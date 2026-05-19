// Package http is the HTTP-facing adapter for the HR usecase. Translates
// JSON ↔ domain types and binds routes to the underlying EmployeeService.
package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/hr/domain"
	"github.com/wit/erp-os/internal/hr/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type EmployeeHandler struct {
	svc *usecase.EmployeeService
}

func NewEmployeeHandler(svc *usecase.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{svc: svc}
}

func (h *EmployeeHandler) Routes(r chi.Router) {
	r.Get("/employees", h.list)
	r.Post("/employees", h.create)
	r.Get("/employees/{id}", h.get)
	r.Put("/employees/{id}", h.update)
	r.Delete("/employees/{id}", h.delete)
}

// ─── DTOs ────────────────────────────────────────────────────────────

type employeeDTO struct {
	ID             uuid.UUID  `json:"id"`
	TenantID       uuid.UUID  `json:"tenantId"`
	UserProfileID  uuid.UUID  `json:"userProfileId"`
	EmployeeNumber string     `json:"employeeNumber"`
	FirstName      string     `json:"firstName"`
	LastName       string     `json:"lastName"`
	Email          string     `json:"email"`
	Phone          string     `json:"phone"`
	EntityID       *uuid.UUID `json:"entityId,omitempty"`
	DepartmentID   *uuid.UUID `json:"departmentId,omitempty"`
	PositionID     *uuid.UUID `json:"positionId,omitempty"`
	ManagerID      *uuid.UUID `json:"managerId,omitempty"`
	EmploymentType string     `json:"employmentType"`
	Status         string     `json:"status"`
	JoinDate       string     `json:"joinDate"`
	EndDate        *string    `json:"endDate,omitempty"`
	BasicSalary    int64      `json:"basicSalary"`
	BpjsKes        bool       `json:"bpjsKes"`
	BpjsTk         bool       `json:"bpjsTk"`
	BankAccount    string     `json:"bankAccount"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

type writeRequest struct {
	FirstName      string     `json:"firstName"`
	LastName       string     `json:"lastName"`
	Email          string     `json:"email"`
	Phone          string     `json:"phone"`
	EmployeeNumber string     `json:"employeeNumber"`
	EntityID       *uuid.UUID `json:"entityId"`
	DepartmentID   *uuid.UUID `json:"departmentId"`
	PositionID     *uuid.UUID `json:"positionId"`
	ManagerID      *uuid.UUID `json:"managerId"`
	EmploymentType string     `json:"employmentType"`
	Status         string     `json:"status"`
	JoinDate       string     `json:"joinDate"` // YYYY-MM-DD
	BasicSalary    int64      `json:"basicSalary"`
	BpjsKes        bool       `json:"bpjsKes"`
	BpjsTk         bool       `json:"bpjsTk"`
	BankAccount    string     `json:"bankAccount"`
}

func toDTO(e *domain.Employee) employeeDTO {
	dto := employeeDTO{
		ID: e.ID, TenantID: e.TenantID, UserProfileID: e.UserProfileID,
		EmployeeNumber: e.EmployeeNumber,
		FirstName:      e.FirstName, LastName: e.LastName,
		Email: e.Email, Phone: e.Phone,
		EntityID: e.EntityID, DepartmentID: e.DepartmentID,
		PositionID: e.PositionID, ManagerID: e.ManagerID,
		EmploymentType: string(e.EmploymentType), Status: string(e.Status),
		JoinDate:    e.JoinDate.Format("2006-01-02"),
		BasicSalary: e.BasicSalary,
		BpjsKes:     e.BpjsKes, BpjsTk: e.BpjsTk,
		BankAccount: e.BankAccount,
		CreatedAt:   e.CreatedAt, UpdatedAt: e.UpdatedAt,
	}
	if e.EndDate != nil {
		s := e.EndDate.Format("2006-01-02")
		dto.EndDate = &s
	}
	return dto
}

// ─── Handlers ────────────────────────────────────────────────────────

func (h *EmployeeHandler) list(w http.ResponseWriter, r *http.Request) {
	tenantID, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	filter := domain.Filter{
		TenantID: tenantID,
		Search:   q.Get("search"),
		Limit:    limit,
		Offset:   offset,
	}
	if v := q.Get("status"); v != "" {
		s := domain.EmployeeStatus(v)
		filter.Status = &s
	}
	if v := q.Get("employmentType"); v != "" {
		t := domain.EmploymentType(v)
		filter.EmploymentType = &t
	}
	if v := q.Get("departmentId"); v != "" {
		id, perr := uuid.Parse(v)
		if perr == nil {
			filter.Department = &id
		}
	}

	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]employeeDTO, 0, len(rows))
	for _, e := range rows {
		out = append(out, toDTO(e))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"data":  out,
		"total": total,
		"limit": filter.Limit,
		"offset": filter.Offset,
	})
}

func (h *EmployeeHandler) get(w http.ResponseWriter, r *http.Request) {
	tenantID, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	emp, err := h.svc.Get(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(emp))
}

func (h *EmployeeHandler) create(w http.ResponseWriter, r *http.Request) {
	tenantID, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return
	}
	var req writeRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	joinDate, _ := time.Parse("2006-01-02", req.JoinDate)
	emp, err := h.svc.Create(r.Context(), usecase.CreateInput{
		TenantID:       tenantID,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Email:          req.Email,
		Phone:          req.Phone,
		EmployeeNumber: req.EmployeeNumber,
		EntityID:       req.EntityID,
		DepartmentID:   req.DepartmentID,
		PositionID:     req.PositionID,
		ManagerID:      req.ManagerID,
		EmploymentType: domain.EmploymentType(req.EmploymentType),
		Status:         domain.EmployeeStatus(req.Status),
		JoinDate:       joinDate,
		BasicSalary:    req.BasicSalary,
		BpjsKes:        req.BpjsKes,
		BpjsTk:         req.BpjsTk,
		BankAccount:    req.BankAccount,
	})
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateNumber) {
			httpx.Error(w, r, http.StatusConflict, "duplicate_employee_number", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(emp))
}

func (h *EmployeeHandler) update(w http.ResponseWriter, r *http.Request) {
	tenantID, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", err)
		return
	}
	var req writeRequest
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	joinDate, _ := time.Parse("2006-01-02", req.JoinDate)
	emp, err := h.svc.Update(r.Context(), usecase.UpdateInput{
		ID: id,
		CreateInput: usecase.CreateInput{
			TenantID:       tenantID,
			FirstName:      req.FirstName,
			LastName:       req.LastName,
			Email:          req.Email,
			Phone:          req.Phone,
			EmployeeNumber: req.EmployeeNumber,
			EntityID:       req.EntityID,
			DepartmentID:   req.DepartmentID,
			PositionID:     req.PositionID,
			ManagerID:      req.ManagerID,
			EmploymentType: domain.EmploymentType(req.EmploymentType),
			Status:         domain.EmployeeStatus(req.Status),
			JoinDate:       joinDate,
			BasicSalary:    req.BasicSalary,
			BpjsKes:        req.BpjsKes,
			BpjsTk:         req.BpjsTk,
			BankAccount:    req.BankAccount,
		},
	})
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(emp))
}

func (h *EmployeeHandler) delete(w http.ResponseWriter, r *http.Request) {
	tenantID, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
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
