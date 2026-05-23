import { TestPsychologiqueRepository } from "../repositories/test-psychologique.repository";
import { 
  CreerTestDto, 
  ModifierTestDto, 
  PasserTestDto, 
  ListeTestsQueryDto,
  ModifierVisibiliteDto
} from "../dto/test-psychologique.dto";
import { ErreurApi } from "../utils/erreur-api";
import { RoleUtilisateur } from "../types/enums";
import { db } from "../db";
import { candidatTable } from "../db/schema";
import { eq } from "drizzle-orm";

export class TestPsychologiqueService {
  constructor(private readonly repository = new TestPsychologiqueRepository()) {}

  // ADMIN - Gestion des tests

  // Créer un nouveau test
  async creerTest(donnees: CreerTestDto, adminId: string) {
    // Validation des données
    if (!donnees.titre || !donnees.description) {
      throw new ErreurApi("Le titre et la description sont obligatoires", 400);
    }

    if (!donnees.questions || donnees.questions.length === 0) {
      throw new ErreurApi("Au moins une question est requise", 400);
    }

    if (new Date(donnees.date_debut_validite) >= new Date(donnees.date_fin_validite)) {
      throw new ErreurApi("La date de fin doit être postérieure à la date de début", 400);
    }

    // Validation des questions
    for (const question of donnees.questions) {
      if (!question.contenu_question) {
        throw new ErreurApi("Le contenu de la question est obligatoire", 400);
      }

      if (question.score_question <= 0) {
        throw new ErreurApi("Le score de la question doit être positif", 400);
      }

      // Pour les questions à choix multiple, vérifier les options
      if (["choix_multiple", "vrai_faux", "echelle_likert"].includes(question.type_question)) {
        if (!question.options || question.options.length === 0) {
          throw new ErreurApi(`Les options sont requises pour le type de question ${question.type_question}`, 400);
        }

        // Vérifier qu'il y a au moins une bonne réponse pour les questions notées
        const bonnesReponses = question.options.filter(opt => opt.est_correcte);
        if (bonnesReponses.length === 0 && question.type_question !== "echelle_likert") {
          throw new ErreurApi("Au moins une option correcte est requise", 400);
        }
      }
    }

    const donneesTest = {
      titre: donnees.titre,
      description: donnees.description,
      type_test: donnees.type_test,
      duree_minutes: donnees.duree_minutes,
      date_debut_validite: new Date(donnees.date_debut_validite),
      date_fin_validite: new Date(donnees.date_fin_validite),
      instructions: donnees.instructions,
    };

    const test = await this.repository.creerTest(donneesTest, donnees.questions, adminId);

    return {
      message: "Test créé avec succès",
      donnees: {
        id_test: test.id_test,
        titre: test.titre,
        score_total: test.score_total,
        nombre_questions: donnees.questions.length,
      },
    };
  }

  // Lister les tests (admin)
  async listerTests(query: ListeTestsQueryDto) {
    const result = await this.repository.listerTests(query);

    return {
      message: "Tests récupérés avec succès",
      donnees: {
        tests: result.tests.map(t => ({
          id_test: t.test.id_test,
          titre: t.test.titre,
          description: t.test.description,
          type_test: t.test.type_test,
          score_total: t.test.score_total,
          duree_minutes: t.test.duree_minutes,
          statut: t.test.statut,
          date_debut_validite: t.test.date_debut_validite.toISOString(),
          date_fin_validite: t.test.date_fin_validite.toISOString(),
          created_at: t.test.created_at.toISOString(),
          createur: t.createur?.nom || "Inconnu",
        })),
        pagination: result.pagination,
      },
    };
  }

  // Obtenir un test complet (admin)
  async obtenirTest(idTest: string) {
    const test = await this.repository.obtenirTestComplet(idTest);

    if (!test) {
      throw new ErreurApi("Test non trouvé", 404);
    }

    return {
      message: "Test récupéré avec succès",
      donnees: {
        id_test: test.id_test,
        titre: test.titre,
        description: test.description,
        type_test: test.type_test,
        score_total: test.score_total,
        duree_minutes: test.duree_minutes,
        statut: test.statut,
        date_debut_validite: test.date_debut_validite.toISOString(),
        date_fin_validite: test.date_fin_validite.toISOString(),
        instructions: test.instructions,
        created_at: test.created_at.toISOString(),
        questions: test.questions.map(q => ({
          id_question: q.id_question,
          contenu_question: q.contenu_question,
          type_question: q.type_question,
          score_question: q.score_question,
          ordre: q.ordre,
          obligatoire: q.obligatoire,
          options: q.options.map(opt => ({
            id_option: opt.id_option,
            texte_option: opt.texte_option,
            est_correcte: opt.est_correcte,
            score_option: opt.score_option,
            ordre: opt.ordre,
          })),
        })),
      },
    };
  }

  // Modifier un test
  async modifierTest(idTest: string, donnees: ModifierTestDto) {
    const testExistant = await this.repository.obtenirTestComplet(idTest);
    if (!testExistant) {
      throw new ErreurApi("Test non trouvé", 404);
    }

    // Validation des dates si fournies
    if (donnees.date_debut_validite && donnees.date_fin_validite) {
      if (new Date(donnees.date_debut_validite) >= new Date(donnees.date_fin_validite)) {
        throw new ErreurApi("La date de fin doit être postérieure à la date de début", 400);
      }
    }

    const donneesModification: any = {};
    if (donnees.titre) donneesModification.titre = donnees.titre;
    if (donnees.description) donneesModification.description = donnees.description;
    if (donnees.type_test) donneesModification.type_test = donnees.type_test;
    if (donnees.duree_minutes) donneesModification.duree_minutes = donnees.duree_minutes;
    if (donnees.date_debut_validite) donneesModification.date_debut_validite = new Date(donnees.date_debut_validite);
    if (donnees.date_fin_validite) donneesModification.date_fin_validite = new Date(donnees.date_fin_validite);
    if (donnees.instructions !== undefined) donneesModification.instructions = donnees.instructions;
    if (donnees.statut) donneesModification.statut = donnees.statut;

    const testModifie = await this.repository.modifierTest(idTest, donneesModification);

    if (!testModifie) {
      throw new ErreurApi("Erreur lors de la modification", 500);
    }

    return {
      message: "Test modifié avec succès",
      donnees: {
        id_test: testModifie.id_test,
        titre: testModifie.titre,
        statut: testModifie.statut,
      },
    };
  }

  // Supprimer un test
  async supprimerTest(idTest: string) {
    const test = await this.repository.obtenirTestComplet(idTest);
    if (!test) {
      throw new ErreurApi("Test non trouvé", 404);
    }

    const testSupprime = await this.repository.supprimerTest(idTest);

    if (!testSupprime) {
      throw new ErreurApi("Erreur lors de la suppression", 500);
    }

    return {
      message: "Test supprimé avec succès",
      donnees: {
        id_test: idTest,
        supprime_le: new Date().toISOString(),
      },
    };
  }

  // Obtenir les statistiques d'un test
  async obtenirStatistiquesTest(idTest: string) {
    const test = await this.repository.obtenirTestComplet(idTest);
    if (!test) {
      throw new ErreurApi("Test non trouvé", 404);
    }

    const stats = await this.repository.obtenirStatistiquesTest(idTest);

    return {
      message: "Statistiques récupérées avec succès",
      donnees: {
        test: {
          id_test: test.id_test,
          titre: test.titre,
          type_test: test.type_test,
        },
        statistiques: stats,
      },
    };
  }

  // Obtenir tous les résultats d'un test (admin)
  async obtenirResultatsTest(idTest: string) {
    const test = await this.repository.obtenirTestComplet(idTest);
    if (!test) {
      throw new ErreurApi("Test non trouvé", 404);
    }

    const resultats = await this.repository.obtenirResultatsTest(idTest);

    return {
      message: "Résultats récupérés avec succès",
      donnees: {
        test: {
          id_test: test.id_test,
          titre: test.titre,
          score_total: test.score_total,
        },
        resultats: resultats.map(r => ({
          id_resultat: r.resultat.id_resultat,
          candidat: {
            nom: r.candidat?.nom || "Anonyme",
            email: r.candidat?.email || "",
          },
          score_obtenu: r.resultat.score_obtenu,
          pourcentage: r.resultat.pourcentage,
          temps_passe_minutes: r.resultat.temps_passe_minutes,
          date_passage: r.resultat.date_passage.toISOString(),
          est_visible: r.resultat.est_visible,
        })),
      },
    };
  }

  // CANDIDAT - Passage des tests

  // Obtenir les tests disponibles pour un candidat
  async obtenirTestsDisponibles(idCandidat: string) {
    const tests = await this.repository.obtenirTestsDisponibles(idCandidat);

    return {
      message: "Tests disponibles récupérés avec succès",
      donnees: {
        tests: tests.map(t => ({
          id_test: t.id_test,
          titre: t.titre,
          description: t.description,
          type_test: t.type_test,
          duree_minutes: t.duree_minutes,
          date_fin_validite: t.date_fin_validite.toISOString(),
          instructions: t.instructions,
          deja_passe: t.deja_passe,
          peut_passer: t.peut_passer,
        })),
      },
    };
  }

  // Commencer un test (obtenir les questions)
  async commencerTest(idTest: string, idCandidat: string) {
    const test = await this.repository.obtenirTestPourPassage(idTest, idCandidat);

    if (!test) {
      throw new ErreurApi("Test non disponible ou déjà passé", 403);
    }

    // Enregistrer le début de la tentative
    await this.repository.commencerTentative(idTest, idCandidat);

    return {
      message: "Test commencé avec succès",
      donnees: test,
    };
  }

  // Soumettre les réponses d'un test
  async soumettreTest(idTest: string, idCandidat: string, donnees: PasserTestDto) {
    // Validation des réponses
    if (!donnees.reponses || donnees.reponses.length === 0) {
      throw new ErreurApi("Aucune réponse fournie", 400);
    }

    if (donnees.temps_passe_minutes <= 0) {
      throw new ErreurApi("Temps de passage invalide", 400);
    }

    const resultat = await this.repository.soumettreReponses(
      idTest,
      idCandidat,
      donnees.reponses,
      donnees.temps_passe_minutes
    );

    if (!resultat) {
      throw new ErreurApi("Erreur lors de la soumission du test", 500);
    }

    return {
      message: "Test soumis avec succès",
      donnees: {
        id_resultat: resultat.id_resultat!,
        score_obtenu: resultat.score_obtenu!,
        pourcentage: resultat.pourcentage!,
        temps_passe_minutes: resultat.temps_passe_minutes!,
        date_passage: resultat.date_passage!.toISOString(),
      },
    };
  }

  // Obtenir les résultats d'un candidat
  async obtenirResultatsCandidat(idCandidat: string) {
    const resultats = await this.repository.obtenirResultatsCandidat(idCandidat);

    return {
      message: "Résultats récupérés avec succès",
      donnees: {
        resultats: resultats.map(r => ({
          id_resultat: r.resultat.id_resultat,
          test: {
            id_test: r.test?.id_test || "",
            titre: r.test?.titre || "",
            type_test: r.test?.type_test || "",
            score_total: r.test?.score_total || "0",
          },
          score_obtenu: r.resultat.score_obtenu,
          pourcentage: r.resultat.pourcentage,
          temps_passe_minutes: r.resultat.temps_passe_minutes,
          date_passage: r.resultat.date_passage.toISOString(),
          est_visible: r.resultat.est_visible,
          peut_modifier_visibilite: true,
        })),
      },
    };
  }

  // Modifier la visibilité d'un résultat
  async modifierVisibiliteResultat(idResultat: string, idCandidat: string, donnees: ModifierVisibiliteDto) {
    if (typeof donnees?.est_visible !== "boolean") {
      throw new ErreurApi("Le champ est_visible (boolean) est requis", 400);
    }

    let resultat = await this.repository.modifierVisibiliteResultat(
      idResultat,
      idCandidat,
      donnees.est_visible
    );

    // Compatibilité: certaines données historiques peuvent stocker id_candidat = candidat.id
    if (!resultat) {
      const profil = await db
        .select({ id: candidatTable.id })
        .from(candidatTable)
        .where(eq(candidatTable.id_utilisateur, idCandidat))
        .limit(1);

      const idProfilCandidat = profil[0]?.id;
      if (idProfilCandidat) {
        resultat = await this.repository.modifierVisibiliteResultat(
          idResultat,
          idProfilCandidat,
          donnees.est_visible
        );
      }
    }

    if (!resultat) {
      throw new ErreurApi("Résultat non trouvé ou non autorisé", 404);
    }

    return {
      message: "Visibilité modifiée avec succès",
      donnees: {
        id_resultat: resultat.id_resultat,
        est_visible: resultat.est_visible,
      },
    };
  }
}