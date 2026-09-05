-- Migration 003: Ebook Reviews, Vocabulary Extractions & Completion Certificates
-- Phase 3 — AI Reading Assistant · Reviews & Ratings · Completion Certificates

-- Ebook reviews and ratings
CREATE TABLE IF NOT EXISTS ebook_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id       TEXT NOT NULL,
  user_id        TEXT NOT NULL,
  user_name      TEXT NOT NULL,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT NOT NULL CHECK (char_length(comment) <= 2000),
  cefr_level     TEXT,
  helpful        INTEGER NOT NULL DEFAULT 0,
  deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ebook_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ebook_reviews_ebook_id ON ebook_reviews (ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_reviews_user_id  ON ebook_reviews (user_id);

-- Vocabulary items extracted by AI assistant (cached to avoid redundant Gemini calls)
CREATE TABLE IF NOT EXISTS ebook_vocabulary_cache (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id       TEXT NOT NULL,
  chapter_id     TEXT NOT NULL,
  content_hash   TEXT NOT NULL,  -- SHA-256 of (chapterContent + cefrLevel + language)
  cefr_level     TEXT NOT NULL,
  language       TEXT NOT NULL,
  vocabulary     JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_hash)
);

CREATE INDEX IF NOT EXISTS idx_vocab_cache_ebook ON ebook_vocabulary_cache (ebook_id, chapter_id);

-- Saved vocabulary words per student (linked to user_achievements savedWords)
CREATE TABLE IF NOT EXISTS student_saved_vocabulary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  ebook_id    TEXT NOT NULL,
  word        TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition  TEXT,
  example     TEXT,
  language    TEXT NOT NULL,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ebook_id, word)
);

CREATE INDEX IF NOT EXISTS idx_saved_vocab_user ON student_saved_vocabulary (user_id);

-- View: per-ebook rating aggregate
CREATE OR REPLACE VIEW ebook_rating_summary AS
SELECT
  ebook_id,
  COUNT(*)                                    AS total_reviews,
  ROUND(AVG(rating)::NUMERIC, 1)              AS average_rating,
  COUNT(*) FILTER (WHERE rating = 5)          AS five_star,
  COUNT(*) FILTER (WHERE rating = 4)          AS four_star,
  COUNT(*) FILTER (WHERE rating = 3)          AS three_star,
  COUNT(*) FILTER (WHERE rating = 2)          AS two_star,
  COUNT(*) FILTER (WHERE rating = 1)          AS one_star
FROM ebook_reviews
WHERE deleted = FALSE
GROUP BY ebook_id;
