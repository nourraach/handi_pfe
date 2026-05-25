import { NextFunction, Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { reponseSucces } from "../utils/reponse";
import { ErreurApi } from "../utils/erreur-api";

const extraireParametre = (valeur: string | string[] | undefined): string | null => {
  if (typeof valeur === "string") {
    return valeur;
  }

  if (Array.isArray(valeur)) {
    return valeur[0] ?? null;
  }

  return null;
};

export class AdminController {
  constructor(private readonly adminService = new AdminService()) {}

  listerDemandesEnAttente = async (_requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const demandes = await this.adminService.listerDemandesEnAttente();
      return reponseSucces(reponse, 200, "Demandes en attente recuperees avec succes.", demandes);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  approuver = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id = extraireParametre(requete.params.id);

      if (!id) {
        throw new ErreurApi("L'identifiant utilisateur est manquant.", 400);
      }

      const resultat = await this.adminService.approuverDemande(id);
      return reponseSucces(reponse, 200, resultat.message, resultat);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  refuser = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const id = extraireParametre(requete.params.id);

      if (!id) {
        throw new ErreurApi("L'identifiant utilisateur est manquant.", 400);
      }

      const resultat = await this.adminService.refuserDemande(id);
      return reponseSucces(reponse, 200, resultat.message);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}
