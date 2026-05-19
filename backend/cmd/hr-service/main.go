// hr-service is the HR microservice binary. Wires shared infrastructure
// (config, logger, database) to the HR domain and exposes its HTTP routes.
//
// Run standalone:  ./hr-service
// Or compose with other services via the api-gateway when deploying as a
// modular monolith. The handler/usecase/repo split means moving HR to its
// own deployment is a no-code change — same package, different cmd entry.
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

	"github.com/wit/erp-os/internal/hr/repository/postgres"
	hrhttp "github.com/wit/erp-os/internal/hr/transport/http"
	"github.com/wit/erp-os/internal/hr/usecase"
	"github.com/wit/erp-os/internal/shared/config"
	"github.com/wit/erp-os/internal/shared/database"
	"github.com/wit/erp-os/internal/shared/logger"
	mw "github.com/wit/erp-os/internal/shared/middleware"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "fatal: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load("HR")
	if err != nil {
		return fmt.Errorf("config: %w", err)
	}
	log := logger.New("hr-service", cfg.Log.Level, cfg.Log.Pretty)
	log.Info().Int("port", cfg.HTTPPort).Str("env", cfg.Env).Msg("starting")

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
		return fmt.Errorf("db: %w", err)
	}
	defer pool.Close()

	empRepo := postgres.NewEmployeeRepo(pool)
	empSvc := usecase.NewEmployeeService(empRepo)
	empHandler := hrhttp.NewEmployeeHandler(empSvc)

	r := chi.NewRouter()
	for _, m := range mw.Stack(log, cfg.TenantID) {
		r.Use(m)
	}
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok","service":"hr"}`))
	})
	r.Route("/api/v1/hr", empHandler.Routes)

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.HTTPPort),
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info().Str("addr", srv.Addr).Msg("http listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	select {
	case <-ctx.Done():
		log.Info().Msg("shutdown requested")
	case err := <-errCh:
		return err
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}
	log.Info().Msg("stopped")
	return nil
}
