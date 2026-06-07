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
  const normalizedSenderRole = senderRole.toLowerCase();
  const normalizedRecipientRole = recipientRole.toLowerCase();

  // Rule 1: Enterprise cannot contact another Enterprise
  if (normalizedSenderRole === "entreprise" && normalizedRecipientRole === "entreprise") {
    return {
      allowed: false,
      reason: "Une entreprise ne peut pas contacter une autre entreprise.",
    };
  }

  // Rule 2: Inspector cannot contact anyone
  if (normalizedSenderRole === "inspecteur") {
    return {
      allowed: false,
      reason: "Inspectors use read-only reporting interface",
    };
  }

  // Rule 3: Admin can contact anyone
  if (normalizedSenderRole === "admin") {
    return {
      allowed: true,
      reason: "Admin can communicate with anyone",
    };
  }

  // Rule 4: Candidate can contact anyone
  if (normalizedSenderRole === "candidat") {
    return {
      allowed: true,
      reason: "Candidate can communicate freely",
    };
  }

  // Rule 5: Enterprise can contact Candidate
  if (normalizedSenderRole === "entreprise" && normalizedRecipientRole === "candidat") {
    return {
      allowed: true,
      reason: "Recruitment communication allowed",
    };
  }

  // Rule 6: Enterprise can contact Admin
  if (normalizedSenderRole === "entreprise" && normalizedRecipientRole === "admin") {
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
