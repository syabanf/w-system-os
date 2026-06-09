-- ============================================================
-- 023_clients_name_unique.sql
-- Enforce one client per tenant per (case-insensitive, trimmed) name.
--
-- clients.name previously carried no UNIQUE constraint, which left the API's
-- duplicate-name handling as dead code. This makes the rule real: the
-- repository maps the resulting 23505 to domain.ErrDuplicateName, which the
-- HTTP layer returns as 409 Conflict.
--
-- lower(btrim(name)) matches the frontend check (name.trim().toLowerCase()),
-- so "Acme", "acme", and " Acme " all collide as one account.
--
-- NOTE: index creation fails if existing rows already collide on
-- (tenant_id, lower(btrim(name))). The seeded dataset is unique, so a
-- fresh/seeded database migrates cleanly; de-duplicate first if applying to
-- a database with real duplicates.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS clients_tenant_name_uniq
  ON clients (tenant_id, lower(btrim(name)));
