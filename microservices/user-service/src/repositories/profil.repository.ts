import { eq } from "drizzle-orm";
import { db } from "../db";
import { adminTable, candidatTable, entrepriseTable, utilisateurTable } from "../db/schema";

export class ProfilRepository {
  // Candidat
  async obtenirProfilCandidat(id_utilisateur: string) {
    const [resultat] = await db
      .select({
        utilisateur: utilisateurTable,
        candidat: candidatTable,
      })
      .from(utilisateurTable)
      .leftJoin(candidatTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur));

    return resultat ?? null;
  }

  async mettreAJourProfilCandidat(id_utilisateur: string, donneesUtilisateur: any, donneesCandidat: any) {
    return await db.transaction(async (transaction) => {
      // Mettre à jour les données utilisateur
      const [utilisateurMisAJour] = await transaction
        .update(utilisateurTable)
        .set({
          ...donneesUtilisateur,
          updated_at: new Date(),
        })
        .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
        .returning();

      // Mettre à jour les données candidat
      const [candidatMisAJour] = await transaction
        .update(candidatTable)
        .set({
          ...donneesCandidat,
          updated_at: new Date(),
        })
        .where(eq(candidatTable.id_utilisateur, id_utilisateur))
        .returning();

      return { utilisateur: utilisateurMisAJour, candidat: candidatMisAJour };
    });
  }

  // Entreprise
  async obtenirProfilEntreprise(id_utilisateur: string) {
    const [resultat] = await db
      .select({
        utilisateur: utilisateurTable,
        entreprise: entrepriseTable,
      })
      .from(utilisateurTable)
      .leftJoin(entrepriseTable, eq(entrepriseTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur));

    return resultat ?? null;
  }

  async mettreAJourProfilEntreprise(id_utilisateur: string, donneesUtilisateur: any, donneesEntreprise: any) {
    return await db.transaction(async (transaction) => {
      // Mettre à jour les données utilisateur
      const [utilisateurMisAJour] = await transaction
        .update(utilisateurTable)
        .set({
          ...donneesUtilisateur,
          updated_at: new Date(),
        })
        .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
        .returning();

      // Mettre à jour les données entreprise
      const [entrepriseMiseAJour] = await transaction
        .update(entrepriseTable)
        .set({
          ...donneesEntreprise,
          updated_at: new Date(),
        })
        .where(eq(entrepriseTable.id_utilisateur, id_utilisateur))
        .returning();

      return { utilisateur: utilisateurMisAJour, entreprise: entrepriseMiseAJour };
    });
  }

  // Admin
  async obtenirProfilAdmin(id_utilisateur: string) {
    const [resultat] = await db
      .select({
        utilisateur: utilisateurTable,
        admin: adminTable,
      })
      .from(utilisateurTable)
      .leftJoin(adminTable, eq(adminTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur));

    return resultat ?? null;
  }

  async mettreAJourProfilAdmin(id_utilisateur: string, donneesUtilisateur: any, donneesAdmin: any) {
    return await db.transaction(async (transaction) => {
      // Mettre à jour les données utilisateur
      const [utilisateurMisAJour] = await transaction
        .update(utilisateurTable)
        .set({
          ...donneesUtilisateur,
          updated_at: new Date(),
        })
        .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
        .returning();

      // Vérifier si le profil admin existe
      const [adminExistant] = await transaction
        .select()
        .from(adminTable)
        .where(eq(adminTable.id_utilisateur, id_utilisateur));

      let adminMisAJour;
      if (adminExistant) {
        // Mettre à jour le profil admin existant
        [adminMisAJour] = await transaction
          .update(adminTable)
          .set({
            ...donneesAdmin,
            updated_at: new Date(),
          })
          .where(eq(adminTable.id_utilisateur, id_utilisateur))
          .returning();
      } else {
        // Créer un nouveau profil admin
        [adminMisAJour] = await transaction
          .insert(adminTable)
          .values({
            id_utilisateur,
            ...donneesAdmin,
          })
          .returning();
      }

      return { utilisateur: utilisateurMisAJour, admin: adminMisAJour };
    });
  }
}