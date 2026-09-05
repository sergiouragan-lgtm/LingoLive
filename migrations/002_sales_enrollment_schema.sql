-- LingoLive Ebook Studio — Phase 2 Schema
-- Migration: 002_sales_enrollment_schema
-- Depends on: 001_ebook_schema.sql

-- ─── License Keys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key             TEXT UNIQUE NOT NULL,                 -- LINGO-XXXX-XXXX-XXXX-XXXX
  ebook_id        UUID NOT NULL REFERENCES ebooks(id) ON DELETE RESTRICT,
  buyer_uid       TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  buyer_name      TEXT,
  purchase_id     TEXT UNIQUE NOT NULL,
  amount_usd      NUMERIC(10, 2),
  stripe_session_id TEXT,
  activated       BOOLEAN NOT NULL DEFAULT FALSE,
  activated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_license_key       ON license_keys (key);
CREATE INDEX idx_license_buyer_uid ON license_keys (buyer_uid);
CREATE INDEX idx_license_ebook_id  ON license_keys (ebook_id);

-- ─── Student Enrollments ──────────────────────────────────────────────────────
-- One row per (student, ebook) — tracks overall enrollment state
CREATE TABLE IF NOT EXISTS student_enrollments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Composite natural key used as Firestore document id
  enrollment_key  TEXT UNIQUE NOT NULL,                 -- {studentId}_{ebookId}
  ebook_id        UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  student_uid     TEXT NOT NULL,
  student_email   TEXT,
  license_key     TEXT REFERENCES license_keys(key),
  purchase_id     TEXT,
  current_cefr    cefr_level,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ
);

CREATE INDEX idx_enrollment_student   ON student_enrollments (student_uid);
CREATE INDEX idx_enrollment_ebook     ON student_enrollments (ebook_id);
CREATE UNIQUE INDEX idx_enrollment_pair ON student_enrollments (student_uid, ebook_id);

-- ─── Student Chapter Progress ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_chapter_progress (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id       UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  chapter_id          TEXT NOT NULL,                    -- chapter.id from JSONB
  chapter_number      INTEGER,
  read                BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  exercises_total     INTEGER NOT NULL DEFAULT 0,
  last_adapted_level  cefr_level,
  UNIQUE (enrollment_id, chapter_id)
);

CREATE INDEX idx_chapter_progress_enrollment ON student_chapter_progress (enrollment_id);

-- ─── Adaptive Content Cache ────────────────────────────────────────────────────
-- SQL mirror of the Firestore adaptive_content_cache collection
CREATE TABLE IF NOT EXISTS adaptive_content_cache_sql (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ebook_id        UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_id      TEXT NOT NULL,
  block_id        TEXT,
  original_text   TEXT NOT NULL,
  adapted_text    TEXT NOT NULL,
  target_level    cefr_level NOT NULL,
  language        TEXT NOT NULL,
  model_used      TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  cache_key       TEXT GENERATED ALWAYS AS (
    encode(digest(original_text || target_level::TEXT || language, 'sha256'), 'hex')
  ) STORED UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adaptive_cache_ebook ON adaptive_content_cache_sql (ebook_id, chapter_id);

-- ─── Ebook Sales Ledger ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ebook_sales_ledger (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ebook_id        UUID NOT NULL REFERENCES ebooks(id) ON DELETE RESTRICT,
  license_key_id  UUID REFERENCES license_keys(id),
  buyer_uid       TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  amount_usd      NUMERIC(10, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  stripe_session_id TEXT,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_ebook_id   ON ebook_sales_ledger (ebook_id);
CREATE INDEX idx_sales_buyer_uid  ON ebook_sales_ledger (buyer_uid);
CREATE INDEX idx_sales_paid_at    ON ebook_sales_ledger (paid_at DESC);

-- ─── View: author_revenue ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW author_revenue AS
SELECT
  e.author_id,
  e.id              AS ebook_id,
  e.title,
  COUNT(s.id)       AS total_sales,
  SUM(s.amount_usd) AS total_revenue_usd,
  COUNT(DISTINCT s.buyer_uid) AS unique_buyers,
  MIN(s.paid_at)    AS first_sale_at,
  MAX(s.paid_at)    AS last_sale_at
FROM ebooks e
LEFT JOIN ebook_sales_ledger s ON s.ebook_id = e.id
WHERE NOT e.deleted
GROUP BY e.author_id, e.id, e.title;

-- ─── View: student_reading_progress ──────────────────────────────────────────
CREATE OR REPLACE VIEW student_reading_progress AS
SELECT
  se.student_uid,
  se.ebook_id,
  e.title             AS ebook_title,
  e.cefr_level        AS ebook_cefr,
  se.current_cefr     AS student_cefr,
  se.enrolled_at,
  COUNT(cp.id)        AS chapters_read,
  SUM(cp.exercises_completed) AS exercises_completed,
  SUM(cp.exercises_total)     AS exercises_total
FROM student_enrollments se
JOIN ebooks e ON e.id = se.ebook_id
LEFT JOIN student_chapter_progress cp ON cp.enrollment_id = se.id AND cp.read = TRUE
GROUP BY se.student_uid, se.ebook_id, e.title, e.cefr_level, se.current_cefr, se.enrolled_at;
