import { pgEnum, pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { candidatTable } from "./candidat.schema";
import { offreEmploiTable } from "./offre-emploi.schema";

export const statutCandidatureEnum = pgEnum("statut_candidature", [
  "pending",
  "shortlisted", 
  "interview_scheduled",
  "rejected",
  "accepted"
]);

export const candidatureTable = pgTable("candidature", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_candidat: uuid("id_candidat")
    .notNull()
    .references(() => candidatTable.id, { onDelete: "cascade" }),
  id_offre: uuid("id_offre")
    .notNull()
    .references(() => offreEmploiTable.id, { onDelete: "cascade" }),
  date_postulation: timestamp("date_postulation", { withTimezone: false }).defaultNow().notNull(),
  statut: statutCandidatureEnum("statut").notNull().default("pending"),
  motif_refus: text("motif_refus"),
  score_test: integer("score_test"),
  lettre_motivation: text("lettre_motivation"),
  cv_url: text("cv_url"),
  notes_entreprise: text("notes_entreprise"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});