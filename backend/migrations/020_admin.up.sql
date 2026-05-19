-- ============================================================
-- 020_admin.sql
-- Identity & Access. auth_users is the credential store (separate from
-- user_profiles which is the HR-facing person record). roles +
-- permissions follow the standard RBAC pattern; audit_log captures every
-- mutating action for forensics.
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  email           citext UNIQUE NOT NULL,
  password_hash   varchar(255),                     -- argon2id; null for SSO-only users
  mfa_secret      varchar(120),
  user_profile_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_active       boolean NOT NULL DEFAULT true,
  last_login_at   timestamptz,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  code        varchar(40) NOT NULL,
  name        varchar(120) NOT NULL,
  description text,
  is_system   boolean NOT NULL DEFAULT false,        -- system roles cannot be deleted
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        varchar(80) UNIQUE NOT NULL,           -- e.g. "hr.employees.write"
  name        varchar(200) NOT NULL,
  domain      varchar(40) NOT NULL,                  -- "hr" | "finance" | …
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id        uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id  uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_id    uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth_users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  user_id       uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  refresh_token varchar(255) NOT NULL UNIQUE,
  user_agent    text,
  ip_address    inet,
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  user_id      uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  action       varchar(60) NOT NULL,                -- "create" | "update" | "delete" | "login" | …
  resource     varchar(80) NOT NULL,                -- "employees" | "invoices" | …
  resource_id  uuid,
  before_data  jsonb,
  after_data   jsonb,
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_users_tenant   ON auth_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant        ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user       ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires    ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant    ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource  ON audit_log(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created   ON audit_log(created_at DESC);

ALTER TABLE auth_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log        ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_users_all       ON auth_users       FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY roles_all            ON roles            FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY permissions_all      ON permissions      FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY role_permissions_all ON role_permissions FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY user_roles_all       ON user_roles       FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY sessions_all         ON sessions         FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY audit_log_all        ON audit_log        FOR ALL TO PUBLIC USING (true) WITH CHECK (true);

-- Seed the canonical permissions used by every domain. Idempotent.
INSERT INTO permissions (code, name, domain) VALUES
  ('hr.employees.read',           'View employees',          'hr'),
  ('hr.employees.write',          'Create/edit employees',   'hr'),
  ('hr.employees.delete',         'Remove employees',        'hr'),
  ('hr.attendance.read',          'View attendance',         'hr'),
  ('hr.attendance.write',         'Edit attendance',         'hr'),
  ('hr.leave.read',               'View leave requests',     'hr'),
  ('hr.leave.approve',            'Approve leave',           'hr'),
  ('finance.invoices.read',       'View invoices',           'finance'),
  ('finance.invoices.write',      'Create/edit invoices',    'finance'),
  ('finance.payroll.read',        'View payroll',            'finance'),
  ('finance.payroll.approve',     'Approve payroll',         'finance'),
  ('sales.leads.read',            'View leads',              'sales'),
  ('sales.leads.write',           'Create/edit leads',       'sales'),
  ('projects.read',               'View projects',           'projects'),
  ('projects.write',              'Create/edit projects',    'projects'),
  ('support.tickets.read',        'View support tickets',    'support'),
  ('support.tickets.write',       'Resolve support tickets', 'support'),
  ('clients.read',                'View clients',            'clients'),
  ('clients.write',               'Create/edit clients',     'clients'),
  ('performance.templates.write', 'Manage 360 templates',    'performance'),
  ('admin.users.write',           'Manage users + roles',    'admin')
ON CONFLICT (code) DO NOTHING;
