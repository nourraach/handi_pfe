import { Request, Response, NextFunction } from "express";
import { TestPsychologiqueService } from "../services/test-psychologique.service";
import { reponseSucces } from "../utils/reponse";
import { ErreurApi } from "../utils/erreur-api";

export class TestPsychologiqueController {
  constructor(private readonly service = new TestPsychologiqueService()) {}

  // ADMIN - Gestion des tests

  // Créer un nouveau test
  creerTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const adminId = requete.utilisateur?.id_utilisateur;
      if (!adminId) {
        throw new ErreurApi("Utilisateur non authentifié", 401);
      }

      const resultat = await this.service.creerTest(requete.body, adminId);
      return reponseSucces(reponse, 201, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Lister les tests
  listerTests = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const query = {
        page: parseInt(requete.query.page as string) || 1,
        limit: parseInt(requete.query.limit as string) || 10,
        statut: requete.query.statut as string,
        type_test: requete.query.type_test as string,
        recherche: requete.query.recherche as string,
        actifs_seulement: requete.query.actifs_seulement === 'true',
      };

      const resultat = await this.service.listerTests(query);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Obtenir un test spécifique
  obtenirTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }

      const resultat = await this.service.obtenirTest(idTest);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Modifier un test
  modifierTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }

      const resultat = await this.service.modifierTest(idTest, requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Supprimer un test
  supprimerTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }

      const resultat = await this.service.supprimerTest(idTest);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Obtenir les statistiques d'un test
  obtenirStatistiquesTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }

      const resultat = await this.service.obtenirStatistiquesTest(idTest);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Obtenir tous les résultats d'un test
  obtenirResultatsTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }

      const resultat = await this.service.obtenirResultatsTest(idTest);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // CANDIDAT - Passage des tests

  // Obtenir les tests disponibles
  obtenirTestsDisponibles = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const candidatId = requete.utilisateur?.id_utilisateur;
      if (!candidatId) {
        throw new ErreurApi("Utilisateur non authentifié", 401);
      }

      const resultat = await this.service.obtenirTestsDisponibles(candidatId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Commencer un test
  commencerTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;
      const candidatId = requete.utilisateur?.id_utilisateur;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }
      if (!candidatId) {
        throw new ErreurApi("Utilisateur non authentifié", 401);
      }

      const resultat = await this.service.commencerTest(idTest, candidatId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Soumettre un test
  soumettreTest = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idTest = requete.params.id_test as string;
      const candidatId = requete.utilisateur?.id_utilisateur;

      if (!idTest) {
        throw new ErreurApi("ID du test manquant", 400);
      }
      if (!candidatId) {
        throw new ErreurApi("Utilisateur non authentifié", 401);
      }

      const resultat = await this.service.soumettreTest(idTest, candidatId, requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Obtenir les résultats du candidat
  obtenirMesResultats = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const candidatId = requete.utilisateur?.id_utilisateur;
      if (!candidatId) {
        throw new ErreurApi("Utilisateur non authentifié", 401);
      }

      const resultat = await this.service.obtenirResultatsCandidat(candidatId);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  // Modifier la visibilité d'un résultat
  modifierVisibiliteResultat = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const idResultat = requete.params.id_resultat as string;
      const candidatId = requete.utilisateur?.id_utilisateur;

      if (!idResultat) {
        throw new ErreurApi("ID du résultat manquant", 400);
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(idResultat)) {
        throw new ErreurApi("ID du résultat invalide", 400);
      }

      if (!candidatId) {
        throw new ErreurApi("Utilisateur non authentifié", 401);
      }

      const resultat = await this.service.modifierVisibiliteResultat(idResultat, candidatId, requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}
