// @ts-nocheck
import path from "path";
import { promises as fs } from "fs";
import { eq } from "drizzle-orm";
import { CandidatureRepository } from "../repositories/candidature.repository";
import { OffreEmploiRepository } from "../repositories/offre-emploi.repository";
import { OffreEmploiService } from "./offre-emploi.service";
import { NotificationService } from "./notification.service";
import { PostulerDto, ModifierStatutCandidatureDto, FiltreCandidatureDto } from "../dto/candidature.dto";
import { ErreurApi } from "../utils/erreur-api";
import { db } from "../db";
import { candidatTable, entrepriseTable } from "../db/schema";
import { env } from "../config/env";

type AnalyseIaResultat = {
  statut: "pending" | "shortlisted" | "rejected";
  motifRefus?: string;
  scoreTest?: number | null;
  noteIa?: string | null;
  source: "ia" | "manual";
};

export class CandidatureService {
  private candidatureRepository = new CandidatureRepository();
  private offreRepository = new OffreEmploiRepository();
  private offreService = new OffreEmploiService();
  private notificationService = new NotificationService();

  private async resolveCandidatId(idUtilisateur: string): Promise<string> {
    const rows = await db
      .select({ id: candidatTable.id })
      .from(candidatTable)
      .where(eq(candidatTable.id_utilisateur, idUtilisateur))
      .limit(1);
    const row = rows[0];
    if (!row) throw new ErreurApi(404, "Profil candidat introuvable pour cet utilisateur");
    return row.id;
  }

  private async resolveEntrepriseId(idUtilisateur: string): Promise<string> {
    const rows = await db
      .select({ id: entrepriseTable.id })
      .from(entrepriseTable)
      .where(eq(entrepriseTable.id_utilisateur, idUtilisateur))
      .limit(1);
    const row = rows[0];
    if (!row) throw new ErreurApi(404, "Profil entreprise introuvable pour cet utilisateur");
    return row.id;
  }

  async resoudreIdCandidat(idUtilisateur: string): Promise<string> {
    return this.resolveCandidatId(idUtilisateur);
  }

  async resoudreIdEntreprise(idUtilisateur: string): Promise<string> {
    return this.resolveEntrepriseId(idUtilisateur);
  }

  async postuler(idCandidat: string, donnees: PostulerDto) {
    try {
      if (!donnees.cv_url) {
        throw new ErreurApi(400, "Le CV est obligatoire pour postuler a cette offre");
      }

      const offre: any = await this.offreRepository.obtenirOffreParId(donnees.id_offre);
      if (!offre || offre.statut !== "active") {
        throw new ErreurApi(400, "Cette offre n'est plus disponible");
      }

      await this.verifierEligibilite(idCandidat, donnees.id_offre);

      const entrepriseRow = await db
        .select({ id_utilisateur: entrepriseTable.id_utilisateur })
        .from(entrepriseTable)
        .where(eq(entrepriseTable.id, offre.id_entreprise))
        .limit(1);
      const idUtilisateurEntreprise = entrepriseRow[0]?.id_utilisateur;
      if (!idUtilisateurEntreprise) {
        throw new ErreurApi(404, "Entreprise introuvable pour cette offre");
      }

      let candidature;
      try {
        candidature = await this.candidatureRepository.postuler(String(idCandidat), donnees);
      } catch (err: any) {
        const msg = String(err?.message || "");
        console.error("postuler error:", msg);

        if (msg.toLowerCase().includes("deja postule")) {
          const candidatureExistante = await this.candidatureRepository.obtenirCandidatureParCandidatEtOffre(
            String(idCandidat),
            String(donnees.id_offre)
          );

          if (candidatureExistante?.statut === "pending") {
            const decisionIaExistante = await this.evaluerCandidatureAvecIa({
              cvUrl: candidatureExistante.cv_url || donnees.cv_url,
              texteOffre: `${offre?.titre || ""}\n\n${offre?.description || ""}`.trim(),
            });
            const candidatureMaj = await this.appliquerDecisionIaSurCandidature(candidatureExistante, decisionIaExistante);

            const statut = candidatureMaj?.statut || "pending";
            const motif = candidatureMaj?.motif_refus ? ` Motif: ${candidatureMaj.motif_refus}` : "";
            throw new ErreurApi(409, `Vous avez deja postule a cette offre. Statut actuel: ${statut}.${motif}`);
          }

          const statut = candidatureExistante?.statut || "pending";
          const motif = candidatureExistante?.motif_refus ? ` Motif: ${candidatureExistante.motif_refus}` : "";
          throw new ErreurApi(409, `Vous avez deja postule a cette offre. Statut actuel: ${statut}.${motif}`);
        }

        if (msg.toLowerCase().includes("foreign key")) {
          throw new ErreurApi(400, "Offre ou candidat introuvable");
        }
        throw err;
      }

      await this.notificationService.notifierNouvelleCandidat(
        idUtilisateurEntreprise,
        candidature.id,
        offre.titre || "Offre"
      );

      const candidatUtilisateur = await db
        .select({ id_utilisateur: candidatTable.id_utilisateur })
        .from(candidatTable)
        .where(eq(candidatTable.id, idCandidat))
        .limit(1);
      const idUtilisateurCandidat = candidatUtilisateur[0]?.id_utilisateur;

      const decisionIa = await this.evaluerCandidatureAvecIa({
        cvUrl: candidature.cv_url || donnees.cv_url,
        texteOffre: `${offre?.titre || ""}\n\n${offre?.description || ""}`.trim(),
      });

      candidature = await this.appliquerDecisionIaSurCandidature(candidature, decisionIa);

      await this.offreService.incrementerCandidatures(donnees.id_offre);

      if (idUtilisateurCandidat) {
        await this.notificationService.notifierChangementStatut(
          idUtilisateurCandidat,
          candidature.statut || "pending",
          offre.titre || "Offre",
          {
            motifRefus: candidature.motif_refus || undefined,
            source: decisionIa.source,
          }
        );
      }

      return candidature;
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la candidature: ${error.message}`);
    }
  }

  async obtenirCandidaturesCandidat(idCandidat: string) {
    try {
      return await this.candidatureRepository.obtenirCandidaturesCandidat(String(idCandidat));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des candidatures: ${error.message}`);
    }
  }

  async obtenirCandidaturesEntreprise(idEntreprise: string, filtres: FiltreCandidatureDto = {}) {
    try {
      return await this.candidatureRepository.obtenirCandidaturesEntreprise(String(idEntreprise), filtres);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des candidatures: ${error.message}`);
    }
  }

  async obtenirCandidaturesParOffre(idOffre: string, idEntreprise: string, filtres: FiltreCandidatureDto = {}) {
    try {
      const offre: any = await this.offreRepository.obtenirOffreParId(String(idOffre));
      if (!offre) {
        throw new ErreurApi(404, "Offre introuvable");
      }

      if (offre.id_entreprise !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a voir ces candidatures");
      }

      return await this.candidatureRepository.obtenirCandidaturesEntreprise(String(idEntreprise), {
        ...filtres,
        id_offre: String(idOffre),
      });
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la recuperation des candidatures: ${error.message}`);
    }
  }

  async obtenirDetailsCandidature(id: string, idEntreprise: string) {
    try {
      const candidature: any = await this.candidatureRepository.obtenirCandidatureParId(String(id));
      if (!candidature) {
        throw new ErreurApi(404, "Candidature non trouvee");
      }

      if (candidature.entreprise?.id !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a voir cette candidature");
      }

      return candidature;
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la recuperation des details: ${error.message}`);
    }
  }

  async modifierStatutCandidature(id: string, idEntreprise: string, donnees: ModifierStatutCandidatureDto) {
    try {
      const candidature: any = await this.candidatureRepository.obtenirCandidatureParId(String(id));
      if (!candidature) {
        throw new ErreurApi(404, "Candidature non trouvee");
      }

      const offre: any = await this.offreRepository.obtenirOffreParId(candidature.candidature.id_offre);
      if (offre?.id_entreprise !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a modifier cette candidature");
      }

      const candidatureModifiee = await this.candidatureRepository.modifierStatutCandidature(String(id), donnees);

      await this.notificationService.notifierChangementStatut(
        candidature.candidat.id_utilisateur || "",
        candidatureModifiee.statut,
        candidature.offre?.titre || "Candidature",
        {
          motifRefus: candidatureModifiee.motif_refus || undefined,
          source: "manual",
        }
      );

      return candidatureModifiee;
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la modification du statut: ${error.message}`);
    }
  }

  async shortlisterCandidat(id: string, idEntreprise: string) {
    return await this.modifierStatutCandidature(id, idEntreprise, {
      statut: "shortlisted",
    });
  }

  async refuserCandidat(id: string, idEntreprise: string, motifRefus?: string) {
    return await this.modifierStatutCandidature(id, idEntreprise, {
      statut: "rejected",
      motif_refus: motifRefus,
    });
  }

  async accepterCandidat(id: string, idEntreprise: string) {
    return await this.modifierStatutCandidature(id, idEntreprise, {
      statut: "accepted",
    });
  }

  async obtenirStatistiquesEntreprise(idEntreprise: string) {
    try {
      return await this.candidatureRepository.obtenirStatistiquesEntreprise(String(idEntreprise));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des statistiques: ${error.message}`);
    }
  }

  async obtenirStatistiquesCandidat(idCandidat: string) {
    try {
      return await this.candidatureRepository.obtenirStatistiquesCandidat(String(idCandidat));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des statistiques: ${error.message}`);
    }
  }

  private async verifierEligibilite(idCandidat: string, idOffre: string) {
    return true;
  }

  private async appliquerDecisionIaSurCandidature(candidature: any, decisionIa: AnalyseIaResultat) {
    if (!candidature?.id) {
      return candidature;
    }

    if (decisionIa.statut !== "pending") {
      return await this.candidatureRepository.modifierStatutCandidature(String(candidature.id), {
        statut: decisionIa.statut,
        motif_refus: decisionIa.statut === "rejected" ? decisionIa.motifRefus : undefined,
        score_test: decisionIa.scoreTest ?? undefined,
        notes_entreprise: decisionIa.noteIa ?? undefined,
      });
    }

    if (decisionIa.noteIa || decisionIa.scoreTest !== undefined) {
      return await this.candidatureRepository.modifierStatutCandidature(String(candidature.id), {
        score_test: decisionIa.scoreTest ?? undefined,
        notes_entreprise: decisionIa.noteIa ?? undefined,
      });
    }

    return candidature;
  }

  private extraireScore(resultatIa: any): number | null {
    if (!resultatIa) {
      return null;
    }

    const scoreBrut =
      typeof resultatIa.score_global === "number"
        ? resultatIa.score_global
        : typeof resultatIa.score === "number"
          ? resultatIa.score
          : null;

    if (scoreBrut === null || Number.isNaN(scoreBrut)) {
      return null;
    }

    return Math.max(0, Math.min(100, Math.round(scoreBrut)));
  }

  private construireMotifRefusIa(resultatIa: any, score: number | null): string {
    const raisons: string[] = Array.isArray(resultatIa?.raisons_elimination)
      ? resultatIa.raisons_elimination.filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
      : [];

    if (raisons.length > 0) {
      return `Votre CV n'est pas compatible avec l'offre. ${raisons.join(" ; ")}`;
    }

    if (score !== null) {
      return `Votre CV n'est pas compatible avec l'offre (score IA ${score}/100, seuil ${env.iaShortlistMinScore}/100).`;
    }

    return "Votre CV n'est pas compatible avec l'offre selon l'analyse automatique.";
  }

  private determinerDecisionIa(resultatIa: any): AnalyseIaResultat {
    const score = this.extraireScore(resultatIa);
    const recommandation = typeof resultatIa?.recommandation === "string" ? resultatIa.recommandation : "";
    const eligible = typeof resultatIa?.eligible === "boolean" ? resultatIa.eligible : undefined;
    const shortlists = new Set(["shortlist_prioritaire", "shortlist_recommande", "afficher_avec_reserve"]);

    const estRefuse =
      recommandation === "hors_shortlist" ||
      eligible === false ||
      (score !== null && score < env.iaShortlistMinScore);

    const noteIa = JSON.stringify({
      source: "handitalents-ia",
      recommandation: recommandation || null,
      label: resultatIa?.label || null,
      score_global: score,
      eligible: eligible ?? null,
      analysed_at: new Date().toISOString(),
    });

    if (estRefuse) {
      return {
        statut: "rejected",
        motifRefus: this.construireMotifRefusIa(resultatIa, score),
        scoreTest: score,
        noteIa,
        source: "ia",
      };
    }

    if (shortlists.has(recommandation) || (score !== null && score >= env.iaShortlistMinScore)) {
      return {
        statut: "shortlisted",
        scoreTest: score,
        noteIa,
        source: "ia",
      };
    }

    return {
      statut: "pending",
      scoreTest: score,
      noteIa,
      source: "manual",
    };
  }

  private async verifierIaDisponible(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${env.iaApiUrl}/`, { signal: controller.signal });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async analyserCvAvecIa(cheminAbsoluCv: string, texteOffre: string): Promise<any> {
    const buffer = await fs.readFile(cheminAbsoluCv);
    const blob = new Blob([buffer], { type: "application/pdf" });
    const form = new FormData();
    form.append("cv", blob, path.basename(cheminAbsoluCv));
    form.append("texte_offre", texteOffre);
    form.append("experience_min", "0");

    const response = await fetch(`${env.iaApiUrl}/analyser-cv`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analyse IA indisponible (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private async evaluerCandidatureAvecIa(input: { cvUrl?: string | null; texteOffre: string }): Promise<AnalyseIaResultat> {
    const iaDisponible = await this.verifierIaDisponible();
    if (!iaDisponible) {
      if (env.iaShortlistRequired) {
        throw new ErreurApi(503, "Le module IA de shortlisting est indisponible. Veuillez reessayer dans quelques minutes.");
      }
      return {
        statut: "pending",
        noteIa: "IA indisponible au moment de la postulation",
        source: "manual",
      };
    }

    if (!input.cvUrl) {
      return {
        statut: "pending",
        noteIa: "CV introuvable pour l'analyse IA",
        source: "manual",
      };
    }

    const cvPath = path.join(process.cwd(), "public", input.cvUrl.replace(/^\//, ""));
    const resultatIa = await this.analyserCvAvecIa(cvPath, input.texteOffre || "Analyse sur offre non fournie");
    return this.determinerDecisionIa(resultatIa);
  }
}
