-- ============================================================
-- 018_timesheet.sql
-- Time tracking. One row per employee × project × day (or finer if
-- start_time/end_time are set). Approval workflow ties to user_profiles.
-- ============================================================

CREATE TABLE IF NOT EXISTS time_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id),
  project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id         uuid REFERENCES tasks(id) ON DELETE SET NULL,
  date            date NOT NULL,
  start_time      time,
  end_time        time,
  hours           numeric(5,2) NOT NULL DEFAULT 0,
  activity_type   varchar(40),                       -- Development / Design / Review / Discovery / Meeting / Training
  billable        boolean NOT NULL DEFAULT true,
  description     text,
  status          varchar(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','submitted','approved','rejected')),
  approved_by     uuid REFERENCES user_profiles(id),
  approved_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_tenant   ON time_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_day ON time_entries(user_profile_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project  ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_status   ON time_entries(status);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_entries_all ON time_entries FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
