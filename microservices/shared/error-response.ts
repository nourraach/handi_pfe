/**
 * Standardized Error Response Format
 * 
 * All services should return errors in this consistent format.
 * 
 * Requirements: 10.1 - All requirements (error handling)
 */

export interface ErrorResponse {
  error: string;           // Human-readable error message (French)
  code: string;            // Machine-readable error code
  statusCode: number;      // HTTP status code
  requestId?: string;      // For tracing (from X-Request-Id header)
  details?: unknown;       // Additional context (not exposed in production)
}

/**
 * Authorization-specific error codes
 */
export enum AuthorizationErrorCode {
  // CV Access
  CV_NO_APPLICATION_RELATIONSHIP = 'AUTHZ_CV_NO_APPLICATION_RELATIONSHIP',
  CV_INSPECTOR_FORBIDDEN = 'AUTHZ_CV_INSPECTOR_FORBIDDEN',
  
  // Contact
  CONTACT_ENTERPRISE_TO_ENTERPRISE = 'AUTHZ_CONTACT_ENTERPRISE_TO_ENTERPRISE',
  CONTACT_INSPECTOR_FORBIDDEN = 'AUTHZ_CONTACT_INSPECTOR_FORBIDDEN',
  
  // Applications
  APP_NOT_OWNER = 'AUTHZ_APP_NOT_OWNER',
  APP_INSPECTOR_FORBIDDEN = 'AUTHZ_APP_INSPECTOR_FORBIDDEN',
  
  // Generic
  INVALID_ROLE = 'AUTHZ_INVALID_ROLE',
  RESOURCE_NOT_FOUND = 'AUTHZ_RESOURCE_NOT_FOUND',
  ADMIN_REQUIRED = 'AUTHZ_ADMIN_REQUIRED',
  ROLE_FORBIDDEN = 'AUTHZ_ROLE_FORBIDDEN',
}

/**
 * Authentication error codes
 */
export enum AuthenticationErrorCode {
  TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  TOKEN_INVALID_FORMAT = 'AUTH_TOKEN_INVALID_FORMAT',
  TOKEN_VALIDATION_ERROR = 'AUTH_TOKEN_VALIDATION_ERROR',
}

/**
 * General error codes
 */
export enum GeneralErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

/**
 * Create a standardized error response
 * 
 * @param statusCode - HTTP status code
 * @param error - Human-readable error message
 * @param code - Machine-readable error code
 * @param requestId - Optional request ID for tracing
 * @param details - Optional additional details (omitted in production)
 * @returns ErrorResponse object
 */
export function createErrorResponse(
  statusCode: number,
  error: string,
  code: string,
  requestId?: string,
  details?: unknown
): ErrorResponse {
  const response: ErrorResponse = {
    error,
    code,
    statusCode,
  };

  if (requestId) {
    response.requestId = requestId;
  }

  // Only include details in non-production environments
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }

  return response;
}

/**
 * HTTP Status Code Constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Create common error responses
 */
export const ErrorResponses = {
  unauthorized: (requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.UNAUTHORIZED,
      "Non autorisé",
      AuthenticationErrorCode.TOKEN_MISSING,
      requestId
    ),

  forbidden: (reason: string, requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      reason,
      AuthorizationErrorCode.ROLE_FORBIDDEN,
      requestId
    ),

  notFound: (resource: string, requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.NOT_FOUND,
      `${resource} non trouvé`,
      GeneralErrorCode.RESOURCE_NOT_FOUND,
      requestId
    ),

  internalError: (requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Erreur interne du serveur",
      GeneralErrorCode.INTERNAL_ERROR,
      requestId
    ),

  rateLimit: (requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      "Trop de requêtes",
      GeneralErrorCode.RATE_LIMIT_EXCEEDED,
      requestId
    ),

  cvNoRelationship: (requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      "Accès refusé : aucune candidature trouvée",
      AuthorizationErrorCode.CV_NO_APPLICATION_RELATIONSHIP,
      requestId
    ),

  enterpriseToEnterprise: (requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      "Contact entre entreprises non autorisé",
      AuthorizationErrorCode.CONTACT_ENTERPRISE_TO_ENTERPRISE,
      requestId
    ),

  inspectorForbidden: (resource: string, requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      `Les inspecteurs ne peuvent pas accéder à ${resource}`,
      AuthorizationErrorCode.CV_INSPECTOR_FORBIDDEN,
      requestId
    ),

  adminRequired: (requestId?: string) => 
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      "Accès réservé aux administrateurs",
      AuthorizationErrorCode.ADMIN_REQUIRED,
      requestId
    ),
};
