// @ts-nocheck
import { Request, Response } from "express";
import { CandidatureRepository } from "../repositories/candidature.repository";
import { OffreEmploiRepository } from "../repositories/offre-emploi.repository";
import { EntretienRepository } from "../repositories/entretien.repository";
import { reponseSucces, reponseErreur } from "../utils/reponse";
import { asString } from "../utils/request-helpers";
import { sql, eq, ne, gte, ilike, and } from "drizzle-orm";
import { db } from "../db";
import { 
  candidatureTable, 
  candidatTable, 
  offreEmploiTable, 
  entrepriseTable, 
  utilisateurTable 
} from "../db/schema";

export class AdminCandidatureController {
  private candidatureRepository = new CandidatureRepository();
  private offreRepository = new OffreEmploiRepository();
  private entretienRepository = new EntretienRepository();

  // GET /api/admin/candidatures/toutes
  obtenirToutesCandidatures = async (req: Request, res: Response) => {
    try {
      const role = req.utilisateur?.role;
      const region = req.utilisateur?.region?.trim();

      if (role === "inspecteur" && !region) {
        return reponseErreur(res, 400, "Region manquante pour l'inspecteur");
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Récupérer toutes les candidatures avec détails
      let candidatures = await db.query.candidatureTable.findMany({
        with: {
          candidat: {
            with: {
              utilisateur: true
            }
          },
          offre: {
            with: {
              entreprise: {
                with: {
                  utilisateur: true
                }
              }
            }
          }
        },
        limit,
        offset: (page - 1) * limit,
        orderBy: (candidature, { desc }) => [desc(candidature.date_postulation)]
      });

      if (role === "inspecteur" && region) {
        const regionLower = region.toLowerCase();
        candidatures = candidatures.filter((candidature) =>
          candidature?.candidat?.utilisateur?.addresse?.toLowerCase().includes(regionLower)
        );
      }

      if (role === "aneti") {
        candidatures = candidatures.filter((candidature) =>
          ["shortlisted", "accepted"].includes(candidature.statut)
        );
      }

      return reponseSucces(res, 200, "Candidatures récupérées avec succès", candidatures);
    } catch (error) {
      return reponseErreur(res, 500, `Erreur lors de la récupération des candidatures: ${error.message}`);
    }
  };

  // GET /api/admin/candidatures/statistiques-globales
  obtenirStatistiquesGlobales = async (req: Request, res: Response) => {
    try {
      const role = req.utilisateur?.role;
      const region = req.utilisateur?.region?.trim();

      if (role === "inspecteur" && !region) {
        return reponseErreur(res, 400, "Region manquante pour l'inspecteur");
      }

      const regionWhere = role === "inspecteur" && region
        ? ilike(utilisateurTable.addresse, `%${region}%`)
        : undefined;

      // Statistiques par statut
      let statsParStatutQuery = db
        .select({
          statut: candidatureTable.statut,
          count: sql<number>`count(*)`
        })
        .from(candidatureTable)
        .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur));

      if (regionWhere) {
        statsParStatutQuery = statsParStatutQuery.where(regionWhere);
      }

      const statsParStatut = await statsParStatutQuery.groupBy(candidatureTable.statut);

      // Taux de recrutement
      let totalCandidaturesQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(candidatureTable)
        .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur));

      if (regionWhere) {
        totalCandidaturesQuery = totalCandidaturesQuery.where(regionWhere);
      }

      const totalCandidatures = await totalCandidaturesQuery;

      const candidaturesAccepteesWhere = regionWhere
        ? and(eq(candidatureTable.statut, "accepted"), regionWhere)
        : eq(candidatureTable.statut, "accepted");

      let candidaturesAccepteesQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(candidatureTable)
        .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
        .where(candidaturesAccepteesWhere);

      const candidaturesAcceptees = await candidaturesAccepteesQuery;

      const totalCandidaturesCount = totalCandidatures[0]?.count || 0;
      const candidaturesAccepteesCount = candidaturesAcceptees[0]?.count || 0;

      const tauxRecrutement = totalCandidaturesCount > 0 
        ? (candidaturesAccepteesCount / totalCandidaturesCount) * 100 
        : 0;

      // Temps moyen de traitement
      const traitementWhere = regionWhere
        ? and(ne(candidatureTable.statut, "pending"), regionWhere)
        : ne(candidatureTable.statut, "pending");

      let tempsMoyenTraitementQuery = db
        .select({
          moyenne: sql<number>`AVG(EXTRACT(EPOCH FROM (updated_at - date_postulation)) / 86400)`
        })
        .from(candidatureTable)
        .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
        .where(traitementWhere);

      const tempsMoyenTraitement = await tempsMoyenTraitementQuery;

      // Entreprises les plus actives
      let entreprisesActivesQuery = db
        .select({
          entreprise_nom: entrepriseTable.nom_entreprise,
          nombre_offres: sql<number>`count(DISTINCT ${offreEmploiTable.id})`,
          nombre_candidatures: sql<number>`count(${candidatureTable.id})`
        })
        .from(entrepriseTable)
        .leftJoin(offreEmploiTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
        .leftJoin(candidatureTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
        .leftJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .leftJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur));

      if (regionWhere) {
        entreprisesActivesQuery = entreprisesActivesQuery.where(regionWhere);
      }

      const entreprisesActives = await entreprisesActivesQuery
        .groupBy(entrepriseTable.id, entrepriseTable.nom_entreprise)
        .orderBy(sql`count(${candidatureTable.id}) DESC`)
        .limit(10);

      const statistiques = {
        stats_par_statut: statsParStatut,
        taux_recrutement: Math.round(tauxRecrutement * 100) / 100,
        temps_moyen_traitement_jours: Math.round((tempsMoyenTraitement[0]?.moyenne || 0) * 100) / 100,
        total_candidatures: totalCandidaturesCount,
        entreprises_actives: entreprisesActives
      };

      return reponseSucces(res, 200, "Statistiques récupérées avec succès", statistiques);
    } catch (error) {
      return reponseErreur(res, 500, `Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  };

  // PUT /api/admin/candidatures/:id/override-statut
  modifierStatutAdmin = async (req: Request, res: Response) => {
    try {
      const { statut, motif_admin } = req.body;
      
      const candidature = await this.candidatureRepository.modifierStatutCandidature(asString(req.params.id), {
        statut,
        notes_entreprise: motif_admin ? `[ADMIN OVERRIDE] ${motif_admin}` : undefined
      });

      return reponseSucces(res, 200, "Statut modifié par l'administrateur", candidature);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // POST /api/admin/candidatures/:id/bloquer
  bloquerCandidature = async (req: Request, res: Response) => {
    try {
      const { motif } = req.body;
      
      const candidature = await this.candidatureRepository.modifierStatutCandidature(asString(req.params.id), {
        statut: "rejected",
        motif_refus: `[BLOQUÉ PAR ADMIN] ${motif}`
      });

      return reponseSucces(res, 200, "Candidature bloquée par l'administrateur", candidature);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/admin/workflow-recrutement
  obtenirWorkflowRecrutement = async (req: Request, res: Response) => {
    try {
      const role = req.utilisateur?.role;
      const region = req.utilisateur?.region?.trim();

      if (role === "inspecteur" && !region) {
        return reponseErreur(res, 400, "Region manquante pour l'inspecteur");
      }
      const periode = req.query.periode as string || "30"; // derniers 30 jours par défaut
      const dateDebut = new Date();
      dateDebut.setDate(dateDebut.getDate() - parseInt(periode));

      const workflowWhere = role === "inspecteur" && region
        ? and(
            gte(candidatureTable.date_postulation, dateDebut),
            ilike(utilisateurTable.addresse, `%${region}%`)
          )
        : gte(candidatureTable.date_postulation, dateDebut);

      // Flux de candidatures par étape
      const fluxCandidatures = await db
        .select({
          date: sql<string>`DATE(date_postulation)`,
          nouvelles: sql<number>`count(*)`,
          shortlistees: sql<number>`count(CASE WHEN statut = 'shortlisted' THEN 1 END)`,
          entretiens: sql<number>`count(CASE WHEN statut = 'interview_scheduled' THEN 1 END)`,
          acceptees: sql<number>`count(CASE WHEN statut = 'accepted' THEN 1 END)`,
          refusees: sql<number>`count(CASE WHEN statut = 'rejected' THEN 1 END)`
        })
        .from(candidatureTable)
        .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
        .where(workflowWhere)
        .groupBy(sql`DATE(date_postulation)`)
        .orderBy(sql`DATE(date_postulation)`);

      return reponseSucces(res, fluxCandidatures, "Workflow de recrutement récupéré");
    } catch (error) {
      return reponseErreur(res, 500, `Erreur lors de la récupération du workflow: ${error.message}`);
    }
  };

  // GET /api/admin/detection-abus
  detecterAbus = async (req: Request, res: Response) => {
    try {
      // Candidats avec trop de candidatures récentes
      const candidatsActifs = await db
        .select({
          candidat_id: candidatureTable.id_candidat,
          candidat_nom: utilisateurTable.nom,
          candidat_email: utilisateurTable.email,
          nombre_candidatures: sql<number>`count(*)`,
          derniere_candidature: sql<Date>`max(date_postulation)`
        })
        .from(candidatureTable)
        .innerJoin(candidatTable, eq(candidatureTable.id_candidat, candidatTable.id))
        .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
        .where(gte(candidatureTable.date_postulation, sql`NOW() - INTERVAL '7 days'`))
        .groupBy(candidatureTable.id_candidat, utilisateurTable.nom, utilisateurTable.email)
        .having(sql`count(*) > 20`) // Plus de 20 candidatures en 7 jours
        .orderBy(sql`count(*) DESC`);

      // Entreprises avec taux de refus anormalement élevé
      const entreprisesSuspectes = await db
        .select({
          entreprise_id: offreEmploiTable.id_entreprise,
          entreprise_nom: entrepriseTable.nom_entreprise,
          total_candidatures: sql<number>`count(${candidatureTable.id})`,
          candidatures_refusees: sql<number>`count(CASE WHEN ${candidatureTable.statut} = 'rejected' THEN 1 END)`,
          taux_refus: sql<number>`(count(CASE WHEN ${candidatureTable.statut} = 'rejected' THEN 1 END) * 100.0 / count(${candidatureTable.id}))`
        })
        .from(offreEmploiTable)
        .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
        .innerJoin(candidatureTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
        .groupBy(offreEmploiTable.id_entreprise, entrepriseTable.nom_entreprise)
        .having(sql`count(${candidatureTable.id}) > 10 AND (count(CASE WHEN ${candidatureTable.statut} = 'rejected' THEN 1 END) * 100.0 / count(${candidatureTable.id})) > 90`)
        .orderBy(sql`(count(CASE WHEN ${candidatureTable.statut} = 'rejected' THEN 1 END) * 100.0 / count(${candidatureTable.id})) DESC`);

      const abus = {
        candidats_hyperactifs: candidatsActifs,
        entreprises_taux_refus_eleve: entreprisesSuspectes
      };

      return reponseSucces(res, abus, "Détection d'abus effectuée");
    } catch (error) {
      return reponseErreur(res, 500, `Erreur lors de la détection d'abus: ${error.message}`);
    }
  };
}
