import { db } from "../db";
import { accountMemberTable, entrepriseTable } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export class AccountMemberRepository {
  constructor() {
    this.initialiserTable();
  }

  private async initialiserTable() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS account_member (
        id UUID PRIMARY KEY,
        entreprise_id UUID NOT NULL REFERENCES entreprise(id) ON DELETE CASCADE,
        nom TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT,
        telephone TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
  }

  async trouverEntrepriseIdParUtilisateur(id_utilisateur: string) {
    const [resultat] = await db
      .select({ id: entrepriseTable.id })
      .from(entrepriseTable)
      .where(eq(entrepriseTable.id_utilisateur, id_utilisateur));

    return resultat?.id ?? null;
  }

  async listerPourEntreprise(entreprise_id: string) {
    return db
      .select()
      .from(accountMemberTable)
      .where(eq(accountMemberTable.entreprise_id, entreprise_id));
  }

  async creer(entreprise_id: string, membre: { nom: string; email: string; role?: string; telephone?: string }) {
    const [cree] = await db
      .insert(accountMemberTable)
      .values({
        id: crypto.randomUUID(),
        entreprise_id,
        nom: membre.nom,
        email: membre.email,
        role: membre.role,
        telephone: membre.telephone,
      })
      .returning();
    return cree;
  }

  async mettreAJour(
    entreprise_id: string,
    id: string,
    membre: { nom?: string; email?: string; role?: string; telephone?: string }
  ) {
    const [maj] = await db
      .update(accountMemberTable)
      .set({
        ...membre,
        updated_at: new Date(),
      })
      .where(
        sql`${accountMemberTable.id} = ${id} AND ${accountMemberTable.entreprise_id} = ${entreprise_id}`
      )
      .returning();
    return maj;
  }

  async supprimer(entreprise_id: string, id: string) {
    await db
      .delete(accountMemberTable)
      .where(
        sql`${accountMemberTable.id} = ${id} AND ${accountMemberTable.entreprise_id} = ${entreprise_id}`
      );
  }
}
