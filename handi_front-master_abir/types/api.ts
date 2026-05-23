export interface ReponseApi<T = unknown> {
  message: string;
  donnees?: T;
}

export interface UtilisateurConnecte {
  id_utilisateur: string;
  nom: string;
  email: string;
  role: string;
  statut: string;
  region?: string;
  candidat?: { id: string };
  entreprise?: { id: string };
}

export interface DemandeEnAttente {
  id_utilisateur: string;
  nom: string;
  email: string;
  role: string;
  statut: string;
  telephone: string;
  addresse: string;
  created_at: string;
  profil_candidat: Record<string, unknown> | null;
  profil_entreprise: Record<string, unknown> | null;
}
