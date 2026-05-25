import { GenreUtilisateur, RoleUtilisateur, StatutUtilisateur } from "../types/enums";

export interface InscriptionCandidatDto {
  nom: string;
  email: string;
  telephone: string;
  mdp: string;
  addresse: string;
  genre: GenreUtilisateur;
  type_handicap: string;
  num_carte_handicap: string;
  date_expiration_carte_handicap: string;
  niveau_academique: string;
  description: string;
  secteur: string;
  type_licence: string;
  preference_communication: string;
  age: number;
  carte_handicap_url?: string;
}

export interface InscriptionEntrepriseDto {
  nom: string;
  email: string;
  telephone: string;
  mdp: string;
  addresse: string;
  nom_entreprise: string;
  patente: string;
  rne: string;
  profil_publique: boolean;
  url_site: string;
  date_fondation: string;
  description: string;
  nbr_employe: number;
  nbr_employe_handicape: number;
}

export interface ConnexionDto {
  email: string;
  mdp: string;
}

export interface DemandeResetMdpDto {
  email: string;
}

export interface ResetMdpDto {
  token: string;
  nouveau_mdp: string;
}

export interface ChangerMdpDto {
  ancien_mdp: string;
  nouveau_mdp: string;
}

export interface ReponseAuthentificationDto {
  message: string;
  utilisateur?: {
    id_utilisateur: string;
    nom: string;
    email: string;
    role: RoleUtilisateur;
    statut: StatutUtilisateur;
  };
  token?: string;
}
