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

CREATE TABLE IF NOT EXISTS conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  id_utilisateur UUID NOT NULL REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
  role TEXT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_participant_user ON conversation_participant(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_conversation_participant_conversation ON conversation_participant(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_conversation_created_at ON message(conversation_id, created_at);
