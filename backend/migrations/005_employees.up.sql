-- ============================================================
-- 005_employees.sql
-- HR employee record. 1:1 with user_profiles; carries the
-- employment-specific columns that aren't relevant to non-employee users.
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  user_profile_id   uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_number   varchar(40) NOT NULL,
  entity_id         uuid REFERENCES entities(id),
  department_id    uuid REFERENCES departments(id),
  position_id       uuid REFERENCES hr_positions(id),
  manager_id        uuid REFERENCES employees(id),
  employment_type   varchar(20) NOT NULL DEFAULT 'Permanent'
                      CHECK (employment_type IN ('Permanent','Contract','Probation','Intern')),
  status            varchar(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','probation','on-leave','resigned','terminated')),
  join_date         date NOT NULL,
  end_date          date,
  basic_salary      numeric(15,2) NOT NULL DEFAULT 0,
  bpjs_kes          boolean NOT NULL DEFAULT true,
  bpjs_tk           boolean NOT NULL DEFAULT true,
  bank_account      varchar(80),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_number)
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant       ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_profile ON employees(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_status       ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_dept         ON employees(department_id);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY employees_all ON employees FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
