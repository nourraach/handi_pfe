import { Router } from "express";
import { FavorisController } from "../controllers/favoris.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const favorisController = new FavorisController();

router.use(authMiddleware);
router.use(roleMiddleware([RoleUtilisateur.CANDIDAT])); // Toutes les routes sont réservées aux candidats

router.post("/:idOffre", favorisController.ajouterFavori);
router.delete("/:idOffre", favorisController.retirerFavori);
router.get("/", favorisController.obtenirMesFavoris);
router.get("/:idOffre/verifier", favorisController.verifierFavori);

export default router;