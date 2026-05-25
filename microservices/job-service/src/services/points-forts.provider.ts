import { env } from "../config/env";

type SourcePointsForts = "claude" | "fallback";

type DonneesProfilPointsForts = {
  nom?: string;
  competences?: string[] | null;
  experience?: string | null;
  formation?: string | null;
  description?: string | null;
  secteur?: string | null;
  disponibilite?: string | null;
};

type ResultatPointsForts = {
  pointsForts: string[];
  source: SourcePointsForts;
};

export class PointsFortsProvider {
  async genererTroisPointsForts(donnees: DonneesProfilPointsForts): Promise<ResultatPointsForts> {
    const fallback = this.genererFallback(donnees);
    if (!env.claudeApiKey) {
      return { pointsForts: fallback, source: "fallback" };
    }

    try {
      const prompt = this.construirePrompt(donnees);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.claudeApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.claudeModel,
          max_tokens: 220,
          temperature: 0.2,
          system:
            "Tu es un coach de preparation a l'entretien. Retourne strictement un JSON: {\"points_forts\":[\"...\",\"...\",\"...\"]}. Trois points forts concrets, positifs, non medicaux.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        return { pointsForts: fallback, source: "fallback" };
      }

      const payload: any = await response.json();
      const texte = Array.isArray(payload?.content)
        ? payload.content.map((bloc: any) => bloc?.text || "").join("\n")
        : "";
      const points = this.extrairePoints(texte);

      if (points.length !== 3) {
        return { pointsForts: fallback, source: "fallback" };
      }

      return { pointsForts: points, source: "claude" };
    } catch (_error) {
      return { pointsForts: fallback, source: "fallback" };
    }
  }

  private construirePrompt(donnees: DonneesProfilPointsForts) {
    return [
      "Voici des informations de profil candidat:",
      `Nom: ${donnees.nom ?? "Non renseigne"}`,
      `Competences: ${(donnees.competences ?? []).join(", ") || "Non renseigne"}`,
      `Experience: ${donnees.experience ?? "Non renseigne"}`,
      `Formation: ${donnees.formation ?? "Non renseigne"}`,
      `Description: ${donnees.description ?? "Non renseigne"}`,
      `Secteur: ${donnees.secteur ?? "Non renseigne"}`,
      `Disponibilite: ${donnees.disponibilite ?? "Non renseigne"}`,
      "Donne exactement 3 points forts brefs et concrets pour un entretien d'embauche.",
    ].join("\n");
  }

  private extrairePoints(texte: string) {
    try {
      const debut = texte.indexOf("{");
      const fin = texte.lastIndexOf("}");
      if (debut === -1 || fin === -1 || fin <= debut) {
        return [];
      }

      const parsed = JSON.parse(texte.slice(debut, fin + 1));
      const points = Array.isArray(parsed?.points_forts) ? parsed.points_forts : [];
      const nettoyes = points
        .map((p: unknown) => String(p ?? "").trim())
        .filter(Boolean)
        .slice(0, 3);
      return nettoyes;
    } catch (_error) {
      return [];
    }
  }

  private genererFallback(donnees: DonneesProfilPointsForts) {
    const points: string[] = [];
    const competences = Array.isArray(donnees.competences) ? donnees.competences : [];

    if (competences.length > 0) {
      points.push(`Vos competences principales (${competences.slice(0, 2).join(", ")}) renforcent votre profil pour ce poste.`);
    }

    if (donnees.experience?.trim()) {
      points.push("Votre experience vous donne des exemples concrets a partager pendant l'entretien.");
    }

    if (donnees.formation?.trim()) {
      points.push("Votre formation montre une base solide et une capacite d'apprentissage continue.");
    }

    if (points.length < 3 && donnees.description?.trim()) {
      points.push("Votre presentation de profil montre une vision claire de votre projet professionnel.");
    }

    if (points.length < 3 && donnees.secteur?.trim()) {
      points.push(`Votre orientation vers le secteur ${donnees.secteur} montre une direction professionnelle coherente.`);
    }

    const defaults = [
      "Vous avez une base professionnelle pertinente pour cet entretien.",
      "Vous pouvez presenter votre motivation avec clarte et structure.",
      "Vous etes en capacite d'expliquer vos forces avec des exemples simples.",
    ];

    for (const defaut of defaults) {
      if (points.length >= 3) {
        break;
      }
      points.push(defaut);
    }

    return points.slice(0, 3);
  }
}

