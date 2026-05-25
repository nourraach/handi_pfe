import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import {
  candidatureTable,
  candidatTable,
  interviewQuestionsDossierTable,
  offreEmploiTable,
} from "../../db/schema";
import type { InterviewDossierPayload } from "./interview-questions.types";

/**
 * Feature 02 — Repository du dossier de questions d'entretien.
 */

export interface DossierRow {
  id: string;
  id_candidature: string;
  id_candidat: string;
  id_offre: string;
  questions_json: string | null;
  handicap_block_json: string | null;
  gaps_analysis_json: string | null;
  source: string | null;
  cache_key: string | null;
  regenerated_once: boolean;
  generation_status: string;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export class InterviewQuestionsRepository {
  /** Recupere le dossier par candidature (un seul dossier par candidature). */
  async getByCandidature(idCandidature: string): Promise<DossierRow | null> {
    const rows = await db
      .select()
      .from(interviewQuestionsDossierTable)
      .where(eq(interviewQuestionsDossierTable.id_candidature, idCandidature))
      .limit(1);
    return (rows[0] as DossierRow) ?? null;
  }

  /** Recupere le dossier par cache_key pour cache hit cross-candidatures. */
  async findByCacheKey(cacheKey: string): Promise<DossierRow | null> {
    const rows = await db
      .select()
      .from(interviewQuestionsDossierTable)
      .where(eq(interviewQuestionsDossierTable.cache_key, cacheKey))
      .limit(1);
    return (rows[0] as DossierRow) ?? null;
  }

  /**
   * Cree un dossier en statut "pending" si absent (idempotent).
   * Retourne le row (existant ou cree).
   */
  async upsertPending(args: {
    idCandidature: string;
    idCandidat: string;
    idOffre: string;
  }): Promise<DossierRow> {
    const existing = await this.getByCandidature(args.idCandidature);
    if (existing) return existing;

    const inserted = await db
      .insert(interviewQuestionsDossierTable)
      .values({
        id_candidature: args.idCandidature,
        id_candidat: args.idCandidat,
        id_offre: args.idOffre,
        generation_status: "pending",
      })
      .onConflictDoNothing({ target: interviewQuestionsDossierTable.id_candidature })
      .returning();

    if (inserted[0]) return inserted[0] as DossierRow;
    // Course condition : un autre process l'a cree entre-temps
    const after = await this.getByCandidature(args.idCandidature);
    if (!after) throw new Error("Impossible de creer ou recuperer le dossier");
    return after;
  }

  /** Tente le passage atomique pending|failed -> processing. Retourne true si reussi. */
  async tryMarkProcessing(idCandidature: string): Promise<boolean> {
    const res = await db
      .update(interviewQuestionsDossierTable)
      .set({ generation_status: "processing", updated_at: new Date() })
      .where(
        and(
          eq(interviewQuestionsDossierTable.id_candidature, idCandidature),
        ),
      )
      .returning({ status: interviewQuestionsDossierTable.generation_status });
    return res.length > 0;
  }

  async markReady(args: {
    idCandidature: string;
    payload: InterviewDossierPayload;
    gapsJson: string;
    cacheKey: string;
  }): Promise<void> {
    await db
      .update(interviewQuestionsDossierTable)
      .set({
        generation_status: "ready",
        source: args.payload.source,
        questions_json: JSON.stringify(args.payload.questions),
        handicap_block_json: args.payload.handicap_block
          ? JSON.stringify(args.payload.handicap_block)
          : null,
        gaps_analysis_json: args.gapsJson,
        cache_key: args.cacheKey,
        error_message: null,
        updated_at: new Date(),
      })
      .where(eq(interviewQuestionsDossierTable.id_candidature, args.idCandidature));
  }

  async markFailed(idCandidature: string, error: string): Promise<void> {
    await db
      .update(interviewQuestionsDossierTable)
      .set({
        generation_status: "failed",
        error_message: error.slice(0, 500),
        updated_at: new Date(),
      })
      .where(eq(interviewQuestionsDossierTable.id_candidature, idCandidature));
  }

  async markRegenerated(idCandidature: string): Promise<void> {
    await db
      .update(interviewQuestionsDossierTable)
      .set({ regenerated_once: true, updated_at: new Date() })
      .where(eq(interviewQuestionsDossierTable.id_candidature, idCandidature));
  }

  async resetForRegeneration(idCandidature: string): Promise<void> {
    await db
      .update(interviewQuestionsDossierTable)
      .set({
        generation_status: "processing",
        error_message: null,
        updated_at: new Date(),
      })
      .where(eq(interviewQuestionsDossierTable.id_candidature, idCandidature));
  }

  /** Recupere les donnees jointes (candidature + candidat + offre) necessaires a la generation. */
  async getGenerationContext(idCandidature: string) {
    const rows = await db
      .select({
        candidature: candidatureTable,
        candidat: candidatTable,
        offre: offreEmploiTable,
      })
      .from(candidatureTable)
      .innerJoin(candidatTable, eq(candidatTable.id, candidatureTable.id_candidat))
      .innerJoin(offreEmploiTable, eq(offreEmploiTable.id, candidatureTable.id_offre))
      .where(eq(candidatureTable.id, idCandidature))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Hash deterministe pour la cle de cache. */
  static computeCacheKey(args: {
    idOffre: string;
    idCandidat: string;
    profileSignature: string;
  }): string {
    return crypto
      .createHash("sha256")
      .update(`${args.idOffre}::${args.idCandidat}::${args.profileSignature}`)
      .digest("hex");
  }

  /** Signature du profil (change -> nouvelle cle de cache). */
  static computeProfileSignature(candidat: {
    competences: string[] | null | undefined;
    experience: string | null | undefined;
    formation: string | null | undefined;
    updated_at?: Date | null;
  }): string {
    const stable = JSON.stringify({
      c: (candidat.competences ?? []).slice().sort(),
      e: candidat.experience ?? "",
      f: candidat.formation ?? "",
      u: candidat.updated_at ? candidat.updated_at.toISOString().slice(0, 10) : "",
    });
    return crypto.createHash("sha256").update(stable).digest("hex").slice(0, 32);
  }
}
