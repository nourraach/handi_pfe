import { Request, Response } from "express";
import { reponseErreur, reponseSucces } from "../utils/reponse";
import { asString } from "../utils/request-helpers";
import { BienEtreEntretienService } from "../services/bien-etre-entretien.service";

export class BienEtreEntretienController {
  private readonly service = new BienEtreEntretienService();

  obtenirContexte = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur?.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Acces reserve aux candidats.");
      }

      const donnees = await this.service.obtenirContexte(asString(req.params.id), idCandidat);
      return reponseSucces(res, 200, "Contexte bien-etre recupere", donnees);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message || "Erreur interne");
    }
  };

  demarrerSession = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur?.candidat?.id;
      const idUtilisateur = req.utilisateur?.id_utilisateur;
      if (!idCandidat || !idUtilisateur) {
        return reponseErreur(res, 403, "Acces reserve aux candidats.");
      }

      const donnees = await this.service.demarrerSession(asString(req.params.id), idCandidat, idUtilisateur);
      return reponseSucces(res, 200, "Session bien-etre demarree", donnees);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message || "Erreur interne");
    }
  };

  terminerSession = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur?.candidat?.id;
      const idUtilisateur = req.utilisateur?.id_utilisateur;
      if (!idCandidat || !idUtilisateur) {
        return reponseErreur(res, 403, "Acces reserve aux candidats.");
      }

      const dureeSecondes =
        typeof req.body?.duration_seconds === "number" ? Number(req.body.duration_seconds) : undefined;
      const donnees = await this.service.terminerSession(
        asString(req.params.id),
        idCandidat,
        idUtilisateur,
        dureeSecondes,
      );
      return reponseSucces(res, 200, "Session bien-etre terminee", donnees);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message || "Erreur interne");
    }
  };

  dispatcherRappelJ1 = async (req: Request, res: Response) => {
    try {
      const dryRun = Boolean(req.body?.dry_run);
      const donnees = await this.service.dispatcherRappelJ1(dryRun);
      return reponseSucces(res, 200, "Dispatch bien-etre J-1 termine", donnees);
    } catch (error: any) {
      return reponseErreur(res, error.statusCode || 500, error.message || "Erreur interne");
    }
  };
}

