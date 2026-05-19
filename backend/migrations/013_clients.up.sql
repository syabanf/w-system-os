-- ============================================================
-- 013_clients.sql
-- Customer accounts (companies WIT bills/services).
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  name                varchar(200) NOT NULL,
  industry            varchar(80),
  region              varchar(80),
  primary_contact     varchar(200),
  contact_email       citext,
  account_owner_id    uuid REFERENCES user_profiles(id),
  contract_value      numeric(15,2) NOT NULL DEFAULT 0,
  retainer_active     boolean NOT NULL DEFAULT false,
  active_projects     integer NOT NULL DEFAULT 0,
  satisfaction_score  integer NOT NULL DEFAULT 0,
  health              varchar(20) NOT NULL DEFAULT 'stable'
                        CHECK (health IN ('excellent','stable','at-risk','churn-risk')),
  renewal_date        date,
  joined_at           date,
  logo_color          varchar(10),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_health ON clients(health);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_all ON clients FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
