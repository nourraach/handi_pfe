# Shared Service Contracts

## Health Check

Every service exposes:

```http
GET /health
```

Response:

```json
{
  "service": "service-name",
  "status": "ok"
}
```

## Auth Header

Internal and frontend calls keep the same bearer token contract:

```http
Authorization: Bearer <jwt>
```

## Gateway Feature Flags

The gateway can progressively switch route ownership without changing the frontend base URL:

```env
AUTH_SERVICE_ENABLED=true
USER_SERVICE_ENABLED=true
JOB_SERVICE_ENABLED=true
APPLICATION_SERVICE_ENABLED=true
```

Disabled services fall back to `core-service` through the generic `/api/*` proxy.

## Error Envelope

All services should converge to:

```json
{
  "message": "Human readable message",
  "error": "Technical or validation detail",
  "code": "OPTIONAL_MACHINE_CODE"
}
```
