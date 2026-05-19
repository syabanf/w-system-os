-- ============================================================
-- 004_user_profiles.sql
-- Single source of truth for any person inside the firm. Auth user
-- (Supabase/Cognito/etc.) is referenced by auth_user_id when present;
-- otherwise user_profiles can stand alone (back-office employees).
-- Employees extend this via 1:1 employees table (next migration).
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  auth_user_id  uuid,
  email         citext UNIQUE,
  first_name    varchar(120) NOT NULL,
  last_name     varchar(120) NOT NULL,
  phone         varchar(40),
  avatar_color  varchar(10),
  initials      varchar(8),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_name   ON user_profiles USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_profiles_all ON user_profiles FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
