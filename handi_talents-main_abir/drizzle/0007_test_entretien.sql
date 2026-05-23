-- Migration: test_entretien tables
CREATE TABLE IF NOT EXISTS "test_entretien" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "id_offre" uuid NOT NULL REFERENCES "offre_emploi"("id") ON DELETE CASCADE,
  "titre" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "test_entretien_question" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "id_test" uuid NOT NULL REFERENCES "test_entretien"("id") ON DELETE CASCADE,
  "texte" text NOT NULL,
  "type" text NOT NULL,
  "options" json,
  "ordre" text
);

CREATE TABLE IF NOT EXISTS "test_entretien_resultat" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "id_test" uuid NOT NULL REFERENCES "test_entretien"("id") ON DELETE CASCADE,
  "id_candidat" uuid NOT NULL REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE,
  "reponses" json,
  "score" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
