# Implementation Plan: Remove Inclusion Score Display

## Overview

This plan removes the inclusion score visual display from the enterprise home page's hero section while preserving all other orbital visualization elements (rings, floating tags, and analytics panel). The implementation involves surgical deletion of one JSX element and four CSS rule blocks from the `entreprise-home.tsx` component.

## Tasks

- [x] 1. Remove inclusion score JSX element from orbital visualization
  - Locate the `<div className="orbital-core">` element within the orbital-shell container
  - Delete the entire orbital-core div including all children (small, strong, span elements)
  - Verify the orbital-shell still contains 5 children: 3 orbital-ring divs and 2 floating-tag divs
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Remove orbital-core CSS rules from styled-jsx block
  - Locate and delete the `.orbital-core { ... }` CSS rule block
  - Delete the `.orbital-core small { ... }` CSS rule block
  - Delete the `.orbital-core strong { ... }` CSS rule block
  - Delete the `.orbital-core span { ... }` CSS rule block
  - Ensure no orphaned CSS rules remain
  - _Requirements: 4.1_

- [x] 3. Verify inclusionScore variable usage and preservation
  - Confirm the `inclusionScore` variable is still used in the scoreCards array
  - Verify the "IA Shortlisting" card in scoreCards references `inclusionScore`
  - Ensure the variable declaration remains unchanged: `const inclusionScore = Math.max(0, Math.min(100, averageAiScore || (recommendedCandidates.length > 0 ? 68 : 0)));`
  - _Requirements: 4.2, 4.3_

- [ ] 4. Checkpoint - Compile and type-check the component
  - Run TypeScript type checking to ensure no compilation errors
  - Verify no React/JSX syntax errors exist
  - Ensure all imports and dependencies are resolved
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 3.1, 3.2_

- [ ]* 5. Write unit tests for component rendering
  - Create test file `__tests__/entreprise-home.test.tsx` if it doesn't exist
  - Write test to verify orbital-core element is NOT present in rendered output
  - Write test to verify three orbital-ring elements are preserved
  - Write test to verify two floating-tag elements are preserved
  - Write test to verify inclusion score text is NOT rendered ("Score d'inclusion")
  - Write test to verify analytics panel displays "IA Shortlisting" card with inclusionScore
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 3.2, 3.3, 4.3_

- [ ]* 6. Create snapshot test for visual regression detection
  - Add snapshot test in the test file to capture full component render
  - Verify snapshot does NOT contain orbital-core class references
  - Verify snapshot contains all preserved elements (rings, tags, analytics)
  - _Requirements: 1.3, 2.3, 2.4_

- [~] 7. Perform visual verification in development environment
  - Start development server and navigate to enterprise home page
  - Verify hero section displays without gaps or layout artifacts
  - Confirm three concentric orbital rings are visible and animating
  - Confirm "Diversite" floating tag is visible at top position
  - Confirm "Impact" floating tag is visible at bottom position
  - Verify no inclusion score text or percentage appears in the center
  - Verify analytics panel shows "IA Shortlisting" card with percentage
  - Check browser console for errors or warnings
  - _Requirements: 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.2, 3.3_

- [~] 8. Final checkpoint - Ensure all acceptance criteria met
  - Review all requirements acceptance criteria from requirements document
  - Verify component compiles without errors
  - Verify all tests pass
  - Verify no visual regressions or layout issues
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The `inclusionScore` variable MUST be preserved as it's used in the analytics panel's scoreCards array
- This is a purely presentational change with no API or data model modifications
- The removal uses `position: absolute` elements, so no reflow or layout cascade issues are expected
- All orbital ring animations are independent of the orbital-core element
- The orbital-shell maintains structural integrity with 5 child elements after removal
- No accessibility regressions occur since the ops-hero-visual already has `aria-hidden="true"`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4"] },
    { "id": 2, "tasks": ["5", "6"] },
    { "id": 3, "tasks": ["7"] },
    { "id": 4, "tasks": ["8"] }
  ]
}
```
