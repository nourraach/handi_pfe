import { RoleUtilisateur, StatutUtilisateur } from "../types/enums";

export interface DemandeEnAttenteDto {
  id_utilisateur: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  statut: StatutUtilisateur;
  telephone: string;
  addresse: string;
  created_at: Date;
  profil_candidat: Record<string, unknown> | null;
  profil_entreprise: Record<string, unknown> | null;
}
