-- ============================================================
-- 003_hr_core.sql
-- Master data referenced by HR/Payroll: grades, positions, shifts,
-- calendars, leave types.
-- ============================================================

CREATE TABLE IF NOT EXISTS hr_job_grades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  code        varchar(40)  NOT NULL,
  name        varchar(120) NOT NULL,
  level       integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS hr_positions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  grade_id      uuid REFERENCES hr_job_grades(id),
  code          varchar(40)  NOT NULL,
  name          varchar(200) NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS hr_work_shifts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  code         varchar(40)  NOT NULL,
  name         varchar(120) NOT NULL,
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  break_minutes integer NOT NULL DEFAULT 60,
  is_active    boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS hr_work_calendars (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  year        integer NOT NULL,
  date        date NOT NULL,
  kind        varchar(20) NOT NULL CHECK (kind IN ('holiday','company_holiday','workday')),
  label       varchar(200),
  UNIQUE (tenant_id, date)
);

CREATE TABLE IF NOT EXISTS hr_leave_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  code            varchar(40) NOT NULL,
  name            varchar(120) NOT NULL,
  entitled_days   integer NOT NULL DEFAULT 0,
  paid            boolean NOT NULL DEFAULT true,
  affects_payroll boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_hr_positions_tenant ON hr_positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_types_tenant ON hr_leave_types(tenant_id);

ALTER TABLE hr_job_grades    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_positions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_shifts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_types   ENABLE ROW LEVEL SECURITY;

CREATE POLICY hr_job_grades_all    ON hr_job_grades    FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY hr_positions_all     ON hr_positions     FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY hr_work_shifts_all   ON hr_work_shifts   FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY hr_work_calendars_all ON hr_work_calendars FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY hr_leave_types_all   ON hr_leave_types   FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
