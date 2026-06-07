import { Router } from "express";
import { SupervisionController } from "../controllers/supervision.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const controller = new SupervisionController();

router.use(authMiddleware);

router.get(
  "/statistics/overview",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.getOverview
);

router.get(
  "/pipeline",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.getPipeline
);

router.get(
  "/companies-map",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.listSupervisedEnterprises
);

router.get(
  "/reports",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.listReports
);

router.get(
  "/reports/:id/pdf",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.getReportPdf
);

router.get(
  "/reports/:id",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.getReportDetail
);

router.post(
  "/reports",
  roleMiddleware([RoleUtilisateur.ENTREPRISE]),
  controller.createReport
);

router.post(
  "/reports/:id/validate",
  roleMiddleware([RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.validateReport
);

router.post(
  "/reports/:id/reject",
  roleMiddleware([RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.rejectReport
);

router.post(
  "/reports/:id/recommendations",
  roleMiddleware([RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.addRecommendation
);

router.get(
  "/offers",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.listOffers
);

router.get(
  "/candidates",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.listCandidates
);

router.get(
  "/export",
  roleMiddleware([RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI]),
  controller.exportDataset
);

export const supervisionRoutes = router;
