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

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_question') THEN
    CREATE TYPE type_question AS ENUM ('choix_multiple', 'vrai_faux', 'echelle_likert', 'texte_libre');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_test') THEN
    CREATE TYPE statut_test AS ENUM ('actif', 'inactif', 'archive');
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

CREATE TABLE IF NOT EXISTS test_psychologique (
  id_test UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  type_test TEXT NOT NULL,
  score_total DECIMAL(5,2) NOT NULL,
  duree_minutes INTEGER NOT NULL,
  statut statut_test NOT NULL DEFAULT 'actif',
  date_debut_validite TIMESTAMP NOT NULL,
  date_fin_validite TIMESTAMP NOT NULL,
  instructions TEXT,
  created_by UUID NOT NULL REFERENCES utilisateur(id_utilisateur),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question (
  id_question UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_test UUID NOT NULL REFERENCES test_psychologique(id_test) ON DELETE CASCADE,
  contenu_question TEXT NOT NULL,
  type_question type_question NOT NULL,
  score_question DECIMAL(5,2) NOT NULL,
  ordre INTEGER NOT NULL,
  obligatoire BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS option_reponse (
  id_option UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_question UUID NOT NULL REFERENCES question(id_question) ON DELETE CASCADE,
  texte_option TEXT NOT NULL,
  est_correcte BOOLEAN DEFAULT FALSE,
  score_option DECIMAL(5,2) DEFAULT 0,
  ordre INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS resultat_test (
  id_resultat UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_test UUID NOT NULL REFERENCES test_psychologique(id_test),
  id_candidat UUID NOT NULL REFERENCES candidat(id_utilisateur),
  score_obtenu DECIMAL(5,2) NOT NULL,
  pourcentage DECIMAL(5,2) NOT NULL,
  temps_passe_minutes INTEGER,
  est_visible BOOLEAN DEFAULT TRUE,
  date_passage TIMESTAMP NOT NULL DEFAULT NOW(),
  reponses JSON
);

CREATE TABLE IF NOT EXISTS tentative_test (
  id_tentative UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_test UUID NOT NULL REFERENCES test_psychologique(id_test),
  id_candidat UUID NOT NULL REFERENCES candidat(id_utilisateur),
  date_tentative TIMESTAMP NOT NULL DEFAULT NOW(),
  est_termine BOOLEAN DEFAULT FALSE,
  date_debut TIMESTAMP,
  date_fin TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_psychologique_statut ON test_psychologique(statut);
CREATE INDEX IF NOT EXISTS idx_resultat_test_candidat ON resultat_test(id_candidat);
