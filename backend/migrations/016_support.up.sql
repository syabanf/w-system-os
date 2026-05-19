-- ============================================================
-- 016_support.sql
-- Support tickets + change requests (CRs are tickets with a flag).
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL,
  code                    varchar(40) NOT NULL,
  title                   varchar(300) NOT NULL,
  description             text,
  client_id               uuid REFERENCES clients(id),
  project_id              uuid REFERENCES projects(id),
  severity                varchar(20) NOT NULL DEFAULT 'medium'
                            CHECK (severity IN ('low','medium','high','critical')),
  status                  varchar(30) NOT NULL DEFAULT 'Open'
                            CHECK (status IN ('Open','Investigating','Waiting Client','In Progress','Resolved','Closed')),
  assigned_to_id          uuid REFERENCES user_profiles(id),
  is_change_request       boolean NOT NULL DEFAULT false,
  estimated_effort_hours  numeric(6,2),
  sla_deadline            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_support_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_client ON support_tickets(client_id);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_tickets_all ON support_tickets FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
