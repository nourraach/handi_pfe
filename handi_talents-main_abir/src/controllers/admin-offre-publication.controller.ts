import { NextFunction, Request, Response } from "express";
import { OffrePublicationReviewService } from "../services/offre-publication-review.service";
import { ErreurApi } from "../utils/erreur-api";
import { reponseSucces } from "../utils/reponse";

const extraireParametre = (valeur: string | string[] | undefined): string | null => {
  if (typeof valeur === "string") return valeur;
  if (Array.isArray(valeur)) return valeur[0] ?? null;
  return null;
};

export class AdminOffrePublicationController {
  constructor(private readonly service = new OffrePublicationReviewService()) {}

  listerEnAttente = async (_requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const rows = await this.service.listerOffresEnAttente();
      return reponseSucces(reponse, 200, "Offres en attente de publication recuperees avec succes.", rows);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  approuver = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idOffre = extraireParametre(requete.params.id);
      const idAdmin = requete.utilisateur?.id_utilisateur;

      if (!idOffre) {
        throw new ErreurApi("L'identifiant de l'offre est manquant.", 400);
      }
      if (!idAdmin) {
        throw new ErreurApi("Administrateur non authentifie.", 401);
      }

      const resultat = await this.service.approuverPublication(idOffre, idAdmin);
      return reponseSucces(reponse, 200, "Offre validee et publiee avec succes.", resultat);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  refuser = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idOffre = extraireParametre(requete.params.id);
      const idAdmin = requete.utilisateur?.id_utilisateur;
      const motif = typeof requete.body?.motif === "string" ? requete.body.motif : "";

      if (!idOffre) {
        throw new ErreurApi("L'identifiant de l'offre est manquant.", 400);
      }
      if (!idAdmin) {
        throw new ErreurApi("Administrateur non authentifie.", 401);
      }

      const resultat = await this.service.refuserPublication(idOffre, idAdmin, motif);
      return reponseSucces(reponse, 200, "Offre refusee avec succes.", resultat);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}

