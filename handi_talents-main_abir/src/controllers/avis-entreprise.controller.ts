import { Request, Response } from "express";
import { AvisEntrepriseService } from "../services/avis-entreprise.service";
import { reponseErreur, reponseSucces } from "../utils/reponse";

export class AvisEntrepriseController {
  constructor(private readonly service = new AvisEntrepriseService()) {}

  creerAvis = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== "candidat") {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }

      const avis = await this.service.creerAvis(req.utilisateur.id_utilisateur, req.body);
      return reponseSucces(res, 201, "Avis enregistre avec succes", avis);
    } catch (error: any) {
      return reponseErreur(res, error?.statutHttp || 500, error.message || "Erreur lors de l'enregistrement de l'avis");
    }
  };

  listerMesAvis = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== "candidat") {
        return reponseErreur(res, 403, "Acces reserve aux candidats");
      }

      const avis = await this.service.listerMesAvis(req.utilisateur.id_utilisateur);
      return reponseSucces(res, 200, "Avis recuperes avec succes", avis);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la recuperation des avis");
    }
  };

  listerAvisEntreprise = async (req: Request, res: Response) => {
    try {
      const idEntreprise = String(req.params.idEntreprise || "").trim();
      if (!idEntreprise) {
        return reponseErreur(res, 400, "ID entreprise manquant");
      }

      const avis = await this.service.listerAvisEntreprise(idEntreprise);
      return reponseSucces(res, 200, "Avis entreprise recuperes avec succes", avis);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la recuperation des avis entreprise");
    }
  };
}
