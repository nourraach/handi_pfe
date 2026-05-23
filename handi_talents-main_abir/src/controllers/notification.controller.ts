// @ts-nocheck
import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { reponseSucces, reponseErreur } from "../utils/reponse";

export class NotificationController {
  private notificationService = new NotificationService();

  // GET /api/notifications
  obtenirMesNotifications = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur.id_utilisateur;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await this.notificationService.obtenirNotificationsUtilisateur(idUtilisateur, limit);
      return reponseSucces(res, 200, "Notifications récupérées avec succès", notifications);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // PUT /api/notifications/marquer-lu
  marquerCommeLu = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur.id_utilisateur;
      const { notification_ids } = req.body;

      await this.notificationService.marquerCommeLu(idUtilisateur, notification_ids);
      return reponseSucces(res, 200, "Notifications marquées comme lues", null);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // PUT /api/notifications/marquer-tout-lu
  marquerToutCommeLu = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur.id_utilisateur;

      await this.notificationService.marquerToutCommeLu(idUtilisateur);
      return reponseSucces(res, 200, "Toutes les notifications marquées comme lues", null);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  marquerCommeNonLu = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur.id_utilisateur;
      const { notification_ids } = req.body;

      await this.notificationService.marquerCommeNonLu(idUtilisateur, notification_ids);
      return reponseSucces(res, 200, "Notifications marquees comme non lues", null);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/notifications/non-lues/count
  compterNotificationsNonLues = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur.id_utilisateur;

      const count = await this.notificationService.compterNotificationsNonLues(idUtilisateur);
      return reponseSucces(res, 200, "Nombre de notifications non lues", { count });
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };
}
