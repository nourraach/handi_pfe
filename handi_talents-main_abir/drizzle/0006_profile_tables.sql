-- Create profile tables for candidates and enterprises

CREATE TABLE IF NOT EXISTS "profil_candidat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"competences" json,
	"experience" text,
	"formation" text,
	"handicap" text,
	"disponibilite" text,
	"salaire_souhaite" text,
	"cv_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profil_candidat_id_utilisateur_unique" UNIQUE("id_utilisateur")
);

CREATE TABLE IF NOT EXISTS "profil_entreprise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"secteur" text,
	"taille" text,
	"description" text,
	"site_web" text,
	"siret" text,
	"contact_rh" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profil_entreprise_id_utilisateur_unique" UNIQUE("id_utilisateur")
);

DO $$ BEGIN
 ALTER TABLE "profil_candidat" ADD CONSTRAINT "profil_candidat_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "profil_entreprise" ADD CONSTRAINT "profil_entreprise_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;