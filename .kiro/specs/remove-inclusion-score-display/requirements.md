# Requirements Document

## Introduction

This document specifies the requirements for removing the inclusion score display from the enterprise home page. The inclusion score is currently shown as a circular animated component (orbital-core element) in the hero section of the enterprise home page. This component displays three pieces of information: a label "Score d'inclusion", a percentage value (e.g., "80%"), and a monthly variation (e.g., "+6% ce mois-ci").

The removal is a focused UI modification that simplifies the hero section interface while preserving all other visual elements including orbital rings, floating tags, buttons, analytics panel, and text content.

## Glossary

- **Enterprise_Home_Page**: The main dashboard page for enterprise users located at `handi_front-master_abir/components/entreprise-home.tsx`
- **Inclusion_Score_Display**: The visual component showing "Score d'inclusion", a percentage value, and monthly variation text
- **Orbital_Core_Element**: The DOM element with class `orbital-core` that contains the Inclusion_Score_Display
- **Hero_Section**: The header section of the Enterprise_Home_Page containing the orbital visualization and analytics panel
- **Orbital_Rings**: Three concentric animated circles (orbital-ring-outer, orbital-ring-mid, orbital-ring-inner) in the orbital visualization
- **Floating_Tags**: Two badge elements (Diversite and Impact) positioned within the orbital visualization
- **Analytics_Panel**: The sidebar component showing IA Shortlisting, Pipeline, and Satisfaction metrics

## Requirements

### Requirement 1: Remove Inclusion Score Visual Elements

**User Story:** As an enterprise user viewing the home page, I want the inclusion score display removed from the hero section, so that the interface is simplified and focuses on actionable metrics.

#### Acceptance Criteria

1. THE Enterprise_Home_Page SHALL NOT render the Inclusion_Score_Display text elements ("Score d'inclusion", percentage value, monthly variation)
2. THE Enterprise_Home_Page SHALL NOT render the Orbital_Core_Element DOM node with class `orbital-core`
3. WHEN the Enterprise_Home_Page is loaded, THE Hero_Section SHALL display without the inclusion score component
4. THE Enterprise_Home_Page SHALL maintain all other hero section elements (buttons, title, description, orbital rings)
5. THE Enterprise_Home_Page SHALL maintain both Floating_Tags (Diversite and Impact) in their original positions

### Requirement 2: Preserve Orbital Visualization Structure

**User Story:** As an enterprise user, I want the orbital rings and floating tags to remain functional and visually intact, so that the hero section maintains its branded appearance.

#### Acceptance Criteria

1. THE Enterprise_Home_Page SHALL maintain the animation of Orbital_Rings after Orbital_Core_Element removal
2. THE Hero_Section SHALL preserve the orbital-shell container structure
3. THE Enterprise_Home_Page SHALL maintain all CSS classes except orbital-core related classes
4. WHEN the Orbital_Core_Element is removed, THE Hero_Section SHALL NOT display visual artifacts or layout gaps

### Requirement 3: Maintain Component Integrity

**User Story:** As a developer, I want the component to compile and render without errors after the removal, so that the application remains stable.

#### Acceptance Criteria

1. THE Enterprise_Home_Page SHALL compile without TypeScript type errors
2. THE Enterprise_Home_Page SHALL render without React runtime errors
3. THE Enterprise_Home_Page SHALL execute all lifecycle hooks (useEffect, useMemo) without errors
4. THE Enterprise_Home_Page SHALL maintain all existing props and state management logic

### Requirement 4: Clean Up Related Code

**User Story:** As a developer, I want unused code and styles removed, so that the codebase remains clean and maintainable.

#### Acceptance Criteria

1. THE Enterprise_Home_Page SHALL remove CSS rules for `.orbital-core`, `.orbital-core small`, `.orbital-core strong`, and `.orbital-core span`
2. IF the `inclusionScore` computed value is not used elsewhere, THEN THE Enterprise_Home_Page SHALL remove or suppress the `inclusionScore` variable declaration
3. THE Enterprise_Home_Page SHALL preserve all other computed values (averageAiScore, recommendedCandidates, pipeline, activeOffers)
4. THE Enterprise_Home_Page SHALL maintain all data fetching logic (API calls for candidatures and entretiens)
