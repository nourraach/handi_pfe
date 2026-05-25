import { NextFunction, Request, Response } from "express";
import { RoleUtilisateur } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";

export const roleMiddleware = (rolesAutorises: RoleUtilisateur[]) => {
  return (requete: Request, _reponse: Response, suivant: NextFunction) => {
    if (!requete.utilisateur) {
      return suivant(new ErreurApi("Utilisateur non authentifie.", 401));
    }

    if (!rolesAutorises.includes(requete.utilisateur.role)) {
      return suivant(new ErreurApi("Vous n'avez pas les droits necessaires pour acceder a cette ressource.", 403));
    }

    return suivant();
  };
};
