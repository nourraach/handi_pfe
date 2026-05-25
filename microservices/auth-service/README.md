# Auth Service

First extracted service.

Planned ownership:

- `/api/auth/*`
- password reset/session token tables
- JWT signing and verification contract

The service now owns `/api/auth/*` locally. The gateway still starts with `AUTH_SERVICE_ENABLED=false` until the database-backed login/register flows are tested end to end.
