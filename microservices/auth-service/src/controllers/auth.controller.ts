import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { reponseSucces } from "../utils/reponse";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  inscriptionCandidat = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const carteHandicap = (requete as any).file;
      const resultat = await this.authService.inscrireCandidat({
        ...requete.body,
        carte_handicap_url: carteHandicap?.path ? carteHandicap.path.replace(/^.*public[\\/]/, "/") : undefined,
      });
      return reponseSucces(reponse, 201, resultat.message);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  inscriptionEntreprise = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.authService.inscrireEntreprise(requete.body);
      return reponseSucces(reponse, 201, resultat.message);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  connexion = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.authService.connecter(requete.body);
      return reponseSucces(reponse, 200, resultat.message, {
        token: resultat.token,
        utilisateur: resultat.utilisateur,
      });
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resultat = await this.authService.logout();
      return reponseSucces(res, 200, resultat.message);
    } catch (erreur) {
      return next(erreur);
    }
  };

  demanderReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultat: any = await this.authService.demanderReset(req.body);
      const payload = resultat.token || resultat.lien_reset
        ? {
            ...(resultat.token ? { token: resultat.token } : {}),
            ...(resultat.lien_reset ? { lien_reset: resultat.lien_reset } : {}),
          }
        : undefined;
      return reponseSucces(res, 200, resultat.message, payload);
    } catch (erreur) {
      return next(erreur);
    }
  };

  resetMotDePasse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultat = await this.authService.resetMotDePasse(req.body);
      return reponseSucces(res, 200, resultat.message);
    } catch (erreur) {
      return next(erreur);
    }
  };

  changerMotDePasse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.utilisateur.id_utilisateur;
      const resultat = await this.authService.changerMotDePasse(userId, req.body);
      return reponseSucces(res, 200, resultat.message);
    } catch (erreur) {
      return next(erreur);
    }
  };

  supprimerCompte = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.utilisateur.id_utilisateur;
      const resultat = await this.authService.supprimerCompte(userId);
      return reponseSucces(res, 200, resultat.message);
    } catch (erreur) {
      return next(erreur);
    }
  };

}
