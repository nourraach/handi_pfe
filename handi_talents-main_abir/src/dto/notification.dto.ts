export interface CreerNotificationDto {
  id_utilisateur: string;
  type: "candidature_status_change" | "interview_scheduled" | "new_message" | "offre_favorite_updated" | "system";
  titre: string;
  message: string;
  data?: string; // JSON stringifié
}

export interface NotificationDto {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  data?: any; // JSON parsé
  created_at: Date;
}

export interface MarquerLuDto {
  notification_ids: string[];
}