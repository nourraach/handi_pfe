import { Request, Response, NextFunction } from "express";
import { AccountMemberService } from "../services/account-member.service";
import { reponseSucces } from "../utils/reponse";

export class AccountMemberController {
  constructor(private readonly service = new AccountMemberService()) {}

  lister = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateur = req.utilisateur;
      const membres = await this.service.listerPourUtilisateur(utilisateur!.id_utilisateur);
      return reponseSucces(res, 200, "Membres récupérés.", membres);
    } catch (err) {
      return next(err);
    }
  };

  creer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateur = req.utilisateur;
      const membre = await this.service.creerPourUtilisateur(utilisateur!.id_utilisateur, req.body);
      return reponseSucces(res, 201, "Membre créé.", membre);
    } catch (err) {
      return next(err);
    }
  };

  mettreAJour = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateur = req.utilisateur;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const membre = await this.service.mettreAJourPourUtilisateur(utilisateur!.id_utilisateur, id, req.body);
      return reponseSucces(res, 200, "Membre mis à jour.", membre);
    } catch (err) {
      return next(err);
    }
  };

  supprimer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const utilisateur = req.utilisateur;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.supprimerPourUtilisateur(utilisateur!.id_utilisateur, id);
      return reponseSucces(res, 204, "Membre supprimé.");
    } catch (err) {
      return next(err);
    }
  };
}
