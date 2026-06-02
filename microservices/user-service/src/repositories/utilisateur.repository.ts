import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { candidatTable, entrepriseTable, utilisateurTable } from "../db/schema";
import { StatutUtilisateur, StatutValidationEntreprise } from "../types/enums";

export class UtilisateurRepository {
  async creer(donnees: typeof utilisateurTable.$inferInsert) {
    const [utilisateur] = await db.insert(utilisateurTable).values(donnees).returning();
    return utilisateur;
  }

  async trouverParEmail(email: string) {
    const [utilisateur] = await db.select().from(utilisateurTable).where(eq(utilisateurTable.email, email));
    return utilisateur ?? null;
  }

  async mettreAJourStatut(id_utilisateur: string, statut: StatutUtilisateur, token_activation?: string | null) {
    const [utilisateur] = await db
      .update(utilisateurTable)
      .set({
        statut,
        token_activation,
        updated_at: new Date(),
      })
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
      .returning();

    return utilisateur ?? null;
  }

  async listerDemandesEnAttente() {
    return db
      .select({
        utilisateur: utilisateurTable,
        candidat: candidatTable,
        entreprise: entrepriseTable,
      })
      .from(utilisateurTable)
      .leftJoin(candidatTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .leftJoin(entrepriseTable, eq(entrepriseTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(utilisateurTable.statut, StatutUtilisateur.EN_ATTENTE));
  }

  async validerEntreprise(id_utilisateur: string) {
    const [entreprise] = await db
      .update(entrepriseTable)
      .set({
        statut_validation: StatutValidationEntreprise.VALIDE,
        updated_at: new Date(),
      })
      .where(eq(entrepriseTable.id_utilisateur, id_utilisateur))
      .returning();

    return entreprise ?? null;
  }

  async emailExiste(email: string) {
    const utilisateur = await this.trouverParEmail(email);
    return Boolean(utilisateur);
  }

  async verifierStatut(id_utilisateur: string, statut: StatutUtilisateur) {
    const [utilisateur] = await db
      .select()
      .from(utilisateurTable)
      .where(and(eq(utilisateurTable.id_utilisateur, id_utilisateur), eq(utilisateurTable.statut, statut)));

    return utilisateur ?? null;
  }

  async mettreAJourMotDePasse(id_utilisateur: string, mdpHache: string) {
    const [utilisateur] = await db
      .update(utilisateurTable)
      .set({ mdp: mdpHache, updated_at: new Date() })
      .where(eq(utilisateurTable.id_utilisateur, id_utilisateur))
      .returning();
    return utilisateur ?? null;
  }

  async supprimerUtilisateur(id_utilisateur: string) {
    await db.delete(utilisateurTable).where(eq(utilisateurTable.id_utilisateur, id_utilisateur));
  }
}
