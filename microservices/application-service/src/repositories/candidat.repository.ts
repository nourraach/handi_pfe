import { db } from "../db";
import { candidatTable } from "../db/schema";

export class CandidatRepository {
  async creer(donnees: typeof candidatTable.$inferInsert) {
    const [candidat] = await db.insert(candidatTable).values(donnees).returning();
    return candidat;
  }
}
