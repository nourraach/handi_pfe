import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  candidateMatchingConsentTable,
  recommendationTable,
  offreEmploiTable,
  entrepriseTable,
} from "../db/schema";

type RecommendationUpsertInput = {
  id_candidat: string;
  id_offre: string;
  score_final: number;
  score_semantic: number;
  score_skills: number;
  score_preferences: number;
  score_accessibility: number;
  explanation_json: Record<string, unknown>;
  status: "pending" | "notified" | "viewed" | "applied" | "dismissed";
  notified_at?: Date | null;
  meta?: string;
};

export class RecommendationRepository {
  async upsertRecommendation(input: RecommendationUpsertInput) {
    const [row] = await db
      .insert(recommendationTable)
      .values({
        id_candidat: input.id_candidat,
        id_offre: input.id_offre,
        score_final: input.score_final.toFixed(4),
        score_semantic: input.score_semantic.toFixed(4),
        score_skills: input.score_skills.toFixed(4),
        score_preferences: input.score_preferences.toFixed(4),
        score_accessibility: input.score_accessibility.toFixed(4),
        explanation_json: input.explanation_json,
        status: input.status,
        notified_at: input.notified_at ?? null,
        meta: input.meta,
      })
      .onConflictDoUpdate({
        target: [recommendationTable.id_candidat, recommendationTable.id_offre],
        set: {
          score_final: input.score_final.toFixed(4),
          score_semantic: input.score_semantic.toFixed(4),
          score_skills: input.score_skills.toFixed(4),
          score_preferences: input.score_preferences.toFixed(4),
          score_accessibility: input.score_accessibility.toFixed(4),
          explanation_json: input.explanation_json,
          status: input.status,
          notified_at: input.notified_at ?? null,
          meta: input.meta,
          updated_at: new Date(),
        },
      })
      .returning();

    return row;
  }

  async getCandidateRecommendations(idCandidat: string) {
    return db
      .select({
        recommendation: recommendationTable,
        offre: {
          id: offreEmploiTable.id,
          titre: offreEmploiTable.titre,
          localisation: offreEmploiTable.localisation,
          type_poste: offreEmploiTable.type_poste,
          salaire_min: offreEmploiTable.salaire_min,
          salaire_max: offreEmploiTable.salaire_max,
        },
        entreprise: {
          nom_entreprise: entrepriseTable.nom_entreprise,
        },
      })
      .from(recommendationTable)
      .innerJoin(offreEmploiTable, eq(recommendationTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(recommendationTable.id_candidat, idCandidat))
      .orderBy(desc(recommendationTable.score_final), desc(recommendationTable.created_at));
  }

  async updateRecommendationStatus(
    idRecommendation: string,
    idCandidat: string,
    status: "viewed" | "dismissed" | "applied",
  ) {
    const patch: Partial<typeof recommendationTable.$inferInsert> = {
      status,
      updated_at: new Date(),
    };

    if (status === "viewed") {
      patch.viewed_at = new Date();
    }

    const [row] = await db
      .update(recommendationTable)
      .set(patch)
      .where(
        and(
          eq(recommendationTable.id, idRecommendation),
          eq(recommendationTable.id_candidat, idCandidat),
        ),
      )
      .returning();

    return row ?? null;
  }

  async getMatchingConsent(idCandidat: string) {
    const rows = await db
      .select()
      .from(candidateMatchingConsentTable)
      .where(eq(candidateMatchingConsentTable.id_candidat, idCandidat))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertMatchingConsent(
    idCandidat: string,
    payload: {
      allow_accessibility_matching: boolean;
      allow_semantic_embedding: boolean;
    },
  ) {
    const [row] = await db
      .insert(candidateMatchingConsentTable)
      .values({
        id_candidat: idCandidat,
        allow_accessibility_matching: payload.allow_accessibility_matching,
        allow_semantic_embedding: payload.allow_semantic_embedding,
      })
      .onConflictDoUpdate({
        target: candidateMatchingConsentTable.id_candidat,
        set: {
          allow_accessibility_matching: payload.allow_accessibility_matching,
          allow_semantic_embedding: payload.allow_semantic_embedding,
          updated_at: new Date(),
        },
      })
      .returning();

    return row;
  }
}

