// Package config loads service configuration from env vars and optional .env files.
// Every microservice binary calls Load(serviceName) on startup; the prefix lets
// HR-specific overrides (HR_HTTP_PORT) coexist with shared defaults.
package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Service    string
	HTTPPort   int
	GRPCPort   int
	Database   DatabaseConfig
	Log        LogConfig
	TenantID   string
	Env        string // dev | staging | prod
	APIBaseURL string
}

type DatabaseConfig struct {
	URL             string
	MaxConns        int32
	MinConns        int32
	MigrationsDir   string
	AutoMigrate     bool
}

type LogConfig struct {
	Level  string // debug | info | warn | error
	Pretty bool
}

// Load reads config from env vars. servicePrefix isolates per-service overrides
// (e.g. HR_HTTP_PORT). Shared vars (DATABASE_URL, LOG_LEVEL) apply to every
// service.
func Load(servicePrefix string) (*Config, error) {
	v := viper.New()
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Defaults
	v.SetDefault("HTTP_PORT", 8080)
	v.SetDefault("GRPC_PORT", 0)
	v.SetDefault("DATABASE_URL", "postgres://wit:wit@localhost:5432/wit_erp?sslmode=disable")
	v.SetDefault("DB_MAX_CONNS", 10)
	v.SetDefault("DB_MIN_CONNS", 1)
	v.SetDefault("DB_MIGRATIONS_DIR", "migrations")
	v.SetDefault("DB_AUTO_MIGRATE", true)
	v.SetDefault("LOG_LEVEL", "info")
	v.SetDefault("LOG_PRETTY", true)
	v.SetDefault("TENANT_ID", "00000000-0000-0000-0000-000000000001")
	v.SetDefault("ENV", "dev")
	v.SetDefault("API_BASE_URL", "http://localhost:8080")

	// Service prefix lets HR_HTTP_PORT override the shared HTTP_PORT default.
	servicePrefix = strings.ToUpper(strings.TrimSpace(servicePrefix))

	httpPort := v.GetInt("HTTP_PORT")
	if servicePrefix != "" {
		if scoped := v.GetInt(servicePrefix + "_HTTP_PORT"); scoped > 0 {
			httpPort = scoped
		}
	}

	cfg := &Config{
		Service:    strings.ToLower(servicePrefix),
		HTTPPort:   httpPort,
		GRPCPort:   v.GetInt("GRPC_PORT"),
		Env:        v.GetString("ENV"),
		TenantID:   v.GetString("TENANT_ID"),
		APIBaseURL: v.GetString("API_BASE_URL"),
		Database: DatabaseConfig{
			URL:           v.GetString("DATABASE_URL"),
			MaxConns:      int32(v.GetInt("DB_MAX_CONNS")),
			MinConns:      int32(v.GetInt("DB_MIN_CONNS")),
			MigrationsDir: v.GetString("DB_MIGRATIONS_DIR"),
			AutoMigrate:   v.GetBool("DB_AUTO_MIGRATE"),
		},
		Log: LogConfig{
			Level:  v.GetString("LOG_LEVEL"),
			Pretty: v.GetBool("LOG_PRETTY"),
		},
	}

	if cfg.Database.URL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	return cfg, nil
}
