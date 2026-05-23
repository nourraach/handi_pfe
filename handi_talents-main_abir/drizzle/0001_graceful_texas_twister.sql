CREATE TABLE "admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_utilisateur" uuid NOT NULL,
	"poste" text,
	"departement" text,
	"date_embauche" date,
	"permissions" json,
	"notifications_email" boolean DEFAULT true,
	"notifications_sms" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_id_utilisateur_unique" UNIQUE("id_utilisateur")
);
--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "competences" json;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "experience" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "formation" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "handicap" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "disponibilite" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "salaire_souhaite" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "cv_url" text;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "secteur_activite" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "taille_entreprise" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "siret" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "site_web" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "politique_handicap" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "contact_rh_nom" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "contact_rh_email" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "contact_rh_telephone" text;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "entreprise" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_id_utilisateur_utilisateur_id_utilisateur_fk" FOREIGN KEY ("id_utilisateur") REFERENCES "public"."utilisateur"("id_utilisateur") ON DELETE cascade ON UPDATE no action;