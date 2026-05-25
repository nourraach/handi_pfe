import { integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const profilCandidatTable = pgTable("profil_candidat", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" })
    .unique(),
  competences: json("competences").$type<string[]>(),
  experience: text("experience"),
  formation: text("formation"),
  handicap: text("handicap"),
  disponibilite: text("disponibilite"),
  salaire_souhaite: text("salaire_souhaite"),
  cv_url: text("cv_url"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});