import { Router } from "express";
import { EnterpriseReportingController } from "../controllers/enterprise-reporting.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { RoleUtilisateur } from "../types/enums";

const router = Router();
const controller = new EnterpriseReportingController();

router.use(authMiddleware, roleMiddleware([RoleUtilisateur.ENTREPRISE]));

router.get("/context", controller.getComplianceContext);
router.get("/reports", controller.listReports);
router.get("/reports/:id", controller.getReportDetail);
router.post("/reports", controller.createReport);

export const enterpriseReportingRoutes = router;

