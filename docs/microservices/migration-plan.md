# HandiTalents Microservices Migration Plan

## Current State

The project started as a modular monolith and has now been migrated to the extracted service layout:

- `handi_front-master_abir`: Next.js frontend.
- `handi_talents-main_abir`: legacy Express backend, now removed from the workspace.
- One PostgreSQL/pgvector database configured by the backend `docker-compose.yml`.
- All business domains are mounted in one `src/app.ts`.
- The remaining legacy inline routes inside `src/app.ts` are being disabled as the extracted services take over.
- The gateway now fails fast on unmatched `/api/*` paths instead of silently falling back to a legacy backend.

## Target Architecture

```text
frontend Next.js
  |
api-gateway
  |
  |-- auth-service
  |-- user-service
  |-- job-service
  |-- application-service
  |-- interview-service
  |-- reporting-service
  |-- notification-service
  |-- communication-service
```

## Migration Rule

The existing backend has been retired from the workspace, and the gateway no longer forwards unmatched API traffic to a fallback service.

## Route Ownership

| Current route group | Target service | Notes |
| --- | --- | --- |
| `/api/auth/*` | `auth-service` | Login, registration, JWT issue/verification, password reset. |
| `/api/admin/demandes-en-attente`, `/api/admin/approuver/:id`, `/api/admin/refuser/:id` | `user-service` | Registration approval workflow. Now owned by `user-service`. |
| `/api/admin/utilisateurs/*` | `user-service` | Admin user management. |
| `/api/candidats/profil/*`, `/api/entreprises/profil/*`, `/api/entreprises/membres/*` | `user-service` | Candidate/company profile and members. Now owned by `user-service`. |
| `/api/offres-emploi/*`, `/api/offres/publiques`, `/api/entreprise/offres/*`, `/api/admin/offres/publication/*` | `job-service` | Job discovery, public listings, enterprise job CRUD, admin publication validation. |
| `/api/favoris/*`, `/api/recommandations/*` | `job-service` initially | Candidate job shortlist/recommendation domain. Can later become `matching-service`. |
| `/api/candidatures/*`, `/api/entreprise/candidatures/*`, `/api/admin/candidatures/*`, `/api/entreprise/candidatures/export/*` | `application-service` | Applications, statuses, exports, admin application tracking. |
| `/api/entretiens/*`, `/api/admin/entretiens/*`, `/api/tests-entretien/*`, `/api/interne/bien-etre/*` | `interview-service` | Interview scheduling, prep, wellbeing dispatch. |
| `/api/tests-psychologiques/*` | `assessment-service` or `interview-service` | Keep separate if time allows. |
| `/api/supervision/*`, `/api/entreprise/reports-requests/*`, `/api/avis-entreprises/*` | `reporting-service` | Compliance reports, supervision, company reviews. |
| `/api/notifications/*` | `notification-service` | In-app notifications, emails/SMS later. |
| `/api/chat/*` | `communication-service` | Conversations, messages, recipient search, and SSE stream. |

## Week Plan

### Day 1

- Create `microservices-refactor` branch.
- Add migration documentation and route ownership.
- Scaffold `api-gateway`, `auth-service`, and the legacy backend.
- Make gateway proxy all existing `/api/*` traffic to the legacy backend.
- Keep frontend API base pointed at the gateway.

### Day 2

- Extract `/api/auth/*` into `auth-service`.
- Add JWT verification contract shared by all services.
- Gateway routes `/api/auth/*` to `auth-service`, while the earliest migration phase kept the rest on the legacy backend.

### Day 3

- Extract user/account/profile routes into `user-service`.
- Move inline pending registration routes out of `src/app.ts`.
- Add user database/migration boundary.

### Day 4

- Extract job/offers/favorites routes into `job-service`.
- Add service calls from `application-service` plan for job ownership checks.

### Day 5

- Extract applications/candidatures into `application-service`.
- Add inter-service calls to user/job services.

### Day 6

- Extract interviews and reporting domains.
- Add health checks and structured logs to all services.

### Day 7

- Docker compose for full stack.
- End-to-end flow verification.
- Architecture documentation and diagrams.

## First Technical Milestone

The first milestone is not to split every table immediately. It is:

1. Gateway works.
2. The legacy backend still served all old routes during the early migration phase.
3. Auth service owns `/api/auth/*` behind a feature flag.
4. Frontend uses the gateway.
5. Health checks prove service availability.

The gateway now supports routing `/api/auth/*` to the extracted `auth-service` with `AUTH_SERVICE_ENABLED=true`.

It also supports routing account/profile traffic to `user-service` with `USER_SERVICE_ENABLED=true`:

- `/api/admin/demandes-en-attente`
- `/api/admin/approuver/*`
- `/api/admin/refuser/*`
- `/api/admin/utilisateurs/*`
- `/api/candidats/profil/*`
- `/api/entreprises/profil/*`
- `/api/admin/profil/*`
- `/api/entreprises/membres/*`

It also supports routing the first job domain slice to `job-service` with `JOB_SERVICE_ENABLED=true`:

- `/api/offres-emploi/*`
- `/api/entreprise/offres/*`
- `/api/admin/offres/publication/*`
- `/api/favoris/*`
- `/api/recommandations/*`

It also supports routing application traffic to `application-service` with `APPLICATION_SERVICE_ENABLED=true`:

- `/api/candidatures/*`
- `/api/entreprise/candidatures/*`
- `/api/entreprise/candidats/*`
- `/api/admin/candidatures/*`
- `/api/admin/workflow-recrutement`
- `/api/admin/detection-abus`

It also supports routing interview traffic to `interview-service` with `INTERVIEW_SERVICE_ENABLED=true`:

- `/api/entretiens/*`
- `/api/admin/entretiens/*`
- `/api/tests-entretien/*`
- `/api/interne/bien-etre/*`

It also supports routing reporting and supervision traffic to `reporting-service` with `REPORTING_SERVICE_ENABLED=true`:

- `/api/supervision/*`
- `/api/entreprise/reports-requests/*`
- `/api/avis-entreprises/*`

It also supports routing notification traffic to `notification-service` with `NOTIFICATION_SERVICE_ENABLED=true`:

- `/api/notifications/*`

It also supports routing assessment traffic to `assessment-service` with `ASSESSMENT_SERVICE_ENABLED=true`:

- `/api/tests-psychologiques/*`

It also supports routing chat traffic to `communication-service` with `COMMUNICATION_SERVICE_ENABLED=true`:

- `/api/chat/*`

For this milestone, extracted services still used the same PostgreSQL database as the legacy backend so behavior could be validated before later database separation.
