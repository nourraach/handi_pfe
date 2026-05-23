import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { 
  favorisTable, 
  offreEmploiTable,
  entrepriseTable 
} from "../db/schema";

export class FavorisRepository {
  async ajouterFavori(idCandidat: string, idOffre: string) {
    // Vérifier si déjà en favoris
    const favoriExistant = await db
      .select()
      .from(favorisTable)
      .where(
        and(
          eq(favorisTable.id_candidat, idCandidat),
          eq(favorisTable.id_offre, idOffre)
        )
      );

    if (favoriExistant.length > 0) {
      throw new Error("Cette offre est déjà dans vos favoris");
    }

    const [favori] = await db
      .insert(favorisTable)
      .values({
        id_candidat: idCandidat,
        id_offre: idOffre,
      })
      .returning();

    return favori;
  }

  async retirerFavori(idCandidat: string, idOffre: string) {
    await db
      .delete(favorisTable)
      .where(
        and(
          eq(favorisTable.id_candidat, idCandidat),
          eq(favorisTable.id_offre, idOffre)
        )
      );
  }

  async obtenirFavorisCandidat(idCandidat: string) {
    return await db
      .select({
        favori: favorisTable,
        offre: offreEmploiTable,
        entreprise: {
          nom: entrepriseTable.nom_entreprise,
        },
      })
      .from(favorisTable)
      .innerJoin(offreEmploiTable, eq(favorisTable.id_offre, offreEmploiTable.id))
      .innerJoin(entrepriseTable, eq(offreEmploiTable.id_entreprise, entrepriseTable.id))
      .where(eq(favorisTable.id_candidat, idCandidat))
      .orderBy(desc(favorisTable.created_at));
  }

  async verifierFavori(idCandidat: string, idOffre: string) {
    const [favori] = await db
      .select()
      .from(favorisTable)
      .where(
        and(
          eq(favorisTable.id_candidat, idCandidat),
          eq(favorisTable.id_offre, idOffre)
        )
      );

    return !!favori;
  }
}