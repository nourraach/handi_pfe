import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { notificationTable } from "../db/schema";
import { CreerNotificationDto, MarquerLuDto } from "../dto/notification.dto";

export class NotificationRepository {
  async creerNotification(donnees: CreerNotificationDto) {
    const [notification] = await db
      .insert(notificationTable)
      .values(donnees)
      .returning();

    return notification;
  }

  async obtenirNotificationsUtilisateur(idUtilisateur: string, limit = 50) {
    return await db
      .select()
      .from(notificationTable)
      .where(eq(notificationTable.id_utilisateur, idUtilisateur))
      .orderBy(desc(notificationTable.created_at))
      .limit(limit);
  }

  async marquerCommeLu(idUtilisateur: string, notificationIds: string[]) {
    await db
      .update(notificationTable)
      .set({ lu: true })
      .where(
        and(
          eq(notificationTable.id_utilisateur, idUtilisateur),
          inArray(notificationTable.id, notificationIds)
        )
      );
  }

  async marquerToutCommeLu(idUtilisateur: string) {
    await db
      .update(notificationTable)
      .set({ lu: true })
      .where(
        and(
          eq(notificationTable.id_utilisateur, idUtilisateur),
          eq(notificationTable.lu, false)
        )
      );
  }

  async marquerCommeNonLu(idUtilisateur: string, notificationIds: string[]) {
    await db
      .update(notificationTable)
      .set({ lu: false })
      .where(
        and(
          eq(notificationTable.id_utilisateur, idUtilisateur),
          inArray(notificationTable.id, notificationIds)
        )
      );
  }

  async compterNotificationsNonLues(idUtilisateur: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.id_utilisateur, idUtilisateur),
          eq(notificationTable.lu, false)
        )
      );

    return result.count;
  }

  async supprimerNotification(id: string, idUtilisateur: string) {
    await db
      .delete(notificationTable)
      .where(
        and(
          eq(notificationTable.id, id),
          eq(notificationTable.id_utilisateur, idUtilisateur)
        )
      );
  }
}
