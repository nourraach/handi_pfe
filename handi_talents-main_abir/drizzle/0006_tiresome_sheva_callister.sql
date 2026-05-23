CREATE TYPE "public"."compliance_report_status" AS ENUM('submitted', 'validated', 'rejected');--> statement-breakpoint
CREATE TABLE "account_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entreprise_id" uuid NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"telephone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"role" text NOT NULL,
	"contenu" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_entreprise" uuid NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"region" text NOT NULL,
	"summary" text NOT NULL,
	"reporting_period_start" timestamp NOT NULL,
	"reporting_period_end" timestamp NOT NULL,
	"workforce_total" integer DEFAULT 0 NOT NULL,
	"disabled_employees" integer DEFAULT 0 NOT NULL,
	"active_offers" integer DEFAULT 0 NOT NULL,
	"applications_count" integer DEFAULT 0 NOT NULL,
	"shortlisted_count" integer DEFAULT 0 NOT NULL,
	"hired_count" integer DEFAULT 0 NOT NULL,
	"accommodation_actions" text,
	"evidence_urls" json,
	"status" "compliance_report_status" DEFAULT 'submitted' NOT NULL,
	"review_comment" text,
	"last_recommendation" text,
	"recommendations" json,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profil_candidat" (
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
--> statement-breakpoint
CREATE TABLE "profil_entreprise" (
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
--> statement-breakpoint
CREATE TABLE "test_entretien_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_test" uuid NOT NULL,
	"texte" text NOT NULL,
	"type" text NOT NULL,
	"options" json,
	"ordre" text
);
--> statement-breakpoint
CREATE TABLE "test_entretien_resultat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_test" uuid NOT NULL,
	"id_candidat" uuid NOT NULL,
	"reponses" json,
	"score" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_entretien" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_offre" uuid NOT NULL,
	"titre" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "preferences_accessibilite" json;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "visibilite" json;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "carte_handicap_url" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "video_cv_url" text;--> statement-breakpoint
ALTER TABLE "utilisateur" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "account_member" ADD CONSTRAINT "account_member_entreprise_id_entreprise_id_fk" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_report" ADD CONSTRAINT "compliance_report_id_entreprise_entreprise_id_fk" FOREIGN KEY ("id_entreprise") REFERENCES "public"."entreprise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_report" ADD CONSTRAINT "compliance_report_submitted_by_user_id_utilisateur_id_utilisateur_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_report" ADD CONSTRAINT "compliance_report_reviewed_by_user_id_utilisateur_id_utilisateur_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profil_candidat" ADD CONSTRAINT "profil_candidat_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profil_entreprise" ADD CONSTRAINT "profil_entreprise_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_entretien_question" ADD CONSTRAINT "test_entretien_question_id_test_test_entretien_id_fk" FOREIGN KEY ("id_test") REFERENCES "public"."test_entretien"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_entretien_resultat" ADD CONSTRAINT "test_entretien_resultat_id_test_test_entretien_id_fk" FOREIGN KEY ("id_test") REFERENCES "public"."test_entretien"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_entretien_resultat" ADD CONSTRAINT "test_entretien_resultat_id_candidat_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_candidat") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_entretien" ADD CONSTRAINT "test_entretien_id_offre_offre_emploi_id_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offre_emploi"("id") ON DELETE cascade ON UPDATE no action;