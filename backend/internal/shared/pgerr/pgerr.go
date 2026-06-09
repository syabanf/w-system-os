// Package pgerr provides typed inspection of Postgres driver errors, so callers
// can branch on SQLSTATE codes instead of brittle string matching on err.Error().
package pgerr

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// IsUniqueViolation reports whether err is (or wraps) a Postgres
// unique_violation (SQLSTATE 23505).
func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
