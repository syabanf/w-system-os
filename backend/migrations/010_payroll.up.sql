-- ============================================================
-- 010_payroll.sql
-- Payroll periods (one per month/cycle) + per-employee payslip lines +
-- calibration log (every recomputation captured for audit).
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_periods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  entity_id     uuid REFERENCES entities(id),
  period        varchar(7) NOT NULL,                -- YYYY-MM
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  cutoff_date   date,
  pay_date      date,
  status        varchar(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','calculating','approved','paid','locked','cancelled')),
  total_gross   numeric(15,2) NOT NULL DEFAULT 0,
  total_net     numeric(15,2) NOT NULL DEFAULT 0,
  total_pph21   numeric(15,2) NOT NULL DEFAULT 0,
  total_bpjs    numeric(15,2) NOT NULL DEFAULT 0,
  approved_by   uuid REFERENCES user_profiles(id),
  approved_at   timestamptz,
  paid_at       timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_id, period)
);

CREATE TABLE IF NOT EXISTS payroll_details (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  payroll_period_id   uuid NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  user_profile_id     uuid NOT NULL REFERENCES user_profiles(id),
  basic_salary        numeric(15,2) NOT NULL DEFAULT 0,
  allowances          numeric(15,2) NOT NULL DEFAULT 0,
  overtime            numeric(15,2) NOT NULL DEFAULT 0,
  fines               numeric(15,2) NOT NULL DEFAULT 0,
  gross               numeric(15,2) NOT NULL DEFAULT 0,
  pph21               numeric(15,2) NOT NULL DEFAULT 0,
  bpjs_kes_employee   numeric(15,2) NOT NULL DEFAULT 0,
  bpjs_tk_employee    numeric(15,2) NOT NULL DEFAULT 0,
  bpjs_kes_company    numeric(15,2) NOT NULL DEFAULT 0,
  bpjs_tk_company     numeric(15,2) NOT NULL DEFAULT 0,
  other_deductions    numeric(15,2) NOT NULL DEFAULT 0,
  net_pay             numeric(15,2) NOT NULL DEFAULT 0,
  status              varchar(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','approved','paid','adjusted')),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS payroll_calibration_logs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  payroll_period_id  uuid NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  triggered_by       uuid REFERENCES user_profiles(id),
  reason             varchar(40) NOT NULL CHECK (reason IN ('initial','recalc','manual','attendance_changed','allowance_changed','salary_changed')),
  affected_employees integer NOT NULL DEFAULT 0,
  delta_summary      jsonb,                          -- aggregate before/after per component
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_tenant  ON payroll_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_period  ON payroll_periods(period);
CREATE INDEX IF NOT EXISTS idx_payroll_details_period  ON payroll_details(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_user    ON payroll_details(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_payroll_calib_period    ON payroll_calibration_logs(payroll_period_id);

ALTER TABLE payroll_periods         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calibration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_periods_all        ON payroll_periods         FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY payroll_details_all        ON payroll_details         FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY payroll_calib_logs_all     ON payroll_calibration_logs FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
