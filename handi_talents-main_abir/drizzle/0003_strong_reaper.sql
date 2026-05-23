CREATE TYPE "public"."statut_test" AS ENUM('actif', 'inactif', 'archive');--> statement-breakpoint
CREATE TYPE "public"."type_question" AS ENUM('choix_multiple', 'vrai_faux', 'echelle_likert', 'texte_libre');--> statement-breakpoint
CREATE TABLE "option_reponse" (
	"id_option" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_question" uuid NOT NULL,
	"texte_option" text NOT NULL,
	"est_correcte" boolean DEFAULT false,
	"score_option" numeric(5, 2) DEFAULT '0',
	"ordre" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id_question" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_test" uuid NOT NULL,
	"contenu_question" text NOT NULL,
	"type_question" "type_question" NOT NULL,
	"score_question" numeric(5, 2) NOT NULL,
	"ordre" integer NOT NULL,
	"obligatoire" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resultat_test" (
	"id_resultat" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_test" uuid NOT NULL,
	"id_candidat" uuid NOT NULL,
	"score_obtenu" numeric(5, 2) NOT NULL,
	"pourcentage" numeric(5, 2) NOT NULL,
	"temps_passe_minutes" integer,
	"est_visible" boolean DEFAULT true,
	"date_passage" timestamp DEFAULT now() NOT NULL,
	"reponses" json
);
--> statement-breakpoint
CREATE TABLE "tentative_test" (
	"id_tentative" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_test" uuid NOT NULL,
	"id_candidat" uuid NOT NULL,
	"date_tentative" timestamp DEFAULT now() NOT NULL,
	"est_termine" boolean DEFAULT false,
	"date_debut" timestamp,
	"date_fin" timestamp
);
--> statement-breakpoint
CREATE TABLE "test_psychologique" (
	"id_test" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"description" text NOT NULL,
	"type_test" text NOT NULL,
	"score_total" numeric(5, 2) NOT NULL,
	"duree_minutes" integer NOT NULL,
	"statut" "statut_test" DEFAULT 'actif' NOT NULL,
	"date_debut_validite" timestamp NOT NULL,
	"date_fin_validite" timestamp NOT NULL,
	"instructions" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "option_reponse" ADD CONSTRAINT "option_reponse_id_question_question_id_question_fk" FOREIGN KEY ("id_question") REFERENCES "public"."question"("id_question") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_id_test_test_psychologique_id_test_fk" FOREIGN KEY ("id_test") REFERENCES "public"."test_psychologique"("id_test") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultat_test" ADD CONSTRAINT "resultat_test_id_test_test_psychologique_id_test_fk" FOREIGN KEY ("id_test") REFERENCES "public"."test_psychologique"("id_test") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultat_test" ADD CONSTRAINT "resultat_test_id_candidat_candidat_id_utilisateur_fk" FOREIGN KEY ("id_candidat") REFERENCES "public"."candidat"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tentative_test" ADD CONSTRAINT "tentative_test_id_test_test_psychologique_id_test_fk" FOREIGN KEY ("id_test") REFERENCES "public"."test_psychologique"("id_test") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tentative_test" ADD CONSTRAINT "tentative_test_id_candidat_candidat_id_utilisateur_fk" FOREIGN KEY ("id_candidat") REFERENCES "public"."candidat"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_psychologique" ADD CONSTRAINT "test_psychologique_created_by_utilisateur_id_utilisateur_fk" FOREIGN KEY ("created_by") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE no action ON UPDATE no action;