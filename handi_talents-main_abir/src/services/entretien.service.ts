// @ts-nocheck
import { ModifierEntretienDto, PlanifierEntretienDto } from "../dto/entretien.dto";
import { CandidatureRepository } from "../repositories/candidature.repository";
import { EntretienRepository } from "../repositories/entretien.repository";
import { ErreurApi } from "../utils/erreur-api";
import { NotificationService } from "./notification.service";

export class EntretienService {
  private entretienRepository = new EntretienRepository();
  private candidatureRepository = new CandidatureRepository();
  private notificationService = new NotificationService();

  private convertirDateFuture(valeur: Date | string | undefined, messageChamp: string) {
    if (!valeur) {
      throw new ErreurApi(400, messageChamp);
    }

    const date = valeur instanceof Date ? valeur : new Date(valeur);
    if (Number.isNaN(date.getTime())) {
      throw new ErreurApi(400, "La date de l'entretien est invalide");
    }

    if (date <= new Date()) {
      throw new ErreurApi(400, "La date de l'entretien doit etre dans le futur");
    }

    return date;
  }

  async planifierEntretien(donnees: PlanifierEntretienDto, idEntreprise: string) {
    try {
      if (!donnees?.id_candidature) {
        throw new ErreurApi(400, "Le champ id_candidature est requis");
      }

      if (!donnees?.type) {
        throw new ErreurApi(400, "Le type d'entretien est requis");
      }

      const dateEntretien = this.convertirDateFuture(donnees.date_heure, "Le champ date_heure est requis");
      const candidature = await this.candidatureRepository.obtenirCandidatureParId(donnees.id_candidature);

      if (!candidature) {
        throw new ErreurApi(404, "Candidature non trouvee");
      }

      if (candidature.entreprise.id !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a planifier cet entretien");
      }

      const entretienActif = await this.entretienRepository.obtenirEntretienActifParCandidature(donnees.id_candidature);
      if (entretienActif) {
        throw new ErreurApi(409, "Un entretien actif existe deja pour cette candidature");
      }

      const entretien = await this.entretienRepository.planifierEntretien({
        ...donnees,
        date_heure: dateEntretien,
      });

      await this.candidatureRepository.modifierStatutCandidature(donnees.id_candidature, {
        statut: "interview_scheduled",
      });

      await this.notificationService.notifierEntretienPlanifie(
        candidature.candidat.id_utilisateur,
        entretien.id,
        candidature.offre.titre,
        dateEntretien
      );

      return entretien;
    } catch (error) {
      if (error instanceof ErreurApi) {
        throw error;
      }
      throw new ErreurApi(500, `Erreur lors de la planification de l'entretien: ${error.message}`);
    }
  }

  async obtenirEntretiensEntreprise(idEntreprise: string) {
    try {
      return await this.entretienRepository.obtenirEntretiensEntreprise(idEntreprise);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des entretiens: ${error.message}`);
    }
  }

  async obtenirEntretiensCandidat(idCandidat: string) {
    try {
      return await this.entretienRepository.obtenirEntretiensCandidat(idCandidat);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des entretiens: ${error.message}`);
    }
  }

  async modifierEntretien(id: string, donnees: ModifierEntretienDto, idEntreprise: string) {
    try {
      const entretien = await this.entretienRepository.obtenirEntretienParId(id);
      if (!entretien) {
        throw new ErreurApi(404, "Entretien non trouve");
      }

      if (entretien.entreprise.id !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a modifier cet entretien");
      }

      const chargeUtile = {
        ...donnees,
        ...(donnees.date_heure ? { date_heure: this.convertirDateFuture(donnees.date_heure, "La date de l'entretien est invalide") } : {}),
      };

      const entretienModifie = await this.entretienRepository.modifierEntretien(id, chargeUtile);

      if (chargeUtile.date_heure) {
        await this.notificationService.notifierModificationEntretien(
          entretien.candidat.id_utilisateur,
          id,
          entretien.offre.titre,
          chargeUtile.date_heure as Date
        );
      }

      return entretienModifie;
    } catch (error) {
      if (error instanceof ErreurApi) {
        throw error;
      }
      throw new ErreurApi(500, `Erreur lors de la modification de l'entretien: ${error.message}`);
    }
  }

  async annulerEntretien(id: string, idEntreprise: string, motif?: string) {
    try {
      const entretien = await this.entretienRepository.obtenirEntretienParId(id);
      if (!entretien) {
        throw new ErreurApi(404, "Entretien non trouve");
      }

      if (entretien.entreprise.id !== idEntreprise) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a annuler cet entretien");
      }

      const entretienAnnule = await this.modifierEntretien(id, { statut: "annule", notes: motif }, idEntreprise);

      await this.candidatureRepository.modifierStatutCandidature(entretien.candidature.id, {
        statut: "shortlisted",
      });

      await this.notificationService.notifierAnnulationEntretien(
        entretien.candidat.id_utilisateur,
        id,
        entretien.offre.titre,
        motif
      );

      return entretienAnnule;
    } catch (error) {
      if (error instanceof ErreurApi) {
        throw error;
      }
      throw new ErreurApi(500, `Erreur lors de l'annulation de l'entretien: ${error.message}`);
    }
  }

  async confirmerEntretien(id: string, idCandidat: string) {
    try {
      const entretien = await this.entretienRepository.obtenirEntretienParId(id);
      if (!entretien || entretien.candidat.id !== idCandidat) {
        throw new ErreurApi(403, "Vous n'etes pas autorise a confirmer cet entretien");
      }

      const entretienConfirme = await this.entretienRepository.modifierEntretien(id, { statut: "confirme" });

      if (entretien.entreprise.id_utilisateur) {
        await this.notificationService.notifierConfirmationEntretienEntreprise(
          entretien.entreprise.id_utilisateur,
          id,
          entretien.offre.titre
        );
      }

      return entretienConfirme;
    } catch (error) {
      if (error instanceof ErreurApi) {
        throw error;
      }
      throw new ErreurApi(500, `Erreur lors de la confirmation de l'entretien: ${error.message}`);
    }
  }

  async terminerEntretien(id: string, idEntreprise: string, notes?: string) {
    try {
      return await this.modifierEntretien(
        id,
        {
          statut: "termine",
          notes,
        },
        idEntreprise
      );
    } catch (error) {
      if (error instanceof ErreurApi) {
        throw error;
      }
      throw new ErreurApi(500, `Erreur lors de la finalisation de l'entretien: ${error.message}`);
    }
  }

  async obtenirTousEntretiensAdmin(region?: string) {
    try {
      return await this.entretienRepository.obtenirTous(region);
    } catch (error) {
      if (error instanceof ErreurApi) {
        throw error;
      }
      throw new ErreurApi(500, `Erreur lors de la recuperation des entretiens: ${error.message}`);
    }
  }
}
