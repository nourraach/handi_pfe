export interface UpdateMatchingConsentDto {
  allow_accessibility_matching?: boolean;
  allow_semantic_embedding?: boolean;
}

export interface RecommendationListItemDto {
  id: string;
  job_offer_id: string;
  score_final: number;
  status: "pending" | "notified" | "viewed" | "applied" | "dismissed";
  explanation: Record<string, unknown>;
  created_at: string;
  offre: {
    titre: string;
    localisation: string;
    type_poste: string;
    salaire_min?: string | null;
    salaire_max?: string | null;
    nom_entreprise?: string | null;
  };
}

