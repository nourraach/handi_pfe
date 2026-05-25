import { boolean, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { candidatTable } from "./candidat.schema";

export const candidateMatchingConsentTable = pgTable("candidate_matching_consent", {
  id_candidat: uuid("id_candidat")
    .notNull()
    .primaryKey()
    .references(() => candidatTable.id, { onDelete: "cascade" }),
  allow_accessibility_matching: boolean("allow_accessibility_matching").notNull().default(false),
  allow_semantic_embedding: boolean("allow_semantic_embedding").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

