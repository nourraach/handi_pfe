import { Router } from "express";
import { EntretienController } from "../controllers/entretien.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const entretienController = new EntretienController();

router.use(authMiddleware);

// Routes pour les entreprises
router.post("/planifier", roleMiddleware([RoleUtilisateur.ENTREPRISE]), entretienController.planifierEntretien);
router.get("/entreprise", roleMiddleware([RoleUtilisateur.ENTREPRISE]), entretienController.obtenirEntretiensEntreprise);
router.put("/:id", roleMiddleware([RoleUtilisateur.ENTREPRISE]), entretienController.modifierEntretien);
router.post("/:id/annuler", roleMiddleware([RoleUtilisateur.ENTREPRISE]), entretienController.annulerEntretien);
router.post("/:id/terminer", roleMiddleware([RoleUtilisateur.ENTREPRISE]), entretienController.terminerEntretien);

// Routes pour les candidats
router.get("/candidat", roleMiddleware([RoleUtilisateur.CANDIDAT]), entretienController.obtenirMesEntretiens);
router.post("/:id/confirmer", roleMiddleware([RoleUtilisateur.CANDIDAT]), entretienController.confirmerEntretien);

export default router;