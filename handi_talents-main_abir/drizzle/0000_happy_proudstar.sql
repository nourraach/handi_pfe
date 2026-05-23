CREATE TYPE "public"."statut_validation_entreprise" AS ENUM('valide', 'invalide');--> statement-breakpoint
CREATE TYPE "public"."genre_utilisateur" AS ENUM('homme', 'femme');--> statement-breakpoint
CREATE TYPE "public"."role_utilisateur" AS ENUM('admin', 'aneti', 'inspecteur', 'candidat', 'entreprise');--> statement-breakpoint
CREATE TYPE "public"."statut_utilisateur" AS ENUM('en_attente', 'approuve', 'actif', 'refuse');--> statement-breakpoint
CREATE TABLE "candidat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"type_handicap" text NOT NULL,
	"num_carte_handicap" text NOT NULL,
	"date_expiration_carte_handicap" timestamp NOT NULL,
	"niveau_academique" text NOT NULL,
	"description" text NOT NULL,
	"secteur" text NOT NULL,
	"type_licence" text NOT NULL,
	"preference_communication" text NOT NULL,
	"age" integer NOT NULL,
	CONSTRAINT "candidat_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "entreprise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"nom_entreprise" text NOT NULL,
	"patente" text NOT NULL,
	"rne" text NOT NULL,
	"statut_validation" "statut_validation_entreprise" DEFAULT 'invalide' NOT NULL,
	"profil_publique" boolean DEFAULT false NOT NULL,
	"url_site" text,
	"date_fondation" timestamp NOT NULL,
	"description" text NOT NULL,
	"nbr_employe" integer NOT NULL,
	"nbr_employe_handicape" integer NOT NULL,
	CONSTRAINT "entreprise_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
CREATE TABLE "utilisateur" (
	"id_utilisateur" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"mdp" text NOT NULL,
	"telephone" text NOT NULL,
	"addresse" text NOT NULL,
	"email" text NOT NULL,
	"statut" "statut_utilisateur" DEFAULT 'en_attente' NOT NULL,
	"role" "role_utilisateur" NOT NULL,
	"genre" "genre_utilisateur",
	"token_activation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "utilisateur_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "candidat" ADD CONSTRAINT "candidat_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entreprise" ADD CONSTRAINT "entreprise_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;