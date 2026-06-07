import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { JwtPayloadUtilisateur } from "../types/jwt.types";
import { RoleUtilisateur } from "../types/enums";

/**
 * JWT Validation Middleware
 * 
 * This middleware is responsible for:
 * 1. Stripping any pre-existing X-User-* headers from incoming requests (security)
 * 2. Extracting JWT tokens from Authorization headers
 * 3. Validating and verifying JWT tokens
 * 4. Parsing JWT payload to extract user context
 * 5. Injecting validated user context into request headers for downstream services
 * 6. Returning 401 errors for missing, invalid, or expired tokens
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

// Extend Express Request type to include our custom headers
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: RoleUtilisateur;
      userEntityId?: string;
      requestId?: string;
    }
  }
}

export const jwtValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Strip any pre-existing X-User-* headers from incoming requests to prevent header injection attacks
  // This is a critical security measure - clients should never be able to set these headers directly
  Object.keys(req.headers).forEach((header) => {
    if (header.toLowerCase().startsWith("x-user-") || header.toLowerCase() === "x-request-id") {
      delete req.headers[header];
    }
  });

  // Generate unique request ID for tracing
  const requestId = randomUUID();
  req.requestId = requestId;

  // Skip JWT validation for public routes (health check, auth endpoints, and public job listings)
  const publicRoutes = ["/health", "/api/auth", "/api/offres/publiques"];
  if (publicRoutes.some((route) => req.path.startsWith(route))) {
    // Even for public routes, set the request ID header
    req.headers["x-request-id"] = requestId;
    return next();
  }

  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: "Token d'authentification manquant",
      code: "AUTH_TOKEN_MISSING",
      statusCode: 401,
      requestId,
    });
    return;
  }

  // Authorization header should be in format "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      error: "Format de token invalide. Utilisez 'Bearer <token>'",
      code: "AUTH_TOKEN_INVALID_FORMAT",
      statusCode: 401,
      requestId,
    });
    return;
  }

  const token = parts[1];

  try {
    // Get JWT secret from environment variable
    const jwtSecret = process.env.JWT_SECRET || "votre_secret_jwt";

    // Verify and decode JWT token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayloadUtilisateur;

    // Extract user context from JWT payload
    const userId = decoded.id_utilisateur;
    const userRole = decoded.role;

    // Determine entity ID based on role
    let userEntityId: string | undefined;
    if (decoded.candidat?.id) {
      userEntityId = decoded.candidat.id;
    } else if (decoded.entreprise?.id) {
      userEntityId = decoded.entreprise.id;
    } else if (decoded.admin?.id) {
      userEntityId = decoded.admin.id;
    }

    // Store user context in request object (for middleware chaining)
    req.userId = userId;
    req.userRole = userRole;
    req.userEntityId = userEntityId;

    // Inject validated user context into request headers for downstream services
    // These headers will be trusted by microservices because they are set by the gateway after JWT validation
    req.headers["x-user-id"] = userId;
    req.headers["x-user-role"] = userRole;
    if (userEntityId) {
      req.headers["x-user-entity-id"] = userEntityId;
    }
    req.headers["x-request-id"] = requestId;

    // Continue to next middleware
    next();
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "Token expiré",
        code: "AUTH_TOKEN_EXPIRED",
        statusCode: 401,
        requestId,
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: "Token invalide",
        code: "AUTH_TOKEN_INVALID",
        statusCode: 401,
        requestId,
      });
      return;
    }

    // Unexpected error during JWT validation
    console.error("[JWT Validation Error]", error);
    res.status(401).json({
      error: "Erreur lors de la validation du token",
      code: "AUTH_TOKEN_VALIDATION_ERROR",
      statusCode: 401,
      requestId,
    });
    return;
  }
};
