-- ============================================================
-- 001_extensions.sql
-- Postgres extensions required by every downstream migration.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive text (emails)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy search on names
