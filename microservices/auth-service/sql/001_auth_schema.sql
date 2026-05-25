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

CREATE TABLE IF NOT EXISTS reset_token (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  expire_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS login_attempt (
  email TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_utilisateur_email ON utilisateur(email);
CREATE INDEX IF NOT EXISTS idx_utilisateur_role ON utilisateur(role);
CREATE INDEX IF NOT EXISTS idx_utilisateur_statut ON utilisateur(statut);

