import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { offreEmploiTable, offreStatistiquesTable, entrepriseTable } from "../db/schema";
import { CreerOffreDto, ModifierOffreDto, ChangerStatutOffreDto, OffreAvecStatistiquesDto } from "../dto/offre-emploi.dto";
import { ErreurApi } from "../utils/erreur-api";

export class OffreEmploiService {
  private async resolveEntrepriseId(idUtilisateurEntreprise: string): Promise<string> {
    const rows = await db
      .select({ id: entrepriseTable.id })
      .from(entrepriseTable)
      .where(eq(entrepriseTable.id_utilisateur, idUtilisateurEntreprise))
      .limit(1);
    const row = rows[0];
    if (!row) {
      throw new ErreurApi("Entreprise non trouvée pour cet utilisateur", 404);
    }
    return row.id;
  }

  private normaliserSeuilIa(valeur: unknown, defaut = 60): number {
    const brut =
      typeof valeur === "number"
        ? valeur
        : typeof valeur === "string"
          ? Number.parseFloat(valeur.replace(",", "."))
          : defaut;

    if (!Number.isFinite(brut)) {
      return defaut;
    }

    return Math.max(0, Math.min(100, Math.round(brut)));
  }
  
  async obtenirOffresParEntreprise(idEntreprise: string): Promise<OffreAvecStatistiquesDto[]> {
    try {
      const entrepriseId = await this.resolveEntrepriseId(idEntreprise);
      const offres = await db
        .select({
          id: offreEmploiTable.id,
          id_entreprise: offreEmploiTable.id_entreprise,
          titre: offreEmploiTable.titre,
          description: offreEmploiTable.description,
          localisation: offreEmploiTable.localisation,
          type_poste: offreEmploiTable.type_poste,
          salaire_min: offreEmploiTable.salaire_min,
          salaire_max: offreEmploiTable.salaire_max,
          competences_requises: offreEmploiTable.competences_requises,
          experience_requise: offreEmploiTable.experience_requise,
          niveau_etude: offreEmploiTable.niveau_etude,
          ai_shortlist_min_score: offreEmploiTable.ai_shortlist_min_score,
          statut: offreEmploiTable.statut,
          date_limite: offreEmploiTable.date_limite,
          accessibilite_handicap: offreEmploiTable.accessibilite_handicap,
          amenagements_possibles: offreEmploiTable.amenagements_possibles,
          created_at: offreEmploiTable.created_at,
          updated_at: offreEmploiTable.updated_at,
          vues_count: offreStatistiquesTable.vues_count,
          candidatures_count: offreStatistiquesTable.candidatures_count,
        })
        .from(offreEmploiTable)
        .leftJoin(offreStatistiquesTable, eq(offreEmploiTable.id, offreStatistiquesTable.id_offre))
        .where(eq(offreEmploiTable.id_entreprise, entrepriseId))
        .orderBy(offreEmploiTable.created_at);

      return offres.map(offre => ({
        ...offre,
        created_at: offre.created_at.toISOString(),
        updated_at: offre.updated_at.toISOString(),
        date_limite: offre.date_limite?.toISOString(),
        date_expiration: offre.date_limite?.toISOString(),
        salaire_min: offre.salaire_min || undefined,
        salaire_max: offre.salaire_max || undefined,
        competences_requises: offre.competences_requises || undefined,
        experience_requise: offre.experience_requise || undefined,
        niveau_etude: offre.niveau_etude || undefined,
        ai_shortlist_min_score: offre.ai_shortlist_min_score ?? 60,
        amenagements_possibles: offre.amenagements_possibles || undefined,
        accessibilite_handicap: offre.accessibilite_handicap ?? true,
        vues_count: offre.vues_count || 0,
        candidatures_count: offre.candidatures_count || 0,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des offres:", error);
      throw new ErreurApi("Erreur lors de la récupération des offres", 500);
    }
  }

  async creerOffre(donnees: CreerOffreDto): Promise<OffreAvecStatistiquesDto> {
    try {
      const entrepriseId = await this.resolveEntrepriseId(donnees.id_entreprise);

      const nouvelleOffre = await db.transaction(async (transaction) => {
        // Créer l'offre
        const offresCreees = await transaction
          .insert(offreEmploiTable)
          .values({
            id_entreprise: entrepriseId,
            titre: donnees.titre,
            description: donnees.description,
            localisation: donnees.localisation,
            type_poste: donnees.type_poste,
            salaire_min: donnees.salaire_min,
            salaire_max: donnees.salaire_max,
            competences_requises: donnees.competences_requises,
            experience_requise: donnees.experience_requise,
            niveau_etude: donnees.niveau_etude,
            ai_shortlist_min_score: this.normaliserSeuilIa(donnees.ai_shortlist_min_score, 60),
            date_limite: donnees.date_limite ? new Date(donnees.date_limite) : null,
            accessibilite_handicap: donnees.accessibilite_handicap ?? true,
            amenagements_possibles: donnees.amenagements_possibles,
          })
          .returning();

        const offre = offresCreees[0];
        if (!offre) {
          throw new ErreurApi("Erreur lors de la création de l'offre", 500);
        }

        // Créer les statistiques initiales
        await transaction
          .insert(offreStatistiquesTable)
          .values({
            id_offre: offre.id,
            vues_count: 0,
            candidatures_count: 0,
          });

        return offre;
      });

      // Retourner l'offre avec les statistiques
      return {
        id: nouvelleOffre.id,
        id_entreprise: entrepriseId,
        titre: nouvelleOffre.titre,
        description: nouvelleOffre.description,
        localisation: nouvelleOffre.localisation,
        type_poste: nouvelleOffre.type_poste,
        salaire_min: nouvelleOffre.salaire_min || undefined,
        salaire_max: nouvelleOffre.salaire_max || undefined,
        competences_requises: nouvelleOffre.competences_requises || undefined,
        experience_requise: nouvelleOffre.experience_requise || undefined,
        niveau_etude: nouvelleOffre.niveau_etude || undefined,
        ai_shortlist_min_score: nouvelleOffre.ai_shortlist_min_score ?? 60,
        statut: nouvelleOffre.statut,
        date_limite: nouvelleOffre.date_limite?.toISOString(),
        date_expiration: nouvelleOffre.date_limite?.toISOString(),
        accessibilite_handicap: nouvelleOffre.accessibilite_handicap ?? true,
        amenagements_possibles: nouvelleOffre.amenagements_possibles || undefined,
        created_at: nouvelleOffre.created_at.toISOString(),
        updated_at: nouvelleOffre.updated_at.toISOString(),
        vues_count: 0,
        candidatures_count: 0,
      };
    } catch (error) {
      console.error("Erreur lors de la création de l'offre:", error);
      throw new ErreurApi("Erreur lors de la création de l'offre", 500);
    }
  }

  async modifierOffre(idOffre: string, donnees: ModifierOffreDto): Promise<OffreAvecStatistiquesDto> {
    try {
      const offresModifiees = await db
        .update(offreEmploiTable)
        .set({
          ...donnees,
          ai_shortlist_min_score:
            donnees.ai_shortlist_min_score !== undefined
              ? this.normaliserSeuilIa(donnees.ai_shortlist_min_score, 60)
              : undefined,
          date_limite: donnees.date_limite ? new Date(donnees.date_limite) : undefined,
          updated_at: new Date(),
        })
        .where(eq(offreEmploiTable.id, idOffre))
        .returning();

      const offre = offresModifiees[0];
      if (!offre) {
        throw new ErreurApi("Offre non trouvée", 404);
      }

      // Récupérer les statistiques
      const statistiques = await db
        .select()
        .from(offreStatistiquesTable)
        .where(eq(offreStatistiquesTable.id_offre, idOffre))
        .limit(1);

      const stats = statistiques[0] || { vues_count: 0, candidatures_count: 0 };

      return {
        id: offre.id,
        id_entreprise: offre.id_entreprise,
        titre: offre.titre,
        description: offre.description,
        localisation: offre.localisation,
        type_poste: offre.type_poste,
        salaire_min: offre.salaire_min || undefined,
        salaire_max: offre.salaire_max || undefined,
        competences_requises: offre.competences_requises || undefined,
        experience_requise: offre.experience_requise || undefined,
        niveau_etude: offre.niveau_etude || undefined,
        ai_shortlist_min_score: offre.ai_shortlist_min_score ?? 60,
        statut: offre.statut,
        date_limite: offre.date_limite?.toISOString(),
        date_expiration: offre.date_limite?.toISOString(),
        accessibilite_handicap: offre.accessibilite_handicap ?? true,
        amenagements_possibles: offre.amenagements_possibles || undefined,
        created_at: offre.created_at.toISOString(),
        updated_at: offre.updated_at.toISOString(),
        vues_count: stats.vues_count,
        candidatures_count: stats.candidatures_count,
      };
    } catch (error) {
      console.error("Erreur lors de la modification de l'offre:", error);
      throw new ErreurApi("Erreur lors de la modification de l'offre", 500);
    }
  }

  async supprimerOffre(idOffre: string): Promise<void> {
    try {
      const offresSupprimes = await db
        .delete(offreEmploiTable)
        .where(eq(offreEmploiTable.id, idOffre))
        .returning();

      if (offresSupprimes.length === 0) {
        throw new ErreurApi("Offre non trouvée", 404);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'offre:", error);
      throw new ErreurApi("Erreur lors de la suppression de l'offre", 500);
    }
  }

  async changerStatutOffre(idOffre: string, donnees: ChangerStatutOffreDto): Promise<OffreAvecStatistiquesDto> {
    try {
      // Note: la vérification de propriétaire est faite dans le contrôleur avant l'appel
      const offresModifiees = await db
        .update(offreEmploiTable)
        .set({
          statut: donnees.statut,
          updated_at: new Date(),
        })
        .where(eq(offreEmploiTable.id, idOffre))
        .returning();

      const offre = offresModifiees[0];
      if (!offre) {
        throw new ErreurApi("Offre non trouvée", 404);
      }

      // Récupérer les statistiques
      const statistiques = await db
        .select()
        .from(offreStatistiquesTable)
        .where(eq(offreStatistiquesTable.id_offre, idOffre))
        .limit(1);

      const stats = statistiques[0] || { vues_count: 0, candidatures_count: 0 };

      return {
        id: offre.id,
        id_entreprise: offre.id_entreprise,
        titre: offre.titre,
        description: offre.description,
        localisation: offre.localisation,
        type_poste: offre.type_poste,
        salaire_min: offre.salaire_min || undefined,
        salaire_max: offre.salaire_max || undefined,
        competences_requises: offre.competences_requises || undefined,
        experience_requise: offre.experience_requise || undefined,
        niveau_etude: offre.niveau_etude || undefined,
        ai_shortlist_min_score: offre.ai_shortlist_min_score ?? 60,
        statut: offre.statut,
        date_limite: offre.date_limite?.toISOString(),
        date_expiration: offre.date_limite?.toISOString(),
        accessibilite_handicap: offre.accessibilite_handicap ?? true,
        amenagements_possibles: offre.amenagements_possibles || undefined,
        created_at: offre.created_at.toISOString(),
        updated_at: offre.updated_at.toISOString(),
        vues_count: stats.vues_count,
        candidatures_count: stats.candidatures_count,
      };
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      throw new ErreurApi("Erreur lors du changement de statut", 500);
    }
  }

  async verifierProprietaireOffre(idOffre: string, idEntreprise: string): Promise<boolean> {
    try {
      const entrepriseId = await this.resolveEntrepriseId(idEntreprise);
      const offres = await db
        .select({ id: offreEmploiTable.id })
        .from(offreEmploiTable)
        .where(and(
          eq(offreEmploiTable.id, idOffre),
          eq(offreEmploiTable.id_entreprise, entrepriseId)
        ))
        .limit(1);

      return offres.length > 0;
    } catch (error) {
      console.error("Erreur lors de la vérification du propriétaire:", error);
      return false;
    }
  }

  async incrementerVues(idOffre: string): Promise<void> {
    try {
      // Récupérer le count actuel et l'incrémenter
      const statistiques = await db
        .select({ vues_count: offreStatistiquesTable.vues_count })
        .from(offreStatistiquesTable)
        .where(eq(offreStatistiquesTable.id_offre, idOffre))
        .limit(1);

      const countActuel = statistiques[0]?.vues_count || 0;

      await db
        .update(offreStatistiquesTable)
        .set({
          vues_count: countActuel + 1
        })
        .where(eq(offreStatistiquesTable.id_offre, idOffre));
    } catch (error) {
      console.error("Erreur lors de l'incrémentation des vues:", error);
      // Ne pas faire échouer la requête principale pour une erreur de statistiques
    }
  }

  async incrementerCandidatures(idOffre: string): Promise<void> {
    try {
      // Récupérer le count actuel et l'incrémenter
      const statistiques = await db
        .select({ candidatures_count: offreStatistiquesTable.candidatures_count })
        .from(offreStatistiquesTable)
        .where(eq(offreStatistiquesTable.id_offre, idOffre))
        .limit(1);

      const countActuel = statistiques[0]?.candidatures_count || 0;

      await db
        .update(offreStatistiquesTable)
        .set({
          candidatures_count: countActuel + 1
        })
        .where(eq(offreStatistiquesTable.id_offre, idOffre));
    } catch (error) {
      console.error("Erreur lors de l'incrémentation des candidatures:", error);
      // Ne pas faire échouer la requête principale pour une erreur de statistiques
    }
  }
}
