// DTOs pour les tests psychologiques

export interface CreerTestDto {
  titre: string;
  description: string;
  type_test: string;
  duree_minutes: number;
  date_debut_validite: string;
  date_fin_validite: string;
  instructions?: string;
  questions: CreerQuestionDto[];
}

export interface CreerQuestionDto {
  contenu_question: string;
  type_question: "choix_multiple" | "vrai_faux" | "echelle_likert" | "texte_libre";
  score_question: number;
  ordre: number;
  obligatoire?: boolean;
  options?: CreerOptionDto[];
}

export interface CreerOptionDto {
  texte_option: string;
  est_correcte: boolean;
  score_option: number;
  ordre: number;
}

export interface ModifierTestDto {
  titre?: string;
  description?: string;
  type_test?: string;
  duree_minutes?: number;
  date_debut_validite?: string;
  date_fin_validite?: string;
  instructions?: string;
  statut?: "actif" | "inactif" | "archive";
}

export interface ModifierQuestionDto {
  id_question?: string;
  contenu_question?: string;
  type_question?: "choix_multiple" | "vrai_faux" | "echelle_likert" | "texte_libre";
  score_question?: number;
  ordre?: number;
  obligatoire?: boolean;
  options?: ModifierOptionDto[];
}

export interface ModifierOptionDto {
  id_option?: string;
  texte_option?: string;
  est_correcte?: boolean;
  score_option?: number;
  ordre?: number;
}

export interface PasserTestDto {
  reponses: ReponseTestDto[];
  temps_passe_minutes: number;
}

export interface ReponseTestDto {
  id_question: string;
  id_option?: string; // pour choix multiple, vrai/faux, échelle
  reponse_texte?: string; // pour texte libre
}

export interface TestDisponibleDto {
  id_test: string;
  titre: string;
  description: string;
  type_test: string;
  duree_minutes: number;
  date_fin_validite: string;
  instructions?: string;
  deja_passe: boolean;
  peut_passer: boolean; // basé sur la période de validité
}

export interface QuestionTestDto {
  id_question: string;
  contenu_question: string;
  type_question: string;
  ordre: number;
  obligatoire: boolean;
  options?: OptionQuestionDto[];
}

export interface OptionQuestionDto {
  id_option: string;
  texte_option: string;
  ordre: number;
}

export interface ResultatTestDto {
  id_resultat: string;
  test: {
    id_test: string;
    titre: string;
    type_test: string;
    score_total: number;
  };
  score_obtenu: number;
  pourcentage: number;
  temps_passe_minutes: number;
  date_passage: string;
  est_visible: boolean;
  peut_modifier_visibilite: boolean;
}

export interface StatistiquesTestDto {
  id_test: string;
  titre: string;
  nombre_participants: number;
  score_moyen: number;
  score_median: number;
  score_min: number;
  score_max: number;
  taux_completion: number;
  temps_moyen_minutes: number;
}

export interface ListeTestsQueryDto {
  page?: number;
  limit?: number;
  statut?: string;
  type_test?: string;
  recherche?: string;
  actifs_seulement?: boolean;
}

export interface ModifierVisibiliteDto {
  est_visible: boolean;
}