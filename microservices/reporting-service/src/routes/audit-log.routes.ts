import { Router } from "express";
import { queryAuditLogs } from "../controllers/audit-log.controller";

/**
 * Audit Log Routes
 * 
 * Routes for querying audit logs.
 * All routes require ADMIN role (validated in controller).
 * 
 * Requirements: 6.4
 */

const router = Router();

// Query audit logs with filtering and pagination
// GET /api/audit-logs?userId=xxx&startDate=2024-01-01&endDate=2024-12-31&actionType=CV_ACCESS&authorizationResult=DENIED&page=1&pageSize=50
router.get("/", queryAuditLogs);

export default router;
