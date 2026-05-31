import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "../db";
import { candidatTable, utilisateurTable } from "../db/schema";

export type CandidatVisibleEntreprise = {
  id: string;
  nom: string;
  competences: string[];
  experience: string | null;
  niveau_academique: string;
  secteur: string;
  disponibilite: string | null;
  cv_url: string | null;
  video_cv_url: string | null;
  photo_profil_url: string | null;
  email?: string;
  telephone?: string;
};

export class EntrepriseCandidatService {
  async listerCandidats(options?: { page?: number; limit?: number; recherche?: string; competence?: string }) {
    const page = Math.max(1, Number(options?.page || 1));
    const limit = Math.min(50, Math.max(1, Number(options?.limit || 10)));
    const offset = (page - 1) * limit;

    const conditions = [] as any[];

    if (options?.recherche) {
      const pattern = `%${options.recherche.trim()}%`;
      conditions.push(ilike(utilisateurTable.nom, pattern));
    }

    if (options?.competence) {
      const pattern = `%${options.competence.trim()}%`;
      conditions.push(sql`${candidatTable.competences}::text ILIKE ${pattern}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: candidatTable.id,
        nom: utilisateurTable.nom,
        email: utilisateurTable.email,
        telephone: utilisateurTable.telephone,
        competences: candidatTable.competences,
        experience: candidatTable.experience,
        niveau_academique: candidatTable.niveau_academique,
        secteur: candidatTable.secteur,
        disponibilite: candidatTable.disponibilite,
        cv_url: candidatTable.cv_url,
        video_cv_url: candidatTable.video_cv_url,
        photo_profil_url: candidatTable.photo_profil_url,
        visibilite: candidatTable.visibilite,
      })
      .from(candidatTable)
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(candidatTable)
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(whereClause);

    const total = Number(totalRows[0]?.count || 0);

    const candidats: CandidatVisibleEntreprise[] = rows.map((row) => {
      const visibilite = (row.visibilite || {}) as {
        email?: boolean;
        telephone?: boolean;
        experience?: boolean;
        competences?: boolean;
        documents?: boolean;
      };
      const isVisible = (key: keyof typeof visibilite) => visibilite?.[key] !== false;

      const competences = Array.isArray(row.competences) ? row.competences : [];
      const experience = row.experience || null;
      const cvUrl = row.cv_url || null;
      const videoUrl = row.video_cv_url || null;
      const photoUrl = row.photo_profil_url || null;

      return {
        id: row.id,
        nom: row.nom,
        competences: isVisible("competences") ? competences : [],
        experience: isVisible("experience") ? experience : null,
        niveau_academique: row.niveau_academique,
        secteur: row.secteur,
        disponibilite: row.disponibilite || null,
        cv_url: isVisible("documents") ? cvUrl : null,
        video_cv_url: isVisible("documents") ? videoUrl : null,
        photo_profil_url: isVisible("documents") ? photoUrl : null,
        ...(isVisible("email") ? { email: row.email } : {}),
        ...(isVisible("telephone") ? { telephone: row.telephone } : {}),
      };
    });

    return {
      candidats,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
