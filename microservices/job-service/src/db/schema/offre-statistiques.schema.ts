import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { offreEmploiTable } from "./offre-emploi.schema";

export const offreStatistiquesTable = pgTable("offre_statistiques", {
  id_offre: uuid("id_offre")
    .notNull()
    .references(() => offreEmploiTable.id, { onDelete: "cascade" })
    .primaryKey(),
  vues_count: integer("vues_count").default(0).notNull(),
  candidatures_count: integer("candidatures_count").default(0).notNull(),
});