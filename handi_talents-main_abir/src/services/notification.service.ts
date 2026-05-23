// @ts-nocheck
import { NotificationRepository } from "../repositories/notification.repository";
import { CreerNotificationDto } from "../dto/notification.dto";
import { ErreurApi } from "../utils/erreur-api";

export class NotificationService {
  private notificationRepository = new NotificationRepository();

  async creerNotification(donnees: CreerNotificationDto) {
    try {
      return await this.notificationRepository.creerNotification(donnees);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la creation de la notification: ${error.message}`);
    }
  }

  async obtenirNotificationsUtilisateur(idUtilisateur: string | number, limit = 50) {
    try {
      const notifications = await this.notificationRepository.obtenirNotificationsUtilisateur(String(idUtilisateur), limit);

      return notifications.map((notification) => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : null,
      }));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors de la recuperation des notifications: ${error.message}`);
    }
  }

  async marquerCommeLu(idUtilisateur: string | number, notificationIds: string[]) {
    try {
      await this.notificationRepository.marquerCommeLu(String(idUtilisateur), notificationIds);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors du marquage des notifications: ${error.message}`);
    }
  }

  async marquerToutCommeLu(idUtilisateur: string | number) {
    try {
      await this.notificationRepository.marquerToutCommeLu(String(idUtilisateur));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors du marquage des notifications: ${error.message}`);
    }
  }

  async marquerCommeNonLu(idUtilisateur: string | number, notificationIds: string[]) {
    try {
      await this.notificationRepository.marquerCommeNonLu(String(idUtilisateur), notificationIds);
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors du marquage des notifications: ${error.message}`);
    }
  }

  async compterNotificationsNonLues(idUtilisateur: string | number) {
    try {
      return await this.notificationRepository.compterNotificationsNonLues(String(idUtilisateur));
    } catch (error) {
      throw new ErreurApi(500, `Erreur lors du comptage des notifications: ${error.message}`);
    }
  }

  async notifierChangementStatut(idUtilisateur: string | number, nouveauStatut: string, titreOffre: string) {
    const messages: Record<string, string> = {
      pending: "Votre candidature a ete recue et est en cours d'etude",
      shortlisted: "Votre candidature a ete preselectionnee",
      interview_scheduled: "Un entretien a ete planifie pour votre candidature",
      rejected: "Votre candidature n'a pas ete retenue",
      accepted: "Felicitations ! Votre candidature a ete acceptee",
    };

    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "candidature_status_change",
      titre: "Mise a jour de candidature",
      message: `${messages[nouveauStatut] || "Le statut de votre candidature a change"} pour l'offre "${titreOffre}"`,
      data: JSON.stringify({ statut: nouveauStatut, offre: titreOffre }),
    });
  }

  async notifierEntretienPlanifie(idUtilisateur: string | number, idEntretien: string, titreOffre: string, dateHeure: Date) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "interview_scheduled",
      titre: "Entretien planifie",
      message: `Un entretien a ete planifie le ${dateHeure.toLocaleDateString()} a ${dateHeure.toLocaleTimeString()} pour l'offre "${titreOffre}"`,
      data: JSON.stringify({
        id_entretien: idEntretien,
        offre: titreOffre,
        date_heure: dateHeure,
      }),
    });
  }

  async notifierModificationEntretien(idUtilisateur: string | number, idEntretien: string, titreOffre: string, nouvelleDateHeure: Date) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "interview_scheduled",
      titre: "Entretien modifie",
      message: `Votre entretien pour l'offre "${titreOffre}" a ete reprogramme le ${nouvelleDateHeure.toLocaleDateString()} a ${nouvelleDateHeure.toLocaleTimeString()}`,
      data: JSON.stringify({
        id_entretien: idEntretien,
        offre: titreOffre,
        date_heure: nouvelleDateHeure,
      }),
    });
  }

  async notifierAnnulationEntretien(idUtilisateur: string | number, idEntretien: string, titreOffre: string, motif?: string) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "interview_scheduled",
      titre: "Entretien annule",
      message: motif
        ? `Votre entretien pour l'offre "${titreOffre}" a ete annule. Motif: ${motif}`
        : `Votre entretien pour l'offre "${titreOffre}" a ete annule.`,
      data: JSON.stringify({
        id_entretien: idEntretien,
        offre: titreOffre,
        motif: motif || null,
      }),
    });
  }

  async notifierConfirmationEntretienEntreprise(idUtilisateur: string | number, idEntretien: string, titreOffre: string) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "interview_scheduled",
      titre: "Entretien confirme",
      message: `Le candidat a confirme l'entretien pour l'offre "${titreOffre}".`,
      data: JSON.stringify({
        id_entretien: idEntretien,
        offre: titreOffre,
      }),
    });
  }

  async notifierNouvelleCandidat(idUtilisateur: string | number, idCandidature: string, titreOffre: string) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "new_message",
      titre: "Nouvelle candidature",
      message: `Une nouvelle candidature a ete recue pour l'offre "${titreOffre}"`,
      data: JSON.stringify({
        id_candidature: idCandidature,
        offre: titreOffre,
      }),
    });
  }

  async notifierOffreFavoriteModifiee(idUtilisateur: string | number, titreOffre: string, modification: string) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "offre_favorite_updated",
      titre: "Offre favorite mise a jour",
      message: `L'offre "${titreOffre}" dans vos favoris a ete ${modification}`,
      data: JSON.stringify({ offre: titreOffre, modification }),
    });
  }

  async notifierRappelPreparationEntretien(
    idUtilisateur: string | number,
    idEntretien: string,
    titreOffre: string,
    dateHeure: Date,
  ) {
    await this.creerNotification({
      id_utilisateur: String(idUtilisateur),
      type: "bien_etre_entretien",
      titre: "Entretien demain : preparation optionnelle",
      message: "Votre entretien est demain. Voulez-vous vous preparer en 5 minutes ?",
      data: JSON.stringify({
        id_entretien: idEntretien,
        offre: titreOffre,
        category: "interview_wellbeing_prompt",
        cta: {
          label: "Commencer ma preparation 5 min",
          href: `/candidat/entretiens/${idEntretien}/bien-etre`,
        },
        scheduled_for: dateHeure.toISOString(),
      }),
    });
  }
}
