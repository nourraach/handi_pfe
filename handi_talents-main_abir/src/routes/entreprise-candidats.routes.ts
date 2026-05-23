import { Router } from "express";
import { EntrepriseCandidatController } from "../controllers/entreprise-candidat.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const controller = new EntrepriseCandidatController();

router.use(authMiddleware);
router.use(roleMiddleware([RoleUtilisateur.ENTREPRISE]));

router.get("/", controller.listerCandidats);

export default router;
