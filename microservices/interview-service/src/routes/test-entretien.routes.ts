import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";
import { TestEntretienService } from "../services/test-entretien.service";
import { reponseSucces } from "../utils/reponse";

const router = Router();
const service = new TestEntretienService();

// Entreprise
router.post(
  "/entreprise",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  async (req, res, next) => {
    try {
      const test = await service.creerTest(String(req.body.id_offre ?? ""), String(req.body.titre ?? ""), req.body.questions || []);
      return reponseSucces(res, 201, "Test créé", test);
    } catch (e) {
      return next(e);
    }
  }
);

router.get(
  "/entreprise",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  async (req, res, next) => {
    try {
      const raw = (req.query as any).id_offre;
      const idOffre = Array.isArray(raw) ? raw[0] : raw ? String(raw) : undefined;
      const tests = await service.listerTestsEntreprise(idOffre);
      return reponseSucces(res, 200, "Tests", tests);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/entreprise/:id/resultats",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  async (req, res, next) => {
    try {
      const raw = (req.params as any).id;
      const testId = Array.isArray(raw) ? raw[0] : String(raw);
      const r = await service.resultatsPourEntreprise(testId);
      return reponseSucces(res, 200, "Résultats", r);
    } catch (e) {
      next(e);
    }
  }
);

// Candidat
router.get(
  "/candidat",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.CANDIDAT]),
  async (_req, res, next) => {
    try {
      const tests = await service.listerTestsCandidat();
      return reponseSucces(res, 200, "Tests disponibles", tests);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/candidat/:id",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.CANDIDAT]),
  async (req, res, next) => {
    try {
      const testParam = (req.params as any).id;
      const testId = Array.isArray(testParam) ? testParam[0] : String(testParam);
      const test = await service.obtenirTest(testId);
      return reponseSucces(res, 200, "Test", test);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/candidat/:id/passer",
  authMiddleware,
  roleMiddleware([RoleUtilisateur.CANDIDAT]),
  async (req, res, next) => {
    try {
      const testParam = (req.params as any).id;
      const testId = Array.isArray(testParam) ? testParam[0] : String(testParam);
      const passage = await service.passerTest(testId, req.utilisateur!.id_utilisateur, req.body.reponses || []);
      return reponseSucces(res, 201, "Test soumis", passage);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
