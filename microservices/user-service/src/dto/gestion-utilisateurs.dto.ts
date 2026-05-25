// DTOs pour la gestion des utilisateurs par les admins

export interface ListeUtilisateursQueryDto {
  page?: number;
  limit?: number;
  role?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  recherche?: string;
}

export interface CreerUtilisateurDto {
  nom: string;
  email: string;
  role: string;
  statut?: string;
  telephone?: string;
  addresse?: string;
  region?: string;
  gouvernorat?: string;
  delegation?: string;
}

export interface ModifierUtilisateurDto {
  nom?: string;
  email?: string;
  role?: string;
  statut?: string;
  telephone?: string;
  addresse?: string;
  region?: string;
  gouvernorat?: string;
  delegation?: string;
}

export interface ChangerStatutDto {
  statut: string;
}

export interface RechercheAvanceeDto {
  criteres: {
    nom?: string;
    email_domaine?: string;
    role?: string[];
    statut?: string[];
    date_creation_apres?: string;
    date_creation_avant?: string;
    derniere_connexion_apres?: string;
    a_profil_complete?: boolean;
    ville?: string;
  };
  tri?: {
    champ: string;
    ordre: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface StatistiquesQueryDto {
  periode?: 'jour' | 'semaine' | 'mois' | 'annee';
  dateDebut?: string;
  dateFin?: string;
}

export interface ExportQueryDto {
  role?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  format?: 'csv' | 'xlsx';
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatistiquesUtilisateursDto {
  total: number;
  actifs: number;
  en_attente: number;
  suspendus: number;
  par_role: Record<string, number>;
}

export interface UtilisateurDetailDto {
  id_utilisateur: string;
  nom: string;
  email: string;
  role: string;
  statut: string;
  telephone: string;
  addresse: string;
  region?: string;
  gouvernorat?: string;
  delegation?: string;
  created_at: string;
  updated_at: string;
  derniere_connexion?: string;
  profil_complete?: boolean;
}

export interface ActionAuditDto {
  id_action: string;
  type_action: string;
  ancien_statut?: string;
  nouveau_statut?: string;
  admin_id: string;
  admin_nom: string;
  date_action: string;
  commentaire?: string;
}
