export interface PlanifierEntretienDto {
  id_candidature: string;
  date_heure: Date;
  type: "visio" | "presentiel" | "telephonique";
  lieu_visio?: string;
  lieu?: string;
  duree_prevue?: string;
  contact_entreprise?: string;
  notes?: string;
}

export interface ModifierEntretienDto extends Partial<PlanifierEntretienDto> {
  statut?: "planifie" | "confirme" | "reporte" | "annule" | "termine";
}

export interface EntretienAvecDetailsDto {
  id: string;
  candidature: {
    candidat_nom: string;
    candidat_email: string;
    offre_titre: string;
    entreprise_nom: string;
  };
  date_heure: Date;
  type: string;
  lieu_visio?: string;
  lieu?: string;
  statut: string;
  notes?: string;
  duree_prevue?: string;
  contact_entreprise?: string;
}