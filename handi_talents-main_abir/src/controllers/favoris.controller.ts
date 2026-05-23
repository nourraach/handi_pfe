// @ts-nocheck
import { Request, Response } from "express";
import { FavorisService } from "../services/favoris.service";
import { reponseSucces, reponseErreur } from "../utils/reponse";
import { asString } from "../utils/request-helpers";

export class FavorisController {
  private favorisService = new FavorisService();

  // POST /api/favoris/:idOffre
  ajouterFavori = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Accès réservé aux candidats");
      }

      const favori = await this.favorisService.ajouterFavori(idCandidat, asString(req.params.idOffre));
      return reponseSucces(res, 201, "Offre ajoutée aux favoris", favori);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // DELETE /api/favoris/:idOffre
  retirerFavori = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Accès réservé aux candidats");
      }

      await this.favorisService.retirerFavori(idCandidat, asString(req.params.idOffre));
      return reponseSucces(res, 200, "Offre retirée des favoris", null);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/favoris
  obtenirMesFavoris = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Accès réservé aux candidats");
      }

      const favoris = await this.favorisService.obtenirFavorisCandidat(idCandidat);
      return reponseSucces(res, 200, "Favoris récupérés avec succès", favoris);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/favoris/:idOffre/verifier
  verifierFavori = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Accès réservé aux candidats");
      }

      const estFavori = await this.favorisService.verifierFavori(idCandidat, asString(req.params.idOffre));
      return reponseSucces(res, 200, "Vérification effectuée", { est_favori: estFavori });
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };
}
