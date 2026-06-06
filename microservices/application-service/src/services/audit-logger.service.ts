import { pool } from "../db";

/**
 * Audit Logger Service for Application Service
 * 
 * Requirements: 6.3
 */

export interface AuditLogEntry {
  requestId?: string;
  userId: string;
  userRole: string;
  userEmail?: string;
  serviceName: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  authorizationResult: "ALLOWED" | "DENIED";
  denialReason?: string;
  httpMethod?: string;
  httpPath?: string;
  ipAddress?: string;
  userAgent?: string;
  additionalContext?: Record<string, any>;
}

export async function logAuthorizationAttempt(auditLog: AuditLogEntry): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_logs (
        timestamp,
        request_id,
        user_id,
        user_role,
        user_email,
        service_name,
        action_type,
        resource_type,
        resource_id,
        authorization_result,
        denial_reason,
        http_method,
        http_path,
        ip_address,
        user_agent,
        additional_context
      ) VALUES (
        NOW(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
    `;

    const values = [
      auditLog.requestId || null,
      auditLog.userId,
      auditLog.userRole,
      auditLog.userEmail || null,
      auditLog.serviceName,
      auditLog.actionType,
      auditLog.resourceType || null,
      auditLog.resourceId || null,
      auditLog.authorizationResult,
      auditLog.denialReason || null,
      auditLog.httpMethod || null,
      auditLog.httpPath || null,
      auditLog.ipAddress || null,
      auditLog.userAgent || null,
      auditLog.additionalContext ? JSON.stringify(auditLog.additionalContext) : null,
    ];

    await pool.query(query, values);

    console.log(`[Audit Log] ${auditLog.authorizationResult} - ${auditLog.actionType} by ${auditLog.userRole} (${auditLog.userId})`);
  } catch (error) {
    console.error("[Audit Logger] Failed to write audit log to database:", error);
    console.error("[Audit Logger] Audit log entry:", JSON.stringify(auditLog, null, 2));
  }
}
