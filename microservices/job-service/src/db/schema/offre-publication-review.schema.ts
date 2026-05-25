import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { offreEmploiTable } from "./offre-emploi.schema";
import { utilisateurTable } from "./utilisateur.schema";

export const publicationReviewStatusEnum = pgEnum("publication_review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const offrePublicationReviewTable = pgTable("offre_publication_review", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_offre: uuid("id_offre")
    .notNull()
    .references(() => offreEmploiTable.id, { onDelete: "cascade" })
    .unique(),
  status: publicationReviewStatusEnum("status").notNull().default("pending"),
  rejection_reason: text("rejection_reason"),
  reviewed_by: uuid("reviewed_by").references(() => utilisateurTable.id_utilisateur, { onDelete: "set null" }),
  reviewed_at: timestamp("reviewed_at", { withTimezone: false }),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

