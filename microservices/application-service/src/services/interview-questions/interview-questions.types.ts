/**
 * Feature 02 — Predicteur de questions d'entretien personnalise
 * Types partages entre analyzer, provider IA et service.
 */

export type InterviewQuestionCategorie =
  | "motivation"
  | "technique"
  | "comportementale"
  | "gap"
  | "secteur"
  | "handicap";

export type InterviewQuestionProbabilite = "haute" | "moyenne";

export interface InterviewQuestion {
  id: string;
  question: string;
  categorie: InterviewQuestionCategorie;
  probabilite: InterviewQuestionProbabilite;
  conseil_reponse: string;
  exemple_amorce: string;
  pieges_a_eviter: string[];
  competences_profil_a_mobiliser: string[];
}

export interface HandicapBlockQuestion {
  question: string;
  conseil_reponse: string;
}

export interface HandicapBlock {
  titre: string;
  intro: string;
  questions: HandicapBlockQuestion[];
}

/** Resultat du pre-traitement structure (sans IA) passe au prompt Gemini. */
export interface GapsAnalysis {
  matching_skills: string[];
  missing_skills: string[];
  extra_skills: string[];
  experience_gap: "sufficient" | "borderline" | "insufficient";
  education_match: boolean;
  secteur: string;
  matching_score: number | null;
  psycho_traits: string[];
  handicap_context: { type: string; amenagements_possibles: string | null } | null;
  offre_summary: { titre: string; description_short: string };
  candidat_summary: { competences: string[]; experience_short: string; formation_short: string };
}

export interface InterviewDossierPayload {
  questions: InterviewQuestion[];
  handicap_block: HandicapBlock | null;
  source: "gemini" | "fallback";
}
