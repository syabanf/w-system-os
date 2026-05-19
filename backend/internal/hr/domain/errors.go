package domain

import "errors"

var (
	ErrNotFound       = errors.New("employee not found")
	ErrDuplicateNumber = errors.New("employee number already exists for this tenant")
)
