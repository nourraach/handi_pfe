import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const typeNotificationEnum = pgEnum("type_notification", [
  "candidature_status_change",
  "interview_scheduled", 
  "new_message",
  "offre_favorite_updated",
  "system"
]);

export const notificationTable = pgTable("notification", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" }),
  type: typeNotificationEnum("type").notNull(),
  titre: text("titre").notNull(),
  message: text("message").notNull(),
  lu: boolean("lu").default(false),
  data: text("data"), // JSON pour données additionnelles
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});