import { json, numeric, pgEnum, pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { candidatTable } from "./candidat.schema";
import { offreEmploiTable } from "./offre-emploi.schema";

export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "pending",
  "notified",
  "viewed",
  "applied",
  "dismissed",
]);

export const recommendationTable = pgTable(
  "recommendation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    id_candidat: uuid("id_candidat")
      .notNull()
      .references(() => candidatTable.id, { onDelete: "cascade" }),
    id_offre: uuid("id_offre")
      .notNull()
      .references(() => offreEmploiTable.id, { onDelete: "cascade" }),
    score_final: numeric("score_final", { precision: 5, scale: 4 }).notNull(),
    score_semantic: numeric("score_semantic", { precision: 5, scale: 4 }).default("0").notNull(),
    score_skills: numeric("score_skills", { precision: 5, scale: 4 }).default("0").notNull(),
    score_preferences: numeric("score_preferences", { precision: 5, scale: 4 }).default("0").notNull(),
    score_accessibility: numeric("score_accessibility", { precision: 5, scale: 4 }).default("0").notNull(),
    explanation_json: json("explanation_json").$type<Record<string, unknown>>().notNull(),
    status: recommendationStatusEnum("status").notNull().default("pending"),
    notified_at: timestamp("notified_at", { withTimezone: false }),
    viewed_at: timestamp("viewed_at", { withTimezone: false }),
    created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
    meta: text("meta"),
  },
  (table) => [
    unique("recommendation_candidate_offer_unique").on(table.id_candidat, table.id_offre),
  ],
);

