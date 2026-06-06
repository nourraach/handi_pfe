import { db } from "../db";
import { offreEmploiTable } from "../db/schema/offre-emploi.schema";
import { eq } from "drizzle-orm";

/**
 * Application Access Authorization Service
 * 
 * Implements authorization logic for accessing job applications according to design rules:
 * - Admin users: always allow
 * - Inspector users: always deny
 * - Candidate users: filter to show only own applications
 * - Enterprise users: verify enterprise owns the job offer
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  filterByCandidateId?: string; // Used for candidates to filter to their own applications
}

/**
 * Check if user can access applications for a job offer
 * 
 * @param userId - ID of the user requesting access
 * @param userRole - Role of the user (ADMIN, CANDIDAT, ENTREPRISE, INSPECTEUR)
 * @param jobOfferId - ID of the job offer whose applications are being accessed
 * @returns Authorization decision with reason
 */
export async function canAccessApplications(
  userId: string,
  userRole: string,
  jobOfferId: string
): Promise<AuthorizationResult> {
  // Rule 1: Admin users always have access
  if (userRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Admin users have full access",
    };
  }

  // Rule 2: Inspector users always denied
  if (userRole === "INSPECTEUR") {
    return {
      allowed: false,
      reason: "Inspectors use reporting service for aggregated statistics",
    };
  }

  // Rule 3: Candidate users - allow but must filter to own applications
  if (userRole === "CANDIDAT") {
    return {
      allowed: true,
      reason: "Candidate can access own applications",
      filterByCandidateId: userId,
    };
  }

  // Rule 4: Enterprise users - verify enterprise owns the job offer
  if (userRole === "ENTREPRISE") {
    try {
      // Query database to check if the enterprise owns this job offer
      const jobOffer = await db
        .select({ id_entreprise: offreEmploiTable.id_entreprise })
        .from(offreEmploiTable)
        .where(eq(offreEmploiTable.id, jobOfferId))
        .limit(1);

      if (jobOffer.length === 0) {
        return {
          allowed: false,
          reason: "Job offer not found",
        };
      }

      if (jobOffer[0].id_entreprise === userId) {
        return {
          allowed: true,
          reason: "Enterprise owns the job offer",
        };
      } else {
        return {
          allowed: false,
          reason: "Enterprise does not own this job offer",
        };
      }
    } catch (error) {
      console.error("[Application Authorization] Failed to check job offer ownership:", error);
      return {
        allowed: false,
        reason: "Unable to verify job offer ownership",
      };
    }
  }

  // Default: deny (safety fallback)
  return {
    allowed: false,
    reason: `Role ${userRole} is not authorized to access applications`,
  };
}
