import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { candidatureTable, candidatTable, entrepriseTable, offreEmploiTable, utilisateurTable } from "../db/schema";
import { FiltreCandidatureDto, ModifierStatutCandidatureDto, PostulerDto } from "../dto/candidature.dto";

export class CandidatureRepository {
  async obtenirCandidatureParCandidatEtOffre(idCandidat: string, idOffre: string) {
    const [candidature] = await db
      .select()
      .from(candidatureTable)
      .where(and(eq(candidatureTable.id_candidat, idCandidat), eq(candidatureTable.id_offre, idOffre)))
      .limit(1);

    return candidature;
  }

  async postuler(idCandidat: string, donnees: PostulerDto) {
    const candidatureExistante = await db
      .select()
      .from(candidatureTable)
      .where(and(eq(candidatureTable.id_candidat, idCandidat), eq(candidatureTable.id_offre, donnees.id_offre)));

    if (candidatureExistante.length > 0) {
      throw new Error("Vous avez deja postule a cette offre");
    }

    const [candidature] = await db
      .insert(candidatureTable)
      .values({
        id_candidat: idCandidat,
        id_offre: donnees.id_offre,
        lettre_motivation: donnees.lettre_motivation,
        cv_url: donnees.cv_url,
      })
      .returning();

    return candidature;
  }

  async obtenirCandidaturesCandidat(idCandidat: string) {
    return await db
      .select({
        candidature: candidatureTable,
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
          localisation: offreEmploiTable.localisation,
          type_poste: offreEmploiTable.type_poste,
        },
        entreprise: {
          id: entrepriseTable.id,
          nom: entrepriseTable.nom_entreprise,
        },
      })
      .from(candidatureTable)
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(candidatureTable.id_candidat, idCandidat))
      .orderBy(desc(candidatureTable.date_postulation));
  }

  async obtenirCandidaturesEntreprise(idEntreprise: string, filtres: FiltreCandidatureDto = {}) {
    const { page = 1, limit = 10, ...autresFiltres } = filtres;
    const offset = (page - 1) * limit;

    const conditions = [eq(offreEmploiTable.id_entreprise, idEntreprise)];

    if (autresFiltres.id_offre) {
      conditions.push(eq(candidatureTable.id_offre, autresFiltres.id_offre));
    }

    if (autresFiltres.statut) {
      conditions.push(eq(candidatureTable.statut, autresFiltres.statut as any));
    }

    if (autresFiltres.score_min !== undefined) {
      conditions.push(gte(candidatureTable.score_test, autresFiltres.score_min));
    }

    if (autresFiltres.score_max !== undefined) {
      conditions.push(lte(candidatureTable.score_test, autresFiltres.score_max));
    }

    const rows = await db
      .select({
        candidature: candidatureTable,
        candidat: {
          id: candidatTable.id,
          id_utilisateur: utilisateurTable.id_utilisateur,
          nom: utilisateurTable.nom,
          email: utilisateurTable.email,
          telephone: utilisateurTable.telephone,
          competences: candidatTable.competences,
          experience: candidatTable.experience,
          handicap: candidatTable.handicap,
          cv_url: candidatTable.cv_url,
          video_cv_url: candidatTable.video_cv_url,
          visibilite: candidatTable.visibilite,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
        },
      })
      .from(candidatureTable)
      .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .where(and(...conditions))
      .orderBy(desc(candidatureTable.date_postulation))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => {
      const visibilite = (row.candidat?.visibilite || {}) as {
        email?: boolean;
        telephone?: boolean;
        handicap?: boolean;
        experience?: boolean;
        competences?: boolean;
      };
      const isVisible = (key: keyof typeof visibilite) => visibilite?.[key] !== false;

      const candidat: any = {
        id: row.candidat.id,
        id_utilisateur: row.candidat.id_utilisateur,
        nom: row.candidat.nom,
        competences: isVisible("competences") ? row.candidat.competences : [],
        experience: isVisible("experience") ? row.candidat.experience : null,
        handicap: isVisible("handicap") ? row.candidat.handicap : null,
        cv_url: row.candidat.cv_url,
        video_cv_url: row.candidat.video_cv_url,
      };
      if (isVisible("email")) candidat.email = row.candidat.email;
      if (isVisible("telephone")) candidat.telephone = row.candidat.telephone;

      return {
        candidature: row.candidature,
        candidat,
        offre: row.offre,
      };
    });
  }

  async modifierStatutCandidature(id: string, donnees: ModifierStatutCandidatureDto) {
    const [candidature] = await db
      .update(candidatureTable)
      .set({
        ...donnees,
        updated_at: new Date(),
      })
      .where(eq(candidatureTable.id, id))
      .returning();

    return candidature;
  }

  async obtenirCandidatureParId(id: string) {
    const [row] = await db
      .select({
        candidature: candidatureTable,
        candidat: {
          id: candidatTable.id,
          id_utilisateur: utilisateurTable.id_utilisateur,
          nom: utilisateurTable.nom,
          email: utilisateurTable.email,
          telephone: utilisateurTable.telephone,
          competences: candidatTable.competences,
          experience: candidatTable.experience,
          handicap: candidatTable.handicap,
          cv_url: candidatTable.cv_url,
          video_cv_url: candidatTable.video_cv_url,
          visibilite: candidatTable.visibilite,
        },
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
          description: offreEmploiTable.description,
        },
        entreprise: {
          id: entrepriseTable.id,
          id_utilisateur: entrepriseTable.id_utilisateur,
          nom: entrepriseTable.nom_entreprise,
          contact_rh_nom: entrepriseTable.contact_rh_nom,
          contact_rh_email: entrepriseTable.contact_rh_email,
          contact_rh_telephone: entrepriseTable.contact_rh_telephone,
        },
      })
      .from(candidatureTable)
      .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(candidatureTable.id, id));

    if (!row) return row;

    const visibilite = (row.candidat?.visibilite || {}) as {
      email?: boolean;
      telephone?: boolean;
      handicap?: boolean;
      experience?: boolean;
      competences?: boolean;
    };
    const isVisible = (key: keyof typeof visibilite) => visibilite?.[key] !== false;

    const candidat: any = {
      id: row.candidat.id,
      id_utilisateur: row.candidat.id_utilisateur,
      nom: row.candidat.nom,
      competences: isVisible("competences") ? row.candidat.competences : [],
      experience: isVisible("experience") ? row.candidat.experience : null,
      handicap: isVisible("handicap") ? row.candidat.handicap : null,
      cv_url: row.candidat.cv_url,
      video_cv_url: row.candidat.video_cv_url,
    };
    if (isVisible("email")) candidat.email = row.candidat.email;
    if (isVisible("telephone")) candidat.telephone = row.candidat.telephone;

    return {
      candidature: row.candidature,
      candidat,
      offre: row.offre,
      entreprise: row.entreprise,
    };
  }

  async obtenirStatistiquesEntreprise(idEntreprise: string) {
    return await db
      .select({
        statut: candidatureTable.statut,
        count: sql<number>`count(*)`,
      })
      .from(candidatureTable)
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .where(eq(offreEmploiTable.id_entreprise, idEntreprise))
      .groupBy(candidatureTable.statut);
  }

  async obtenirStatistiquesCandidat(idCandidat: string) {
    return await db
      .select({
        statut: candidatureTable.statut,
        count: sql<number>`count(*)`,
      })
      .from(candidatureTable)
      .where(eq(candidatureTable.id_candidat, idCandidat))
      .groupBy(candidatureTable.statut);
  }
}
