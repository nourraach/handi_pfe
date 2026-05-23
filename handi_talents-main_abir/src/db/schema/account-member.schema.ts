import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { entrepriseTable } from "./entreprise.schema";

export const accountMemberTable = pgTable("account_member", {
  id: uuid("id").defaultRandom().primaryKey(),
  entreprise_id: uuid("entreprise_id")
    .notNull()
    .references(() => entrepriseTable.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  role: text("role"),
  telephone: text("telephone"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});
