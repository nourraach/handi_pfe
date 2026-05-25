import type { GapsAnalysis } from "./interview-questions.types";

/**
 * Feature 02 — Analyseur de gaps (pre-traitement structure, sans IA).
 * Options A (skills intersection) + C (regles metier explicites).
 *
 * Entree: rangees brutes des tables candidat + offre + (optionnel) tests psy + score matching.
 * Sortie: GapsAnalysis structure passe ensuite au prompt Gemini.
 */

interface AnalyzerInput {
  candidat: {
    competences: string[] | null | undefined;
    experience: string | null | undefined;
    formation: string | null | undefined;
    niveau_academique?: string | null;
    type_handicap?: string | null;
    visibilite?: { handicap?: boolean } | null;
  };
  offre: {
    titre: string;
    description: string | null;
    competences_requises: string | null;
    experience_requise: string | null;
    niveau_etude: string | null;
    amenagements_possibles: string | null;
  };
  matching_score?: number | null;
  psycho_traits?: string[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSkills(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n\r\/]| - /g)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60);
}

function extractYears(text: string | null | undefined): number | null {
  if (!text) return null;
  // Cherche un pattern "X an(s|nees)" ou "X+ ans"
  const m = text.match(/(\d+)\s*\+?\s*(an|annee|year)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!isNaN(n)) return n;
  }
  return null;
}

function shortText(t: string | null | undefined, max = 400): string {
  if (!t) return "";
  const s = t.replace(/\s+/g, " ").trim();
  return s.length <= max ? s : s.slice(0, max) + "...";
}

export class InterviewGapsAnalyzer {
  analyze(input: AnalyzerInput): GapsAnalysis {
    const candSkillsRaw = (input.candidat.competences ?? []).map((s) => String(s));
    const offerSkills = splitSkills(input.offre.competences_requises);

    const candSet = new Map(candSkillsRaw.map((s) => [normalize(s), s]));
    const offerSet = new Map(offerSkills.map((s) => [normalize(s), s]));

    const matching_skills: string[] = [];
    const missing_skills: string[] = [];
    const extra_skills: string[] = [];

    for (const [norm, original] of offerSet) {
      if (candSet.has(norm)) matching_skills.push(original);
      else missing_skills.push(original);
    }
    for (const [norm, original] of candSet) {
      if (!offerSet.has(norm)) extra_skills.push(original);
    }

    // Experience gap
    const reqYears = extractYears(input.offre.experience_requise);
    const candYears = extractYears(input.candidat.experience);
    let experience_gap: GapsAnalysis["experience_gap"] = "sufficient";
    if (reqYears !== null) {
      if (candYears === null) experience_gap = "borderline";
      else if (candYears >= reqYears) experience_gap = "sufficient";
      else if (candYears >= reqYears - 1) experience_gap = "borderline";
      else experience_gap = "insufficient";
    }

    // Education match (heuristique simple : niveau requis present dans formation/niveau_academique)
    const eduRequired = normalize(input.offre.niveau_etude ?? "");
    const eduCandidat = normalize(
      `${input.candidat.formation ?? ""} ${input.candidat.niveau_academique ?? ""}`,
    );
    const education_match = eduRequired.length === 0 ? true : eduCandidat.includes(eduRequired);

    // Secteur (heuristique : 3-5 mots cles du titre offre)
    const secteur = (input.offre.titre ?? "").trim();

    // Handicap context (uniquement si opt-in)
    const optIn = input.candidat.visibilite?.handicap === true;
    const handicap_context =
      optIn && input.candidat.type_handicap
        ? {
            type: input.candidat.type_handicap,
            amenagements_possibles: input.offre.amenagements_possibles ?? null,
          }
        : null;

    return {
      matching_skills,
      missing_skills,
      extra_skills,
      experience_gap,
      education_match,
      secteur,
      matching_score: input.matching_score ?? null,
      psycho_traits: input.psycho_traits ?? [],
      handicap_context,
      offre_summary: {
        titre: input.offre.titre,
        description_short: shortText(input.offre.description, 500),
      },
      candidat_summary: {
        competences: candSkillsRaw,
        experience_short: shortText(input.candidat.experience, 400),
        formation_short: shortText(input.candidat.formation, 200),
      },
    };
  }
}
