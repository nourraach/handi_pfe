# API Gateway Middleware

## JWT Validation Middleware

### Overview

The JWT validation middleware (`jwt-validation.middleware.ts`) is responsible for securing all API requests by validating JWT tokens and injecting authenticated user context into request headers for downstream microservices.

### Features

1. **Header Injection Attack Prevention**: Strips any pre-existing `X-User-*` headers from incoming requests to prevent malicious clients from spoofing user identity
2. **JWT Token Validation**: Extracts and verifies JWT tokens from `Authorization` headers using the shared JWT secret
3. **User Context Extraction**: Parses JWT payload to extract user information (user ID, role, entity ID)
4. **Header Injection**: Injects validated user context into headers for downstream microservices:
   - `X-User-Id`: Unique identifier of the authenticated user
   - `X-User-Role`: Role of the user (ADMIN, CANDIDAT, ENTREPRISE, INSPECTEUR, ANETI)
   - `X-User-Entity-Id`: Entity-specific ID (candidate_id, enterprise_id, admin_id)
   - `X-Request-Id`: Unique request identifier for tracing
5. **Public Route Support**: Skips validation for public routes (`/health`, `/api/auth/*`)
6. **Comprehensive Error Handling**: Returns appropriate 401 errors for missing, invalid, or expired tokens

### Requirements Validation

This middleware validates the following requirements:
- **Requirement 4.1**: JWT token extraction and validation
- **Requirement 4.2**: Invalid/expired token rejection with 401 errors
- **Requirement 4.3**: User context transmission to downstream microservices via headers

### Security Measures

#### 1. Header Injection Prevention

Before processing any request, the middleware strips all `X-User-*` and `X-Request-Id` headers from incoming requests:

```typescript
Object.keys(req.headers).forEach((header) => {
  if (header.toLowerCase().startsWith("x-user-") || header.toLowerCase() === "x-request-id") {
    delete req.headers[header];
  }
});
```

This prevents malicious clients from sending forged headers like:
```
X-User-Id: admin-user-id
X-User-Role: ADMIN
```

#### 2. JWT Token Verification

The middleware verifies JWT tokens using the shared secret:

```typescript
const decoded = jwt.verify(token, jwtSecret) as JwtPayloadUtilisateur;
```

This ensures:
- Token signature is valid (not tampered with)
- Token has not expired
- Token was issued by the auth service

#### 3. Secure Header Injection

After successful validation, the middleware injects trusted headers:

```typescript
req.headers["x-user-id"] = userId;
req.headers["x-user-role"] = userRole;
req.headers["x-user-entity-id"] = userEntityId;
req.headers["x-request-id"] = requestId;
```

These headers are now trusted by downstream microservices because they were set by the gateway after JWT validation.

### Usage

The middleware is automatically applied to all routes in the API Gateway:

```typescript
// server.ts
import { jwtValidationMiddleware } from "./middleware/jwt-validation.middleware";

app.use(jwtValidationMiddleware);
```

### Public Routes

The following routes skip JWT validation:
- `/health` - Health check endpoint
- `/api/auth/*` - Authentication endpoints (login, register, etc.)

### Error Responses

#### Missing Token (401)
```json
{
  "error": "Token d'authentification manquant",
  "code": "AUTH_TOKEN_MISSING",
  "statusCode": 401,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Invalid Token Format (401)
```json
{
  "error": "Format de token invalide. Utilisez 'Bearer <token>'",
  "code": "AUTH_TOKEN_INVALID_FORMAT",
  "statusCode": 401,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Expired Token (401)
```json
{
  "error": "Token expiré",
  "code": "AUTH_TOKEN_EXPIRED",
  "statusCode": 401,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Invalid Token (401)
```json
{
  "error": "Token invalide",
  "code": "AUTH_TOKEN_INVALID",
  "statusCode": 401,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Environment Configuration

The middleware requires the following environment variable:

```env
JWT_SECRET=your_jwt_secret_here
```

**Important**: The `JWT_SECRET` must match the secret used by the auth-service to generate tokens.

### JWT Payload Structure

The middleware expects JWT tokens with the following payload:

```typescript
interface JwtPayloadUtilisateur {
  id_utilisateur: string;      // User ID
  email: string;                // User email
  role: RoleUtilisateur;        // User role
  region?: string;              // Optional region
  candidat?: { id: string };    // Candidate-specific data
  entreprise?: { id: string };  // Enterprise-specific data
  admin?: { id: string };       // Admin-specific data
}
```

### Integration with Microservices

Downstream microservices can trust and use the injected headers:

```typescript
// Example: User Service endpoint
app.get("/api/candidats/profil/:id", (req, res) => {
  // Headers are now available and trusted
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];
  const requestId = req.headers["x-request-id"];
  
  // Use these for authorization decisions
  if (userRole === "ADMIN" || userId === req.params.id) {
    // Allow access
  } else {
    // Deny access
  }
});
```

### Testing

To test the middleware:

1. **Valid Token**: Include a valid JWT token in the Authorization header
   ```bash
   curl -H "Authorization: Bearer <valid_token>" http://localhost:4000/api/candidats/profil/123
   ```

2. **Missing Token**: Omit the Authorization header
   ```bash
   curl http://localhost:4000/api/candidats/profil/123
   # Expected: 401 AUTH_TOKEN_MISSING
   ```

3. **Expired Token**: Use an expired JWT token
   ```bash
   curl -H "Authorization: Bearer <expired_token>" http://localhost:4000/api/candidats/profil/123
   # Expected: 401 AUTH_TOKEN_EXPIRED
   ```

4. **Invalid Token**: Use a malformed or invalid token
   ```bash
   curl -H "Authorization: Bearer invalid_token" http://localhost:4000/api/candidats/profil/123
   # Expected: 401 AUTH_TOKEN_INVALID
   ```

5. **Header Injection Attack**: Try to send forged headers
   ```bash
   curl -H "Authorization: Bearer <valid_token>" \
        -H "X-User-Id: admin-id" \
        -H "X-User-Role: ADMIN" \
        http://localhost:4000/api/candidats/profil/123
   # Expected: Forged headers are stripped, real user context is injected
   ```

### Future Enhancements

1. **Rate Limiting**: Add rate limiting per user/IP to prevent abuse
2. **Token Refresh**: Implement token refresh mechanism for long-lived sessions
3. **Audit Logging**: Log all authentication attempts (see task 1.5)
4. **Role-Based Route Guards**: Add route-specific role checks (see task 1.3)
