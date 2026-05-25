import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { entrepriseTable } from "./entreprise.schema";

export const statutOffreEnum = pgEnum("statut_offre", ["active", "inactive", "pourvue", "expiree"]);
export const typePosteEnum = pgEnum("type_poste", ["cdi", "cdd", "stage", "freelance", "temps_partiel", "temps_plein"]);

export const offreEmploiTable = pgTable("offre_emploi", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_entreprise: uuid("id_entreprise")
    .notNull()
    .references(() => entrepriseTable.id, { onDelete: "cascade" }),
  titre: text("titre").notNull(),
  description: text("description").notNull(),
  localisation: text("localisation").notNull(),
  type_poste: typePosteEnum("type_poste").notNull(),
  salaire_min: text("salaire_min"),
  salaire_max: text("salaire_max"),
  competences_requises: text("competences_requises"),
  experience_requise: text("experience_requise"),
  niveau_etude: text("niveau_etude"),
  statut: statutOffreEnum("statut").notNull().default("active"),
  date_limite: timestamp("date_limite", { withTimezone: false }),
  accessibilite_handicap: boolean("accessibilite_handicap").default(true),
  amenagements_possibles: text("amenagements_possibles"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});