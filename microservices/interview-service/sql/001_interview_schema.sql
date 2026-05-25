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

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_entretien') THEN
    CREATE TYPE type_entretien AS ENUM ('visio', 'presentiel', 'telephonique');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_entretien') THEN
    CREATE TYPE statut_entretien AS ENUM ('planifie', 'confirme', 'reporte', 'annule', 'termine');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_notification') THEN
    CREATE TYPE type_notification AS ENUM (
      'candidature_status_change',
      'interview_scheduled',
      'new_message',
      'offre_favorite_updated',
      'system',
      'bien_etre_entretien',
      'interview_prep_ready'
    );
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

CREATE TABLE IF NOT EXISTS offre_statistiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_offre UUID NOT NULL UNIQUE REFERENCES offre_emploi(id) ON DELETE CASCADE,
  vues_count INTEGER NOT NULL DEFAULT 0,
  candidatures_count INTEGER NOT NULL DEFAULT 0
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

CREATE TABLE IF NOT EXISTS entretien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_candidature UUID NOT NULL REFERENCES candidature(id) ON DELETE CASCADE,
  date_heure TIMESTAMP NOT NULL,
  type type_entretien NOT NULL,
  lieu_visio TEXT,
  lieu TEXT,
  statut statut_entretien NOT NULL DEFAULT 'planifie',
  notes TEXT,
  duree_prevue TEXT,
  contact_entreprise TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  type type_notification NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  data TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_questions_dossier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_candidature UUID NOT NULL REFERENCES candidature(id) ON DELETE CASCADE,
  id_candidat UUID NOT NULL REFERENCES candidat(id) ON DELETE CASCADE,
  id_offre UUID NOT NULL REFERENCES offre_emploi(id) ON DELETE CASCADE,
  questions_json TEXT,
  handicap_block_json TEXT,
  gaps_analysis_json TEXT,
  source TEXT,
  cache_key TEXT,
  regenerated_once BOOLEAN NOT NULL DEFAULT FALSE,
  generation_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS interview_questions_dossier_candidature_uidx
  ON interview_questions_dossier(id_candidature);
CREATE INDEX IF NOT EXISTS idx_candidature_candidat ON candidature(id_candidat);
CREATE INDEX IF NOT EXISTS idx_candidature_offre ON candidature(id_offre);
CREATE INDEX IF NOT EXISTS idx_candidature_statut ON candidature(statut);

CREATE TABLE IF NOT EXISTS test_entretien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_offre UUID NOT NULL REFERENCES offre_emploi(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_entretien_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_test UUID NOT NULL REFERENCES test_entretien(id) ON DELETE CASCADE,
  texte TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSON,
  ordre TEXT
);

CREATE TABLE IF NOT EXISTS test_entretien_resultat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_test UUID NOT NULL REFERENCES test_entretien(id) ON DELETE CASCADE,
  id_candidat UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  reponses JSON,
  score TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_bien_etre_entretien (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entretien UUID NOT NULL REFERENCES entretien(id) ON DELETE CASCADE,
  id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  notification_envoyee_le TIMESTAMP,
  demarre_le TIMESTAMP,
  termine_le TIMESTAMP,
  duree_secondes INTEGER,
  points_forts_json TEXT,
  source_points_forts TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS session_bien_etre_entretien_entretien_utilisateur_uidx
  ON session_bien_etre_entretien(id_entretien, id_utilisateur);
