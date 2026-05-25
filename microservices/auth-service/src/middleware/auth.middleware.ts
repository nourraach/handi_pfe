import { NextFunction, Request, Response } from "express";
import { verifierJwt } from "../utils/securite";
import { ErreurApi } from "../utils/erreur-api";

export const authMiddleware = (requete: Request, _reponse: Response, suivant: NextFunction) => {
  try {
    const entete = requete.headers.authorization;

    if (!entete?.startsWith("Bearer ")) {
      throw new ErreurApi("Token d'authentification manquant.", 401);
    }

    const token = entete.replace("Bearer ", "").trim();
    try {
      requete.utilisateur = verifierJwt(token);
      suivant();
    } catch (err) {
      return suivant(new ErreurApi("Token invalide ou expiré.", 401));
    }
  } catch (erreur) {
    suivant(erreur);
  }
};
