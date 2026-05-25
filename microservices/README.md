# Microservices Workspace

This folder contains the new progressive microservices migration.

The old backend remains in `handi_talents-main_abir` and will temporarily act as `core-service` until each business domain is extracted.

Initial services:

- `api-gateway`: single public API entry point for the frontend.
- `auth-service`: first extracted domain.
- `core-service`: compatibility wrapper for the current backend.

Planned services:

- `user-service`
- `job-service`
- `application-service`
- `interview-service`
- `reporting-service`
- `notification-service`

