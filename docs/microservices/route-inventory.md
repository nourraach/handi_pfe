# Route Inventory

This file records the current backend route surface before extraction.

## Mounted Route Modules

| Mount path | Route file | Target service |
| --- | --- | --- |
| `/api/auth` | `auth.routes.ts` | `auth-service` |
| `/api/admin` | `admin.routes.ts` | `user-service` |
| `/api/admin` | `admin-offre-publication.routes.ts` | `job-service` |
| `/api/admin` | `gestion-utilisateurs.routes.ts` | `user-service` |
| `/api` | `profil.routes.ts` | `user-service` |
| `/api/entreprises/membres` | `account-member.routes.ts` | `user-service` |
| `/api/offres-emploi` | `offre-emploi-minimal.routes.ts` | `job-service` |
| `/api/offres-emploi` | `offre-emploi-simple.routes.ts` | `job-service` |
| `/api/entreprise/offres` | `offre-emploi.routes.ts` | `job-service` |
| `/api/candidatures` | `candidature.routes.ts` | `application-service` |
| `/api/entreprise/candidatures` | `candidature.routes.ts` | `application-service` |
| `/api/entretiens` | `entretien.routes.ts` | `interview-service` |
| `/api/tests-entretien` | `test-entretien.routes.ts` | `interview-service` |
| `/api/favoris` | `favoris.routes.ts` | `job-service` |
| `/api/notifications` | `notification.routes.ts` | `notification-service` |
| `/api/recommandations` | `recommendation.routes.ts` | `job-service` initially |
| `/api/avis-entreprises` | `avis-entreprise.routes.ts` | `reporting-service` |
| `/api/entreprise/candidatures/export` | `entreprise-candidature-export.routes.ts` | `application-service` |
| `/api/entreprise/candidats` | `entreprise-candidats.routes.ts` | `application-service` |
| `/api/admin` | `admin-candidature.routes.ts` | `application-service` |
| `/api/admin` | `admin-entretien.routes.ts` | `interview-service` |
| `/api/chat` | `chat.routes.ts` | `communication-service` later |
| `/api/supervision` | `supervision.routes.ts` | `reporting-service` |
| `/api/entreprise/reports-requests` | `enterprise-reporting.routes.ts` | `reporting-service` |
| `/api/interne/bien-etre` | `bien-etre-interne.routes.ts` | `interview-service` |

## Legacy Inline Routes

The following routes were historically defined directly in `src/app.ts`. They are now handled by the extracted services, and the legacy fallback block has been disabled in the monolith:

- `GET /api/entreprise/offres` - extracted behind `job-service` through the modular route; no longer depends on the legacy backend
- `GET /api/offres/publiques` - now served by `job-service` through the gateway alias
- `POST /api/entreprise/offres` - extracted behind `job-service` through the modular route; no longer depends on the legacy backend
- `PATCH /api/entreprise/offres/:id/statut` - extracted behind `job-service` through the modular route; no longer depends on the legacy backend
- `GET /api/admin/demandes-en-attente` - extracted behind `user-service`
- `POST /api/admin/approuver/:id` - extracted behind `user-service`
- `POST /api/admin/refuser/:id` - extracted behind `user-service`
- `GET /api/candidats/profil/:id` - extracted behind `user-service`
- `PUT /api/candidats/profil` - extracted behind `user-service`
- `GET /api/entreprises/profil/:id` - extracted behind `user-service`
- `PUT /api/entreprises/profil` - extracted behind `user-service`

## Database Boundary Draft

| Service | Tables |
| --- | --- |
| `auth-service` | `utilisateur`, reset tokens/session tokens later |
| `user-service` | `utilisateur`, `candidat`, `entreprise`, `admin`, `profil_candidat`, `profil_entreprise`, `account_member`, audit tables |
| `job-service` | `offre_emploi`, `offre_publication_review`, `offre_statistiques`, `favoris`, recommendation/matching tables |
| `application-service` | `candidature`, application export/read models |
| `interview-service` | `entretien`, `test_entretien`, `session_bien_etre_entretien`, `interview_questions_dossier` |
| `reporting-service` | `compliance_report`, `recommendation`, company review tables |
| `notification-service` | `notification`, email/SMS delivery logs later |

The first migration phase can keep one physical PostgreSQL server while separating schemas/databases progressively.
