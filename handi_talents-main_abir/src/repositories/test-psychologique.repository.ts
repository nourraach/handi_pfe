import { and, count, desc, eq, gte, ilike, lte, or, sql, avg, min, max } from "drizzle-orm";
import { db } from "../db";
import { 
  testPsychologiqueTable, 
  questionTable, 
  optionReponseTable, 
  resultatTestTable, 
  tentativeTestTable,
  candidatTable,
  utilisateurTable
} from "../db/schema";
import { ListeTestsQueryDto } from "../dto/test-psychologique.dto";

export class TestPsychologiqueRepository {
  // ADMIN - Gestion des tests

  // Créer un test complet avec questions et options
  async creerTest(donneesTest: any, questions: any[], adminId: string) {
    return await db.transaction(async (transaction) => {
      // Calculer le score total basé sur les questions AVANT de créer le test
      const scoreTotal = questions.reduce((total, q) => total + parseFloat(q.score_question), 0);
      
      // Créer le test avec le score total calculé
      const [test] = await transaction
        .insert(testPsychologiqueTable)
        .values({
          ...donneesTest,
          score_total: scoreTotal.toString(),
          created_by: adminId,
        })
        .returning();

      if (!test) {
        throw new Error("Erreur lors de la création du test");
      }

      // Créer les questions
      for (const questionData of questions) {
        const [question] = await transaction
          .insert(questionTable)
          .values({
            id_test: test.id_test,
            contenu_question: questionData.contenu_question,
            type_question: questionData.type_question,
            score_question: questionData.score_question.toString(),
            ordre: questionData.ordre,
            obligatoire: questionData.obligatoire ?? true,
          })
          .returning();

        if (!question) {
          throw new Error("Erreur lors de la création de la question");
        }

        // Créer les options si elles existent
        if (questionData.options && questionData.options.length > 0) {
          for (const optionData of questionData.options) {
            await transaction.insert(optionReponseTable).values({
              id_question: question.id_question,
              texte_option: optionData.texte_option,
              est_correcte: optionData.est_correcte,
              score_option: optionData.score_option.toString(),
              ordre: optionData.ordre,
            });
          }
        }
      }

      return { ...test, score_total: scoreTotal.toString() };
    });
  }

  // Lister les tests avec pagination et filtres
  async listerTests(query: ListeTestsQueryDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const offset = (page - 1) * limit;

    let whereConditions: any[] = [];

    if (query.statut) {
      whereConditions.push(eq(testPsychologiqueTable.statut, query.statut as any));
    }
    if (query.type_test) {
      whereConditions.push(eq(testPsychologiqueTable.type_test, query.type_test));
    }
    if (query.recherche) {
      whereConditions.push(
        or(
          ilike(testPsychologiqueTable.titre, `%${query.recherche}%`),
          ilike(testPsychologiqueTable.description, `%${query.recherche}%`)
        )
      );
    }
    if (query.actifs_seulement) {
      const maintenant = new Date();
      whereConditions.push(
        and(
          eq(testPsychologiqueTable.statut, "actif"),
          lte(testPsychologiqueTable.date_debut_validite, maintenant),
          gte(testPsychologiqueTable.date_fin_validite, maintenant)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const tests = await db
      .select({
        test: testPsychologiqueTable,
        createur: {
          nom: utilisateurTable.nom,
        },
      })
      .from(testPsychologiqueTable)
      .leftJoin(utilisateurTable, eq(testPsychologiqueTable.created_by, utilisateurTable.id_utilisateur))
      .where(whereClause)
      .orderBy(desc(testPsychologiqueTable.created_at))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(testPsychologiqueTable)
      .where(whereClause);

    return {
      tests,
      pagination: {
        page,
        limit,
        total: totalResult?.count || 0,
        totalPages: Math.ceil((totalResult?.count || 0) / limit),
      },
    };
  }

  // Obtenir un test avec ses questions et options
  async obtenirTestComplet(idTest: string) {
    const [test] = await db
      .select()
      .from(testPsychologiqueTable)
      .where(eq(testPsychologiqueTable.id_test, idTest));

    if (!test) return null;

    const questions = await db
      .select()
      .from(questionTable)
      .where(eq(questionTable.id_test, idTest))
      .orderBy(questionTable.ordre);

    const questionsAvecOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db
          .select()
          .from(optionReponseTable)
          .where(eq(optionReponseTable.id_question, question.id_question))
          .orderBy(optionReponseTable.ordre);

        return {
          ...question,
          options,
        };
      })
    );

    return {
      ...test,
      questions: questionsAvecOptions,
    };
  }

  // Modifier un test
  async modifierTest(idTest: string, donnees: any) {
    const [test] = await db
      .update(testPsychologiqueTable)
      .set({
        ...donnees,
        updated_at: new Date(),
      })
      .where(eq(testPsychologiqueTable.id_test, idTest))
      .returning();

    return test ?? null;
  }

  // Supprimer un test
  async supprimerTest(idTest: string) {
    const [test] = await db
      .delete(testPsychologiqueTable)
      .where(eq(testPsychologiqueTable.id_test, idTest))
      .returning();

    return test ?? null;
  }

  // CANDIDAT - Passage des tests

  // Obtenir les tests disponibles pour un candidat
  async obtenirTestsDisponibles(idCandidat: string) {
    const maintenant = new Date();
    
    // Tests actifs et dans la période de validité
    const testsActifs = await db
      .select()
      .from(testPsychologiqueTable)
      .where(
        and(
          eq(testPsychologiqueTable.statut, "actif"),
          lte(testPsychologiqueTable.date_debut_validite, maintenant),
          gte(testPsychologiqueTable.date_fin_validite, maintenant)
        )
      )
      .orderBy(testPsychologiqueTable.created_at);

    // Vérifier quels tests le candidat a déjà passés dans cette période
    const testsAvecStatut = await Promise.all(
      testsActifs.map(async (test) => {
        const [tentative] = await db
          .select()
          .from(tentativeTestTable)
          .where(
            and(
              eq(tentativeTestTable.id_test, test.id_test),
              eq(tentativeTestTable.id_candidat, idCandidat),
              gte(tentativeTestTable.date_tentative, test.date_debut_validite),
              lte(tentativeTestTable.date_tentative, test.date_fin_validite)
            )
          );

        return {
          ...test,
          deja_passe: !!tentative,
          peut_passer: !tentative,
        };
      })
    );

    return testsAvecStatut;
  }

  // Obtenir un test pour passage (sans les bonnes réponses)
  async obtenirTestPourPassage(idTest: string, idCandidat: string) {
    // Vérifier si déjà passé dans les 6 derniers mois
    const sixMoisAvant = new Date();
    sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 6);
    const [dernier] = await db
      .select()
      .from(resultatTestTable)
      .where(
        and(
          eq(resultatTestTable.id_test, idTest),
          eq(resultatTestTable.id_candidat, idCandidat),
          gte(resultatTestTable.date_passage, sixMoisAvant)
        )
      )
      .orderBy(desc(resultatTestTable.date_passage));

    if (dernier) return null; // Périodicité 6 mois

    // Vérifier si le candidat peut passer ce test
    const maintenant = new Date();
    const [test] = await db
      .select()
      .from(testPsychologiqueTable)
      .where(
        and(
          eq(testPsychologiqueTable.id_test, idTest),
          eq(testPsychologiqueTable.statut, "actif"),
          lte(testPsychologiqueTable.date_debut_validite, maintenant),
          gte(testPsychologiqueTable.date_fin_validite, maintenant)
        )
      );

    if (!test) return null;

    // Vérifier si déjà passé dans cette période
    const [tentativeExistante] = await db
      .select()
      .from(tentativeTestTable)
      .where(
        and(
          eq(tentativeTestTable.id_test, idTest),
          eq(tentativeTestTable.id_candidat, idCandidat),
          gte(tentativeTestTable.date_tentative, test.date_debut_validite),
          lte(tentativeTestTable.date_tentative, test.date_fin_validite)
        )
      );

    if (tentativeExistante) return null; // Déjà passé

    // Récupérer les questions sans révéler les bonnes réponses
    const questions = await db
      .select()
      .from(questionTable)
      .where(eq(questionTable.id_test, idTest))
      .orderBy(questionTable.ordre);

    const questionsAvecOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await db
          .select({
            id_option: optionReponseTable.id_option,
            texte_option: optionReponseTable.texte_option,
            ordre: optionReponseTable.ordre,
          })
          .from(optionReponseTable)
          .where(eq(optionReponseTable.id_question, question.id_question))
          .orderBy(optionReponseTable.ordre);

        return {
          id_question: question.id_question,
          contenu_question: question.contenu_question,
          type_question: question.type_question,
          ordre: question.ordre,
          obligatoire: question.obligatoire,
          options,
        };
      })
    );

    return {
      id_test: test.id_test,
      titre: test.titre,
      description: test.description,
      type_test: test.type_test,
      duree_minutes: test.duree_minutes,
      instructions: test.instructions,
      questions: questionsAvecOptions,
    };
  }

  // Commencer une tentative de test
  async commencerTentative(idTest: string, idCandidat: string) {
    const [tentative] = await db
      .insert(tentativeTestTable)
      .values({
        id_test: idTest,
        id_candidat: idCandidat,
        date_debut: new Date(),
      })
      .returning();

    return tentative;
  }

  // Soumettre les réponses et calculer le score
  async soumettreReponses(idTest: string, idCandidat: string, reponses: any[], tempsPasse: number) {
    return await db.transaction(async (transaction) => {
      // Récupérer les questions avec leurs options et scores
      const questions = await transaction
        .select()
        .from(questionTable)
        .where(eq(questionTable.id_test, idTest));

      let scoreTotal = 0;
      const reponsesDetaillees = [];

      // Calculer le score pour chaque réponse
      for (const reponse of reponses) {
        const question = questions.find(q => q.id_question === reponse.id_question);
        if (!question) continue;

        let scoreObtenu = 0;

        if (reponse.id_option) {
          // Pour les questions à choix multiple, vrai/faux, échelle
          const [option] = await transaction
            .select()
            .from(optionReponseTable)
            .where(eq(optionReponseTable.id_option, reponse.id_option));

          if (option) {
            scoreObtenu = parseFloat(option.score_option || "0");
          }
        } else if (reponse.reponse_texte) {
          // Pour les questions texte libre, on peut attribuer le score complet
          // ou implémenter une logique de notation plus complexe
          scoreObtenu = parseFloat(question.score_question);
        }

        scoreTotal += scoreObtenu;
        reponsesDetaillees.push({
          id_question: reponse.id_question,
          id_option: reponse.id_option,
          reponse_texte: reponse.reponse_texte,
          score_obtenu: scoreObtenu,
        });
      }

      // Récupérer le score maximum du test
      const [test] = await transaction
        .select()
        .from(testPsychologiqueTable)
        .where(eq(testPsychologiqueTable.id_test, idTest));

      const scoreMaximum = parseFloat(test?.score_total || "0");
      const pourcentage = scoreMaximum > 0 ? (scoreTotal / scoreMaximum) * 100 : 0;

      // Enregistrer le résultat
      const [resultat] = await transaction
        .insert(resultatTestTable)
        .values({
          id_test: idTest,
          id_candidat: idCandidat,
          score_obtenu: scoreTotal.toString(),
          pourcentage: pourcentage.toString(),
          temps_passe_minutes: tempsPasse,
          reponses: reponsesDetaillees,
        })
        .returning();

      // Marquer la tentative comme terminée
      await transaction
        .update(tentativeTestTable)
        .set({
          est_termine: true,
          date_fin: new Date(),
        })
        .where(
          and(
            eq(tentativeTestTable.id_test, idTest),
            eq(tentativeTestTable.id_candidat, idCandidat),
            eq(tentativeTestTable.est_termine, false)
          )
        );

      return resultat;
    });
  }

  // Obtenir les résultats d'un candidat
  async obtenirResultatsCandidat(idCandidat: string) {
    const resultats = await db
      .select({
        resultat: resultatTestTable,
        test: {
          id_test: testPsychologiqueTable.id_test,
          titre: testPsychologiqueTable.titre,
          type_test: testPsychologiqueTable.type_test,
          score_total: testPsychologiqueTable.score_total,
        },
      })
      .from(resultatTestTable)
      .leftJoin(testPsychologiqueTable, eq(resultatTestTable.id_test, testPsychologiqueTable.id_test))
      .where(eq(resultatTestTable.id_candidat, idCandidat))
      .orderBy(desc(resultatTestTable.date_passage));

    return resultats;
  }

  // Modifier la visibilité d'un résultat
  async modifierVisibiliteResultat(idResultat: string, idCandidat: string, estVisible: boolean) {
    const [resultat] = await db
      .update(resultatTestTable)
      .set({ est_visible: estVisible })
      .where(
        and(
          eq(resultatTestTable.id_resultat, idResultat),
          eq(resultatTestTable.id_candidat, idCandidat)
        )
      )
      .returning();

    return resultat ?? null;
  }

  // STATISTIQUES ADMIN

  // Obtenir les statistiques d'un test
  async obtenirStatistiquesTest(idTest: string) {
    const [stats] = await db
      .select({
        nombre_participants: count(),
        score_moyen: avg(sql`CAST(${resultatTestTable.score_obtenu} AS DECIMAL)`),
        score_min: min(sql`CAST(${resultatTestTable.score_obtenu} AS DECIMAL)`),
        score_max: max(sql`CAST(${resultatTestTable.score_obtenu} AS DECIMAL)`),
        temps_moyen: avg(resultatTestTable.temps_passe_minutes),
      })
      .from(resultatTestTable)
      .where(eq(resultatTestTable.id_test, idTest));

    // Calculer le taux de completion
    const [tentativesTotales] = await db
      .select({ count: count() })
      .from(tentativeTestTable)
      .where(eq(tentativeTestTable.id_test, idTest));

    const [tentativesTerminees] = await db
      .select({ count: count() })
      .from(tentativeTestTable)
      .where(
        and(
          eq(tentativeTestTable.id_test, idTest),
          eq(tentativeTestTable.est_termine, true)
        )
      );

    const tauxCompletion = (tentativesTotales?.count || 0) > 0 
      ? ((tentativesTerminees?.count || 0) / (tentativesTotales?.count || 1)) * 100 
      : 0;

    return {
      nombre_participants: stats?.nombre_participants || 0,
      score_moyen: parseFloat(stats?.score_moyen?.toString() || "0"),
      score_min: parseFloat(stats?.score_min?.toString() || "0"),
      score_max: parseFloat(stats?.score_max?.toString() || "0"),
      taux_completion: tauxCompletion,
      temps_moyen_minutes: stats?.temps_moyen || 0,
    };
  }

  // Obtenir tous les résultats d'un test (pour l'admin)
  async obtenirResultatsTest(idTest: string) {
    const resultats = await db
      .select({
        resultat: resultatTestTable,
        candidat: {
          nom: utilisateurTable.nom,
          email: utilisateurTable.email,
        },
      })
      .from(resultatTestTable)
      .leftJoin(candidatTable, eq(resultatTestTable.id_candidat, candidatTable.id_utilisateur))
      .leftJoin(utilisateurTable, eq(candidatTable.id_utilisateur, utilisateurTable.id_utilisateur))
      .where(eq(resultatTestTable.id_test, idTest))
      .orderBy(desc(resultatTestTable.date_passage));

    return resultats;
  }
}
