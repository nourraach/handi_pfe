-- Feature 02 — Predicteur de questions d'entretien personnalise
-- Ajoute la valeur enum "interview_prep_ready" pour le type de notification
-- Cree la table interview_questions_dossier

-- 1) Enum value (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'type_notification'
      AND e.enumlabel = 'interview_prep_ready'
  ) THEN
    ALTER TYPE type_notification ADD VALUE 'interview_prep_ready';
  END IF;
END$$;

-- 2) Table
CREATE TABLE IF NOT EXISTS interview_questions_dossier (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_candidature      UUID NOT NULL REFERENCES candidature(id) ON DELETE CASCADE,
  id_candidat         UUID NOT NULL REFERENCES candidat(id) ON DELETE CASCADE,
  id_offre            UUID NOT NULL REFERENCES offre_emploi(id) ON DELETE CASCADE,
  questions_json      TEXT,
  handicap_block_json TEXT,
  gaps_analysis_json  TEXT,
  source              TEXT,
  cache_key           TEXT,
  regenerated_once    BOOLEAN NOT NULL DEFAULT FALSE,
  generation_status   TEXT NOT NULL DEFAULT 'pending',
  error_message       TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS interview_questions_dossier_candidature_uidx
  ON interview_questions_dossier (id_candidature);

CREATE INDEX IF NOT EXISTS interview_questions_dossier_candidat_status_idx
  ON interview_questions_dossier (id_candidat, generation_status);

CREATE INDEX IF NOT EXISTS interview_questions_dossier_cache_key_idx
  ON interview_questions_dossier (cache_key);
