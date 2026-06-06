import { Request, Response } from "express";
import { db } from "../db";
import { candidatureTable } from "../db/schema/candidature.schema";
import { offreEmploiTable } from "../db/schema/offre-emploi.schema";
import { eq, and, count } from "drizzle-orm";

/**
 * Internal Controller
 * 
 * Provides internal endpoints for inter-service communication.
 * These endpoints are NOT exposed through the API Gateway.
 * 
 * Requirements: 2.3
 */

interface ApplicationRelationshipResult {
  hasRelationship: boolean;
  applicationCount: number;
  latestApplicationDate?: Date;
}

/**
 * Check if an application relationship exists between a candidate and an enterprise
 * 
 * GET /internal/applications/check-relationship?candidateId=xxx&enterpriseId=yyy
 * 
 * This endpoint checks if the candidate has submitted any applications (active or historical)
 * to job offers published by the specified enterprise.
 * 
 * @param req - Express request with candidateId and enterpriseId query parameters
 * @param res - Express response with ApplicationRelationshipResult
 */
export async function checkApplicationRelationship(req: Request, res: Response): Promise<void> {
  try {
    const { candidateId, enterpriseId } = req.query;

    // Validate required parameters
    if (!candidateId || !enterpriseId) {
      res.status(400).json({
        error: "Missing required parameters: candidateId and enterpriseId",
        code: "MISSING_PARAMETERS",
      });
      return;
    }

    // Query to find applications where:
    // 1. Candidate ID matches
    // 2. The job offer belongs to the enterprise
    const applications = await db
      .select({
        id: candidatureTable.id,
        datePostulation: candidatureTable.date_postulation,
      })
      .from(candidatureTable)
      .innerJoin(offreEmploiTable, eq(candidatureTable.id_offre, offreEmploiTable.id))
      .where(
        and(
          eq(candidatureTable.id_candidat, candidateId as string),
          eq(offreEmploiTable.id_entreprise, enterpriseId as string)
        )
      )
      .orderBy(candidatureTable.date_postulation);

    const hasRelationship = applications.length > 0;
    const applicationCount = applications.length;
    const latestApplicationDate = applications.length > 0 
      ? applications[applications.length - 1].datePostulation 
      : undefined;

    const result: ApplicationRelationshipResult = {
      hasRelationship,
      applicationCount,
      latestApplicationDate,
    };

    res.json(result);
  } catch (error) {
    console.error("[Internal Controller] Error checking application relationship:", error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
