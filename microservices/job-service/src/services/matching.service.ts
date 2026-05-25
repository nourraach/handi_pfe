import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { candidatTable, offreEmploiTable, utilisateurTable } from "../db/schema";
import { NotificationService } from "./notification.service";
import { RecommendationRepository } from "../repositories/recommendation.repository";
import { EmbeddingStorageService } from "./embedding-storage.service";
import { sql } from "drizzle-orm";

type CandidateRow = {
  id: string;
  id_utilisateur: string;
  competences: unknown;
  disponibilite: string | null;
  preferences_accessibilite: unknown;
  addresse: string;
};

type MatchExplanation = {
  matchedSkills: string[];
  missingSkills: string[];
  preferenceMatches: string[];
  accessibilityMatches: string[];
  semanticReason: string;
  notes: string[];
};

// Phase 1 calibration (structured-only): keep recommendations useful before embeddings are enabled.
const NOTIFY_THRESHOLD = 0.45;
const STORE_THRESHOLD = 0.35;

export class MatchingService {
  private readonly notificationService = new NotificationService();
  private readonly recommendationRepository = new RecommendationRepository();
  private readonly embeddingStorage = new EmbeddingStorageService();
  private readonly ensureSchemaPromise = this.ensureRecommendationSchema();

  private async ensureRecommendationSchema() {
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_status') THEN
            CREATE TYPE recommendation_status AS ENUM ('pending', 'notified', 'viewed', 'applied', 'dismissed');
          END IF;
        END$$;
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS recommendation (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          id_candidat UUID NOT NULL REFERENCES candidat(id) ON DELETE CASCADE,
          id_offre UUID NOT NULL REFERENCES offre_emploi(id) ON DELETE CASCADE,
          score_final NUMERIC(5,4) NOT NULL,
          score_semantic NUMERIC(5,4) NOT NULL DEFAULT 0,
          score_skills NUMERIC(5,4) NOT NULL DEFAULT 0,
          score_preferences NUMERIC(5,4) NOT NULL DEFAULT 0,
          score_accessibility NUMERIC(5,4) NOT NULL DEFAULT 0,
          explanation_json JSON NOT NULL,
          status recommendation_status NOT NULL DEFAULT 'pending',
          notified_at TIMESTAMP NULL,
          viewed_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          meta TEXT NULL,
          CONSTRAINT recommendation_candidate_offer_unique UNIQUE (id_candidat, id_offre)
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS candidate_matching_consent (
          id_candidat UUID PRIMARY KEY REFERENCES candidat(id) ON DELETE CASCADE,
          allow_accessibility_matching BOOLEAN NOT NULL DEFAULT false,
          allow_semantic_embedding BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    } catch (error) {
      console.error("Matching schema init failed:", error);
    }
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s+-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private splitTags(value?: string | null): string[] {
    if (!value) return [];
    return value
      .split(/[,\n;|/]/g)
      .map((item) => this.normalizeText(item))
      .filter((item) => item.length > 0);
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (typeof item === "string" ? this.normalizeText(item) : ""))
      .filter((item) => item.length > 0);
  }

  private unique(values: string[]) {
    return Array.from(new Set(values));
  }

  private computeSkillScore(requiredSkills: string[], candidateSkills: string[]) {
    if (requiredSkills.length === 0) return { score: 0.7, matched: [], missing: [] as string[] };
    const candidateSet = new Set(candidateSkills);
    const matched = requiredSkills.filter((skill) => candidateSet.has(skill));
    const missing = requiredSkills.filter((skill) => !candidateSet.has(skill));
    return {
      score: matched.length / requiredSkills.length,
      matched,
      missing,
    };
  }

  private computePreferenceScore(candidate: CandidateRow, offerLocation: string, offerTypePoste: string) {
    const pref = this.normalizeText(candidate.disponibilite || "");
    const address = this.normalizeText(candidate.addresse || "");
    const location = this.normalizeText(offerLocation || "");
    const typePoste = this.normalizeText(offerTypePoste || "");
    const matches: string[] = [];
    let score = 0.4;

    if (pref && typePoste && pref.includes(typePoste.replace("_", " "))) {
      score += 0.3;
      matches.push(`Type de contrat compatible (${offerTypePoste})`);
    }

    if (location && (address.includes(location) || location.includes("remote") || location.includes("hybrid"))) {
      score += 0.3;
      matches.push(`Localisation compatible (${offerLocation})`);
    }

    return { score: Math.min(1, score), matches };
  }

  private computeAccessibilityScore(
    consent: { allow_accessibility_matching: boolean } | null,
    candidateNeeds: string[],
    offerAmenities: string[],
  ) {
    if (!consent?.allow_accessibility_matching) {
      return {
        score: 0.5,
        matches: [] as string[],
        note: "Accessibilite non utilisee faute de consentement explicite.",
      };
    }

    if (candidateNeeds.length === 0) {
      return { score: 1, matches: [], note: "Aucun besoin specifique declare." };
    }

    const offerSet = new Set(offerAmenities);
    const matches = candidateNeeds.filter((need) => offerSet.has(need));
    return {
      score: matches.length / candidateNeeds.length,
      matches,
      note: "",
    };
  }

  async matchPublishedJob(jobOfferId: string) {
    await this.ensureSchemaPromise;

    const offers = await db
      .select()
      .from(offreEmploiTable)
      .where(and(eq(offreEmploiTable.id, jobOfferId), eq(offreEmploiTable.statut, "active")))
      .limit(1);
    const offer = offers[0];
    if (!offer) {
      return { processed: 0, stored: 0, notified: 0 };
    }

    const candidates = await db
      .select({
        id: candidatTable.id,
        id_utilisateur: candidatTable.id_utilisateur,
        competences: candidatTable.competences,
        disponibilite: candidatTable.disponibilite,
        preferences_accessibilite: candidatTable.preferences_accessibilite,
        addresse: utilisateurTable.addresse,
      })
      .from(candidatTable)
      .innerJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(utilisateurTable.statut, "actif"));

    const requiredSkills = this.unique(this.splitTags(offer.competences_requises));
    const offerAmenities = this.unique(
      this.splitTags(offer.amenagements_possibles).concat(
        offer.accessibilite_handicap ? ["accessible", "amenagement"] : [],
      ),
    );
    const jobEmbedding = await this.embeddingStorage.getJobOfferEmbedding(offer.id);
    const candidateEmbeddingMap = await this.embeddingStorage.getCandidateEmbeddings(
      candidates.map((candidate) => candidate.id),
    );

    let stored = 0;
    let notified = 0;

    for (const candidate of candidates) {
      const candidateSkills = this.unique(this.toStringArray(candidate.competences));
      const skill = this.computeSkillScore(requiredSkills, candidateSkills);
      const pref = this.computePreferenceScore(candidate, offer.localisation, offer.type_poste);
      const consent = await this.recommendationRepository.getMatchingConsent(candidate.id);
      const accessibility = this.computeAccessibilityScore(
        consent,
        this.unique(this.toStringArray(candidate.preferences_accessibilite)),
        offerAmenities,
      );

      const semanticEnabled = Boolean(consent?.allow_semantic_embedding);
      const candidateEmbedding = candidateEmbeddingMap.get(candidate.id) || [];
      const semanticAvailable = semanticEnabled && Boolean(jobEmbedding?.length) && candidateEmbedding.length > 0;
      const semanticScore = semanticAvailable
        ? this.embeddingStorage.cosineSimilarity(jobEmbedding || [], candidateEmbedding)
        : 0;

      const finalScore = semanticAvailable
        ? 0.4 * semanticScore + 0.3 * skill.score + 0.2 * pref.score + 0.1 * accessibility.score
        : 0.55 * skill.score + 0.3 * pref.score + 0.15 * accessibility.score;

      if (finalScore < STORE_THRESHOLD) continue;

      const explanation: MatchExplanation = {
        matchedSkills: skill.matched,
        missingSkills: skill.missing,
        preferenceMatches: pref.matches,
        accessibilityMatches: accessibility.matches,
        semanticReason: semanticAvailable
          ? "Similarite semantique calculee depuis les embeddings candidat/offre."
          : semanticEnabled
            ? "Mode semantique autorise, mais embeddings absents: fallback structure active."
            : "Score semantique desactive: classement base sur competences, preferences et accessibilite.",
        notes: accessibility.note ? [accessibility.note] : [],
      };

      const shouldNotify = finalScore >= NOTIFY_THRESHOLD;
      await this.recommendationRepository.upsertRecommendation({
        id_candidat: candidate.id,
        id_offre: offer.id,
        score_final: finalScore,
        score_semantic: semanticScore,
        score_skills: skill.score,
        score_preferences: pref.score,
        score_accessibility: accessibility.score,
        explanation_json: explanation as unknown as Record<string, unknown>,
        status: shouldNotify ? "notified" : "pending",
        notified_at: shouldNotify ? new Date() : null,
        meta: JSON.stringify({ version: "v1-structured", threshold: STORE_THRESHOLD }),
      });
      stored += 1;

      if (shouldNotify) {
        notified += 1;
        await this.notificationService.creerNotification({
          id_utilisateur: candidate.id_utilisateur,
          type: "system",
          titre: "Nouvelle offre compatible",
          message: `${offer.titre} semble compatible avec votre profil.`,
          data: JSON.stringify({
            type: "job_recommendation",
            job_offer_id: offer.id,
            final_score: Number(finalScore.toFixed(4)),
            matched_skills: skill.matched.slice(0, 3),
          }),
        });
      }
    }

    return {
      processed: candidates.length,
      stored,
      notified,
    };
  }
}
