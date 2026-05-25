import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";
import { RecommendationController } from "../controllers/recommendation.controller";

const router = Router();
const controller = new RecommendationController();

router.use(authMiddleware);
router.use(roleMiddleware([RoleUtilisateur.CANDIDAT]));

router.get("/candidat", controller.obtenirMesRecommandations);
router.post("/:id/view", controller.marquerViewed);
router.post("/:id/dismiss", controller.marquerDismiss);
router.post("/:id/apply", controller.marquerApply);
router.get("/consentement", controller.obtenirConsentement);
router.patch("/consentement", controller.mettreAJourConsentement);

export default router;

