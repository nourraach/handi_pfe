import { Request, Response } from "express";
import { EntrepriseCandidatService } from "../services/entreprise-candidat.service";
import { reponseErreur, reponseSucces } from "../utils/reponse";
import { asString } from "../utils/request-helpers";

export class EntrepriseCandidatController {
  constructor(private readonly service = new EntrepriseCandidatService()) {}

  listerCandidats = async (req: Request, res: Response) => {
    try {
      if (!req.utilisateur || req.utilisateur.role !== "entreprise") {
        return reponseErreur(res, 403, "Acces reserve aux entreprises");
      }

      const resultat = await this.service.listerCandidats({
        page: req.query.page ? Number(asString(req.query.page)) : 1,
        limit: req.query.limit ? Number(asString(req.query.limit)) : 10,
        recherche: asString(req.query.recherche) || undefined,
        competence: asString(req.query.competence) || undefined,
      });

      return reponseSucces(res, 200, "Candidats recuperes avec succes", resultat);
    } catch (error: any) {
      return reponseErreur(res, 500, error.message || "Erreur lors de la recuperation des candidats");
    }
  };
}
