import { json, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const typeActionEnum = pgEnum("type_action", [
  "creation",
  "modification",
  "suppression",
  "changement_statut",
  "reset_password",
]);

export const auditActionsAdminTable = pgTable("audit_actions_admin", {
  id_action: uuid("id_action").defaultRandom().primaryKey(),
  admin_id: uuid("admin_id")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur),
  utilisateur_cible_id: uuid("utilisateur_cible_id")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur),
  type_action: typeActionEnum("type_action").notNull(),
  anciennes_valeurs: json("anciennes_valeurs"),
  nouvelles_valeurs: json("nouvelles_valeurs"),
  commentaire: text("commentaire"),
  date_action: timestamp("date_action", { withTimezone: false }).defaultNow().notNull(),
});