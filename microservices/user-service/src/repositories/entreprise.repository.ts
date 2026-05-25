import { db } from "../db";
import { entrepriseTable } from "../db/schema";

export class EntrepriseRepository {
  async creer(donnees: typeof entrepriseTable.$inferInsert) {
    const [entreprise] = await db.insert(entrepriseTable).values(donnees).returning();
    return entreprise;
  }
}
