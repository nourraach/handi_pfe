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

CREATE INDEX IF NOT EXISTS idx_notification_user_created ON notification(id_utilisateur, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_user_lu ON notification(id_utilisateur, lu);
