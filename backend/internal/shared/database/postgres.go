// Package database wires pgx connection pools + golang-migrate so every service
// boots the same way: open pool → optionally run migrations → return *pgxpool.Pool.
package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

type Config struct {
	URL           string
	MaxConns      int32
	MinConns      int32
	MigrationsDir string
	AutoMigrate   bool
}

// New opens a connection pool, pings it, and (optionally) runs migrations.
func New(ctx context.Context, cfg Config, log zerolog.Logger) (*pgxpool.Pool, error) {
	pcfg, err := pgxpool.ParseConfig(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("parse db url: %w", err)
	}
	pcfg.MaxConns = cfg.MaxConns
	pcfg.MinConns = cfg.MinConns
	pcfg.MaxConnLifetime = 30 * time.Minute
	pcfg.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, pcfg)
	if err != nil {
		return nil, fmt.Errorf("open pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	log.Info().Str("host", pcfg.ConnConfig.Host).Msg("postgres connected")

	if cfg.AutoMigrate {
		if err := runMigrations(cfg.URL, cfg.MigrationsDir, log); err != nil {
			pool.Close()
			return nil, fmt.Errorf("migrate: %w", err)
		}
	}
	return pool, nil
}

func runMigrations(dbURL, dir string, log zerolog.Logger) error {
	src := "file://" + dir
	m, err := migrate.New(src, dbURL)
	if err != nil {
		return err
	}
	defer m.Close()

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Info().Msg("migrations: up to date")
			return nil
		}
		return err
	}
	version, dirty, _ := m.Version()
	log.Info().Uint("version", version).Bool("dirty", dirty).Msg("migrations applied")
	return nil
}
