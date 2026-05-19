-- ============================================================
-- 019_knowledge.sql
-- Internal wiki. Articles → categories → tags. Versioning is intentionally
-- shallow (updated_at + author) — extend with article_revisions when you
-- need full edit history.
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  code        varchar(40) NOT NULL,
  name        varchar(120) NOT NULL,
  color       varchar(10),
  parent_id   uuid REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS knowledge_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  label      varchar(80) NOT NULL,
  UNIQUE (tenant_id, label)
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  category_id   uuid REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title         varchar(300) NOT NULL,
  slug          varchar(300) NOT NULL,
  excerpt       text,
  body_markdown text NOT NULL,
  author_id     uuid REFERENCES user_profiles(id),
  status        varchar(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','archived')),
  pinned        boolean NOT NULL DEFAULT false,
  view_count    integer NOT NULL DEFAULT 0,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS knowledge_article_tags (
  article_id uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tenant ON knowledge_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search ON knowledge_articles
  USING gin ((title || ' ' || COALESCE(excerpt,'')) gin_trgm_ops);

ALTER TABLE knowledge_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_categories_all   ON knowledge_categories   FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY knowledge_tags_all         ON knowledge_tags         FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY knowledge_articles_all     ON knowledge_articles     FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
CREATE POLICY knowledge_article_tags_all ON knowledge_article_tags FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
