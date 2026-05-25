import { boolean, date, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const adminTable = pgTable("admin", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" })
    .unique(),
  poste: text("poste"),
  departement: text("departement"),
  date_embauche: date("date_embauche"),
  permissions: json("permissions").$type<string[]>(),
  notifications_email: boolean("notifications_email").default(true),
  notifications_sms: boolean("notifications_sms").default(false),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});