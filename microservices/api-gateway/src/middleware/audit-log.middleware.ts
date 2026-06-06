import { NextFunction, Request, Response } from "express";
import { logAuthorizationAttempt } from "../services/audit-logger.service";

/**
 * Gateway Audit Logging Middleware
 * 
 * This middleware intercepts responses to log all denied access attempts
 * at the API Gateway level (JWT validation failures and role guard denials).
 * 
 * Requirements: 4.5
 */

export const auditLogMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Store original res.json to intercept error responses
  const originalJson = res.json.bind(res);

  // Override res.json to capture error responses for audit logging
  res.json = function (body: any): Response {
    // Check if this is an authorization/authentication error (401 or 403)
    if (res.statusCode === 401 || res.statusCode === 403) {
      // Extract IP address
      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || 
                       req.socket.remoteAddress || 
                       "unknown";

      // Extract user agent
      const userAgent = req.headers["user-agent"] || "unknown";

      // Determine denial reason based on error code and status
      let denialReason = "UNKNOWN";
      let actionType = "GATEWAY_VALIDATION";

      if (res.statusCode === 401) {
        // Authentication failures
        denialReason = "INVALID_TOKEN";
        if (body?.code === "AUTH_TOKEN_MISSING") {
          denialReason = "MISSING_TOKEN";
        } else if (body?.code === "AUTH_TOKEN_EXPIRED") {
          denialReason = "EXPIRED_TOKEN";
        } else if (body?.code === "AUTH_TOKEN_INVALID") {
          denialReason = "INVALID_TOKEN";
        }
      } else if (res.statusCode === 403) {
        // Authorization failures (role guard)
        denialReason = "ROLE_FORBIDDEN";
        actionType = "ROLE_GUARD";
      }

      // Log the denied access attempt asynchronously
      // Use "SYSTEM" as userId for authentication failures where user is unknown
      const userId = req.userId || "SYSTEM";
      const userRole = req.userRole || "UNKNOWN";

      logAuthorizationAttempt({
        requestId: req.requestId,
        userId,
        userRole,
        serviceName: "api-gateway",
        actionType,
        authorizationResult: "DENIED",
        denialReason,
        httpMethod: req.method,
        httpPath: req.path,
        ipAddress,
        userAgent,
        additionalContext: {
          errorCode: body?.code,
          errorMessage: body?.error,
          statusCode: res.statusCode,
        },
      }).catch((error) => {
        // Error already logged in logAuthorizationAttempt
        // Just ensure it doesn't crash the application
        console.error("[Audit Log Middleware] Failed to log authorization attempt:", error);
      });
    }

    // Call original res.json with the body
    return originalJson(body);
  };

  next();
};
