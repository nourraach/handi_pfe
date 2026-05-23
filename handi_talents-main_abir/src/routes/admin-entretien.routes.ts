import { Router } from "express";
import { EntretienController } from "../controllers/entretien.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const controller = new EntretienController();

router.use(
  authMiddleware,
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI])
);

router.get("/entretiens", controller.obtenirTousEntretiensAdmin);

export default router;
