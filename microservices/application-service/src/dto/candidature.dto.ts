export interface PostulerDto {
  id_offre: string;
  lettre_motivation?: string;
  cv_url?: string;
}

export interface ModifierStatutCandidatureDto {
  statut: "pending" | "shortlisted" | "interview_scheduled" | "rejected" | "accepted";
  motif_refus?: string;
  notes_entreprise?: string;
}

export interface FiltreCandidatureDto {
  statut?: string;
  id_offre?: string;
  score_min?: number;
  score_max?: number;
  competences?: string[];
  date_debut?: Date;
  date_fin?: Date;
  page?: number;
  limit?: number;
}

export interface CandidatureAvecDetailsDto {
  id: string;
  candidat: {
    nom: string;
    email: string;
    competences: string[];
    experience: string;
    handicap: string;
    cv_url?: string;
  };
  offre: {
    titre: string;
    entreprise: string;
  };
  date_postulation: Date;
  statut: string;
  score_test?: number;
  lettre_motivation?: string;
  notes_entreprise?: string;
}
