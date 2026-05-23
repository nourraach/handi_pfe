ALTER TYPE "public"."type_notification" ADD VALUE IF NOT EXISTS 'bien_etre_entretien';

CREATE TABLE IF NOT EXISTS "session_bien_etre_entretien" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "id_entretien" uuid NOT NULL REFERENCES "public"."entretien"("id") ON DELETE cascade,
  "id_utilisateur" uuid NOT NULL REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade,
  "notification_envoyee_le" timestamp,
  "demarre_le" timestamp,
  "termine_le" timestamp,
  "duree_secondes" integer,
  "points_forts_json" text,
  "source_points_forts" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "session_bien_etre_entretien_entretien_utilisateur_uidx"
    UNIQUE("id_entretien", "id_utilisateur")
);
