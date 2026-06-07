CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_utilisateur') THEN
    CREATE TYPE role_utilisateur AS ENUM ('admin', 'aneti', 'inspecteur', 'candidat', 'entreprise');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_utilisateur') THEN
    CREATE TYPE statut_utilisateur AS ENUM ('en_attente', 'approuve', 'actif', 'refuse', 'suspendu', 'inactif');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genre_utilisateur') THEN
    CREATE TYPE genre_utilisateur AS ENUM ('homme', 'femme');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_validation_entreprise') THEN
    CREATE TYPE statut_validation_entreprise AS ENUM ('valide', 'invalide');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_offre') THEN
    CREATE TYPE statut_offre AS ENUM ('active', 'inactive', 'expiree', 'pourvue');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_poste') THEN
    CREATE TYPE type_poste AS ENUM ('cdi', 'cdd', 'stage', 'freelance', 'alternance');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_candidature') THEN
    CREATE TYPE statut_candidature AS ENUM ('pending', 'shortlisted', 'interview_scheduled', 'rejected', 'accepted');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_report_status') THEN
    CREATE TYPE compliance_report_status AS ENUM ('submitted', 'validated', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS utilisateur (
  id_utilisateur UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  mdp TEXT NOT NULL,
  telephone TEXT NOT NULL,
  addresse TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  region TEXT,
  gouvernorat TEXT,
  delegation TEXT,
  statut statut_utilisateur NOT NULL DEFAULT 'en_attente',
  role role_utilisateur NOT NULL,
  genre genre_utilisateur,
  token_activation TEXT,
  derniere_connexion TIMESTAMP,
  profil_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur UUID NOT NULL UNIQUE REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  type_handicap TEXT NOT NULL,
  num_carte_handicap TEXT NOT NULL,
  date_expiration_carte_handicap TIMESTAMP NOT NULL,
  niveau_academique TEXT NOT NULL,
  description TEXT NOT NULL,
  secteur TEXT NOT NULL,
  type_licence TEXT NOT NULL,
  preference_communication TEXT NOT NULL,
  age INTEGER NOT NULL,
  competences JSON,
  experience TEXT,
  formation TEXT,
  handicap TEXT,
  disponibilite TEXT,
  salaire_souhaite TEXT,
  cv_url TEXT,
  preferences_accessibilite JSON,
  visibilite JSON,
  carte_handicap_url TEXT,
  video_cv_url TEXT,
  photo_profil_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entreprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur UUID NOT NULL UNIQUE REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  nom_entreprise TEXT NOT NULL,
  patente TEXT NOT NULL,
  rne TEXT NOT NULL,
  statut_validation statut_validation_entreprise NOT NULL DEFAULT 'invalide',
  profil_publique BOOLEAN NOT NULL DEFAULT FALSE,
  url_site TEXT,
  date_fondation TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  nbr_employe INTEGER NOT NULL,
  nbr_employe_handicape INTEGER NOT NULL,
  secteur_activite TEXT,
  taille_entreprise TEXT,
  siret TEXT,
  site_web TEXT,
  politique_handicap TEXT,
  contact_rh_nom TEXT,
  contact_rh_email TEXT,
  contact_rh_telephone TEXT,
  logo_url TEXT,
  subscription_pack TEXT,
  subscription_status TEXT,
  subscription_price_tnd INTEGER,
  subscription_cycle TEXT,
  subscribed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offre_emploi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entreprise UUID NOT NULL REFERENCES entreprise(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  localisation TEXT NOT NULL,
  type_poste type_poste NOT NULL,
  salaire_min TEXT,
  salaire_max TEXT,
  competences_requises TEXT,
  experience_requise TEXT,
  niveau_etude TEXT,
  statut statut_offre NOT NULL DEFAULT 'inactive',
  date_limite TIMESTAMP,
  accessibilite_handicap BOOLEAN DEFAULT TRUE,
  amenagements_possibles TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_candidat UUID NOT NULL REFERENCES candidat(id) ON DELETE CASCADE,
  id_offre UUID NOT NULL REFERENCES offre_emploi(id) ON DELETE CASCADE,
  date_postulation TIMESTAMP NOT NULL DEFAULT NOW(),
  statut statut_candidature NOT NULL DEFAULT 'pending',
  motif_refus TEXT,
  score_test INTEGER,
  lettre_motivation TEXT,
  cv_url TEXT,
  notes_entreprise TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
  report_pdf_path TEXT,
  report_pdf_filename TEXT,
  evidence_urls JSON,
  status compliance_report_status NOT NULL DEFAULT 'submitted',
  review_comment TEXT,
  last_recommendation TEXT,
  recommendations JSON,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avis_entreprise (
  id TEXT PRIMARY KEY,
  id_candidat UUID NOT NULL REFERENCES candidat(id) ON DELETE CASCADE,
  id_entreprise UUID NOT NULL REFERENCES entreprise(id) ON DELETE CASCADE,
  id_candidature UUID REFERENCES candidature(id) ON DELETE SET NULL,
  note INTEGER NOT NULL,
  commentaire TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_avis_entreprise_candidature ON avis_entreprise(id_candidature);
CREATE INDEX IF NOT EXISTS idx_compliance_report_status ON compliance_report(status);
CREATE INDEX IF NOT EXISTS idx_compliance_report_region ON compliance_report(region);
