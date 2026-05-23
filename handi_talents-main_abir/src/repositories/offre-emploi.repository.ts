import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { offreEmploiTable, offreStatistiquesTable } from "../db/schema";

export class OffreEmploiRepository {
  
  async trouverParEntreprise(idEntreprise: string) {
    return await db
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
      .where(eq(offreEmploiTable.id_entreprise, idEntreprise))
      .orderBy(offreEmploiTable.created_at);
  }

  async trouverParId(idOffre: string) {
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
      .where(eq(offreEmploiTable.id, idOffre))
      .limit(1);

    return offres[0] || null;
  }

  async verifierProprietaire(idOffre: string, idEntreprise: string): Promise<boolean> {
    const offres = await db
      .select({ id: offreEmploiTable.id })
      .from(offreEmploiTable)
      .where(and(
        eq(offreEmploiTable.id, idOffre),
        eq(offreEmploiTable.id_entreprise, idEntreprise)
      ))
      .limit(1);

    return offres.length > 0;
  }

  async creer(donnees: any) {
    const offresCreees = await db
      .insert(offreEmploiTable)
      .values(donnees)
      .returning();

    return offresCreees[0];
  }

  async modifier(idOffre: string, donnees: any) {
    const offresModifiees = await db
      .update(offreEmploiTable)
      .set({
        ...donnees,
        updated_at: new Date(),
      })
      .where(eq(offreEmploiTable.id, idOffre))
      .returning();

    return offresModifiees[0];
  }

  async supprimer(idOffre: string) {
    const offresSupprimes = await db
      .delete(offreEmploiTable)
      .where(eq(offreEmploiTable.id, idOffre))
      .returning();

    return offresSupprimes[0];
  }

  async creerStatistiques(idOffre: string) {
    await db
      .insert(offreStatistiquesTable)
      .values({
        id_offre: idOffre,
        vues_count: 0,
        candidatures_count: 0,
      });
  }

  async obtenirStatistiques(idOffre: string) {
    const statistiques = await db
      .select()
      .from(offreStatistiquesTable)
      .where(eq(offreStatistiquesTable.id_offre, idOffre))
      .limit(1);

    return statistiques[0] || { vues_count: 0, candidatures_count: 0 };
  }

  // Alias utilitaire attendu par certains services
  async obtenirOffreParId(idOffre: string) {
    return this.trouverParId(idOffre);
  }
}
