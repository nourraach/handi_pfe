CREATE TABLE "offre_statistiques" (
	"id_offre" uuid PRIMARY KEY NOT NULL,
	"vues_count" integer DEFAULT 0 NOT NULL,
	"candidatures_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offre_statistiques" ADD CONSTRAINT "offre_statistiques_id_offre_offre_emploi_id_fk" FOREIGN KEY ("id_offre") REFERENCES "public"."offre_emploi"("id") ON DELETE cascade ON UPDATE no action;