DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'compliance_report_status'
  ) THEN
    CREATE TYPE compliance_report_status AS ENUM ('submitted', 'validated', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS compliance_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entreprise UUID NOT NULL REFERENCES entreprise(id) ON DELETE CASCADE,
  submitted_by_user_id UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE RESTRICT,
  reviewed_by_user_id UUID REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
  region TEXT NOT NULL,
  summary TEXT NOT NULL,
  reporting_period_start TIMESTAMP NOT NULL,
  reporting_period_end TIMESTAMP NOT NULL,
  workforce_total INTEGER NOT NULL DEFAULT 0,
  disabled_employees INTEGER NOT NULL DEFAULT 0,
  active_offers INTEGER NOT NULL DEFAULT 0,
  applications_count INTEGER NOT NULL DEFAULT 0,
  shortlisted_count INTEGER NOT NULL DEFAULT 0,
  hired_count INTEGER NOT NULL DEFAULT 0,
  accommodation_actions TEXT,
  evidence_urls JSONB,
  status compliance_report_status NOT NULL DEFAULT 'submitted',
  review_comment TEXT,
  last_recommendation TEXT,
  recommendations JSONB,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_report_company ON compliance_report (id_entreprise);
CREATE INDEX IF NOT EXISTS idx_compliance_report_status ON compliance_report (status);
CREATE INDEX IF NOT EXISTS idx_compliance_report_region ON compliance_report (region);
