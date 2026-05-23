export interface DemarrerSessionBienEtreDto {
  entry_point?: "notification" | "entretiens_page" | "direct";
}

export interface TerminerSessionBienEtreDto {
  completed_steps?: string[];
  duration_seconds?: number;
}

export interface SessionBienEtreEntretienDto {
  id: string;
  id_entretien: string;
  id_utilisateur: string;
  notification_envoyee_le?: Date | null;
  demarre_le?: Date | null;
  termine_le?: Date | null;
  duree_secondes?: number | null;
  points_forts_json?: string | null;
  source_points_forts?: string | null;
  created_at: Date;
  updated_at: Date;
}

