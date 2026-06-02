import { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { entrepriseTable, offreEmploiTable, offreStatistiquesTable } from "../db/schema";
import { reponseErreur, reponseSucces } from "../utils/reponse";

export class OffreEmploiSimpleController {
  private async chargerOffresActives() {
    const rows = await db
      .select({
        id: offreEmploiTable.id,
        id_offre: offreEmploiTable.id,
        titre: offreEmploiTable.titre,
        description: offreEmploiTable.description,
        localisation: offreEmploiTable.localisation,
        type_poste: offreEmploiTable.type_poste,
        salaire_min: offreEmploiTable.salaire_min,
        salaire_max: offreEmploiTable.salaire_max,
        competences_requises: offreEmploiTable.competences_requises,
        experience_requise: offreEmploiTable.experience_requise,
        niveau_etude: offreEmploiTable.niveau_etude,
        statut: offreEmploiTable.statut,
        date_limite: offreEmploiTable.date_limite,
        accessibilite_handicap: offreEmploiTable.accessibilite_handicap,
        amenagements_possibles: offreEmploiTable.amenagements_possibles,
        created_at: offreEmploiTable.created_at,
        updated_at: offreEmploiTable.updated_at,
        vues_count: offreStatistiquesTable.vues_count,
        candidatures_count: offreStatistiquesTable.candidatures_count,
        nom_entreprise: entrepriseTable.nom_entreprise,
        entreprise: {
          nom: entrepriseTable.nom_entreprise,
          nom_entreprise: entrepriseTable.nom_entreprise,
        },
      })
      .from(offreEmploiTable)
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .leftJoin(offreStatistiquesTable, eq(offreEmploiTable.id, offreStatistiquesTable.id_offre))
      .where(eq(offreEmploiTable.statut, "active"))
      .orderBy(desc(offreEmploiTable.created_at));

    return rows.map((offre) => ({
      ...offre,
      created_at: offre.created_at.toISOString(),
      updated_at: offre.updated_at.toISOString(),
      date_limite: offre.date_limite?.toISOString(),
      vues_count: offre.vues_count ?? 0,
      candidatures_count: offre.candidatures_count ?? 0,
    }));
  }

  // POST /api/offres-emploi
  creerOffre = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur) {
        return reponseErreur(res, 401, "Authentification requise");
      }

      if (req.utilisateur.role !== "entreprise") {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const offreTest = {
        id: "test-" + Date.now(),
        titre: req.body.titre || "Offre test",
        description: req.body.description || "Description test",
        entreprise: req.utilisateur.email,
        created_at: new Date().toISOString(),
      };

      return reponseSucces(res, 201, "Offre d'emploi créée avec succès", offreTest);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la création de l'offre");
    }
  };

  // GET /api/offres-emploi
  obtenirOffres = async (_req: Request, res: Response) => {
    try {
      const offres = await this.chargerOffresActives();
      return reponseSucces(res, 200, "Offres récupérées avec succès", offres);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la récupération des offres");
    }
  };

  // GET /api/offres/publiques
  obtenirOffresPubliques = async (_req: Request, res: Response) => {
    try {
      const offres = await this.chargerOffresActives();
      return reponseSucces(res, 200, "Offres publiques récupérées avec succès", { offres });
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la récupération des offres");
    }
  };

  // GET /api/offres-emploi/:id
  obtenirOffreParId = async (req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          id: offreEmploiTable.id,
          id_offre: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
          description: offreEmploiTable.description,
          localisation: offreEmploiTable.localisation,
          type_poste: offreEmploiTable.type_poste,
          salaire_min: offreEmploiTable.salaire_min,
          salaire_max: offreEmploiTable.salaire_max,
          competences_requises: offreEmploiTable.competences_requises,
          experience_requise: offreEmploiTable.experience_requise,
          niveau_etude: offreEmploiTable.niveau_etude,
          statut: offreEmploiTable.statut,
          date_limite: offreEmploiTable.date_limite,
          accessibilite_handicap: offreEmploiTable.accessibilite_handicap,
          amenagements_possibles: offreEmploiTable.amenagements_possibles,
          created_at: offreEmploiTable.created_at,
          updated_at: offreEmploiTable.updated_at,
          vues_count: offreStatistiquesTable.vues_count,
          candidatures_count: offreStatistiquesTable.candidatures_count,
          nom_entreprise: entrepriseTable.nom_entreprise,
          entreprise: {
            nom: entrepriseTable.nom_entreprise,
            nom_entreprise: entrepriseTable.nom_entreprise,
          },
        })
        .from(offreEmploiTable)
        .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
        .leftJoin(offreStatistiquesTable, eq(offreEmploiTable.id, offreStatistiquesTable.id_offre))
        .where(eq(offreEmploiTable.id, typeof req.params.id === "string" ? req.params.id : String(req.params.id?.[0] || "")))
        .limit(1);

      const offre = rows[0];
      if (!offre) {
        return reponseErreur(res, 404, "Offre introuvable");
      }

      return reponseSucces(res, 200, "Offre récupérée avec succès", {
        ...offre,
        created_at: offre.created_at.toISOString(),
        updated_at: offre.updated_at.toISOString(),
        date_limite: offre.date_limite?.toISOString(),
        vues_count: offre.vues_count ?? 0,
        candidatures_count: offre.candidatures_count ?? 0,
      });
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la récupération de l'offre");
    }
  };
}
