// @ts-nocheck
import { Request, Response } from "express";
import { CandidatureService } from "../services/candidature.service";
import { reponseSucces, reponseErreur } from "../utils/reponse";
import { asString } from "../utils/request-helpers";
import { ErreurApi } from "../utils/erreur-api";

const extraireErreurHttp = (erreur: unknown) => {
  if (erreur instanceof ErreurApi) {
    return {
      statutHttp: erreur.statutHttp,
      message: erreur.message,
    };
  }

  if (erreur instanceof Error) {
    const statusCode =
      typeof (erreur as { statusCode?: unknown }).statusCode === "number"
        ? (erreur as { statusCode: number }).statusCode
        : 500;

    return {
      statutHttp: statusCode,
      message: erreur.message || "Une erreur interne est survenue.",
    };
  }

  return {
    statutHttp: 500,
    message: "Une erreur interne est survenue.",
  };
};

export class CandidatureController {
  private candidatureService = new CandidatureService();

  private async obtenirIdCandidatDepuisRequete(req: Request): Promise<string | null> {
    if (req.utilisateur?.role !== "candidat") {
      return null;
    }

    const idDepuisToken = req.utilisateur?.candidat?.id;
    if (idDepuisToken) {
      return idDepuisToken;
    }

    const idUtilisateur = req.utilisateur?.id_utilisateur;
    if (!idUtilisateur) {
      return null;
    }

    return this.candidatureService.resoudreIdCandidat(idUtilisateur);
  }

  // POST /api/candidatures/postuler
  postuler = async (req: Request, res: Response) => {
    const cvFile = (req as Request & { file?: Express.Multer.File }).file;
    const donnees = {
      id_offre: req.body?.id_offre,
      lettre_motivation: req.body?.lettre_motivation ?? req.body?.message_motivation,
      cv_url: cvFile?.path ? cvFile.path.replace(/^.*public[\\/]/, "/") : req.body?.cv_url,
    };

    try {
      const idCandidat = await this.obtenirIdCandidatDepuisRequete(req);
      if (!idCandidat) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }

      if (!donnees.id_offre) {
        return reponseErreur(res, 400, "Le champ id_offre est requis");
      }

      if (!donnees.cv_url) {
        return reponseErreur(res, 400, "Le CV est obligatoire pour postuler a cette offre");
      }

      const candidature = await this.candidatureService.postuler(idCandidat, donnees);
      const message =
        candidature?.statut === "shortlisted"
          ? "Candidature envoyee et preselectionnee automatiquement par l'IA."
          : candidature?.statut === "rejected"
            ? `Candidature evaluee automatiquement: non retenue. ${candidature?.motif_refus || ""}`.trim()
            : "Candidature envoyee avec succes. Analyse IA en cours.";

      return reponseSucces(res, 201, message, candidature);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);

      console.error("[POST /api/candidatures]", {
        statutHttp,
        message,
        idCandidat: req.utilisateur?.candidat?.id,
        idUtilisateur: req.utilisateur?.id_utilisateur,
        body: donnees,
        stack: erreur instanceof Error ? erreur.stack : undefined,
      });

      return reponseErreur(res, statutHttp, message);
    }
  };

  // GET /api/candidatures/mes-candidatures
  obtenirMesCandidatures = async (req: Request, res: Response) => {
    try {
      const idCandidat = await this.obtenirIdCandidatDepuisRequete(req);
      if (!idCandidat) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }

      const candidatures = await this.candidatureService.obtenirCandidaturesCandidat(idCandidat);
      return reponseSucces(res, candidatures, "Candidatures recuperees avec succes");
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // GET /api/candidatures/entreprise
  obtenirCandidaturesEntreprise = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise || req.utilisateur.role !== "entreprise") {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const filtres = {
        statut: asString(req.query.statut),
        id_offre: asString(req.query.id_offre) || undefined,
        score_min: req.query.score_min ? parseInt(asString(req.query.score_min)) : undefined,
        score_max: req.query.score_max ? parseInt(asString(req.query.score_max)) : undefined,
        competences: req.query.competences ? asString(req.query.competences).split(",") : undefined,
        date_debut: req.query.date_debut ? new Date(asString(req.query.date_debut)) : undefined,
        date_fin: req.query.date_fin ? new Date(asString(req.query.date_fin)) : undefined,
        page: parseInt(asString(req.query.page)) || 1,
        limit: parseInt(asString(req.query.limit)) || 10,
      };

      const candidatures = await this.candidatureService.obtenirCandidaturesEntreprise(idEntreprise, filtres);
      return reponseSucces(res, candidatures, "Candidatures recuperees avec succes");
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // GET /api/candidatures/offre/:idOffre
  obtenirCandidaturesParOffre = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise || req.utilisateur.role !== "entreprise") {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const filtres = {
        statut: asString(req.query.statut),
        score_min: req.query.score_min ? parseInt(asString(req.query.score_min)) : undefined,
        score_max: req.query.score_max ? parseInt(asString(req.query.score_max)) : undefined,
        competences: req.query.competences ? asString(req.query.competences).split(",") : undefined,
        date_debut: req.query.date_debut ? new Date(asString(req.query.date_debut)) : undefined,
        date_fin: req.query.date_fin ? new Date(asString(req.query.date_fin)) : undefined,
        page: parseInt(asString(req.query.page)) || 1,
        limit: parseInt(asString(req.query.limit)) || 10,
      };

      const candidatures = await this.candidatureService.obtenirCandidaturesParOffre(
        asString(req.params.idOffre),
        idEntreprise,
        filtres
      );
      return reponseSucces(res, candidatures, "Candidatures recuperees avec succes");
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // GET /api/candidatures/:id/details
  obtenirDetailsCandidature = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise || req.utilisateur.role !== "entreprise") {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const candidature = await this.candidatureService.obtenirDetailsCandidature(
        asString(req.params.id),
        idEntreprise
      );
      return reponseSucces(res, candidature, "Details de la candidature recuperees avec succes");
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // PUT /api/candidatures/:id/statut
  modifierStatut = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const candidature = await this.candidatureService.modifierStatutCandidature(
        asString(req.params.id),
        idEntreprise,
        req.body
      );
      return reponseSucces(res, 200, "Statut modifie avec succes", candidature);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // POST /api/candidatures/:id/shortlist
  shortlister = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const candidature = await this.candidatureService.shortlisterCandidat(asString(req.params.id), idEntreprise);
      return reponseSucces(res, 200, "Candidat preselectionne avec succes", candidature);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // POST /api/candidatures/:id/refuser
  refuser = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const { motif_refus } = req.body;
      const candidature = await this.candidatureService.refuserCandidat(
        asString(req.params.id),
        idEntreprise,
        motif_refus
      );
      return reponseSucces(res, 200, "Candidature refusee", candidature);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // POST /api/candidatures/:id/accepter
  accepter = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const candidature = await this.candidatureService.accepterCandidat(asString(req.params.id), idEntreprise);
      return reponseSucces(res, 200, "Candidature acceptee avec succes", candidature);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  // GET /api/candidatures/statistiques
  obtenirStatistiques = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur?.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const statistiques = await this.candidatureService.obtenirStatistiquesEntreprise(idEntreprise);
      return reponseSucces(res, 200, "Statistiques recuperees avec succes", statistiques);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };

  obtenirStatistiquesCandidat = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur?.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }

      const statistiques = await this.candidatureService.obtenirStatistiquesCandidat(idCandidat);
      return reponseSucces(res, 200, "Statistiques recuperees avec succes", statistiques);
    } catch (erreur: unknown) {
      const { statutHttp, message } = extraireErreurHttp(erreur);
      return reponseErreur(res, statutHttp, message);
    }
  };
}
