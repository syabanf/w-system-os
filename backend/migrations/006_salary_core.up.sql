-- ============================================================
-- 006_salary_core.sql
-- Salary components, salary matrix (grade × type), allowance matrix
-- (component × position). Backfills the salary_component_id FK that
-- migration 009 (employee_allowances) references nullably.
-- ============================================================

CREATE TABLE IF NOT EXISTS salary_components (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  code            varchar(40) NOT NULL,
  name            varchar(120) NOT NULL,
  kind            varchar(20) NOT NULL DEFAULT 'allowance'
                    CHECK (kind IN ('basic','allowance','deduction','overtime','bonus','other')),
  is_taxable      boolean NOT NULL DEFAULT true,
  affects_bpjs    boolean NOT NULL DEFAULT false,
  recurrence      varchar(20) NOT NULL DEFAULT 'monthly'
                    CHECK (recurrence IN ('monthly','one-off','daily','hourly')),
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS salary_matrix (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  grade_id        uuid NOT NULL REFERENCES hr_job_grades(id) ON DELETE CASCADE,
  employment_type varchar(20) NOT NULL
                    CHECK (employment_type IN ('Permanent','Contract','Probation','Intern')),
  min_amount      numeric(15,2) NOT NULL DEFAULT 0,
  mid_amount      numeric(15,2) NOT NULL DEFAULT 0,
  max_amount      numeric(15,2) NOT NULL DEFAULT 0,
  effective_from  date NOT NULL,
  effective_to    date,
  is_active       boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, grade_id, employment_type, effective_from)
);

CREATE TABLE IF NOT EXISTS allowance_matrix (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  salary_component_id uuid NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
  position_id         uuid REFERENCES hr_positions(id) ON DELETE CASCADE,
  grade_id            uuid REFERENCES hr_job_grades(id) ON DELETE CASCADE,
  amount              numeric(15,2) NOT NULL DEFAULT 0,
  is_percent_of_basic boolean NOT NULL DEFAULT false,
  percent             numeric(5,2),
  effective_from      date NOT NULL,
  effective_to        date,
  is_active           boolean NOT NULL DEFAULT true,
  CHECK (position_id IS NOT NULL OR grade_id IS NOT NULL)
);

-- Late FK from employee_allowances → salary_components (was nullable in 009).
ALTER TABLE employee_allowances
  ADD CONSTRAINT employee_allowances_salary_component_fkey
  FOREIGN KEY (salary_component_id) REFERENCES salary_components(id) ON DELETE SET NULL;
ALTER TABLE employee_allowance_histories
  ADD CONSTRAINT employee_allowance_histories_salary_component_fkey
  FOREIGN KEY (salary_component_id) REFERENCES salary_components(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_salary_components_tenant ON salary_components(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_matrix_tenant     ON salary_matrix(tenant_id);
CREATE INDEX IF NOT EXISTS idx_allowance_matrix_tenant  ON allowance_matrix(tenant_id);

ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_matrix     ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowance_matrix  ENABLE ROW LEVEL SECURITY;
CREATE POLICY salary_components_all ON salary_components FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY salary_matrix_all     ON salary_matrix     FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY allowance_matrix_all  ON allowance_matrix  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
