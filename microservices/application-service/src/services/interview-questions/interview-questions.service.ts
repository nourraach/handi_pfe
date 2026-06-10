import { eq } from "drizzle-orm";
import { db } from "../../db";
import { candidatTable } from "../../db/schema";
import { ErreurApi } from "../../utils/erreur-api";
import { NotificationService } from "../notification.service";
import { EntretienRepository } from "../../repositories/entretien.repository";
import { GeminiInterviewQuestionsProvider } from "./gemini-interview-questions.provider";
import { InterviewGapsAnalyzer } from "./interview-gaps.analyzer";
import { buildFallbackDossier } from "./interview-questions.fallback";
import {
  InterviewQuestionsRepository,
  type DossierRow,
} from "./interview-questions.repository";
import type {
  GapsAnalysis,
  HandicapBlock,
  InterviewDossierPayload,
  InterviewQuestion,
} from "./interview-questions.types";

/**
 * Feature 02 — Service principal du predicteur de questions d'entretien.
 *
 * Responsabilites:
 *  - Declenche fire-and-forget au shortlist (scheduleGeneration)
 *  - Genere le dossier (generateDossier) : gaps -> Gemini -> persistance + notification
 *  - Expose le dossier au candidat proprietaire (getDossier)
 *  - Permet UNE regeneration manuelle (regenerate)
 */

export interface DossierView {
  status: "pending" | "processing" | "ready" | "failed" | "not_eligible";
  source: "gemini" | "fallback" | null;
  offre: { id: string; titre: string } | null;
  generated_at: string | null;
  can_regenerate: boolean;
  questions: InterviewQuestion[];
  handicap_block: HandicapBlock | null;
}

export class InterviewQuestionsService {
  private repository = new InterviewQuestionsRepository();
  private entretienRepository = new EntretienRepository();
  private analyzer = new InterviewGapsAnalyzer();
  private provider = new GeminiInterviewQuestionsProvider();
  private notificationService = new NotificationService();

  /**
   * Appele depuis shortlisterCandidat (fire-and-forget).
   * Cree l'enregistrement pending puis declenche la generation en background.
   */
  async scheduleGeneration(idCandidature: string): Promise<void> {
    const ctx = await this.repository.getGenerationContext(idCandidature);
    if (!ctx) return;
    const isAccessible = await this.isPreparationAccessible(idCandidature, ctx.candidature.statut);
    if (!isAccessible) return;

    await this.repository.upsertPending({
      idCandidature,
      idCandidat: ctx.candidat.id,
      idOffre: ctx.offre.id,
    });

    // Fire-and-forget : ne bloque pas la reponse HTTP du shortlist.
    void this.generateDossier(idCandidature).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[interview-prep] generation failed", { idCandidature, err: err?.message });
      void this.repository.markFailed(idCandidature, String(err?.message || err));
    });
  }

  /** Job de generation (idempotent par status). */
  async generateDossier(idCandidature: string): Promise<void> {
    const existing = await this.repository.getByCandidature(idCandidature);
    if (!existing) return;
    if (existing.generation_status === "ready") return;
    if (existing.generation_status === "processing") {
      // deja en cours dans un autre flux : ne pas dupliquer
      // (idempotence simple ; pas de lock distribue en MVP)
    }

    const ctx = await this.repository.getGenerationContext(idCandidature);
    if (!ctx) {
      await this.repository.markFailed(idCandidature, "Contexte introuvable");
      return;
    }

    await this.repository.tryMarkProcessing(idCandidature);

    // Cache hit ?
    const profileSignature = InterviewQuestionsRepository.computeProfileSignature({
      competences: ctx.candidat.competences as string[] | null,
      experience: ctx.candidat.experience,
      formation: ctx.candidat.formation,
      updated_at: ctx.candidat.updated_at,
    });
    const cacheKey = InterviewQuestionsRepository.computeCacheKey({
      idOffre: ctx.offre.id,
      idCandidat: ctx.candidat.id,
      profileSignature,
    });

    const cached = await this.repository.findByCacheKey(cacheKey);
    if (cached && cached.id_candidature !== idCandidature && cached.generation_status === "ready") {
      // Reutilise les questions deja generees pour ce meme profil + offre
      const payload: InterviewDossierPayload = {
        questions: JSON.parse(cached.questions_json || "[]"),
        handicap_block: cached.handicap_block_json
          ? JSON.parse(cached.handicap_block_json)
          : null,
        source: (cached.source as "gemini" | "fallback") || "fallback",
      };
      await this.repository.markReady({
        idCandidature,
        payload,
        gapsJson: cached.gaps_analysis_json || "{}",
        cacheKey,
      });
      await this.sendReadyNotification(ctx.candidat.id_utilisateur, idCandidature, ctx.offre.id, ctx.offre.titre);
      return;
    }

    // Analyse des gaps
    const gaps: GapsAnalysis = this.analyzer.analyze({
      candidat: {
        competences: ctx.candidat.competences as string[] | null,
        experience: ctx.candidat.experience,
        formation: ctx.candidat.formation,
        niveau_academique: ctx.candidat.niveau_academique,
        type_handicap: ctx.candidat.type_handicap,
        visibilite: ctx.candidat.visibilite as { handicap?: boolean } | null,
      },
      offre: {
        titre: ctx.offre.titre,
        description: ctx.offre.description,
        competences_requises: ctx.offre.competences_requises,
        experience_requise: ctx.offre.experience_requise,
        niveau_etude: ctx.offre.niveau_etude,
        amenagements_possibles: ctx.offre.amenagements_possibles,
      },
    });

    // Generation IA + fallback
    let payload: InterviewDossierPayload;
    try {
      payload = await this.provider.generate(gaps);
    } catch {
      payload = buildFallbackDossier(gaps);
    }

    await this.repository.markReady({
      idCandidature,
      payload,
      gapsJson: JSON.stringify(gaps),
      cacheKey,
    });

    await this.sendReadyNotification(
      ctx.candidat.id_utilisateur,
      idCandidature,
      ctx.offre.id,
      ctx.offre.titre,
    );
  }

  /** Lecture du dossier (verif proprietaire). */
  async getDossier(idCandidature: string, idUtilisateurRequester: string): Promise<DossierView> {
    const ctx = await this.repository.getGenerationContext(idCandidature);
    if (!ctx) throw new ErreurApi(404, "Candidature introuvable");

    // Verif proprietaire
    if (ctx.candidat.id_utilisateur !== idUtilisateurRequester) {
      throw new ErreurApi(403, "Acces non autorise a ce dossier");
    }

    const isAccessible = await this.isPreparationAccessible(idCandidature, ctx.candidature.statut);
    if (!isAccessible) {
      return this.emptyView("not_eligible", ctx.offre.id, ctx.offre.titre);
    }

    const row = await this.repository.getByCandidature(idCandidature);
    if (!row) {
      // Trigger asynchrone si absent (cas manuel)
      void this.scheduleGeneration(idCandidature);
      return this.emptyView("pending", ctx.offre.id, ctx.offre.titre);
    }

    if (row.generation_status === "pending" || row.generation_status === "failed") {
      void this.generateDossier(idCandidature).catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[interview-prep] auto-resume failed", { idCandidature, err: err?.message });
        void this.repository.markFailed(idCandidature, String(err?.message || err));
      });
      if (this.hasUsableDossier(row)) {
        return this.rowToView(row, ctx.offre.id, ctx.offre.titre);
      }
      return this.emptyView("processing", ctx.offre.id, ctx.offre.titre);
    }

    if (row.generation_status === "processing") {
      if (this.hasUsableDossier(row)) {
        return this.rowToView(row, ctx.offre.id, ctx.offre.titre);
      }
      return this.emptyView("processing", ctx.offre.id, ctx.offre.titre);
    }

    return this.rowToView(row, ctx.offre.id, ctx.offre.titre);
  }

  /** Regeneration manuelle (1 fois max). */
  async regenerate(idCandidature: string, idUtilisateurRequester: string): Promise<DossierView> {
    const ctx = await this.repository.getGenerationContext(idCandidature);
    if (!ctx) throw new ErreurApi(404, "Candidature introuvable");
    if (ctx.candidat.id_utilisateur !== idUtilisateurRequester) {
      throw new ErreurApi(403, "Acces non autorise");
    }
    const isAccessible = await this.isPreparationAccessible(idCandidature, ctx.candidature.statut);
    if (!isAccessible) {
      throw new ErreurApi(409, "Candidature non eligible a la regeneration");
    }

    const row = await this.repository.getByCandidature(idCandidature);
    if (!row) {
      await this.scheduleGeneration(idCandidature);
      return this.emptyView("pending", ctx.offre.id, ctx.offre.titre);
    }
    if (row.regenerated_once) {
      throw new ErreurApi(409, "Regeneration deja effectuee une fois");
    }

    await this.repository.markRegenerated(idCandidature);
    await this.repository.resetForRegeneration(idCandidature);

    void this.generateDossier(idCandidature).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[interview-prep] regenerate failed", { idCandidature, err: err?.message });
      void this.repository.markFailed(idCandidature, String(err?.message || err));
    });

    const updatedRow = await this.repository.getByCandidature(idCandidature);
    if (updatedRow && this.hasUsableDossier(updatedRow)) {
      return this.rowToView(updatedRow, ctx.offre.id, ctx.offre.titre);
    }

    return this.emptyView("processing", ctx.offre.id, ctx.offre.titre);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private emptyView(
    status: DossierView["status"],
    idOffre: string,
    titre: string,
  ): DossierView {
    return {
      status,
      source: null,
      offre: { id: idOffre, titre },
      generated_at: null,
      can_regenerate: false,
      questions: [],
      handicap_block: null,
    };
  }

  private hasUsableDossier(row: DossierRow): boolean {
    try {
      const questions = row.questions_json ? JSON.parse(row.questions_json) : [];
      return Array.isArray(questions) && questions.length > 0;
    } catch {
      return false;
    }
  }

  private async isPreparationAccessible(idCandidature: string, statutCandidature: string): Promise<boolean> {
    if (statutCandidature === "shortlisted") return true;

    const entretien = await this.entretienRepository.obtenirEntretienActifParCandidature(idCandidature);
    if (!entretien) {
      return statutCandidature === "interview_scheduled";
    }

    const dateEntretien = new Date(entretien.date_heure);
    if (Number.isNaN(dateEntretien.getTime())) return true;

    return dateEntretien.getTime() >= Date.now();
  }

  private rowToView(row: DossierRow, idOffre: string, titre: string): DossierView {
    const status = row.generation_status as DossierView["status"];
    const questions: InterviewQuestion[] = row.questions_json ? JSON.parse(row.questions_json) : [];
    const handicap_block: HandicapBlock | null = row.handicap_block_json
      ? JSON.parse(row.handicap_block_json)
      : null;
    return {
      status,
      source: (row.source as "gemini" | "fallback" | null) ?? null,
      offre: { id: idOffre, titre },
      generated_at: questions.length > 0 ? row.updated_at.toISOString() : null,
      can_regenerate: row.generation_status === "ready" && !row.regenerated_once,
      questions,
      handicap_block,
    };
  }

  private async sendReadyNotification(
    idUtilisateur: string,
    idCandidature: string,
    idOffre: string,
    titreOffre: string,
  ): Promise<void> {
    try {
      await this.notificationService.creerNotification({
        id_utilisateur: idUtilisateur,
        type: "interview_prep_ready",
        titre: "Votre preparation d'entretien est prete",
        message: `Vos questions d'entretien personnalisees pour "${titreOffre}" sont disponibles.`,
        data: JSON.stringify({
          id_candidature: idCandidature,
          id_offre: idOffre,
          category: "interview_prep_ready",
          cta: {
            label: "Voir mes questions d'entretien",
            href: `/candidat/candidatures/${idCandidature}/preparation-entretien`,
          },
        }),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[interview-prep] notification failed", err);
    }
  }
}

// Singleton partage par l'application (evite multiple connexions et facilite mock en test)
export const interviewQuestionsService = new InterviewQuestionsService();

/** Helper: resout id_utilisateur -> id_candidat (utilise par le controller). */
export async function resolveCandidatIdFromUser(idUtilisateur: string): Promise<string | null> {
  const rows = await db
    .select({ id: candidatTable.id })
    .from(candidatTable)
    .where(eq(candidatTable.id_utilisateur, idUtilisateur))
    .limit(1);
  return rows[0]?.id ?? null;
}
