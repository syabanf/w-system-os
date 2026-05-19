-- ============================================================
-- 014_leads.sql
-- Sales pipeline. Leads convert to clients on win.
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  company_name      varchar(200) NOT NULL,
  contact_person    varchar(200),
  contact_email     citext,
  deal_value        numeric(15,2) NOT NULL DEFAULT 0,
  stage             varchar(40) NOT NULL DEFAULT 'New Lead'
                      CHECK (stage IN ('New Lead','Qualified','Discovery','Proposal Sent','Negotiation','Won','Lost')),
  source            varchar(40),
  probability       integer NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  follow_up_date    date,
  owner_id          uuid REFERENCES user_profiles(id),
  notes             text,
  won_client_id     uuid REFERENCES clients(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  lead_id             uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_id            uuid REFERENCES user_profiles(id),
  type                varchar(30) NOT NULL
                        CHECK (type IN ('Call','Email','Meeting','Note','Stage Change')),
  subject             varchar(300) NOT NULL,
  body                text,
  next_action_date    date,
  occurred_at         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant       ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage        ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);

ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_all           ON leads           FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY lead_activities_all ON lead_activities FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
