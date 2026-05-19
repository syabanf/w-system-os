package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/clients/domain"
	"github.com/wit/erp-os/internal/clients/usecase"
	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct {
	svc *usecase.ClientService
}

func NewHandler(svc *usecase.ClientService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Routes(r chi.Router) {
	r.Get("/clients", h.list)
	r.Post("/clients", h.create)
	r.Get("/clients/{id}", h.get)
	r.Put("/clients/{id}", h.update)
	r.Delete("/clients/{id}", h.delete)
}

type clientDTO struct {
	ID                uuid.UUID  `json:"id"`
	Name              string     `json:"name"`
	Industry          string     `json:"industry"`
	Region            string     `json:"region"`
	PrimaryContact    string     `json:"primaryContact"`
	ContactEmail      string     `json:"contactEmail"`
	AccountOwnerID    *uuid.UUID `json:"accountOwnerId,omitempty"`
	ContractValue     int64      `json:"contractValue"`
	RetainerActive    bool       `json:"retainerActive"`
	ActiveProjects    int        `json:"activeProjects"`
	SatisfactionScore int        `json:"satisfactionScore"`
	Health            string     `json:"health"`
	RenewalDate       *string    `json:"renewalDate,omitempty"`
	JoinedAt          *string    `json:"joinedAt,omitempty"`
	LogoColor         string     `json:"logoColor"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

type writeReq struct {
	Name              string     `json:"name"`
	Industry          string     `json:"industry"`
	Region            string     `json:"region"`
	PrimaryContact    string     `json:"primaryContact"`
	ContactEmail      string     `json:"contactEmail"`
	AccountOwnerID    *uuid.UUID `json:"accountOwnerId"`
	ContractValue     int64      `json:"contractValue"`
	RetainerActive    bool       `json:"retainerActive"`
	ActiveProjects    int        `json:"activeProjects"`
	SatisfactionScore int        `json:"satisfactionScore"`
	Health            string     `json:"health"`
	RenewalDate       string     `json:"renewalDate"`
	JoinedAt          string     `json:"joinedAt"`
	LogoColor         string     `json:"logoColor"`
}

func toDTO(c *domain.Client) clientDTO {
	out := clientDTO{
		ID: c.ID, Name: c.Name, Industry: c.Industry, Region: c.Region,
		PrimaryContact: c.PrimaryContact, ContactEmail: c.ContactEmail,
		AccountOwnerID: c.AccountOwnerID, ContractValue: c.ContractValue,
		RetainerActive: c.RetainerActive, ActiveProjects: c.ActiveProjects,
		SatisfactionScore: c.SatisfactionScore, Health: string(c.Health),
		LogoColor: c.LogoColor, CreatedAt: c.CreatedAt, UpdatedAt: c.UpdatedAt,
	}
	if c.RenewalDate != nil {
		s := c.RenewalDate.Format("2006-01-02")
		out.RenewalDate = &s
	}
	if c.JoinedAt != nil {
		s := c.JoinedAt.Format("2006-01-02")
		out.JoinedAt = &s
	}
	return out
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
	if v := q.Get("health"); v != "" {
		h := domain.Health(v)
		filter.Health = &h
	}
	rows, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "list_failed", err)
		return
	}
	out := make([]clientDTO, 0, len(rows))
	for _, c := range rows {
		out = append(out, toDTO(c))
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
	c, err := h.svc.Get(r.Context(), tenantID, id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(c))
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
	c, err := h.svc.Create(r.Context(), buildInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrDuplicateName) {
			httpx.Error(w, r, http.StatusConflict, "duplicate", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "create_failed", err)
		return
	}
	httpx.Created(w, toDTO(c))
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
	c, err := h.svc.Update(r.Context(), id, buildInput(tenantID, req))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			httpx.Error(w, r, http.StatusNotFound, "not_found", err)
			return
		}
		httpx.Error(w, r, http.StatusBadRequest, "update_failed", err)
		return
	}
	httpx.OK(w, toDTO(c))
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
		TenantID:          tenantID,
		Name:              req.Name,
		Industry:          req.Industry,
		Region:            req.Region,
		PrimaryContact:    req.PrimaryContact,
		ContactEmail:      req.ContactEmail,
		AccountOwnerID:    req.AccountOwnerID,
		ContractValue:     req.ContractValue,
		RetainerActive:    req.RetainerActive,
		ActiveProjects:    req.ActiveProjects,
		SatisfactionScore: req.SatisfactionScore,
		Health:            domain.Health(req.Health),
		RenewalDate:       parseDate(req.RenewalDate),
		JoinedAt:          parseDate(req.JoinedAt),
		LogoColor:         req.LogoColor,
	}
}
