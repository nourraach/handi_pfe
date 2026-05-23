# FEATURE_02 - Predicteur IA de questions d'entretien (Front + Back)

## Objectif
Generer automatiquement un dossier de questions d'entretien personnalise apres shortlist, avec fallback si l'IA est indisponible.

## Portee
- Frontend:
  - `app/candidat/candidatures/[id]/preparation-entretien/page.tsx`
  - consultation dossier + regeneration (1 fois max)
- Backend:
  - `GET /api/candidatures/:id/interview-prep`
  - `POST /api/candidatures/:id/interview-prep/regenerate`
  - trigger auto lors du shortlist entreprise

## Fichiers principaux
- `src/controllers/interview-prep.controller.ts`
- `src/routes/candidature.routes.ts`
- `src/services/interview-questions/*`
- `src/services/candidature.service.ts` (hook shortlist -> generation)
- `src/db/schema/interview-questions-dossier.schema.ts`
- `drizzle/0010_interview_questions_dossier.sql`

## IA et configuration
- Variables:
  - `GEMINI_API_KEY`
  - `GEMINI_INTERVIEW_MODEL`
  - `INTERVIEW_PREP_GENERATION_TIMEOUT_MS`
  - `INTERVIEW_PREP_CACHE_TTL_DAYS`
- fallback actif si generation IA indisponible

## Notifications
Type: `interview_prep_ready`
- message candidat quand le dossier est pret
- CTA vers `/candidat/candidatures/{id}/preparation-entretien`

