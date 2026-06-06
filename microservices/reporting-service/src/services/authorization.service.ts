/**
 * Reporting Authorization Service
 * 
 * Implements role-based access control for reporting endpoints:
 * - Inspector: allow access to enterprise lists, job offers, aggregated statistics
 * - Inspector: deny access to candidate profiles, CVs, messages, individual applications
 * - Admin: allow access to everything
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

export type ResourceType = 
  | "ENTERPRISE_LIST"
  | "JOB_OFFERS"
  | "AGGREGATED_STATS"
  | "RECRUITED_CANDIDATES"
  | "CANDIDATE_PROFILE"
  | "CANDIDATE_CV"
  | "MESSAGES"
  | "INDIVIDUAL_APPLICATIONS";

/**
 * Check if user can access a specific resource type in reporting service
 * 
 * @param userRole - Role of the user (ADMIN, INSPECTEUR, etc.)
 * @param resourceType - Type of resource being accessed
 * @returns Authorization decision with reason
 */
export function canAccessReportingResource(
  userRole: string,
  resourceType: ResourceType
): AuthorizationResult {
  // Rule 1: Admin users have full access to everything
  if (userRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Admin users have full access",
    };
  }

  // Rule 2: Inspector access based on resource type
  if (userRole === "INSPECTEUR") {
    const inspectorAllowedResources: ResourceType[] = [
      "ENTERPRISE_LIST",
      "JOB_OFFERS",
      "AGGREGATED_STATS",
      "RECRUITED_CANDIDATES",
    ];

    if (inspectorAllowedResources.includes(resourceType)) {
      return {
        allowed: true,
        reason: "Inspector can access aggregated and enterprise data",
      };
    } else {
      return {
        allowed: false,
        reason: `Inspectors cannot access ${resourceType}`,
      };
    }
  }

  // Default: deny for all other roles
  return {
    allowed: false,
    reason: `Role ${userRole} is not authorized to access reporting resources`,
  };
}
