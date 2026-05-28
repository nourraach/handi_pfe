# Microservices Workspace

This folder contains the new microservices architecture.

The legacy backend has been retired from the workspace. The live runtime now routes through the extracted services.

Initial services:

- `api-gateway`: single public API entry point for the frontend.
- `auth-service`: first extracted domain.
- `user-service`: account, profile, admin user-management, and pending registration workflow.
- `job-service`: first job-domain slice for offers, enterprise offer management, publication review, favorites, and recommendations.
- `application-service`: candidatures, enterprise application views, admin application tracking, exports, and candidate search.
- `interview-service`: interview scheduling, admin interview views, interview tests, and interview wellbeing flows.
- `reporting-service`: supervision dashboards, enterprise compliance reports, and company reviews.
- `notification-service`: authenticated in-app notification reads and state changes.
- `assessment-service`: psychological test administration, candidate tests, and test results.
- `communication-service`: chat conversations, recipient search, messages, and SSE conversation stream.
