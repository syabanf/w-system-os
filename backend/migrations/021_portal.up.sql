-- ============================================================
-- 021_portal.sql
-- Employee self-service portal: chat threads + messages, onboarding
-- checklist instances, HR meeting bookings.
-- Maps to the frontend User Portal's 5 tabs (check-in/onboarding/chat/
-- leave/meet-HR). Leave + attendance live in 007/008; this file covers
-- the remaining three.
-- ============================================================

-- ─── Chat ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_threads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  kind          varchar(20) NOT NULL DEFAULT 'direct'
                  CHECK (kind IN ('direct','group','hr')),
  topic         varchar(200),
  last_message_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_thread_participants (
  thread_id        uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_profile_id  uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at        timestamptz NOT NULL DEFAULT now(),
  last_read_at     timestamptz,
  PRIMARY KEY (thread_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  thread_id       uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES user_profiles(id),
  body            text NOT NULL,
  attachment_url  text,
  edited_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Onboarding ───────────────────────────────────────────────────────

-- Template tasks (defined per tenant) that get materialised into
-- onboarding_task_instances when a new joiner arrives.
CREATE TABLE IF NOT EXISTS onboarding_task_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  title        varchar(200) NOT NULL,
  description  text,
  category     varchar(40) NOT NULL CHECK (category IN ('Setup','Training','People','Compliance','Product')),
  week_number  integer NOT NULL DEFAULT 1,
  resource_url text,
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS onboarding_task_instances (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  template_id      uuid REFERENCES onboarding_task_templates(id) ON DELETE SET NULL,
  user_profile_id  uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title            varchar(200) NOT NULL,
  description      text,
  category         varchar(40),
  week_number      integer NOT NULL DEFAULT 1,
  status           varchar(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','done','skipped')),
  completed_at     timestamptz,
  due_date         date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── HR meeting bookings ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hr_meeting_slots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  hr_user_id     uuid NOT NULL REFERENCES user_profiles(id),
  slot_date      date NOT NULL,
  slot_start     time NOT NULL,
  slot_end       time NOT NULL,
  is_booked      boolean NOT NULL DEFAULT false,
  notes          text,
  UNIQUE (tenant_id, hr_user_id, slot_date, slot_start)
);

CREATE TABLE IF NOT EXISTS hr_meeting_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  slot_id           uuid REFERENCES hr_meeting_slots(id) ON DELETE SET NULL,
  user_profile_id   uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  purpose           varchar(120) NOT NULL,
  message           text,
  status            varchar(20) NOT NULL DEFAULT 'requested'
                      CHECK (status IN ('requested','confirmed','rescheduled','cancelled','completed')),
  scheduled_at      timestamptz,
  duration_minutes  integer NOT NULL DEFAULT 30,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant       ON chat_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread      ON chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_inst_user      ON onboarding_task_instances(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_hr_meeting_slots_date     ON hr_meeting_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_hr_meeting_requests_user  ON hr_meeting_requests(user_profile_id);

ALTER TABLE chat_threads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_thread_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_meeting_slots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_meeting_requests       ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_threads_all              ON chat_threads              FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY chat_thread_participants_all  ON chat_thread_participants  FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY chat_messages_all             ON chat_messages             FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY onboarding_task_templates_all ON onboarding_task_templates FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY onboarding_task_instances_all ON onboarding_task_instances FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY hr_meeting_slots_all          ON hr_meeting_slots          FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY hr_meeting_requests_all       ON hr_meeting_requests       FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
