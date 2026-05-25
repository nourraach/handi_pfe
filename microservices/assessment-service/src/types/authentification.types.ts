import { RoleUtilisateur } from "./enums";

export interface JwtPayloadUtilisateur {
  id_utilisateur: string;
  email: string;
  role: RoleUtilisateur;
  region?: string;
  candidat?: {
    id: string;
  };
  entreprise?: {
    id: string;
  };
  admin?: {
    id: string;
  };
}
