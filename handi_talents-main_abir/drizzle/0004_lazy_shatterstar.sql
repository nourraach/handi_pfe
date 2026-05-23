CREATE TYPE "public"."statut_candidature" AS ENUM('pending', 'shortlisted', 'interview_scheduled', 'rejected', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."statut_entretien" AS ENUM('planifie', 'confirme', 'reporte', 'annule', 'termine');--> statement-breakpoint
CREATE TYPE "public"."type_entretien" AS ENUM('visio', 'presentiel', 'telephonique');--> statement-breakpoint
CREATE TYPE "public"."statut_offre" AS ENUM('active', 'inactive', 'pourvue', 'expiree');--> statement-breakpoint
CREATE TYPE "public"."type_poste" AS ENUM('cdi', 'cdd', 'stage', 'freelance', 'temps_partiel', 'temps_plein');--> statement-breakpoint
CREATE TYPE "public"."type_notification" AS ENUM('candidature_status_change', 'interview_scheduled', 'new_message', 'offre_favorite_updated', 'system');--> statement-breakpoint
CREATE TABLE "candidature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_candidat" uuid NOT NULL,
	"id_offre" uuid NOT NULL,
	"date_postulation" timestamp DEFAULT now() NOT NULL,
	"statut" "statut_candidature" DEFAULT 'pending' NOT NULL,
	"motif_refus" text,
	"score_test" integer,
	"lettre_motivation" text,
	"cv_url" text,
	"notes_entreprise" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "critere_eligibilite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_offre" uuid NOT NULL,
	"description" text NOT NULL,
	"type_critere" text NOT NULL,
	"valeur_requise" text,
	"niveau_minimum" integer,
	"obligatoire" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "entretien" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_candidature" uuid NOT NULL,
	"date_heure" timestamp NOT NULL,
	"type" "type_entretien" NOT NULL,
	"lieu_visio" text,
	"lieu" text,
	"statut" "statut_entretien" DEFAULT 'planifie' NOT NULL,
	"notes" text,
	"duree_prevue" text,
	"contact_entreprise" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favoris" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_candidat" uuid NOT NULL,
	"id_offre" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offre_emploi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"titre" text NOT NULL,
	"description" text NOT NULL,
	"localisation" text NOT NULL,
	"type_poste" "type_poste" NOT NULL,
	"salaire_min" text,
	"salaire_max" text,
	"competences_requises" text,
	"experience_requise" text,
	"niveau_etude" text,
	"statut" "statut_offre" DEFAULT 'active' NOT NULL,
	"date_limite" timestamp,
	"accessibilite_handicap" boolean DEFAULT true,
	"amenagements_possibles" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"type" "type_notification" NOT NULL,
	"titre" text NOT NULL,
	"message" text NOT NULL,
	"lu" boolean DEFAULT false,
	"data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidature" ADD CONSTRAINT "candidature_id_candidat_candidat_id_fk" FOREIGN KEY ("id_candidat") REFERENCES "public"."candidat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidature" ADD CONSTRAINT "candidature_id_offre_offre_emploi_id_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offre_emploi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critere_eligibilite" ADD CONSTRAINT "critere_eligibilite_id_offre_offre_emploi_id_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offre_emploi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entretien" ADD CONSTRAINT "entretien_id_candidature_candidature_id_fk" FOREIGN KEY ("id_candidature") REFERENCES "public"."candidature"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_id_candidat_candidat_id_fk" FOREIGN KEY ("id_candidat") REFERENCES "public"."candidat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_id_offre_offre_emploi_id_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offre_emploi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offre_emploi" ADD CONSTRAINT "offre_emploi_id_entreprise_entreprise_id_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;