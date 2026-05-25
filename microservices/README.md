# Microservices Workspace

This folder contains the new progressive microservices migration.

The old backend remains in `handi_talents-main_abir` and will temporarily act as `core-service` until each business domain is extracted.

Initial services:

- `api-gateway`: single public API entry point for the frontend.
- `auth-service`: first extracted domain.
- `user-service`: account, profile, admin user-management, and pending registration workflow.
- `job-service`: first job-domain slice for offers, enterprise offer management, publication review, favorites, and recommendations.
- `core-service`: compatibility wrapper for the current backend.

Planned services:

- `application-service`
- `interview-service`
- `reporting-service`
- `notification-service`
