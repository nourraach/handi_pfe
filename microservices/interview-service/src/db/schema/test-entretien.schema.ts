import { pgTable, uuid, text, json, timestamp } from "drizzle-orm/pg-core";
import { offreEmploiTable, utilisateurTable } from "./index";

export const testEntretienTable = pgTable("test_entretien", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_offre: uuid("id_offre").notNull().references(() => offreEmploiTable.id, { onDelete: "cascade" }),
  titre: text("titre").notNull(),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const testEntretienQuestionTable = pgTable("test_entretien_question", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_test: uuid("id_test").notNull().references(() => testEntretienTable.id, { onDelete: "cascade" }),
  texte: text("texte").notNull(),
  type: text("type").notNull(), // texte | choix
  options: json("options").$type<string[]>(),
  ordre: text("ordre"),
});

export const testEntretienResultatTable = pgTable("test_entretien_resultat", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_test: uuid("id_test").notNull().references(() => testEntretienTable.id, { onDelete: "cascade" }),
  id_candidat: uuid("id_candidat").notNull().references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" }),
  reponses: json("reponses").$type<any>(),
  score: text("score"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});
