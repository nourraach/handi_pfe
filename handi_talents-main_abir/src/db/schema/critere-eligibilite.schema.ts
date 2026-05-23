import { pgTable, text, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { offreEmploiTable } from "./offre-emploi.schema";

export const critereEligibiliteTable = pgTable("critere_eligibilite", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_offre: uuid("id_offre")
    .notNull()
    .references(() => offreEmploiTable.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  type_critere: text("type_critere").notNull(), // "competence", "experience", "formation", "handicap"
  valeur_requise: text("valeur_requise"),
  niveau_minimum: integer("niveau_minimum"),
  obligatoire: boolean("obligatoire").default(true),
});