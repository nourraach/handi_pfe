# FEATURE_01 - Bien-etre entretien (Front + Back)

## Objectif
Proposer un module court de preparation emotionnelle (respiration + visualisation + points forts) pour les candidats avant un entretien.

## Portee
- Frontend:
  - `app/candidat/entretiens/[id]/bien-etre/page.tsx`
  - CTA depuis notifications `bien_etre_entretien`
- Backend:
  - Routes candidat:
    - `GET /api/entretiens/:id/bien-etre/contexte`
    - `POST /api/entretiens/:id/bien-etre/demarrer`
    - `POST /api/entretiens/:id/bien-etre/terminer`
  - Route interne:
    - `POST /api/interne/bien-etre/dispatch-j1` (header `x-internal-key`)

## Fichiers principaux
- `src/controllers/bien-etre-entretien.controller.ts`
- `src/services/bien-etre-entretien.service.ts`
- `src/repositories/bien-etre-entretien.repository.ts`
- `src/services/points-forts.provider.ts`
- `src/routes/entretien.routes.ts`
- `src/routes/bien-etre-interne.routes.ts`
- `src/db/schema/session-bien-etre-entretien.schema.ts`

## Donnees
Table: `session_bien_etre_entretien`
- session par `(id_entretien, id_utilisateur)`
- tracking: notification envoyee, debut/fin, duree, points forts, source

## Notifications
Type: `bien_etre_entretien`
- payload avec CTA vers `/candidat/entretiens/{id}/bien-etre`

