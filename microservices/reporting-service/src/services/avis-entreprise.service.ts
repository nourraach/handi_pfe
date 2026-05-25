import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { candidatTable, entrepriseTable } from "../db/schema";
import { ErreurApi } from "../utils/erreur-api";

type CreerAvisPayload = {
  id_entreprise?: string;
  id_candidature?: string;
  note: number;
  commentaire: string;
};

export class AvisEntrepriseService {
  constructor() {
    void this.initialiserTable().catch((erreur) => {
      console.error("[reporting-service] avis_entreprise initialization failed", erreur);
    });
  }

  private async initialiserTable() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS avis_entreprise (
        id TEXT PRIMARY KEY,
        id_candidat UUID NOT NULL REFERENCES candidat(id) ON DELETE CASCADE,
        id_entreprise UUID NOT NULL REFERENCES entreprise(id) ON DELETE CASCADE,
        id_candidature UUID REFERENCES candidature(id) ON DELETE SET NULL,
        note INTEGER NOT NULL,
        commentaire TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS ux_avis_entreprise_candidature ON avis_entreprise(id_candidature);`);
  }

  async creerAvis(idUtilisateurCandidat: string, payload: CreerAvisPayload) {
    const note = Number(payload.note);
    if (!Number.isInteger(note) || note < 1 || note > 5) {
      throw new ErreurApi("La note doit etre comprise entre 1 et 5.", 400);
    }

    const commentaire = String(payload.commentaire || "").trim();
    if (commentaire.length < 10) {
      throw new ErreurApi("Le commentaire doit contenir au moins 10 caracteres.", 400);
    }

    const candidatRows = await db
      .select({ id: candidatTable.id })
      .from(candidatTable)
      .where(eq(candidatTable.id_utilisateur, idUtilisateurCandidat))
      .limit(1);

    const candidatId = candidatRows[0]?.id;
    if (!candidatId) {
      throw new ErreurApi("Profil candidat introuvable.", 404);
    }

    const candidatureRows = await db.execute(sql`
      SELECT c.id AS id_candidature, o.id_entreprise
      FROM candidature c
      INNER JOIN offre_emploi o ON o.id = c.id_offre
      WHERE c.id_candidat = ${candidatId}
        AND c.statut = 'accepted'
        AND (${payload.id_entreprise || null}::uuid IS NULL OR o.id_entreprise = ${payload.id_entreprise || null}::uuid)
        AND (${payload.id_candidature || null}::uuid IS NULL OR c.id = ${payload.id_candidature || null}::uuid)
      ORDER BY c.updated_at DESC
      LIMIT 1
    `);

    const candidature = candidatureRows.rows[0];
    if (!candidature) {
      throw new ErreurApi(
        "Vous ne pouvez laisser un avis qu'apres une candidature acceptee par l'entreprise.",
        403,
      );
    }

    const idAvis = crypto.randomBytes(16).toString("hex");

    try {
      await db.execute(sql`
        INSERT INTO avis_entreprise (id, id_candidat, id_entreprise, id_candidature, note, commentaire, created_at, updated_at)
        VALUES (
          ${idAvis},
          ${candidatId},
          ${String(candidature.id_entreprise)},
          ${String(candidature.id_candidature)},
          ${note},
          ${commentaire},
          NOW(),
          NOW()
        )
      `);
    } catch (error: any) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("duplicate") || message.includes("ux_avis_entreprise_candidature")) {
        throw new ErreurApi("Un avis existe deja pour cette candidature acceptee.", 409);
      }
      throw error;
    }

    return {
      id: idAvis,
      id_entreprise: String(candidature.id_entreprise),
      id_candidature: String(candidature.id_candidature),
      note,
      commentaire,
    };
  }

  async listerMesAvis(idUtilisateurCandidat: string) {
    const candidatRows = await db
      .select({ id: candidatTable.id })
      .from(candidatTable)
      .where(eq(candidatTable.id_utilisateur, idUtilisateurCandidat))
      .limit(1);

    const candidatId = candidatRows[0]?.id;
    if (!candidatId) {
      return [];
    }

    const rows = await db.execute(sql`
      SELECT a.id, a.note, a.commentaire, a.created_at, a.id_entreprise, e.nom_entreprise
      FROM avis_entreprise a
      INNER JOIN entreprise e ON e.id = a.id_entreprise
      WHERE a.id_candidat = ${candidatId}
      ORDER BY a.created_at DESC
    `);

    return rows.rows.map((row) => ({
      id: String(row.id),
      id_entreprise: String(row.id_entreprise),
      nom_entreprise: String(row.nom_entreprise || "Entreprise"),
      note: Number(row.note || 0),
      commentaire: String(row.commentaire || ""),
      created_at: row.created_at,
    }));
  }

  async listerAvisEntreprise(idEntreprise: string) {
    const rows = await db.execute(sql`
      SELECT a.id, a.note, a.commentaire, a.created_at
      FROM avis_entreprise a
      WHERE a.id_entreprise = ${idEntreprise}
      ORDER BY a.created_at DESC
    `);

    const moyenneRows = await db.execute(sql`
      SELECT COALESCE(AVG(note), 0) AS moyenne, COUNT(*) AS total
      FROM avis_entreprise
      WHERE id_entreprise = ${idEntreprise}
    `);

    const moyenne = moyenneRows.rows[0];

    return {
      moyenne_note: Number(moyenne?.moyenne || 0),
      total_avis: Number(moyenne?.total || 0),
      avis: rows.rows.map((row) => ({
        id: String(row.id),
        note: Number(row.note || 0),
        commentaire: String(row.commentaire || ""),
        created_at: row.created_at,
      })),
    };
  }
}
