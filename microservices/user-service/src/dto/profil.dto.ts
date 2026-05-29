// DTOs pour les profils utilisateurs

export interface ProfilCandidatDto {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  competences?: string[];
  experience?: string;
  formation?: string;
  handicap?: string;
  disponibilite?: string;
  salaire_souhaite?: string;
  preferences_accessibilite?: string[];
  visibilite?: { email?: boolean; telephone?: boolean; handicap?: boolean };
  cv_url?: string | null;
  carte_handicap_url?: string | null;
  video_cv_url?: string | null;
  photo_profil_url?: string | null;
  // Champs existants du candidat
  type_handicap?: string;
  num_carte_handicap?: string;
  date_expiration_carte_handicap?: string;
  niveau_academique?: string;
  description?: string;
  secteur?: string;
  type_licence?: string;
  preference_communication?: string;
  age?: number;
}

export interface ProfilEntrepriseDto {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  region?: string;
  gouvernorat?: string;
  delegation?: string;
  nom_entreprise?: string;
  secteur_activite?: string;
  taille_entreprise?: string;
  siret?: string;
  site_web?: string;
  description?: string;
  politique_handicap?: string;
  contact_rh_nom?: string;
  contact_rh_email?: string;
  contact_rh_telephone?: string;
  logo_url?: string;
  // Champs existants de l'entreprise
  patente?: string;
  rne?: string;
  url_site?: string;
  date_fondation?: string;
  nbr_employe?: number;
  nbr_employe_handicape?: number;
  subscription_pack?: string;
  subscription_status?: string;
  subscription_price_tnd?: number;
  subscription_cycle?: string;
  subscribed_at?: string;
  profil_publique?: boolean;
}

export interface ChoixPackEntrepriseDto {
  pack_code: string;
}

export interface ProfilAdminDto {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  poste?: string;
  departement?: string;
  date_embauche?: string;
  permissions?: string[];
  notifications_email?: boolean;
  notifications_sms?: boolean;
}

export interface ReponseProfilDto {
  message: string;
  donnees?: any;
}
