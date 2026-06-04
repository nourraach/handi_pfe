# Systeme typographique HandiTalents

## Choix

La typographie produit utilise Inter, deja chargee dans l'application. Elle garde une lecture nette en SaaS, de bons chiffres pour les stats, et reste compatible avec les fallbacks systeme et RTL.

## Echelle

- Display: `clamp(2rem, 3vw, 2.75rem)` pour les rares titres tres visibles.
- Page: `clamp(1.9rem, 2.6vw, 2.25rem)` pour les titres d'ecran.
- Section: `1.375rem` pour les blocs principaux.
- Card: `1.125rem` pour les titres de cartes.
- Body: `0.875rem` et Small `0.8125rem`.
- Caption: `0.75rem`, uppercase, pour labels courts.
- Stat: `clamp(1.75rem, 2.4vw, 2rem)` ou `compact` pour barres et cartes denses.

## Composants

```tsx
import { Caption, Heading, Stat, Text } from "@/components/ui/typography";

<Heading as="h1" variant="page">Recruitment</Heading>
<Text variant="muted">Manage active roles and hiring performance</Text>
<Stat value={12} label="candidats" />
<Stat size="compact" value={3} label="entretiens" />
<Caption>Offres actives</Caption>
```

## Migrations realisees

- `app/messages/page.tsx`: titre de page, sous-titre, titre du panneau conversations, recherche globale.
- `app/entreprise/offres/page.tsx`: titre Recruitment, description, recherche, filtres, titres de cartes et stats de role.
- `app/entreprise/candidatures/page.tsx`: titre Gestion des candidatures, description, resume de pipeline et filtres.

## Regles

- Utiliser `Heading` pour les titres visibles au lieu de classes locales `h1/h2/h3`.
- Utiliser `Text variant="muted"` pour les descriptions sous titre.
- Utiliser `Stat size="compact"` dans les barres denses, et `Stat` par defaut dans les cartes KPI.
- Ajouter `ht-search-control`, `ht-control` ou `ht-filter-control` aux recherches et filtres existants.
