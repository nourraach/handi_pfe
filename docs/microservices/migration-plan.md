# HandiTalents Microservices Migration Plan

## Current State

The project is currently a modular monolith:

- `handi_front-master_abir`: Next.js frontend.
- `handi_talents-main_abir`: one Express backend process.
- One PostgreSQL/pgvector database configured by the backend `docker-compose.yml`.
- All business domains are mounted in one `src/app.ts`.
- Several routes still live inline inside `src/app.ts`, which must be extracted before clean service separation.

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
  |-- core-service temporary fallback
```

## Migration Rule

The existing backend remains available as `core-service` while domains are extracted one by one. This keeps the platform usable during the migration.

## Route Ownership

| Current route group | Target service | Notes |
| --- | --- | --- |
| `/api/auth/*` | `auth-service` | Login, registration, JWT issue/verification, password reset. |
| `/api/admin/demandes-en-attente`, `/api/admin/approuver/:id`, `/api/admin/refuser/:id` | `user-service` | Registration approval workflow. Currently inline in `src/app.ts`. |
| `/api/admin/utilisateurs/*` | `user-service` | Admin user management. |
| `/api/candidats/profil/*`, `/api/entreprises/profil/*`, `/api/entreprises/membres/*` | `user-service` | Candidate/company profile and members. Some profile routes are inline in `src/app.ts`. |
| `/api/offres-emploi/*`, `/api/offres/publiques`, `/api/entreprise/offres/*`, `/api/admin/offres/publication/*` | `job-service` | Job discovery, enterprise job CRUD, admin publication validation. Some enterprise routes are inline. |
| `/api/favoris/*`, `/api/recommandations/*` | `job-service` initially | Candidate job shortlist/recommendation domain. Can later become `matching-service`. |
| `/api/candidatures/*`, `/api/entreprise/candidatures/*`, `/api/admin/candidatures/*`, `/api/entreprise/candidatures/export/*` | `application-service` | Applications, statuses, exports, admin application tracking. |
| `/api/entretiens/*`, `/api/admin/entretiens/*`, `/api/tests-entretien/*`, `/api/interne/bien-etre/*` | `interview-service` | Interview scheduling, prep, wellbeing dispatch. |
| `/api/tests-psychologiques/*` | `assessment-service` or `interview-service` | Keep separate if time allows. |
| `/api/supervision/*`, `/api/entreprise/reports-requests/*`, `/api/avis-entreprises/*` | `reporting-service` | Compliance reports, supervision, company reviews. |
| `/api/notifications/*` | `notification-service` | In-app notifications, emails/SMS later. |
| `/api/chat/*` | `communication-service` or `notification-service` | Can stay in `core-service` until later. |

## Week Plan

### Day 1

- Create `microservices-refactor` branch.
- Add migration documentation and route ownership.
- Scaffold `api-gateway`, `auth-service`, and `core-service`.
- Make gateway proxy all existing `/api/*` traffic to `core-service`.
- Keep frontend API base pointed at the gateway.

### Day 2

- Extract `/api/auth/*` into `auth-service`.
- Add JWT verification contract shared by all services.
- Gateway routes `/api/auth/*` to `auth-service`, everything else to `core-service`.

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
2. Core service still serves all old routes.
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

For this milestone, extracted services still use the same PostgreSQL database as `core-service` so behavior can be validated before later database separation.
