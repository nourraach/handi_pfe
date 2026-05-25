import { JwtPayloadUtilisateur } from "./authentification.types";

declare global {
  namespace Express {
    interface Request {
      utilisateur: JwtPayloadUtilisateur;
      user?: JwtPayloadUtilisateur; // Alias pour compatibilité
    }
  }
}

export {};
