-- ============================================================
-- 022_master_data.sql
-- Generic master data store. Mirrors the frontend's
-- src/state/masterData.store.ts: every lookup list (lead sources,
-- pipeline stages, ticket severities, currencies, banks, knowledge
-- categories, etc.) is a `md_category` with N `md_items`. The schema
-- field stays JSONB so categories can declare arbitrary columns
-- (text/number/select/color/boolean) without us touching the DB.
-- ============================================================

CREATE TABLE IF NOT EXISTS md_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  code          varchar(80) NOT NULL,                 -- e.g. "leads.sources", "finance.taxRates"
  module_id     varchar(40) NOT NULL,                 -- frontend AppModuleId namespace
  label         varchar(160) NOT NULL,
  description   text,
  fields        jsonb NOT NULL DEFAULT '[]'::jsonb,    -- [{ key, label, type, required, options }]
  display_keys  text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_system     boolean NOT NULL DEFAULT false,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS md_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES md_categories(id) ON DELETE CASCADE,
  payload     jsonb NOT NULL,                          -- arbitrary fields per the category schema
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_md_categories_tenant ON md_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_md_categories_module ON md_categories(module_id);
CREATE INDEX IF NOT EXISTS idx_md_items_tenant      ON md_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_md_items_category    ON md_items(category_id);
CREATE INDEX IF NOT EXISTS idx_md_items_payload     ON md_items USING gin (payload);

ALTER TABLE md_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE md_items      ENABLE ROW LEVEL SECURITY;
CREATE POLICY md_categories_all ON md_categories FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY md_items_all      ON md_items      FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
