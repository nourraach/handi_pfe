import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const statutValidationEntrepriseEnum = pgEnum("statut_validation_entreprise", ["valide", "invalide"]);

export const entrepriseTable = pgTable("entreprise", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" })
    .unique(),
  nom_entreprise: text("nom_entreprise").notNull(),
  patente: text("patente").notNull(),
  rne: text("rne").notNull(),
  statut_validation: statutValidationEntrepriseEnum("statut_validation").notNull().default("invalide"),
  profil_publique: boolean("profil_publique").notNull().default(false),
  url_site: text("url_site"),
  date_fondation: timestamp("date_fondation", { withTimezone: false }).notNull(),
  description: text("description").notNull(),
  nbr_employe: integer("nbr_employe").notNull(),
  nbr_employe_handicape: integer("nbr_employe_handicape").notNull(),
  // Nouveaux champs pour le profil étendu
  secteur_activite: text("secteur_activite"),
  taille_entreprise: text("taille_entreprise"),
  siret: text("siret"),
  site_web: text("site_web"),
  politique_handicap: text("politique_handicap"),
  contact_rh_nom: text("contact_rh_nom"),
  contact_rh_email: text("contact_rh_email"),
  contact_rh_telephone: text("contact_rh_telephone"),
  logo_url: text("logo_url"),
  subscription_pack: text("subscription_pack"),
  subscription_status: text("subscription_status"),
  subscription_price_tnd: integer("subscription_price_tnd"),
  subscription_cycle: text("subscription_cycle"),
  subscribed_at: timestamp("subscribed_at", { withTimezone: false }),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});
