-- ============================================================
-- 015_projects.sql
-- Projects + Epics + User Stories + Sprints + Tasks.
-- Mirrors src/domain/entities/{Project,Epic,UserStory,Sprint,Task}.ts.
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  code                varchar(40) NOT NULL,
  name                varchar(200) NOT NULL,
  client_id           uuid REFERENCES clients(id),
  status              varchar(40) NOT NULL DEFAULT 'Discovery'
                        CHECK (status IN ('Discovery','Planning','In Development','QA','UAT','Delivered','Maintenance')),
  progress            integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  budget              numeric(15,2) NOT NULL DEFAULT 0,
  actual_cost         numeric(15,2) NOT NULL DEFAULT 0,
  risk_level          varchar(20) DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  start_date          date,
  end_date            date,
  project_manager_id  uuid REFERENCES user_profiles(id),
  health              varchar(10) NOT NULL DEFAULT 'green' CHECK (health IN ('green','amber','red')),
  tech_stack          text[],
  open_tickets        integer NOT NULL DEFAULT 0,
  change_requests     integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS epics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code                varchar(40) NOT NULL,
  name                varchar(200) NOT NULL,
  description         text,
  owner_id            uuid REFERENCES user_profiles(id),
  status              varchar(20) NOT NULL DEFAULT 'Discovery'
                        CHECK (status IN ('Discovery','In Progress','At Risk','Done','Cancelled')),
  color               varchar(10),
  start_date          date,
  target_date         date,
  committed_points    integer NOT NULL DEFAULT 0,
  completed_points    integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS user_stories (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  epic_id             uuid REFERENCES epics(id) ON DELETE SET NULL,
  code                varchar(40) NOT NULL,
  title               varchar(300) NOT NULL,
  as_a                varchar(200),
  i_want              text,
  so_that             text,
  status              varchar(20) NOT NULL DEFAULT 'Backlog'
                        CHECK (status IN ('Backlog','Ready','In Progress','Review','Done')),
  priority            varchar(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  story_points        integer NOT NULL DEFAULT 0,
  acceptance_criteria text[],
  owner_id            uuid REFERENCES user_profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS sprints (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name              varchar(200) NOT NULL,
  start_date        date NOT NULL,
  end_date          date NOT NULL,
  goal              text,
  committed_points  integer NOT NULL DEFAULT 0,
  completed_points  integer NOT NULL DEFAULT 0,
  status            varchar(20) NOT NULL DEFAULT 'planning'
                      CHECK (status IN ('planning','active','completed'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id       uuid REFERENCES sprints(id) ON DELETE SET NULL,
  user_story_id   uuid REFERENCES user_stories(id) ON DELETE SET NULL,
  code            varchar(40) NOT NULL,
  title           varchar(300) NOT NULL,
  status          varchar(20) NOT NULL DEFAULT 'Backlog'
                    CHECK (status IN ('Backlog','To Do','In Progress','Review','QA','Done')),
  priority        varchar(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  story_points    integer NOT NULL DEFAULT 0,
  assignee_id     uuid REFERENCES user_profiles(id),
  blocked         boolean NOT NULL DEFAULT false,
  blocker_reason  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  due_date        date,
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant  ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_epics_project    ON epics(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_project  ON user_stories(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_epic     ON user_stories(epic_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project  ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint     ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_story      ON tasks(user_story_id);

ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE epics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_all      ON projects     FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY epics_all         ON epics        FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY user_stories_all  ON user_stories FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY sprints_all       ON sprints      FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY tasks_all         ON tasks        FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
