import { integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { utilisateurTable } from "./utilisateur.schema";

export const candidatTable = pgTable("candidat", {
  id: uuid("id").defaultRandom().primaryKey(),
  id_utilisateur: uuid("id_utilisateur")
    .notNull()
    .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" })
    .unique(),
  type_handicap: text("type_handicap").notNull(),
  num_carte_handicap: text("num_carte_handicap").notNull(),
  date_expiration_carte_handicap: timestamp("date_expiration_carte_handicap", { withTimezone: false }).notNull(),
  niveau_academique: text("niveau_academique").notNull(),
  description: text("description").notNull(),
  secteur: text("secteur").notNull(),
  type_licence: text("type_licence").notNull(),
  preference_communication: text("preference_communication").notNull(),
  age: integer("age").notNull(),
  // Nouveaux champs pour le profil étendu
  competences: json("competences").$type<string[]>(),
  experience: text("experience"),
  formation: text("formation"),
  handicap: text("handicap"),
  disponibilite: text("disponibilite"),
  salaire_souhaite: text("salaire_souhaite"),
  cv_url: text("cv_url"),
  preferences_accessibilite: json("preferences_accessibilite").$type<string[]>(),
  visibilite: json("visibilite").$type<{ email?: boolean; telephone?: boolean; handicap?: boolean }>(),
  carte_handicap_url: text("carte_handicap_url"),
  video_cv_url: text("video_cv_url"),
  photo_profil_url: text("photo_profil_url"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});
