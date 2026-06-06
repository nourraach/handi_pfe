/**
 * Contact Authorization Service
 * 
 * Implements authorization logic for contact initiation according to design rules:
 * - Enterprise-to-Enterprise: deny (business-to-business contact forbidden)
 * - Enterprise-to-Candidate: allow (recruitment communication)
 * - Enterprise-to-Admin: allow (support communication)
 * - Candidate-to-any: allow (job inquiry, peer communication, support)
 * - Admin-to-any: allow (admin can communicate with anyone)
 * - Inspector-to-any: deny (inspectors use read-only reporting interface)
 * 
 * Requirements: 1.1, 1.2, 1.5, 1.6
 */

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if sender can initiate contact with recipient
 * 
 * @param senderId - ID of the user initiating contact
 * @param senderRole - Role of the sender (ADMIN, CANDIDAT, ENTREPRISE, INSPECTEUR)
 * @param recipientId - ID of the recipient
 * @param recipientRole - Role of the recipient
 * @returns Authorization decision with reason
 */
export function canInitiateContact(
  senderId: string,
  senderRole: string,
  recipientId: string,
  recipientRole: string
): AuthorizationResult {
  // Rule 1: Enterprise cannot contact another Enterprise
  if (senderRole === "ENTREPRISE" && recipientRole === "ENTREPRISE") {
    return {
      allowed: false,
      reason: "Business-to-business contact forbidden",
    };
  }

  // Rule 2: Inspector cannot contact anyone
  if (senderRole === "INSPECTEUR") {
    return {
      allowed: false,
      reason: "Inspectors use read-only reporting interface",
    };
  }

  // Rule 3: Admin can contact anyone
  if (senderRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Admin can communicate with anyone",
    };
  }

  // Rule 4: Candidate can contact anyone
  if (senderRole === "CANDIDAT") {
    return {
      allowed: true,
      reason: "Candidate can communicate freely",
    };
  }

  // Rule 5: Enterprise can contact Candidate
  if (senderRole === "ENTREPRISE" && recipientRole === "CANDIDAT") {
    return {
      allowed: true,
      reason: "Recruitment communication allowed",
    };
  }

  // Rule 6: Enterprise can contact Admin
  if (senderRole === "ENTREPRISE" && recipientRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Support communication allowed",
    };
  }

  // Default: deny (safety fallback)
  return {
    allowed: false,
    reason: `Contact from ${senderRole} to ${recipientRole} not explicitly allowed`,
  };
}
