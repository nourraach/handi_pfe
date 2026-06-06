import { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Audit Log Controller
 * 
 * Provides API for querying audit logs.
 * Only accessible to ADMIN users.
 * 
 * Requirements: 6.4
 */

interface AuditLogQueryParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
  actionType?: string;
  authorizationResult?: "ALLOWED" | "DENIED";
  page?: number;
  pageSize?: number;
}

/**
 * Query audit logs with filtering and pagination
 * 
 * GET /api/audit-logs?userId=xxx&startDate=2024-01-01&endDate=2024-12-31&actionType=CV_ACCESS&authorizationResult=DENIED&page=1&pageSize=50
 * 
 * @param req - Express request with query parameters
 * @param res - Express response with paginated audit log entries
 */
export async function queryAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    // Check if user is admin (set by API Gateway)
    const userRole = req.headers["x-user-role"];
    
    if (userRole !== "ADMIN") {
      res.status(403).json({
        error: "Accès réservé aux administrateurs",
        code: "AUTHZ_ADMIN_REQUIRED",
      });
      return;
    }

    const {
      userId,
      startDate,
      endDate,
      actionType,
      authorizationResult,
      page = 1,
      pageSize = 50,
    } = req.query as unknown as AuditLogQueryParams;

    // Build WHERE clause dynamically based on filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(new Date(endDate));
      paramIndex++;
    }

    if (actionType) {
      conditions.push(`action_type = $${paramIndex}`);
      params.push(actionType);
      paramIndex++;
    }

    if (authorizationResult) {
      conditions.push(`authorization_result = $${paramIndex}`);
      params.push(authorizationResult);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Calculate offset for pagination
    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    // Query total count - build parameterized query
    const countParts = ['SELECT COUNT(*) as total FROM audit_logs'];
    if (conditions.length > 0) {
      countParts.push(`WHERE ${conditions.join(" AND ")}`);
    }
    const countQuery = countParts.join(' ');
    
    const countResult = await db.execute(sql.raw(countQuery));
    const total = Number(countResult.rows[0]?.total || 0);

    // Query audit logs with pagination
    const dataParts = [
      `SELECT 
        id,
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
      FROM audit_logs`
    ];
    if (conditions.length > 0) {
      dataParts.push(`WHERE ${conditions.join(" AND ")}`);
    }
    dataParts.push(`ORDER BY timestamp DESC LIMIT ${pageSizeNum} OFFSET ${offset}`);
    const dataQuery = dataParts.join(' ');

    const dataResult = await db.execute(sql.raw(dataQuery));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pageSizeNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    res.json({
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        userId,
        startDate,
        endDate,
        actionType,
        authorizationResult,
      },
    });
  } catch (error) {
    console.error("[Audit Log Controller] Error querying audit logs:", error);
    res.status(500).json({
      error: "Erreur lors de la requête des logs d'audit",
      code: "INTERNAL_ERROR",
    });
  }
}
