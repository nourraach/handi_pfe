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

## Error Envelope

All services should converge to:

```json
{
  "message": "Human readable message",
  "error": "Technical or validation detail",
  "code": "OPTIONAL_MACHINE_CODE"
}
```

