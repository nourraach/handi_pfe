# Implementation Plan: Access Control Validation Rules

## Overview

This implementation plan establishes a comprehensive access control validation system for the HandiTalents platform using a defense-in-depth approach. The system implements validation at three layers: API Gateway (preliminary checks with JWT validation and role-based route guards), individual microservices (authoritative domain-specific authorization), and audit logging (monitoring and compliance). The implementation uses TypeScript for all components and follows a microservices architecture with clear separation of concerns.

Key implementation priorities:
1. Establish secure token validation and context propagation at the gateway
2. Implement service-level authorization logic for CV access, contact initiation, and application access
3. Create inter-service communication for authorization queries
4. Build comprehensive audit logging infrastructure
5. Develop property-based tests to validate universal authorization rules

## Tasks

- [x] 1. Set up API Gateway authentication and authorization infrastructure
  - [x] 1.1 Implement JWT validation middleware
    - Create `microservices/api-gateway/src/middleware/jwt-validation.middleware.ts`
    - Extract and verify JWT tokens from Authorization headers
    - Parse JWT payload to extract user context (id_utilisateur, role, entity IDs)
    - Inject validated user context into request headers (X-User-Id, X-User-Role, X-User-Entity-Id, X-Request-Id)
    - Strip any pre-existing X-User-* headers from incoming requests to prevent header injection attacks
    - Return 401 errors for missing, invalid, or expired tokens
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 1.2 Write property test for JWT validation middleware
    - **Property 5: JWT Validation Correctness**
    - **Validates: Requirements 4.1, 4.2**
    - Generate random JWT tokens (valid, expired, malformed, invalid signature)
    - Verify correct accept/reject behavior for each token type
  
  - [x] 1.3 Implement role-based route guard middleware
    - Create `microservices/api-gateway/src/middleware/role-guard.middleware.ts`
    - Define ROUTE_GUARDS configuration with patterns and allowed roles
    - Block inspector access to /api/chat routes
    - Block non-inspector access to /api/supervision routes
    - Return 403 errors with descriptive messages for role violations
    - _Requirements: 3.7, 4.4_
  
  - [ ]* 1.4 Write property test for route guard enforcement
    - **Property 6: Route Guard Enforcement**
    - **Validates: Requirements 4.4**
    - Generate random route paths and user roles
    - Verify correct allow/deny based on route guard configuration
  
  - [x] 1.5 Implement gateway audit logging middleware
    - Create `microservices/api-gateway/src/middleware/audit-log.middleware.ts`
    - Log all denied access attempts with complete context
    - Include timestamp, requestId, userId, userRole, path, method, denialReason, ipAddress
    - Write logs to audit_logs table
    - _Requirements: 4.5_
  
  - [ ]* 1.6 Write unit tests for audit logging middleware
    - Test log creation for token validation failures
    - Test log creation for role guard denials
    - Verify all required fields are present in log entries

- [x] 2. Checkpoint - Verify gateway middleware stack
  - Ensure JWT validation, role guards, and audit logging work together correctly
  - Test with valid and invalid tokens, various roles, and protected routes
  - Ask the user if questions arise

- [x] 3. Implement User Service CV access authorization
  - [x] 3.1 Create CV access authorization service
    - Create `microservices/user-service/src/services/cv-authorization.service.ts`
    - Implement `canAccessCv(requesterId, requesterRole, candidateId)` method
    - Admin users: always allow
    - Candidate accessing own CV: always allow
    - Inspector users: always deny
    - Enterprise users: query Application Service for relationship check
    - Return AuthorizationResult with allowed flag and reason
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.5_
  
  - [x] 3.2 Create internal Application Service endpoint for relationship checks
    - Create `microservices/application-service/src/controllers/internal.controller.ts`
    - Implement `GET /internal/applications/check-relationship` endpoint
    - Accept candidateId and enterpriseId query parameters
    - Query database for any applications between candidate and enterprise
    - Return ApplicationRelationshipResult with hasRelationship and applicationCount
    - Listen on separate internal port (not exposed through gateway)
    - _Requirements: 2.3_
  
  - [x] 3.3 Integrate CV authorization into User Service CV endpoints
    - Update CV retrieval endpoints to call cv-authorization.service
    - Parse X-User-Id and X-User-Role headers from gateway
    - Return 403 error when authorization fails
    - Log authorization attempts (success and failure) to audit_logs
    - _Requirements: 2.1, 2.2, 6.1_
  
  - [ ]* 3.4 Write property test for CV access authorization rules
    - **Property 2: CV Access Authorization Rules**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.5**
    - Generate random combinations of requester role, candidate ID, and application relationship status
    - Verify authorization decisions match design rules for all combinations
  
  - [ ]* 3.5 Write unit tests for CV authorization edge cases
    - Test Application Service unavailable scenario (should fail secure and deny access)
    - Test timeout handling with retry logic
    - Test self-access by candidate
    - Test admin access without relationship check

- [x] 4. Implement Communication Service contact authorization
  - [x] 4.1 Create contact authorization service
    - Create `microservices/communication-service/src/services/contact-authorization.service.ts`
    - Implement `canInitiateContact(senderId, senderRole, recipientId, recipientRole)` method
    - Enterprise-to-Enterprise: deny
    - Inspector-to-any: deny
    - Admin-to-any: allow
    - Candidate-to-any: allow
    - Enterprise-to-Candidate: allow
    - Enterprise-to-Admin: allow
    - Return AuthorizationResult with allowed flag and reason
    - _Requirements: 1.1, 1.2, 1.5, 1.6_
  
  - [x] 4.2 Implement enterprise recipient filtering
    - Create recipient search filter in `microservices/communication-service/src/services/user-search.service.ts`
    - When enterprise searches for recipients, exclude all users with ENTREPRISE role
    - Retain all other roles (CANDIDAT, ADMIN, INSPECTEUR) in search results
    - _Requirements: 1.4_
  
  - [x] 4.3 Integrate contact authorization into Communication Service endpoints
    - Update contact initiation endpoints to call contact-authorization.service
    - Parse X-User-Id and X-User-Role headers from gateway
    - Return 403 error when authorization fails
    - Log authorization attempts (success and failure) to audit_logs
    - _Requirements: 1.1, 1.2, 6.2_
  
  - [ ]* 4.4 Write property test for contact authorization rules
    - **Property 1: Contact Authorization Rules**
    - **Validates: Requirements 1.1, 1.2, 1.5, 1.6**
    - Generate random combinations of sender role and recipient role
    - Verify authorization decisions match design rules for all role combinations
  
  - [ ]* 4.5 Write property test for enterprise recipient filtering
    - **Property 3: Enterprise Recipient Filtering**
    - **Validates: Requirements 1.4**
    - Generate random user lists with mixed roles
    - Verify enterprise users are excluded when requester is ENTREPRISE
  
  - [ ]* 4.6 Write unit tests for contact authorization edge cases
    - Test contact between same user (sender = recipient)
    - Test admin contacting inspector
    - Test candidate contacting candidate

- [x] 5. Checkpoint - Verify CV and contact authorization
  - Ensure User Service and Communication Service authorization logic works correctly
  - Test inter-service communication between User Service and Application Service
  - Verify audit logs are created for all authorization attempts
  - Ask the user if questions arise

- [x] 6. Implement Application Service authorization
  - [x] 6.1 Create application access authorization service
    - Create `microservices/application-service/src/services/authorization.service.ts`
    - Implement `canAccessApplications(userId, userRole, jobOfferId)` method
    - Admin users: always allow
    - Inspector users: always deny
    - Candidate users: filter to show only own applications
    - Enterprise users: verify enterprise owns the job offer by querying database
    - Return AuthorizationResult with allowed flag and reason
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 6.2 Integrate application authorization into Application Service endpoints
    - Update application listing endpoints to call authorization.service
    - Parse X-User-Id and X-User-Role headers from gateway
    - Return 403 error when authorization fails
    - Filter candidate results to show only own applications when role is CANDIDAT
    - Log authorization attempts (success and failure) to audit_logs
    - _Requirements: 5.1, 5.2, 5.5, 6.3_
  
  - [ ]* 6.3 Write property test for application access authorization rules
    - **Property 7: Application Access Authorization Rules**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
    - Generate random combinations of user role, user ID, and job offer ownership
    - Verify authorization decisions match design rules for all combinations
  
  - [ ]* 6.4 Write unit tests for application authorization edge cases
    - Test enterprise accessing own job applications
    - Test enterprise accessing another enterprise's job applications
    - Test candidate accessing own applications
    - Test inspector attempting to access applications

- [x] 7. Implement Reporting Service inspector authorization and data sanitization
  - [x] 7.1 Create reporting authorization service
    - Create `microservices/reporting-service/src/services/authorization.service.ts`
    - Implement role-based access control for reporting endpoints
    - Inspector: allow access to enterprise lists, job offers, aggregated statistics
    - Inspector: deny access to candidate profiles, CVs, messages, individual applications
    - Define allowed resource types per role
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 7.2 Implement inspector data sanitization for recruited candidates
    - Create data transformation layer in `microservices/reporting-service/src/services/data-sanitization.service.ts`
    - When returning recruited candidate lists to inspectors, strip CV data and sensitive personal information
    - Return only: id, firstName, jobTitle, recruitmentDate, enterpriseId
    - Exclude: CV, full profile, contact info
    - _Requirements: 3.4_
  
  - [x] 7.3 Integrate reporting authorization into Reporting Service endpoints
    - Update reporting endpoints to call authorization.service
    - Parse X-User-Id and X-User-Role headers from gateway
    - Apply data sanitization for inspector requests
    - Return 403 error when authorization fails
    - Log authorization attempts (success and failure) to audit_logs
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 6.6_
  
  - [ ]* 7.4 Write property test for inspector data sanitization
    - **Property 4: Inspector Data Sanitization**
    - **Validates: Requirements 3.4**
    - Generate random recruited candidate records with full data
    - Verify sanitization removes CV fields and sensitive data while retaining allowed fields
  
  - [ ]* 7.5 Write unit tests for reporting authorization
    - Test inspector accessing enterprise list (should allow)
    - Test inspector accessing job offers with view counts (should allow)
    - Test inspector accessing candidate CV (should deny)
    - Test inspector accessing aggregated application statistics (should allow)

- [x] 8. Create shared audit logging infrastructure
  - [x] 8.1 Create audit log database schema
    - Create migration for `audit_logs` table in shared database
    - Define columns: id, timestamp, request_id, user_id, user_role, user_email, service_name, action_type, resource_type, resource_id, authorization_result, denial_reason, http_method, http_path, ip_address, user_agent, additional_context (JSONB)
    - Create indexes on timestamp, user_id, action_type, authorization_result
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 8.2 Create shared audit logging utility
    - Create `shared/audit-logger/src/audit-logger.service.ts` (if shared library exists) or duplicate in each service
    - Implement `logAuthorizationAttempt(auditLog: AuditLogEntry)` method
    - Write to audit_logs table with all required fields
    - Handle database connection errors gracefully (log to console if DB unavailable)
    - _Requirements: 6.1, 6.2, 6.3, 6.6_
  
  - [x] 8.3 Create audit log query API in Reporting Service
    - Create `GET /api/audit-logs` endpoint in Reporting Service
    - Accept filters: userId, dateRange, actionType, authorizationResult
    - Require ADMIN role for access
    - Return paginated audit log entries
    - _Requirements: 6.4_
  
  - [ ]* 8.4 Write property test for service-level audit logging completeness
    - **Property 9: Service-Level Audit Logging Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.6**
    - Generate random authorization attempts across different services
    - Verify audit log entries are created with all required fields
  
  - [ ]* 8.5 Write property test for gateway access denial logging
    - **Property 8: Gateway Access Denial Logging**
    - **Validates: Requirements 4.5**
    - Generate random denied requests at gateway (invalid tokens, role restrictions)
    - Verify audit log entries contain all required fields
  
  - [ ]* 8.6 Write property test for audit log query filtering
    - **Property 10: Audit Log Query Filtering**
    - **Validates: Requirements 6.4**
    - Generate random audit log entries and filter criteria
    - Verify query results match ALL specified filter criteria
  
  - [ ]* 8.7 Write unit tests for audit log retention
    - Test that audit logs are retained for minimum 12 months
    - Test query API with date range filters
    - _Requirements: 6.5_

- [x] 9. Checkpoint - Verify complete authorization and audit system
  - Test all authorization flows end-to-end
  - Verify audit logs are created for all sensitive operations
  - Test audit log query API with various filters
  - Ask the user if questions arise

- [ ] 10. Implement error handling and security enhancements
  - [x] 10.1 Standardize error response format across services
    - Create shared error response interface: ErrorResponse with error, code, statusCode, requestId, details
    - Define authorization-specific error codes (CV_NO_APPLICATION_RELATIONSHIP, CONTACT_ENTERPRISE_TO_ENTERPRISE, etc.)
    - Update all authorization endpoints to return consistent error format
    - _Requirements: All requirements (error handling)_
  
  - [-] 10.2 Implement rate limiting
    - Add rate limiting middleware to API Gateway (1000 req/min per IP, 100 req/min per user)
    - Add rate limiting to internal service endpoints (100 req/min per calling service)
    - Return 429 errors when rate limit exceeded
    - _Requirements: Security enhancement_
  
  - [ ] 10.3 Implement graceful degradation for inter-service failures
    - Add retry logic with exponential backoff for Application Service relationship checks
    - Implement fail-secure behavior (deny access) when dependent services unavailable
    - Add circuit breaker pattern to prevent cascading failures
    - Log service unavailability events
    - _Requirements: 2.3_
  
  - [ ]* 10.4 Write unit tests for error handling
    - Test Application Service timeout during CV access check (should deny)
    - Test rate limit enforcement
    - Test graceful degradation scenarios
    - Test error response format consistency

- [ ] 11. Integration testing and end-to-end validation
  - [ ]* 11.1 Write integration test for CV access flow
    - Test complete flow: Client → Gateway → User Service → Application Service → Database → Audit Log
    - Verify JWT validation, header injection, authorization check, audit logging
    - Test both allowed and denied scenarios
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 6.1_
  
  - [ ]* 11.2 Write integration test for contact initiation flow
    - Test complete flow: Client → Gateway → Communication Service → Database → Audit Log
    - Verify role-based contact authorization and audit logging
    - Test enterprise-to-enterprise denial and candidate-to-enterprise allowance
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 4.4, 6.2_
  
  - [ ]* 11.3 Write integration test for application access flow
    - Test complete flow: Client → Gateway → Application Service → Database → Audit Log
    - Verify enterprise ownership check and audit logging
    - Test both owner and non-owner scenarios
    - _Requirements: 5.1, 5.2, 5.3, 6.3_
  
  - [ ]* 11.4 Write integration test for inspector reporting access
    - Test complete flow: Client → Gateway → Reporting Service → Database
    - Verify data sanitization for recruited candidates
    - Test inspector access to aggregated statistics
    - Test inspector denial for candidate CVs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 11.5 Write integration test for audit log querying
    - Test audit log query API with various filters
    - Verify admin-only access to audit logs
    - Test pagination and date range filtering
    - _Requirements: 6.4_

- [~] 12. Final checkpoint and documentation
  - Ensure all property-based tests pass (100+ iterations each)
  - Verify ≥80% unit test coverage for authorization services
  - Verify ≥90% integration test coverage for critical authorization paths
  - Run full test suite across all microservices
  - Update service documentation with authorization rules
  - Document internal endpoints and inter-service communication patterns
  - Ask the user if questions arise or if deployment is needed

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery, though they provide important validation of universal authorization properties
- Each task references specific requirements for traceability and validation
- Checkpoints ensure incremental validation at key integration points
- Property-based tests validate universal correctness properties across random inputs (100+ iterations)
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests verify end-to-end flows with real database and inter-service communication
- The implementation follows defense-in-depth principles with validation at gateway, service, and audit layers
- TypeScript is used throughout for type safety and consistency
- Inter-service communication uses internal HTTP endpoints not exposed via API Gateway
- All authorization decisions are logged to audit_logs table for compliance and monitoring
- Header injection attacks are prevented by stripping X-User-* headers from incoming requests at the gateway
- Fail-secure behavior is implemented: deny access when authorization checks fail or dependent services are unavailable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.5", "8.2"] },
    { "id": 2, "tasks": ["1.4", "1.6", "3.1", "3.2", "8.3"] },
    { "id": 3, "tasks": ["3.3", "4.1", "4.2", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 4, "tasks": ["3.4", "3.5", "4.3", "6.1"] },
    { "id": 5, "tasks": ["4.4", "4.5", "4.6", "6.2", "7.1"] },
    { "id": 6, "tasks": ["6.3", "6.4", "7.2"] },
    { "id": 7, "tasks": ["7.3", "10.1"] },
    { "id": 8, "tasks": ["7.4", "7.5", "10.2", "10.3"] },
    { "id": 9, "tasks": ["10.4", "11.1", "11.2"] },
    { "id": 10, "tasks": ["11.3", "11.4", "11.5"] }
  ]
}
```
