import axios from "axios";

/**
 * CV Access Authorization Service
 * 
 * Implements authorization logic for CV access according to design rules:
 * - Admin users: always allow
 * - Candidate accessing own CV: always allow
 * - Inspector users: always deny
 * - Enterprise users: allow only if application relationship exists
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.5
 */

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiresApplication?: boolean;
}

interface ApplicationRelationshipResult {
  hasRelationship: boolean;
  applicationCount: number;
  latestApplicationDate?: Date;
}

const APPLICATION_SERVICE_URL = process.env.APPLICATION_SERVICE_URL || "http://application-service:4104";

/**
 * Check if a user can access a candidate's CV
 * 
 * @param requesterId - ID of the user requesting access
 * @param requesterRole - Role of the requester (ADMIN, CANDIDAT, ENTREPRISE, INSPECTEUR)
 * @param candidateId - ID of the candidate whose CV is being accessed
 * @returns Authorization decision with reason
 */
export async function canAccessCv(
  requesterId: string,
  requesterRole: string,
  candidateId: string
): Promise<AuthorizationResult> {
  // Rule 1: Admin users always have access
  if (requesterRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Admin users have full access",
    };
  }

  // Rule 2: Candidate accessing own CV always allowed
  if (requesterRole === "CANDIDAT" && requesterId === candidateId) {
    return {
      allowed: true,
      reason: "Self-access allowed",
    };
  }

  // Rule 3: Inspector users always denied
  if (requesterRole === "INSPECTEUR") {
    return {
      allowed: false,
      reason: "Inspectors cannot access candidate CVs",
    };
  }

  // Rule 4: Enterprise users - check application relationship
  if (requesterRole === "ENTREPRISE") {
    try {
      // Query Application Service with retry logic and exponential backoff
      const response = await retryWithExponentialBackoff(
        () => axios.get<ApplicationRelationshipResult>(
          `${APPLICATION_SERVICE_URL}/internal/applications/check-relationship`,
          {
            params: {
              candidateId,
              enterpriseId: requesterId,
            },
            timeout: 2000, // 2 second timeout per attempt
          }
        ),
        3, // max 3 retries
        100 // initial delay 100ms
      );

      if (response.data.hasRelationship) {
        return {
          allowed: true,
          reason: "Enterprise has application relationship with candidate",
          requiresApplication: true,
        };
      } else {
        return {
          allowed: false,
          reason: "No application relationship exists between enterprise and candidate",
          requiresApplication: true,
        };
      }
    } catch (error) {
      // Fail secure: if we can't verify the relationship, deny access
      console.error("[CV Authorization] Failed to check application relationship after retries:", error);
      
      return {
        allowed: false,
        reason: "Unable to verify application relationship (service unavailable)",
        requiresApplication: true,
      };
    }
  }

  // Rule 5: All other cases denied
  return {
    allowed: false,
    reason: `Role ${requesterRole} is not authorized to access CVs`,
  };
}
