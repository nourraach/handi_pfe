import { boolean, decimal, integer, json, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";
import { candidatTable } from "./candidat.schema";

// Enum pour les types de questions
export const typeQuestionEnum = pgEnum("type_question", [
  "choix_multiple",
  "vrai_faux",
  "echelle_likert",
  "texte_libre"
]);

// Enum pour le statut du test
export const statutTestEnum = pgEnum("statut_test", [
  "actif",
  "inactif",
  "archive"
]);

// Table des tests psychologiques
export const testPsychologiqueTable = pgTable("test_psychologique", {
  id_test: uuid("id_test").defaultRandom().primaryKey(),
  titre: text("titre").notNull(),
  description: text("description").notNull(),
  type_test: text("type_test").notNull(), // ex: "soft_skills", "personnalite", etc.
  score_total: decimal("score_total", { precision: 5, scale: 2 }).notNull(),
  duree_minutes: integer("duree_minutes").notNull(), // durée en minutes
  statut: statutTestEnum("statut").notNull().default("actif"),
  date_debut_validite: timestamp("date_debut_validite", { withTimezone: false }).notNull(),
  date_fin_validite: timestamp("date_fin_validite", { withTimezone: false }).notNull(),
  instructions: text("instructions"), // instructions pour passer le test
  created_by: uuid("created_by")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

// Table des questions
export const questionTable = pgTable("question", {
  id_question: uuid("id_question").defaultRandom().primaryKey(),
  id_test: uuid("id_test")
    .notNull()
    .references(() => testPsychologiqueTable.id_test, { onDelete: "cascade" }),
  contenu_question: text("contenu_question").notNull(),
  type_question: typeQuestionEnum("type_question").notNull(),
  score_question: decimal("score_question", { precision: 5, scale: 2 }).notNull(),
  ordre: integer("ordre").notNull(), // ordre d'affichage de la question
  obligatoire: boolean("obligatoire").default(true),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

// Table des options de réponse (pour choix multiple, vrai/faux, etc.)
export const optionReponseTable = pgTable("option_reponse", {
  id_option: uuid("id_option").defaultRandom().primaryKey(),
  id_question: uuid("id_question")
    .notNull()
    .references(() => questionTable.id_question, { onDelete: "cascade" }),
  texte_option: text("texte_option").notNull(),
  est_correcte: boolean("est_correcte").default(false),
  score_option: decimal("score_option", { precision: 5, scale: 2 }).default("0"),
  ordre: integer("ordre").notNull(),
});

// Table des résultats de test
export const resultatTestTable = pgTable("resultat_test", {
  id_resultat: uuid("id_resultat").defaultRandom().primaryKey(),
  id_test: uuid("id_test")
    .notNull()
    .references(() => testPsychologiqueTable.id_test),
  id_candidat: uuid("id_candidat")
    .notNull()
    .references(() => candidatTable.id_utilisateur),
  score_obtenu: decimal("score_obtenu", { precision: 5, scale: 2 }).notNull(),
  pourcentage: decimal("pourcentage", { precision: 5, scale: 2 }).notNull(),
  temps_passe_minutes: integer("temps_passe_minutes"), // temps réellement passé
  est_visible: boolean("est_visible").default(true), // choix du candidat d'afficher ou cacher
  date_passage: timestamp("date_passage", { withTimezone: false }).defaultNow().notNull(),
  reponses: json("reponses").$type<{
    id_question: string;
    id_option?: string;
    reponse_texte?: string;
    score_obtenu: number;
  }[]>(), // stockage des réponses détaillées
});

// Table pour suivre les tentatives (pour s'assurer qu'un candidat ne passe qu'une fois par période)
export const tentativeTestTable = pgTable("tentative_test", {
  id_tentative: uuid("id_tentative").defaultRandom().primaryKey(),
  id_test: uuid("id_test")
    .notNull()
    .references(() => testPsychologiqueTable.id_test),
  id_candidat: uuid("id_candidat")
    .notNull()
    .references(() => candidatTable.id_utilisateur),
  date_tentative: timestamp("date_tentative", { withTimezone: false }).defaultNow().notNull(),
  est_termine: boolean("est_termine").default(false),
  date_debut: timestamp("date_debut", { withTimezone: false }),
  date_fin: timestamp("date_fin", { withTimezone: false }),
});