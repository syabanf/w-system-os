// Package http is the HTTP adapter for the workspace usecase: GET/PUT the
// per-tenant shell setup (enabled modules + first-run flag).
package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
	"github.com/wit/erp-os/internal/workspace/domain"
	"github.com/wit/erp-os/internal/workspace/usecase"
)

type Handler struct{ svc *usecase.Service }

func NewHandler(svc *usecase.Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Routes(r chi.Router) {
	r.Get("/setup", h.get)
	r.Put("/setup", h.put)
}

type setupDTO struct {
	EnabledModules []string  `json:"enabledModules"`
	IsComplete     bool      `json:"isComplete"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func toDTO(s *domain.Setup) setupDTO {
	mods := s.EnabledModules
	if mods == nil {
		mods = []string{}
	}
	return setupDTO{EnabledModules: mods, IsComplete: s.IsComplete, UpdatedAt: s.UpdatedAt}
}

func tenantOrErr(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	tid, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return uuid.Nil, false
	}
	return tid, true
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	s, err := h.svc.Get(r.Context(), tid)
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "get_failed", err)
		return
	}
	httpx.OK(w, toDTO(s))
}

type writeReq struct {
	EnabledModules []string `json:"enabledModules"`
	IsComplete     bool     `json:"isComplete"`
}

func (h *Handler) put(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	var req writeReq
	if err := httpx.Decode(r, &req); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_body", err)
		return
	}
	s, err := h.svc.Save(r.Context(), usecase.SaveInput{
		TenantID:       tid,
		EnabledModules: req.EnabledModules,
		IsComplete:     req.IsComplete,
	})
	if err != nil {
		httpx.Error(w, r, http.StatusInternalServerError, "save_failed", err)
		return
	}
	httpx.OK(w, toDTO(s))
}
