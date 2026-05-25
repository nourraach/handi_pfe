export interface CreerOffreDto {
  id_entreprise: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: "cdi" | "cdd" | "stage" | "freelance" | "temps_partiel" | "temps_plein";
  salaire_min?: string;
  salaire_max?: string;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  date_limite?: string;
  accessibilite_handicap?: boolean;
  amenagements_possibles?: string;
}

export interface ModifierOffreDto {
  titre?: string;
  description?: string;
  localisation?: string;
  type_poste?: "cdi" | "cdd" | "stage" | "freelance" | "temps_partiel" | "temps_plein";
  salaire_min?: string;
  salaire_max?: string;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  date_limite?: string;
  accessibilite_handicap?: boolean;
  amenagements_possibles?: string;
}

export interface ChangerStatutOffreDto {
  statut: "active" | "inactive" | "pourvue" | "expiree";
}

export interface OffreAvecStatistiquesDto {
  id: string;
  id_entreprise: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  salaire_min?: string | null;
  salaire_max?: string | null;
  competences_requises?: string | null;
  experience_requise?: string | null;
  niveau_etude?: string | null;
  statut: string;
  date_limite?: string;
  date_expiration?: string;
  accessibilite_handicap: boolean | null;
  amenagements_possibles?: string | null;
  created_at: string;
  updated_at: string;
  vues_count: number;
  candidatures_count: number;
}
