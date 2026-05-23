import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { candidatTable } from "./candidat.schema";
import { offreEmploiTable } from "./offre-emploi.schema";

export const favorisTable = pgTable("favoris", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_candidat: uuid("id_candidat")
    .notNull()
    .references(() => candidatTable.id, { onDelete: "cascade" }),
  id_offre: uuid("id_offre")
    .notNull()
    .references(() => offreEmploiTable.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});