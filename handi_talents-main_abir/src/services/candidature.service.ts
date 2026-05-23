// @ts-nocheck
import { CandidatureRepository } from "../repositories/candidature.repository";
import { OffreEmploiRepository } from "../repositories/offre-emploi.repository";
import { OffreEmploiService } from "./offre-emploi.service";
import { NotificationService } from "./notification.service";
import { interviewQuestionsService } from "./interview-questions/interview-questions.service";
import { PostulerDto, ModifierStatutCandidatureDto, FiltreCandidatureDto } from "../dto/candidature.dto";
import { ErreurApi } from "../utils/erreur-api";
import { db } from "../db";
import { candidatTable, entrepriseTable } from "../db/schema";
import { eq } from "drizzle-orm";

export class CandidatureService {
  private candidatureRepository = new CandidatureRepository();
  private offreRepository = new OffreEmploiRepository();
  private offreService = new OffreEmploiService();
  private notificationService = new NotificationService();

  private async resolveCandidatId(idUtilisateur: string): Promise<string> {
    const rows = await db.select({ id: candidatTable.id }).from(candidatTable).where(eq(candidatTable.id_utilisateur, idUtilisateur)).limit(1);
    const row = rows[0];
    if (!row) throw new ErreurApi(404, "Profil candidat introuvable pour cet utilisateur");
    return row.id;
  }

  private async resolveEntrepriseId(idUtilisateur: string): Promise<string> {
    const rows = await db.select({ id: entrepriseTable.id }).from(entrepriseTable).where(eq(entrepriseTable.id_utilisateur, idUtilisateur)).limit(1);
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
      // Vérifier que l'offre existe et est active
      const offre: any = await this.offreRepository.obtenirOffreParId(donnees.id_offre);
      if (!offre || offre.statut !== "active") {
        throw new ErreurApi(400, "Cette offre n'est plus disponible");
      }

      // Vérifier les critères d'éligibilité
      await this.verifierEligibilite(idCandidat, donnees.id_offre);

      // Récupérer l'utilisateur entreprise pour les notifications
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
        if (msg.toLowerCase().includes("déjà postulé") || msg.toLowerCase().includes("deja postule")) {
          throw new ErreurApi(409, "Vous avez déjà postulé à cette offre");
        }
        if (msg.toLowerCase().includes("foreign key")) {
          throw new ErreurApi(400, "Offre ou candidat introuvable");
        }
        throw err;
      }

      // Envoyer notification à l'entreprise (utilisateur propriétaire de l'offre)
      await this.notificationService.notifierNouvelleCandidat(
        idUtilisateurEntreprise,
        candidature.id,
        offre.titre || "Offre"
      );

      await this.offreService.incrementerCandidatures(donnees.id_offre);

      const candidatUtilisateur = await db
        .select({ id_utilisateur: candidatTable.id_utilisateur })
        .from(candidatTable)
        .where(eq(candidatTable.id, idCandidat))
        .limit(1);
      const idUtilisateurCandidat = candidatUtilisateur[0]?.id_utilisateur;
      if (idUtilisateurCandidat) {
        await this.notificationService.notifierChangementStatut(
          idUtilisateurCandidat,
          "pending",
          offre.titre || "Offre"
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
      throw new ErreurApi(500, `Erreur lors de la récupération des candidatures: ${error.message}`);
    }
  }

  async obtenirCandidaturesEntreprise(idEntreprise: string, filtres: FiltreCandidatureDto = {}) {
    try {
      return await this.candidatureRepository.obtenirCandidaturesEntreprise(String(idEntreprise), filtres);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la récupération des candidatures: ${error.message}`);
    }
  }

  async obtenirCandidaturesParOffre(idOffre: string, idEntreprise: string, filtres: FiltreCandidatureDto = {}) {
    try {
      const offre: any = await this.offreRepository.obtenirOffreParId(String(idOffre));
      if (!offre) {
        throw new ErreurApi(404, "Offre introuvable");
      }

      if (offre.id_entreprise !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'Ãªtes pas autorisÃ© Ã  voir ces candidatures");
      }

      return await this.candidatureRepository.obtenirCandidaturesEntreprise(String(idEntreprise), {
        ...filtres,
        id_offre: String(idOffre),
      });
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la rÃ©cupÃ©ration des candidatures: ${error.message}`);
    }
  }

  async obtenirDetailsCandidature(id: string, idEntreprise: string) {
    try {
      const candidature: any = await this.candidatureRepository.obtenirCandidatureParId(String(id));
      if (!candidature) {
        throw new ErreurApi(404, "Candidature non trouvÃ©e");
      }

      if (candidature.entreprise?.id !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'Ãªtes pas autorisÃ© Ã  voir cette candidature");
      }

      return candidature;
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la rÃ©cupÃ©ration des dÃ©tails: ${error.message}`);
    }
  }

  async modifierStatutCandidature(id: string, idEntreprise: string, donnees: ModifierStatutCandidatureDto) {
    try {
      // Vérifier que la candidature appartient à l'entreprise
      const candidature: any = await this.candidatureRepository.obtenirCandidatureParId(String(id));
      if (!candidature) {
        throw new ErreurApi(404, "Candidature non trouvée");
      }

      // Vérifier les droits
      const offre: any = await this.offreRepository.obtenirOffreParId(candidature.candidature.id_offre);
      if (offre?.id_entreprise !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'êtes pas autorisé à modifier cette candidature");
      }

      const candidatureModifiee = await this.candidatureRepository.modifierStatutCandidature(String(id), donnees);

      // Envoyer notification au candidat
      await this.notificationService.notifierChangementStatut(
        candidature.candidat.id_utilisateur || "",
        candidatureModifiee.statut,
        candidature.offre?.titre || "Candidature"
      );

      return candidatureModifiee;
    } catch (error) {
      if (error instanceof ErreurApi) throw error;
      throw new ErreurApi(500, `Erreur lors de la modification du statut: ${error.message}`);
    }
  }

  async shortlisterCandidat(id: string, idEntreprise: string) {
    const candidature = await this.modifierStatutCandidature(id, idEntreprise, {
      statut: "shortlisted"
    });

    // Feature 02 — Declenche la generation du dossier de questions d'entretien (fire-and-forget)
    void interviewQuestionsService.scheduleGeneration(String(id)).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[interview-prep] scheduleGeneration failed", { id, err: err?.message });
    });

    return candidature;
  }

  async refuserCandidat(id: string, idEntreprise: string, motifRefus?: string) {
    return await this.modifierStatutCandidature(id, idEntreprise, {
      statut: "rejected",
      motif_refus: motifRefus
    });
  }

  async accepterCandidat(id: string, idEntreprise: string) {
    return await this.modifierStatutCandidature(id, idEntreprise, {
      statut: "accepted"
    });
  }

  async obtenirStatistiquesEntreprise(idEntreprise: string) {
    try {
      return await this.candidatureRepository.obtenirStatistiquesEntreprise(String(idEntreprise));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  async obtenirStatistiquesCandidat(idCandidat: string) {
    try {
      return await this.candidatureRepository.obtenirStatistiquesCandidat(String(idCandidat));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  private async verifierEligibilite(idCandidat: string, idOffre: string) {
    // TODO: Implémenter la vérification des critères d'éligibilité
    // Vérifier le profil complet du candidat
    // Vérifier les critères spécifiques de l'offre
    return true;
  }
}
