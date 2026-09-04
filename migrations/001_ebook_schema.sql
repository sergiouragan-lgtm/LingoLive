-- LingoLive Ebook Studio — Phase 1 Schema
-- Migration: 001_ebook_schema
-- Created: 2025-01-01

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE ebook_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE tone_formality AS ENUM ('informal', 'neutral', 'formal', 'academic');
CREATE TYPE tone_style AS ENUM ('conversational', 'narrative', 'instructional', 'analytical');
CREATE TYPE tone_audience AS ENUM ('children', 'teens', 'adults', 'professionals');
CREATE TYPE tone_richness AS ENUM ('simple', 'standard', 'rich', 'elaborate');

-- ─── Table: ebooks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ebooks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firestore_id    TEXT UNIQUE,                          -- mirrors Firestore doc ID for sync
  author_id       TEXT NOT NULL,                        -- Firebase UID
  author_name     TEXT,
  author_email    TEXT,

  title           TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  language        TEXT NOT NULL DEFAULT 'pt',
  cefr_level      cefr_level NOT NULL DEFAULT 'B1',
  cover_color     TEXT,

  -- Tone configuration (JSONB for flexibility, typed columns for indexing)
  tone_formality  tone_formality NOT NULL DEFAULT 'neutral',
  tone_style      tone_style NOT NULL DEFAULT 'instructional',
  tone_audience   tone_audience NOT NULL DEFAULT 'adults',
  tone_richness   tone_richness NOT NULL DEFAULT 'standard',
  tone_raw        JSONB,

  -- Chapter content stored as JSONB array; includes blocks array per chapter
  chapters        JSONB NOT NULL DEFAULT '[]',

  status          ebook_status NOT NULL DEFAULT 'draft',
  deleted         BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,

  -- DRM / Sales metadata
  drm_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  total_sales     INTEGER NOT NULL DEFAULT 0,
  price_usd       NUMERIC(10, 2),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ebooks_author_id ON ebooks (author_id) WHERE NOT deleted;
CREATE INDEX idx_ebooks_status    ON ebooks (status)    WHERE NOT deleted;
CREATE INDEX idx_ebooks_language  ON ebooks (language);
CREATE INDEX idx_ebooks_cefr      ON ebooks (cefr_level);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ebooks_updated_at
  BEFORE UPDATE ON ebooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Table: ebook_purchases ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ebook_purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ebook_id        UUID NOT NULL REFERENCES ebooks(id) ON DELETE RESTRICT,
  buyer_uid       TEXT NOT NULL,                        -- Firebase UID of buyer
  buyer_name      TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  buyer_nif       TEXT,
  buyer_ip        INET,
  purchase_id     TEXT UNIQUE NOT NULL,
  amount_usd      NUMERIC(10, 2),
  currency        TEXT NOT NULL DEFAULT 'USD',
  payment_method  TEXT,
  -- SHA-256 of (purchase_id + email + timestamp) — embedded in DRM PDF
  drm_hash        TEXT,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_ebook_id   ON ebook_purchases (ebook_id);
CREATE INDEX idx_purchases_buyer_uid  ON ebook_purchases (buyer_uid);
CREATE INDEX idx_purchases_buyer_email ON ebook_purchases (buyer_email);

-- ─── Table: student_profile_sync ─────────────────────────────────────────────
-- Mirrors the adaptive student profile from Firestore for SQL-side analytics
CREATE TABLE IF NOT EXISTS student_profile_sync (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid    TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  email           TEXT,

  -- Current language learning state
  target_language TEXT,
  native_language TEXT,
  cefr_level      cefr_level DEFAULT 'A1',
  xp_total        INTEGER NOT NULL DEFAULT 0,
  streak_days     INTEGER NOT NULL DEFAULT 0,

  -- Adaptive engine state (opaque JSONB from Firestore)
  adaptive_state  JSONB,

  -- Which ebooks this student has purchased / has access to
  ebook_access    UUID[],

  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_uid      ON student_profile_sync (firebase_uid);
CREATE INDEX idx_student_language ON student_profile_sync (target_language);
CREATE INDEX idx_student_cefr     ON student_profile_sync (cefr_level);

-- ─── Table: adaptive_generated_materials ─────────────────────────────────────
-- Cache of AI-adapted content blocks keyed by (ebook_id, chapter_id, block_id, cefr_level)
CREATE TABLE IF NOT EXISTS adaptive_generated_materials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ebook_id        UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  chapter_id      TEXT NOT NULL,
  block_id        TEXT,                                 -- null = full chapter
  cefr_level      cefr_level NOT NULL,
  language        TEXT NOT NULL,

  original_text   TEXT NOT NULL,
  adapted_text    TEXT NOT NULL,
  model_used      TEXT NOT NULL DEFAULT 'gemini-2.5-flash',

  -- Reuse detection: hash of original_text + cefr_level to avoid redundant API calls
  cache_key       TEXT GENERATED ALWAYS AS (
    encode(digest(original_text || cefr_level::TEXT, 'sha256'), 'hex')
  ) STORED UNIQUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adaptive_ebook_chapter ON adaptive_generated_materials (ebook_id, chapter_id);
CREATE INDEX idx_adaptive_cache_key     ON adaptive_generated_materials (cache_key);

-- ─── View: ebook_analytics ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW ebook_analytics AS
SELECT
  e.id,
  e.title,
  e.author_id,
  e.author_name,
  e.cefr_level,
  e.language,
  e.status,
  e.total_sales,
  e.price_usd,
  COUNT(p.id)                         AS purchase_count,
  SUM(p.amount_usd)                   AS revenue_usd,
  COUNT(DISTINCT p.buyer_uid)         AS unique_buyers,
  e.created_at,
  e.updated_at
FROM ebooks e
LEFT JOIN ebook_purchases p ON p.ebook_id = e.id
WHERE NOT e.deleted
GROUP BY e.id;
