import { Router } from "express";
import { AdminCandidatureController } from "../controllers/admin-candidature.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const adminCandidatureController = new AdminCandidatureController();

router.use(authMiddleware);
// role checks applied per-route to allow read-only access for ANETI/INSPECTEUR

// Supervision des candidatures
router.get(
  "/candidatures/toutes",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  adminCandidatureController.obtenirToutesCandidatures
);
router.get(
  "/candidatures/statistiques-globales",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  adminCandidatureController.obtenirStatistiquesGlobales
);
router.put(
  "/candidatures/:id/override-statut",
  roleMiddleware([RoleUtilisateur.ADMIN]),
  adminCandidatureController.modifierStatutAdmin
);
router.post(
  "/candidatures/:id/bloquer",
  roleMiddleware([RoleUtilisateur.ADMIN]),
  adminCandidatureController.bloquerCandidature
);

// Monitoring du workflow
router.get(
  "/workflow-recrutement",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  adminCandidatureController.obtenirWorkflowRecrutement
);

// Sécurité et conformité
router.get(
  "/detection-abus",
  roleMiddleware([RoleUtilisateur.ADMIN]),
  adminCandidatureController.detecterAbus
);

export default router;
