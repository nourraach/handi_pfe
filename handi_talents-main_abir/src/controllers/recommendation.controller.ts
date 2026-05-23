import { Request, Response } from "express";
import { reponseErreur, reponseSucces } from "../utils/reponse";
import { RecommendationService } from "../services/recommendation.service";
import { RoleUtilisateur } from "../types/enums";

export class RecommendationController {
  constructor(private readonly recommendationService = new RecommendationService()) {}

  private async resolveCandidatId(req: Request) {
    const fromToken = req.utilisateur?.candidat?.id;
    if (fromToken) return fromToken;
    return this.recommendationService.resolveCandidatId(req.utilisateur.id_utilisateur);
  }

  obtenirMesRecommandations = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }

      const idCandidat = await this.resolveCandidatId(req);
      const rows = await this.recommendationService.obtenirRecommandationsCandidat(idCandidat);
      return reponseSucces(res, 200, "Recommandations recuperees avec succes", rows);
    } catch (error: any) {
      return reponseErreur(res, 500, error?.message || "Erreur lors de la recuperation des recommandations");
    }
  };

  marquerViewed = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }
      const idCandidat = await this.resolveCandidatId(req);
      const idRecommendation = typeof req.params.id === "string" ? req.params.id : String(req.params.id?.[0] || "");
      await this.recommendationService.marquerView(idRecommendation, idCandidat);
      return reponseSucces(res, 200, "Recommandation marquee comme vue");
    } catch (error: any) {
      return reponseErreur(res, error?.statutHttp || 500, error?.message || "Erreur");
    }
  };

  marquerDismiss = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }
      const idCandidat = await this.resolveCandidatId(req);
      const idRecommendation = typeof req.params.id === "string" ? req.params.id : String(req.params.id?.[0] || "");
      await this.recommendationService.marquerDismiss(idRecommendation, idCandidat);
      return reponseSucces(res, 200, "Recommandation ignoree");
    } catch (error: any) {
      return reponseErreur(res, error?.statutHttp || 500, error?.message || "Erreur");
    }
  };

  marquerApply = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }
      const idCandidat = await this.resolveCandidatId(req);
      const idRecommendation = typeof req.params.id === "string" ? req.params.id : String(req.params.id?.[0] || "");
      await this.recommendationService.marquerApply(idRecommendation, idCandidat);
      return reponseSucces(res, 200, "Recommandation marquee comme candidatee");
    } catch (error: any) {
      return reponseErreur(res, error?.statutHttp || 500, error?.message || "Erreur");
    }
  };

  obtenirConsentement = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }
      const idCandidat = await this.resolveCandidatId(req);
      const consent = await this.recommendationService.obtenirConsentementMatching(idCandidat);
      return reponseSucces(res, 200, "Consentement recupere", consent);
    } catch (error: any) {
      return reponseErreur(res, error?.statutHttp || 500, error?.message || "Erreur");
    }
  };

  mettreAJourConsentement = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== RoleUtilisateur.CANDIDAT) {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }
      const idCandidat = await this.resolveCandidatId(req);
      const consent = await this.recommendationService.mettreAJourConsentementMatching(idCandidat, req.body || {});
      return reponseSucces(res, 200, "Consentement mis a jour", consent);
    } catch (error: any) {
      return reponseErreur(res, error?.statutHttp || 500, error?.message || "Erreur");
    }
  };
}
