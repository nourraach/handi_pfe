import { Router } from "express";
import { checkApplicationRelationship } from "../controllers/internal.controller";

/**
 * Internal Routes
 * 
 * These routes are for inter-service communication only.
 * They are NOT exposed through the API Gateway.
 * 
 * Requirements: 2.3
 */

const router = Router();

// Check if application relationship exists between candidate and enterprise
router.get("/applications/check-relationship", checkApplicationRelationship);

export default router;
