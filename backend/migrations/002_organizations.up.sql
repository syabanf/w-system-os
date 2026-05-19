-- ============================================================
-- 002_organizations.sql
-- Entities (legal companies), departments, divisions.
-- ============================================================

CREATE TABLE IF NOT EXISTS entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  code        varchar(40)  NOT NULL,
  name        varchar(200) NOT NULL,
  legal_form  varchar(40),
  npwp        varchar(40),
  address     text,
  phone       varchar(40),
  email       citext,
  is_default  boolean NOT NULL DEFAULT false,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  entity_id   uuid REFERENCES entities(id) ON DELETE SET NULL,
  code        varchar(40) NOT NULL,
  name        varchar(200) NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_id, code)
);

CREATE TABLE IF NOT EXISTS divisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  code          varchar(40) NOT NULL,
  name          varchar(200) NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, department_id, code)
);

CREATE INDEX IF NOT EXISTS idx_entities_tenant     ON entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant  ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_divisions_tenant    ON divisions(tenant_id);

ALTER TABLE entities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions   ENABLE ROW LEVEL SECURITY;

CREATE POLICY entities_all    ON entities    FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY departments_all ON departments FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY divisions_all   ON divisions   FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
