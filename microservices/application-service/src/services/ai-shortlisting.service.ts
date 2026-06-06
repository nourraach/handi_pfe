import { readFile } from "fs/promises";
import path from "path";
import { env } from "../config/env";

type OffreMatching = {
  titre?: string | null;
  description?: string | null;
  localisation?: string | null;
  type_poste?: string | null;
  salaire_min?: string | null;
  salaire_max?: string | null;
  competences_requises?: string | null;
  experience_requise?: string | null;
  accessibilite_handicap?: boolean | null;
  amenagements_possibles?: string | null;
  ai_shortlist_min_score?: number | null;
};

type AnalyseIaResponse = {
  eligible?: boolean;
  score_global?: number | string | null;
  raisons_elimination?: string[];
};

export type DecisionShortlisting = {
  statut: "pending" | "shortlisted" | "rejected";
  score_test?: number;
  motif_refus?: string;
};

export class AiShortlistingService {
  private async getBaseUrl(): Promise<string | null> {
    for (const url of env.aiServiceUrls) {
      try {
        const response = await fetch(`${url}/`, {
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          return url;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  async evaluerCandidature(cvUrl: string | undefined, offre: OffreMatching): Promise<DecisionShortlisting> {
    if (!cvUrl) {
      return { statut: "pending" };
    }

    const cvPath = this.resolveCvPath(cvUrl);
    if (!cvPath) {
      return { statut: "pending" };
    }

    const baseUrl = await this.getBaseUrl();
    if (!baseUrl) {
      return { statut: "pending" };
    }

    const buffer = await readFile(cvPath);
    const formData = new FormData();
    const fileName = path.basename(cvPath);

    formData.append("cv", new Blob([buffer], { type: this.getMimeType(fileName) }), fileName);
    formData.append("texte_offre", this.buildOfferText(offre));
    formData.append("experience_min", String(this.extractExperienceMin(offre.experience_requise)));

    const response = await fetch(`${baseUrl}/analyser-cv`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(env.aiRequestTimeoutMs),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`AI shortlisting failed with ${response.status}: ${detail}`);
    }

    const analyse = (await response.json()) as AnalyseIaResponse;
    return this.decide(analyse, offre.ai_shortlist_min_score);
  }

  private decide(analyse: AnalyseIaResponse, seuilOffre?: number | null): DecisionShortlisting {
    const score = this.normalizeScore(analyse.score_global);
    const seuil = this.normalizeThreshold(seuilOffre);

    if (analyse.eligible === false) {
      const raisons = Array.isArray(analyse.raisons_elimination)
        ? analyse.raisons_elimination.filter(Boolean)
        : [];

      return {
        statut: "rejected",
        score_test: 0,
        motif_refus:
          raisons.length > 0
            ? `Rejet automatique IA: ${raisons.join(", ")}.`
            : "Rejet automatique IA: candidature non eligible selon les regles metier.",
      };
    }

    if (score >= seuil) {
      return {
        statut: "shortlisted",
        score_test: score,
      };
    }

    return {
      statut: "rejected",
      score_test: score,
      motif_refus: `Rejet automatique IA: score ${score}% inferieur au seuil minimum de ${seuil}%.`,
    };
  }

  private normalizeScore(value: unknown): number {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseFloat(value.replace(",", "."))
          : 0;

    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  private normalizeThreshold(value: unknown): number {
    const numeric =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number.parseFloat(value.replace(",", "."))
          : env.aiShortlistMinScore;

    if (!Number.isFinite(numeric)) {
      return env.aiShortlistMinScore;
    }

    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  private resolveCvPath(cvUrl: string): string | null {
    if (!cvUrl.startsWith("/uploads/")) {
      return null;
    }

    return path.resolve(process.cwd(), "public", cvUrl.replace(/^\/+/, ""));
  }

  private extractExperienceMin(raw: string | null | undefined): number {
    if (!raw) {
      return 0;
    }

    const match = raw.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) || 0 : 0;
  }

  private buildOfferText(offre: OffreMatching): string {
    const salary =
      offre.salaire_min || offre.salaire_max
        ? `Salaire: ${offre.salaire_min || "?"}${offre.salaire_max ? ` - ${offre.salaire_max}` : ""}`
        : "";

    return [
      offre.titre ? `Titre: ${offre.titre}` : "",
      offre.description ? `Description: ${offre.description}` : "",
      offre.localisation ? `Localisation: ${offre.localisation}` : "",
      offre.type_poste ? `Contrat: ${offre.type_poste}` : "",
      salary,
      offre.competences_requises ? `Competences requises: ${offre.competences_requises}` : "",
      offre.experience_requise ? `Experience requise: ${offre.experience_requise}` : "",
      offre.accessibilite_handicap ? "Poste accessible aux personnes en situation de handicap." : "",
      offre.amenagements_possibles ? `Amenagements possibles: ${offre.amenagements_possibles}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    switch (ext) {
      case ".docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case ".doc":
        return "application/msword";
      default:
        return "application/pdf";
    }
  }
}
