// api-gateway is the single-binary entry point that mounts every service's
// HTTP routes. Useful for local dev and modular-monolith deployments.
//
// To split a service onto its own process: copy this file, prune to only the
// routes that service owns, and deploy the new cmd/<service>/main.go binary.
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	adminrepo "github.com/wit/erp-os/internal/admin/repository/postgres"
	adminhttp "github.com/wit/erp-os/internal/admin/transport/http"
	adminuse "github.com/wit/erp-os/internal/admin/usecase"
	analyticshttp "github.com/wit/erp-os/internal/analytics/transport/http"
	clientsrepo "github.com/wit/erp-os/internal/clients/repository/postgres"
	clientshttp "github.com/wit/erp-os/internal/clients/transport/http"
	clientsuse "github.com/wit/erp-os/internal/clients/usecase"
	hrrepo "github.com/wit/erp-os/internal/hr/repository/postgres"
	hrhttp "github.com/wit/erp-os/internal/hr/transport/http"
	hruse "github.com/wit/erp-os/internal/hr/usecase"
	knowledgerepo "github.com/wit/erp-os/internal/knowledge/repository/postgres"
	knowledgehttp "github.com/wit/erp-os/internal/knowledge/transport/http"
	knowledgeuse "github.com/wit/erp-os/internal/knowledge/usecase"
	leadsrepo "github.com/wit/erp-os/internal/leads/repository/postgres"
	leadshttp "github.com/wit/erp-os/internal/leads/transport/http"
	leadsuse "github.com/wit/erp-os/internal/leads/usecase"
	mdrepo "github.com/wit/erp-os/internal/masterdata/repository/postgres"
	mdhttp "github.com/wit/erp-os/internal/masterdata/transport/http"
	mduse "github.com/wit/erp-os/internal/masterdata/usecase"
	perfrepo "github.com/wit/erp-os/internal/performance/repository/postgres"
	perfhttp "github.com/wit/erp-os/internal/performance/transport/http"
	perfuse "github.com/wit/erp-os/internal/performance/usecase"
	portalrepo "github.com/wit/erp-os/internal/portal/repository/postgres"
	portalhttp "github.com/wit/erp-os/internal/portal/transport/http"
	portaluse "github.com/wit/erp-os/internal/portal/usecase"
	projrepo "github.com/wit/erp-os/internal/projects/repository/postgres"
	projhttp "github.com/wit/erp-os/internal/projects/transport/http"
	projuse "github.com/wit/erp-os/internal/projects/usecase"
	"github.com/wit/erp-os/internal/shared/config"
	"github.com/wit/erp-os/internal/shared/database"
	"github.com/wit/erp-os/internal/shared/logger"
	mw "github.com/wit/erp-os/internal/shared/middleware"
	supportrepo "github.com/wit/erp-os/internal/support/repository/postgres"
	supporthttp "github.com/wit/erp-os/internal/support/transport/http"
	supportuse "github.com/wit/erp-os/internal/support/usecase"
	tsrepo "github.com/wit/erp-os/internal/timesheet/repository/postgres"
	tshttp "github.com/wit/erp-os/internal/timesheet/transport/http"
	tsuse "github.com/wit/erp-os/internal/timesheet/usecase"
	txrepo "github.com/wit/erp-os/internal/transactions/repository/postgres"
	txhttp "github.com/wit/erp-os/internal/transactions/transport/http"
	txuse "github.com/wit/erp-os/internal/transactions/usecase"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "fatal: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load("GATEWAY")
	if err != nil {
		return err
	}
	log := logger.New("api-gateway", cfg.Log.Level, cfg.Log.Pretty)
	log.Info().Int("port", cfg.HTTPPort).Msg("starting")

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := database.New(ctx, database.Config{
		URL:           cfg.Database.URL,
		MaxConns:      cfg.Database.MaxConns,
		MinConns:      cfg.Database.MinConns,
		MigrationsDir: cfg.Database.MigrationsDir,
		AutoMigrate:   cfg.Database.AutoMigrate,
	}, log)
	if err != nil {
		return err
	}
	defer pool.Close()

	r := chi.NewRouter()
	for _, m := range mw.Stack(log, cfg.TenantID) {
		r.Use(m)
	}
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok","service":"api-gateway"}`))
	})

	mountRoutes(r, pool)

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}
	go func() {
		log.Info().Str("addr", srv.Addr).Msg("http listening")
		_ = srv.ListenAndServe()
	}()

	<-ctx.Done()
	log.Info().Msg("shutdown requested")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

// mountRoutes wires every microservice handler under its /api/v1/<domain> namespace.
// To add a service: import its usecase + repo + handler, call Routes() inside
// the matching r.Route block.
func mountRoutes(r chi.Router, pool *pgxpool.Pool) {
	// HR
	r.Route("/api/v1/hr", hrhttp.NewEmployeeHandler(hruse.NewEmployeeService(hrrepo.NewEmployeeRepo(pool))).Routes)

	// Clients
	r.Route("/api/v1/clients", clientshttp.NewHandler(clientsuse.NewClientService(clientsrepo.NewClientRepo(pool))).Routes)

	// Sales / Leads
	r.Route("/api/v1/sales", leadshttp.NewHandler(leadsuse.NewLeadService(leadsrepo.NewLeadRepo(pool))).Routes)

	// Projects
	r.Route("/api/v1/projects", projhttp.NewHandler(projuse.NewProjectService(projrepo.NewProjectRepo(pool))).Routes)

	// Support
	r.Route("/api/v1/support", supporthttp.NewHandler(supportuse.NewTicketService(supportrepo.NewTicketRepo(pool))).Routes)

	// Transactions (invoices for now; payments/POs/expenses follow same pattern)
	r.Route("/api/v1/transactions", txhttp.NewHandler(txuse.NewInvoiceService(txrepo.NewInvoiceRepo(pool))).Routes)

	// Performance 360 (templates; questions/submissions/answers/rater_settings follow)
	r.Route("/api/v1/performance", perfhttp.NewHandler(perfuse.NewTemplateService(perfrepo.NewTemplateRepo(pool))).Routes)

	// Knowledge (wiki articles)
	r.Route("/api/v1/knowledge", knowledgehttp.NewHandler(knowledgeuse.NewArticleService(knowledgerepo.NewArticleRepo(pool))).Routes)

	// Timesheet
	r.Route("/api/v1/timesheet", tshttp.NewHandler(tsuse.NewEntryService(tsrepo.NewEntryRepo(pool))).Routes)

	// Admin / IAM users (roles + sessions + audit log follow same pattern)
	r.Route("/api/v1/admin", adminhttp.NewHandler(adminuse.NewUserService(adminrepo.NewUserRepo(pool))).Routes)

	// Master data — categories + items each own their own sub-route group
	r.Route("/api/v1/master-data", func(r chi.Router) {
		mdhttp.NewCategoryHandler(mduse.NewCategoryService(mdrepo.NewCategoryRepo(pool))).Routes(r)
		mdhttp.NewItemHandler(mduse.NewItemService(mdrepo.NewItemRepo(pool))).Routes(r)
	})

	// Portal — employee self-service (chat threads for now)
	r.Route("/api/v1/portal", portalhttp.NewHandler(portaluse.NewThreadService(portalrepo.NewThreadRepo(pool))).Routes)

	// Analytics — Dashboard / KPIs / Reports (computed, no domain layer)
	ah := analyticshttp.NewHandler(pool)
	r.Route("/api/v1/dashboard", ah.DashboardRoutes)
	r.Route("/api/v1/kpis", ah.KPIsRoutes)
	r.Route("/api/v1/reports", ah.ReportsRoutes)
}
