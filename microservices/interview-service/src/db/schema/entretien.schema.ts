import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { candidatureTable } from "./candidature.schema";

export const typeEntretienEnum = pgEnum("type_entretien", ["visio", "presentiel", "telephonique"]);
export const statutEntretienEnum = pgEnum("statut_entretien", ["planifie", "confirme", "reporte", "annule", "termine"]);

export const entretienTable = pgTable("entretien", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_candidature: uuid("id_candidature")
    .notNull()
    .references(() => candidatureTable.id, { onDelete: "cascade" }),
  date_heure: timestamp("date_heure", { withTimezone: false }).notNull(),
  type: typeEntretienEnum("type").notNull(),
  lieu_visio: text("lieu_visio"),
  lieu: text("lieu"),
  statut: statutEntretienEnum("statut").notNull().default("planifie"),
  notes: text("notes"),
  duree_prevue: text("duree_prevue"),
  contact_entreprise: text("contact_entreprise"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});