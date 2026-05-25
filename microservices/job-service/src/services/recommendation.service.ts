import { eq } from "drizzle-orm";
import { db } from "../db";
import { candidatTable } from "../db/schema";
import { RecommendationRepository } from "../repositories/recommendation.repository";
import { ErreurApi } from "../utils/erreur-api";
import { RecommendationListItemDto, UpdateMatchingConsentDto } from "../dto/recommendation.dto";

export class RecommendationService {
  constructor(private readonly recommendationRepository = new RecommendationRepository()) {}

  async resolveCandidatId(idUtilisateur: string): Promise<string> {
    const rows = await db
      .select({ id: candidatTable.id })
      .from(candidatTable)
      .where(eq(candidatTable.id_utilisateur, idUtilisateur))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new ErreurApi(404, "Profil candidat introuvable");
    }

    return row.id;
  }

  async obtenirRecommandationsCandidat(idCandidat: string): Promise<RecommendationListItemDto[]> {
    const rows = await this.recommendationRepository.getCandidateRecommendations(idCandidat);

    return rows.map((row) => ({
      id: row.recommendation.id,
      job_offer_id: row.recommendation.id_offre,
      score_final: Number(row.recommendation.score_final),
      status: row.recommendation.status,
      explanation: row.recommendation.explanation_json || {},
      created_at: row.recommendation.created_at.toISOString(),
      offre: {
        titre: row.offre.titre,
        localisation: row.offre.localisation,
        type_poste: row.offre.type_poste,
        salaire_min: row.offre.salaire_min,
        salaire_max: row.offre.salaire_max,
        nom_entreprise: row.entreprise.nom_entreprise,
      },
    }));
  }

  async marquerView(idRecommendation: string, idCandidat: string) {
    const row = await this.recommendationRepository.updateRecommendationStatus(idRecommendation, idCandidat, "viewed");
    if (!row) {
      throw new ErreurApi(404, "Recommandation introuvable");
    }
    return row;
  }

  async marquerDismiss(idRecommendation: string, idCandidat: string) {
    const row = await this.recommendationRepository.updateRecommendationStatus(idRecommendation, idCandidat, "dismissed");
    if (!row) {
      throw new ErreurApi(404, "Recommandation introuvable");
    }
    return row;
  }

  async marquerApply(idRecommendation: string, idCandidat: string) {
    const row = await this.recommendationRepository.updateRecommendationStatus(idRecommendation, idCandidat, "applied");
    if (!row) {
      throw new ErreurApi(404, "Recommandation introuvable");
    }
    return row;
  }

  async obtenirConsentementMatching(idCandidat: string) {
    const consent = await this.recommendationRepository.getMatchingConsent(idCandidat);
    if (!consent) {
      return {
        id_candidat: idCandidat,
        allow_accessibility_matching: false,
        allow_semantic_embedding: true,
      };
    }

    return consent;
  }

  async mettreAJourConsentementMatching(idCandidat: string, payload: UpdateMatchingConsentDto) {
    const existing = await this.recommendationRepository.getMatchingConsent(idCandidat);
    const allowAccessibility =
      payload.allow_accessibility_matching ?? existing?.allow_accessibility_matching ?? false;
    const allowSemantic = payload.allow_semantic_embedding ?? existing?.allow_semantic_embedding ?? true;

    return this.recommendationRepository.upsertMatchingConsent(idCandidat, {
      allow_accessibility_matching: allowAccessibility,
      allow_semantic_embedding: allowSemantic,
    });
  }
}

