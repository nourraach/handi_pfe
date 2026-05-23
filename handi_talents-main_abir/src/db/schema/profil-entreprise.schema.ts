import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const profilEntrepriseTable = pgTable("profil_entreprise", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" })
    .unique(),
  secteur: text("secteur"),
  taille: text("taille"),
  description: text("description"),
  site_web: text("site_web"),
  siret: text("siret"),
  contact_rh: text("contact_rh"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});