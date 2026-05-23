import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const conversationTable = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const conversationParticipantTable = pgTable("conversation_participant", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversation_id: uuid("conversation_id")
    .notNull()
    .references(() => conversationTable.id, { onDelete: "cascade" }),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" }),
  role: text("role").notNull(), // valeur du RoleUtilisateur
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const messageTable = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversation_id: uuid("conversation_id")
    .notNull()
    .references(() => conversationTable.id, { onDelete: "cascade" }),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" }),
  role: text("role").notNull(), // RoleUtilisateur
  contenu: text("contenu").notNull(),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});
