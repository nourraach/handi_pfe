import { NextFunction, Request, Response } from "express";
import { RoleUtilisateur } from "../types/enums";

/**
 * Role-Based Route Guard Middleware
 * 
 * This middleware enforces role-based access control for specific route patterns.
 * It blocks requests from users whose roles are not allowed to access certain routes.
 * 
 * Key Rules:
 * - Inspectors cannot access /api/chat routes (messaging is for candidates/enterprises only)
 * - Only Inspectors and Admins can access /api/supervision routes
 * 
 * Requirements: 3.7, 4.4
 */

interface RouteGuard {
  pattern: RegExp;
  allowedRoles: RoleUtilisateur[];
  denyMessage: string;
}

/**
 * Route guard configuration
 * Each guard specifies a route pattern, which roles are allowed, and a denial message
 */
const ROUTE_GUARDS: RouteGuard[] = [
  {
    pattern: /^\/api\/supervision/,
    allowedRoles: [RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ADMIN],
    denyMessage: "Accès réservé aux inspecteurs et administrateurs",
  },
  {
    pattern: /^\/api\/chat/,
    allowedRoles: [RoleUtilisateur.CANDIDAT, RoleUtilisateur.ENTREPRISE, RoleUtilisateur.ADMIN],
    denyMessage: "Les inspecteurs ne peuvent pas accéder aux messageries",
  },
];

/**
 * Role guard middleware function
 * Checks if the user's role is allowed to access the requested route
 */
export const roleGuardMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip role checks for public routes
  const publicRoutes = ["/health", "/api/auth"];
  if (publicRoutes.some((route) => req.path.startsWith(route))) {
    return next();
  }

  // Get user role from request (set by JWT validation middleware)
  const userRole = req.userRole;
  const userId = req.userId;
  const requestId = req.requestId;

  // If role is not set, it means JWT validation failed or was skipped
  // Let the request proceed - JWT middleware will handle authentication failures
  if (!userRole) {
    return next();
  }

  // Check each route guard
  for (const guard of ROUTE_GUARDS) {
    if (guard.pattern.test(req.path)) {
      // Route matches this guard pattern - check if role is allowed
      if (!guard.allowedRoles.includes(userRole)) {
        // Role is not allowed - return 403 Forbidden
        console.log(
          `[Role Guard] Access denied - User: ${userId}, Role: ${userRole}, Path: ${req.path}`,
        );

        res.status(403).json({
          error: guard.denyMessage,
          code: "AUTHZ_ROLE_FORBIDDEN",
          statusCode: 403,
          requestId,
          details: {
            userRole,
            path: req.path,
            allowedRoles: guard.allowedRoles,
          },
        });
        return;
      }
      // Role is allowed - continue to next guard or next middleware
    }
  }

  // All guards passed (or no guards matched) - continue
  next();
};
