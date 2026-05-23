import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { entretienTable } from "./entretien.schema";
import { utilisateurTable } from "./utilisateur.schema";

export const sessionBienEtreEntretienTable = pgTable(
  "session_bien_etre_entretien",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    id_entretien: uuid("id_entretien")
      .notNull()
      .references(() => entretienTable.id, { onDelete: "cascade" }),
    id_utilisateur: uuid("id_utilisateur")
      .notNull()
      .references(() => utilisateurTable.id_utilisateur, { onDelete: "cascade" }),
    notification_envoyee_le: timestamp("notification_envoyee_le", { withTimezone: false }),
    demarre_le: timestamp("demarre_le", { withTimezone: false }),
    termine_le: timestamp("termine_le", { withTimezone: false }),
    duree_secondes: integer("duree_secondes"),
    points_forts_json: text("points_forts_json"),
    source_points_forts: text("source_points_forts"),
    created_at: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    uniqEntretienUtilisateur: uniqueIndex("session_bien_etre_entretien_entretien_utilisateur_uidx").on(
      table.id_entretien,
      table.id_utilisateur,
    ),
  }),
);
