import { Router } from "express";
import { AvisEntrepriseController } from "../controllers/avis-entreprise.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const controller = new AvisEntrepriseController();

router.get("/entreprise/:idEntreprise", controller.listerAvisEntreprise);

router.post("/", authMiddleware, roleMiddleware([RoleUtilisateur.CANDIDAT]), controller.creerAvis);
router.get("/mes-avis", authMiddleware, roleMiddleware([RoleUtilisateur.CANDIDAT]), controller.listerMesAvis);

export default router;
