CREATE TYPE "public"."type_action" AS ENUM('creation', 'modification', 'suppression', 'changement_statut', 'reset_password');--> statement-breakpoint
ALTER TYPE "public"."statut_utilisateur" ADD VALUE 'suspendu';--> statement-breakpoint
ALTER TYPE "public"."statut_utilisateur" ADD VALUE 'inactif';--> statement-breakpoint
CREATE TABLE "audit_actions_admin" (
	"id_action" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"utilisateur_cible_id" uuid NOT NULL,
	"type_action" "type_action" NOT NULL,
	"anciennes_valeurs" json,
	"nouvelles_valeurs" json,
	"commentaire" text,
	"date_action" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "utilisateur" ADD COLUMN "derniere_connexion" timestamp;--> statement-breakpoint
ALTER TABLE "utilisateur" ADD COLUMN "profil_complete" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "audit_actions_admin" ADD CONSTRAINT "audit_actions_admin_admin_id_utilisateur_id_utilisateur_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_actions_admin" ADD CONSTRAINT "audit_actions_admin_utilisateur_cible_id_utilisateur_id_utilisateur_fk" FOREIGN KEY ("utilisateur_cible_id") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE no action ON UPDATE no action;