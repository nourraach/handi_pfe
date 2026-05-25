import { env } from "../../config/env";
import { buildFallbackDossier } from "./interview-questions.fallback";
import type {
  GapsAnalysis,
  HandicapBlock,
  InterviewDossierPayload,
  InterviewQuestion,
} from "./interview-questions.types";

/**
 * Feature 02 — Provider Gemini 2.0 Flash pour generation des questions d'entretien.
 *
 * Pattern : env var GEMINI_API_KEY -> fetch API -> JSON parse strict -> fallback.
 * Timeout 15s configurable. 1 retry implicite via fallback en cas d'erreur.
 */

const VALID_CATEGORIES = new Set([
  "motivation",
  "technique",
  "comportementale",
  "gap",
  "secteur",
  "handicap",
]);

const VALID_PROBABILITES = new Set(["haute", "moyenne"]);

export class GeminiInterviewQuestionsProvider {
  async generate(gaps: GapsAnalysis): Promise<InterviewDossierPayload> {
    if (!env.geminiApiKey) {
      return buildFallbackDossier(gaps);
    }

    try {
      const prompt = this.buildPrompt(gaps);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        env.geminiInterviewModel,
      )}:generateContent?key=${env.geminiApiKey}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.interviewPrepTimeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              response_mime_type: "application/json",
              max_output_tokens: 4096,
              // Desactive le "thinking" pour gemini-2.5-* : prompt deja structure,
              // pas besoin de raisonnement implicite -> latence divisee par ~3.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        return buildFallbackDossier(gaps);
      }

      const payload: any = await response.json();
      const text = this.extractText(payload);
      if (!text) return buildFallbackDossier(gaps);

      const parsed = this.safeParse(text);
      if (!parsed) return buildFallbackDossier(gaps);

      const validated = this.validate(parsed, gaps);
      if (!validated) return buildFallbackDossier(gaps);

      return { ...validated, source: "gemini" };
    } catch {
      return buildFallbackDossier(gaps);
    }
  }

  private buildPrompt(gaps: GapsAnalysis): string {
    const handicapInstruction = gaps.handicap_context
      ? `Genere aussi un bloc "handicap_block" optionnel avec 2 questions pour anticiper des questions sensibles sur l'amenagement de poste, en respectant la dignite du candidat (jamais medicalisant, ton bienveillant et factuel). Type de handicap: "${gaps.handicap_context.type}". Amenagements possibles mentionnes dans l'offre: ${gaps.handicap_context.amenagements_possibles ?? "non precises"}.`
      : `Le candidat n'a pas opt-in sur la visibilite du handicap : retourne "handicap_block": null.`;

    return `Tu es un coach de preparation a l'entretien d'embauche specialise en inclusion handicap.
Ton role: generer EXACTEMENT 5 questions d'entretien PROBABLES que CE recruteur va poser a CE candidat pour CETTE offre.

Contraintes strictes:
- 5 questions reparties : 1 motivation, 1 technique, 1 comportementale, 1 gap (sur une competence manquante reelle), 1 secteur.
- Chaque question doit etre SPECIFIQUE a l'offre + au profil (jamais generique).
- Le conseil de reponse doit citer explicitement des elements du profil (competences matching, experience, traits psychologiques).
- Ton bienveillant, professionnel, francais correct.
- ${handicapInstruction}

Donnees factuelles (utilise-les, ne les invente pas):
${JSON.stringify(gaps, null, 2)}

Retourne STRICTEMENT un JSON valide conforme a ce schema (pas de markdown, pas de prose autour):
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "categorie": "motivation" | "technique" | "comportementale" | "gap" | "secteur",
      "probabilite": "haute" | "moyenne",
      "conseil_reponse": "string (cite des elements du profil)",
      "exemple_amorce": "string (1 phrase pour commencer la reponse)",
      "pieges_a_eviter": ["string", "string"],
      "competences_profil_a_mobiliser": ["string"]
    }
    // ... 5 elements au total
  ],
  "handicap_block": null | {
    "titre": "Section optionnelle — Preparer les questions sur l'amenagement de poste",
    "intro": "string courte rappelant que la section est optionnelle et qu'aucune obligation legale d'evoquer le handicap n'existe",
    "questions": [
      { "question": "string", "conseil_reponse": "string" }
    ]
  }
}`;
  }

  private extractText(payload: any): string | null {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    const text = parts.map((p: any) => p?.text || "").join("");
    return text.trim() || null;
  }

  private safeParse(text: string): any | null {
    try {
      return JSON.parse(text);
    } catch {
      // tolere markdown wrapping ```json ... ```
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (m) {
        try {
          return JSON.parse(m[1]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private validate(
    parsed: any,
    gaps: GapsAnalysis,
  ): { questions: InterviewQuestion[]; handicap_block: HandicapBlock | null } | null {
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
      return null;
    }
    const questions: InterviewQuestion[] = [];
    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i];
      if (!q || typeof q.question !== "string" || typeof q.conseil_reponse !== "string") return null;
      const categorie = VALID_CATEGORIES.has(q.categorie) ? q.categorie : "motivation";
      const probabilite = VALID_PROBABILITES.has(q.probabilite) ? q.probabilite : "moyenne";
      questions.push({
        id: typeof q.id === "string" && q.id.length > 0 ? q.id : `q${i + 1}`,
        question: q.question.trim(),
        categorie,
        probabilite,
        conseil_reponse: q.conseil_reponse.trim(),
        exemple_amorce: typeof q.exemple_amorce === "string" ? q.exemple_amorce.trim() : "",
        pieges_a_eviter: Array.isArray(q.pieges_a_eviter)
          ? q.pieges_a_eviter.filter((s: any) => typeof s === "string").slice(0, 5)
          : [],
        competences_profil_a_mobiliser: Array.isArray(q.competences_profil_a_mobiliser)
          ? q.competences_profil_a_mobiliser.filter((s: any) => typeof s === "string").slice(0, 6)
          : [],
      });
    }

    let handicap_block: HandicapBlock | null = null;
    if (gaps.handicap_context && parsed.handicap_block && typeof parsed.handicap_block === "object") {
      const hb = parsed.handicap_block;
      if (Array.isArray(hb.questions) && hb.questions.length > 0) {
        handicap_block = {
          titre:
            typeof hb.titre === "string" && hb.titre.length > 0
              ? hb.titre
              : "Section optionnelle — Preparer les questions sur l'amenagement de poste",
          intro: typeof hb.intro === "string" ? hb.intro : "",
          questions: hb.questions
            .filter(
              (q: any) =>
                q && typeof q.question === "string" && typeof q.conseil_reponse === "string",
            )
            .map((q: any) => ({
              question: q.question.trim(),
              conseil_reponse: q.conseil_reponse.trim(),
            }))
            .slice(0, 4),
        };
        if (handicap_block.questions.length === 0) handicap_block = null;
      }
    }

    return { questions, handicap_block };
  }
}
