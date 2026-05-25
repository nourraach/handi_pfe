import { Router } from "express";
import { OffreEmploiController } from "../controllers/offre-emploi.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const offreController = new OffreEmploiController();

// Routes pour les entreprises - toutes protégées par authentification et rôle entreprise
router.use(authMiddleware);
router.use(roleMiddleware([RoleUtilisateur.ENTREPRISE]));

// GET /api/entreprise/offres - Lister les offres de l'entreprise
router.get("/", offreController.obtenirOffresEntreprise);

// POST /api/entreprise/offres - Créer une nouvelle offre
router.post("/", offreController.creerOffre);

// PUT /api/entreprise/offres/:id - Modifier une offre
router.put("/:id", offreController.modifierOffre);

// DELETE /api/entreprise/offres/:id - Supprimer une offre
router.delete("/:id", offreController.supprimerOffre);

// PATCH /api/entreprise/offres/:id/statut - Changer le statut d'une offre
router.patch("/:id/statut", offreController.changerStatutOffre);

export default router;