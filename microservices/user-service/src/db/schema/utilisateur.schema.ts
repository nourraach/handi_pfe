import { pgEnum, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { GenreUtilisateur, RoleUtilisateur, StatutUtilisateur } from "../../types/enums";

export const roleUtilisateurEnum = pgEnum("role_utilisateur", Object.values(RoleUtilisateur) as [string, ...string[]]);

export const statutUtilisateurEnum = pgEnum("statut_utilisateur", Object.values(StatutUtilisateur) as [string, ...string[]]);

export const genreUtilisateurEnum = pgEnum("genre_utilisateur", Object.values(GenreUtilisateur) as [string, ...string[]]);

export const utilisateurTable = pgTable("utilisateur", {
  id_utilisateur: uuid("id_utilisateur").defaultRandom().primaryKey(),
  nom: text("nom").notNull(),
  mdp: text("mdp").notNull(),
  telephone: text("telephone").notNull(),
  addresse: text("addresse").notNull(),
  email: text("email").notNull().unique(),
  region: text("region"),
  gouvernorat: text("gouvernorat"),
  delegation: text("delegation"),
  statut: statutUtilisateurEnum("statut").notNull().default("en_attente"),
  role: roleUtilisateurEnum("role").notNull(),
  genre: genreUtilisateurEnum("genre"),
  token_activation: text("token_activation"),
  derniere_connexion: timestamp("derniere_connexion", { withTimezone: false }),
  profil_complete: boolean("profil_complete").default(false),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});
