// Package http exposes computed/aggregate endpoints for Dashboard, KPIs, and
// Reports. No domain or repository layer because the data is derived from
// already-persisted facts elsewhere (clients, projects, invoices, tickets).
//
// Each handler runs a SQL aggregation and returns a denormalised shape
// tailored to the frontend view. Add new aggregates by adding handlers — no
// new tables needed.
package http

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wit/erp-os/internal/shared/httpx"
	"github.com/wit/erp-os/internal/shared/middleware"
)

type Handler struct{ pool *pgxpool.Pool }

func NewHandler(pool *pgxpool.Pool) *Handler { return &Handler{pool: pool} }

func (h *Handler) DashboardRoutes(r chi.Router) {
	r.Get("/dashboard/overview", h.dashboardOverview)
}

func (h *Handler) KPIsRoutes(r chi.Router) {
	r.Get("/kpis", h.kpis)
}

func (h *Handler) ReportsRoutes(r chi.Router) {
	r.Get("/reports/templates", h.reportTemplates)
	r.Get("/reports/runs", h.reportRuns)
	r.Get("/reports/scheduled", h.reportScheduled)
}

func tenantOrErr(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	tid, err := uuid.Parse(middleware.TenantFrom(r.Context()))
	if err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_tenant", err)
		return uuid.Nil, false
	}
	return tid, true
}

// ─── Dashboard ───────────────────────────────────────────────────────

type overviewDTO struct {
	MonthlyRevenue  int64   `json:"monthlyRevenue"`
	ActiveProjects  int     `json:"activeProjects"`
	UtilizationPct  float64 `json:"utilizationPct"`
	OutstandingAR   int64   `json:"outstandingAR"`
	SLABreaches     int     `json:"slaBreaches"`
	WinRatePct      float64 `json:"winRatePct"`
}

func (h *Handler) dashboardOverview(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	ctx := r.Context()
	out := overviewDTO{}

	// Outstanding AR
	_ = h.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM((amount - paid_amount) * 100)::bigint, 0)
		FROM invoices WHERE tenant_id=$1 AND status IN ('sent','overdue')`, tid).Scan(&out.OutstandingAR)

	// Monthly revenue (current calendar month)
	_ = h.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount * 100)::bigint, 0)
		FROM invoices
		WHERE tenant_id=$1 AND date_trunc('month', issue_date) = date_trunc('month', now())`, tid).Scan(&out.MonthlyRevenue)

	// Active projects
	_ = h.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM projects
		WHERE tenant_id=$1 AND status NOT IN ('Delivered','Maintenance')`, tid).Scan(&out.ActiveProjects)

	// SLA breaches (open tickets past deadline)
	_ = h.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM support_tickets
		WHERE tenant_id=$1 AND status NOT IN ('Resolved','Closed') AND sla_deadline < now()`, tid).Scan(&out.SLABreaches)

	// Win rate (closed-won / closed-* leads)
	var won, closed int
	_ = h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM leads WHERE tenant_id=$1 AND stage='Won'`, tid).Scan(&won)
	_ = h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM leads WHERE tenant_id=$1 AND stage IN ('Won','Lost')`, tid).Scan(&closed)
	if closed > 0 {
		out.WinRatePct = float64(won) / float64(closed) * 100
	}

	// Utilization — placeholder until a per-employee allocation table exists.
	out.UtilizationPct = 85.0

	httpx.OK(w, out)
}

// ─── KPIs ────────────────────────────────────────────────────────────

type kpiDTO struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Pillar     string  `json:"pillar"`
	Unit       string  `json:"unit"`
	Current    float64 `json:"current"`
	Target     float64 `json:"target"`
	Direction  string  `json:"direction"` // higher | lower
	Status     string  `json:"status"`    // on-track | at-risk | off-track
	Owner      string  `json:"owner"`
	Cadence    string  `json:"cadence"`
}

func (h *Handler) kpis(w http.ResponseWriter, r *http.Request) {
	tid, ok := tenantOrErr(w, r)
	if !ok {
		return
	}
	ctx := r.Context()

	var monthlyRev, outstanding float64
	_ = h.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount),0) FROM invoices WHERE tenant_id=$1 AND date_trunc('month', issue_date) = date_trunc('month', now())`,
		tid).Scan(&monthlyRev)
	_ = h.pool.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount - paid_amount),0) FROM invoices WHERE tenant_id=$1 AND status IN ('sent','overdue')`,
		tid).Scan(&outstanding)

	var won, closed int
	_ = h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM leads WHERE tenant_id=$1 AND stage='Won'`, tid).Scan(&won)
	_ = h.pool.QueryRow(ctx, `SELECT COUNT(*) FROM leads WHERE tenant_id=$1 AND stage IN ('Won','Lost')`, tid).Scan(&closed)
	winRate := 0.0
	if closed > 0 {
		winRate = float64(won) / float64(closed) * 100
	}

	kpis := []kpiDTO{
		{
			ID: "kpi-revenue", Name: "Monthly Revenue", Pillar: "Finance", Unit: "IDR",
			Current: monthlyRev, Target: 2_000_000_000, Direction: "higher",
			Status: statusOf(monthlyRev, 2_000_000_000, true),
			Owner:  "Damar Wicaksono", Cadence: "Monthly",
		},
		{
			ID: "kpi-winrate", Name: "Sales Win Rate", Pillar: "Growth", Unit: "%",
			Current: winRate, Target: 60, Direction: "higher",
			Status: statusOf(winRate, 60, true),
			Owner:  "Citra Anggraini", Cadence: "Monthly",
		},
		{
			ID: "kpi-outstanding", Name: "Outstanding AR", Pillar: "Finance", Unit: "IDR",
			Current: outstanding, Target: 1_000_000_000, Direction: "lower",
			Status: statusOf(outstanding, 1_000_000_000, false),
			Owner:  "Hana Wijaya", Cadence: "Weekly",
		},
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": kpis})
}

func statusOf(current, target float64, higherBetter bool) string {
	if target == 0 {
		return "on-track"
	}
	ratio := current / target
	if higherBetter {
		if ratio >= 1 {
			return "on-track"
		}
		if ratio >= 0.9 {
			return "at-risk"
		}
		return "off-track"
	}
	if ratio <= 1 {
		return "on-track"
	}
	if ratio <= 1.1 {
		return "at-risk"
	}
	return "off-track"
}

// ─── Reports ─────────────────────────────────────────────────────────
// The frontend already owns the report template catalogue (static metadata).
// Backend hands back the same shape so the frontend can swap data source
// without touching the view. Runs and schedules are stubbed for now — wire
// them to a real `report_runs` table when scheduling is built.

type reportTemplateDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Category    string `json:"category"`
	Description string `json:"description"`
	Format      string `json:"format"`
	Cadence     string `json:"cadence"`
	LastRun     string `json:"lastRun,omitempty"`
}

func (h *Handler) reportTemplates(w http.ResponseWriter, r *http.Request) {
	templates := []reportTemplateDTO{
		{ID: "rep-001", Name: "P&L Statement", Category: "Finance", Description: "GL-derived income statement with month-over-month variance.", Format: "PDF", Cadence: "Monthly", LastRun: "2026-05-01"},
		{ID: "rep-002", Name: "Cashflow Forecast", Category: "Finance", Description: "13-week rolling cashflow with AR/AP aging buckets.", Format: "Excel", Cadence: "Weekly", LastRun: "2026-05-13"},
		{ID: "rep-003", Name: "Outstanding Invoices", Category: "Finance", Description: "Aged receivables by client and project.", Format: "Excel", Cadence: "Weekly", LastRun: "2026-05-13"},
		{ID: "rep-004", Name: "Sales Pipeline Forecast", Category: "Sales", Description: "Weighted pipeline by stage and source.", Format: "PDF", Cadence: "Weekly", LastRun: "2026-05-12"},
		{ID: "rep-006", Name: "Project Health Snapshot", Category: "Projects", Description: "Margin, progress, risk and ticket count per project.", Format: "PDF", Cadence: "Weekly", LastRun: "2026-05-13"},
		{ID: "rep-008", Name: "Resource Utilization", Category: "Operations", Description: "Allocation, billable %, and over-allocation per engineer.", Format: "Excel", Cadence: "Weekly", LastRun: "2026-05-13"},
		{ID: "rep-010", Name: "Payroll Register", Category: "People", Description: "Gross-to-net per employee for the current run.", Format: "Excel", Cadence: "Monthly", LastRun: "2026-05-15"},
		{ID: "rep-011", Name: "SLA Compliance", Category: "Operations", Description: "Breach rate by severity and client.", Format: "PDF", Cadence: "Monthly", LastRun: "2026-05-01"},
		{ID: "rep-012", Name: "Board Pack", Category: "Executive", Description: "Quarterly summary across revenue, delivery, pipeline and risk.", Format: "PDF", Cadence: "Quarterly", LastRun: "2026-04-01"},
	}
	// Filter by category if provided.
	if cat := r.URL.Query().Get("category"); cat != "" && cat != "All" {
		filtered := templates[:0]
		for _, t := range templates {
			if t.Category == cat {
				filtered = append(filtered, t)
			}
		}
		templates = filtered
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit > 0 && limit < len(templates) {
		templates = templates[:limit]
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"data": templates, "total": len(templates)})
}

func (h *Handler) reportRuns(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]any{"data": []any{}, "total": 0,
		"note": "report_runs table not yet provisioned; this is a stub.",
	})
}

func (h *Handler) reportScheduled(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]any{"data": []any{}, "total": 0,
		"note": "scheduled_reports table not yet provisioned; this is a stub.",
	})
}
