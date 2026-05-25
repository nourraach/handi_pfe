import { Router } from "express";
import { OffreEmploiSimpleController } from "../controllers/offre-emploi-simple.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const offreController = new OffreEmploiSimpleController();

// Routes publiques (consultation des offres)
router.get("/", offreController.obtenirOffres);
router.get("/:id", offreController.obtenirOffreParId);

// Routes pour les entreprises
router.post("/", authMiddleware, roleMiddleware([RoleUtilisateur.ENTREPRISE]), offreController.creerOffre);

export default router;