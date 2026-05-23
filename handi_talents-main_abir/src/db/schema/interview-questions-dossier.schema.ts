import { boolean, pgTable, text, timestamp, uniqueIndex, uuid, index } from "drizzle-orm/pg-core";
import { candidatureTable } from "./candidature.schema";
import { candidatTable } from "./candidat.schema";
import { offreEmploiTable } from "./offre-emploi.schema";

/**
 * Feature 02 — Predicteur de questions d'entretien personnalise
 * Stocke un dossier de questions probables generees par l'IA (Gemini 2.0 Flash)
 * lors du passage d'une candidature au statut "shortlisted".
 *
 * Statuts:
 *  - "pending"     : enregistrement cree, job pas encore demarre
 *  - "processing"  : appel IA en cours
 *  - "ready"       : questions disponibles
 *  - "failed"      : echec final (apres retry+fallback) - tres rare car fallback couvre
 */
export const interviewQuestionsDossierTable = pgTable(
  "interview_questions_dossier",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    id_candidature: uuid("id_candidature")
      .notNull()
      .references(() => candidatureTable.id, { onDelete: "cascade" }),
    id_candidat: uuid("id_candidat")
      .notNull()
      .references(() => candidatTable.id, { onDelete: "cascade" }),
    id_offre: uuid("id_offre")
      .notNull()
      .references(() => offreEmploiTable.id, { onDelete: "cascade" }),
    // JSON stringifie: InterviewQuestion[]
    questions_json: text("questions_json"),
    // JSON stringifie: { titre, intro, questions: [{ question, conseil_reponse }] } | null
    handicap_block_json: text("handicap_block_json"),
    // JSON stringifie de l'analyse des gaps (audit / debug)
    gaps_analysis_json: text("gaps_analysis_json"),
    // "gemini" | "fallback"
    source: text("source"),
    // hash(id_offre + id_candidat + profile_version) — utilise pour cache hit
    cache_key: text("cache_key"),
    // empeche les regenerations multiples (1 fois max)
    regenerated_once: boolean("regenerated_once").notNull().default(false),
    // "pending" | "processing" | "ready" | "failed"
    generation_status: text("generation_status").notNull().default("pending"),
    error_message: text("error_message"),
    created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    uniqCandidature: uniqueIndex("interview_questions_dossier_candidature_uidx").on(table.id_candidature),
    idxCandidatStatus: index("interview_questions_dossier_candidat_status_idx").on(
      table.id_candidat,
      table.generation_status,
    ),
    idxCacheKey: index("interview_questions_dossier_cache_key_idx").on(table.cache_key),
  }),
);
