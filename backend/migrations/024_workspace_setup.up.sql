-- ============================================================
-- 024_workspace_setup.sql
-- Per-tenant shell setup: which app modules are enabled and whether the
-- first-run wizard has been completed. One row per tenant (upserted by the
-- workspace service). Mirrors the frontend setup wizard's persisted state.
-- ============================================================

CREATE TABLE IF NOT EXISTS workspace_setup (
  tenant_id        uuid PRIMARY KEY,
  -- Frontend AppModuleId values ("dashboard","leads",…), not row UUIDs.
  enabled_modules  text[]      NOT NULL DEFAULT '{}',
  is_complete      boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspace_setup ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_setup_all ON workspace_setup FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
