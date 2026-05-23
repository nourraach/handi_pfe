import { db } from "../db";
import { testEntretienTable, testEntretienQuestionTable, testEntretienResultatTable } from "../db/schema";
import { eq } from "drizzle-orm";

export class TestEntretienRepository {
  async creerTest(id_offre: string, titre: string, questions: any[]) {
    return await db.transaction(async (trx) => {
      const [test] = await trx
        .insert(testEntretienTable)
        .values({ id_offre, titre })
        .returning();

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await trx.insert(testEntretienQuestionTable).values({
          id_test: test.id,
          texte: q.texte,
          type: q.type || "texte",
          options: q.options || null,
          ordre: String(i + 1),
        });
      }
      return test;
    });
  }

  async listerTests(id_offre?: string) {
    if (id_offre) {
      return db.select().from(testEntretienTable).where(eq(testEntretienTable.id_offre, id_offre));
    }
    return db.select().from(testEntretienTable);
  }

  async obtenirTestComplet(id: string) {
    const [test] = await db.select().from(testEntretienTable).where(eq(testEntretienTable.id, id));
    if (!test) return null;
    const questions = await db
      .select()
      .from(testEntretienQuestionTable)
      .where(eq(testEntretienQuestionTable.id_test, id));
    return { ...test, questions };
  }

  async enregistrerResultat(id_test: string, id_candidat: string, reponses: any, score?: string) {
    const [res] = await db
      .insert(testEntretienResultatTable)
      .values({ id_test, id_candidat, reponses, score })
      .returning();
    return res;
  }

  async resultatsPourTest(id_test: string) {
    return db.select().from(testEntretienResultatTable).where(eq(testEntretienResultatTable.id_test, id_test));
  }
}
