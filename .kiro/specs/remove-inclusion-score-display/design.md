# Design Document

## Overview

This design document specifies the technical approach for removing the inclusion score display from the enterprise home page. The inclusion score is currently displayed as a centered circular component (`orbital-core`) within an orbital ring visualization in the hero section. The removal involves deleting the DOM element and its associated CSS styling while preserving all other visual elements including the three concentric orbital rings, two floating badge tags (Diversite and Impact), and the analytics panel.

### Scope

**In Scope:**
- Removal of the `orbital-core` div element containing inclusion score text
- Removal of CSS rules for `.orbital-core` and related selectors
- Cleanup of unused `inclusionScore` variable if not referenced elsewhere
- Verification of preserved orbital ring animations and floating tags

**Out of Scope:**
- Modification of data fetching logic (API calls remain unchanged)
- Changes to the analytics panel scoreCards array
- Alterations to any other sections beyond the hero orbital visualization
- Backend API modifications

### Component Context

The target component is `entreprise-home.tsx` located at:
```
handi_front-master_abir/components/entreprise-home.tsx
```

The component is a Next.js client component (`"use client"`) that:
1. Fetches candidate applications from `/api/candidatures/entreprise`
2. Fetches interview data from `/api/entretiens/entreprise`
3. Computes multiple metrics including `inclusionScore`, `averageAiScore`, `pipeline`, `activeOffers`
4. Renders a hero section with orbital visualization and analytics panel
5. Displays candidate lists, interview schedules, and pipeline statistics

## Architecture

### Component Structure

The EntrepriseHome component follows this high-level structure:

```
EntrepriseHome
├── State Management
│   ├── applications (CandidateApplication[])
│   ├── interviews (InterviewItem[])
│   ├── referenceNow (timestamp)
│   ├── loadingWorkspace (boolean)
│   └── workspaceNotice (string | null)
├── Data Fetching (useEffect)
│   ├── /api/candidatures/entreprise
│   └── /api/entretiens/entreprise
├── Computed Values (useMemo)
│   ├── pipeline
│   ├── activeOffers
│   ├── recommendedCandidates
│   ├── upcomingInterviews
│   ├── averageAiScore
│   ├── inclusionScore ← TARGET FOR REMOVAL
│   └── scoreCards
└── Render Tree
    ├── ops-hero (Hero Section)
    │   ├── ops-hero-copy (Left: Title, description, CTA)
    │   └── ops-hero-visual (Right)
    │       ├── orbital-shell
    │       │   ├── orbital-ring-outer
    │       │   ├── orbital-ring-mid
    │       │   ├── orbital-ring-inner
    │       │   ├── orbital-core ← TARGET FOR REMOVAL
    │       │   ├── floating-tag-top (Diversite)
    │       │   └── floating-tag-bottom (Impact)
    │       └── hero-analytics-panel
    ├── ops-section-pipeline
    ├── ops-section (Candidats prioritaires)
    └── ops-section (Entretiens du jour)
```

### Removal Strategy

The removal follows a surgical deletion approach:

1. **DOM Removal**: Delete the `<div className="orbital-core">` element and all its children from the JSX
2. **CSS Cleanup**: Remove four CSS rule blocks:
   - `.orbital-core { ... }`
   - `.orbital-core small { ... }`
   - `.orbital-core strong { ... }`
   - `.orbital-core span { ... }`
3. **Variable Cleanup**: Assess usage of `inclusionScore` variable and remove or suppress if unused elsewhere
4. **Verification**: Ensure orbital rings and floating tags continue to render and animate correctly

### Preservation Requirements

The following elements MUST remain unchanged:

- **Orbital rings**: Three `div` elements with classes `orbital-ring orbital-ring-outer/mid/inner`
- **Floating tags**: Two `div` elements with classes `floating-tag floating-tag-top/bottom`
- **Analytics panel**: The `hero-analytics-panel` aside element and its scoreCards
- **Data fetching**: All API calls and state management
- **Computed metrics**: All useMemo hooks except potential cleanup of `inclusionScore`

## Components and Interfaces

### Target DOM Element

**Location in JSX:**
```tsx
<div className="ops-hero-visual" aria-hidden="true">
  <div className="orbital-shell">
    <div className="orbital-ring orbital-ring-outer" />
    <div className="orbital-ring orbital-ring-mid" />
    <div className="orbital-ring orbital-ring-inner" />
    
    {/* TARGET FOR REMOVAL - START */}
    <div className="orbital-core">
      <small>Score d&apos;inclusion</small>
      <strong>{inclusionScore}%</strong>
      <span>+{Math.max(6, recommendedCandidates.length * 2)}% ce mois-ci</span>
    </div>
    {/* TARGET FOR REMOVAL - END */}
    
    <div className="floating-tag floating-tag-top">
      {/* ... Diversite tag ... */}
    </div>
    <div className="floating-tag floating-tag-bottom">
      {/* ... Impact tag ... */}
    </div>
  </div>
  {/* ... hero-analytics-panel ... */}
</div>
```

### Target CSS Rules

**Location in `<style jsx>`:**

The styled-jsx block at the end of the component contains these rules to be removed:

```css
.orbital-core {
  position: absolute;
  inset: 50%;
  translate: -50% -50%;
  display: grid;
  gap: 2px;
  text-align: center;
  color: var(--ht-purple);
  z-index: 4;
}

.orbital-core small {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ht-muted);
}

.orbital-core strong {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: var(--ht-purple);
}

.orbital-core span {
  font-size: 11px;
  font-weight: 500;
  color: var(--ht-muted);
}
```

### Variable Assessment

**Target Variable:**
```tsx
const inclusionScore = Math.max(0, Math.min(100, averageAiScore || (recommendedCandidates.length > 0 ? 68 : 0)));
```

**Usage Analysis:**
The `inclusionScore` variable is referenced in:
1. The `orbital-core` JSX (removal target)
2. The `scoreCards` array definition via the expression `Math.max(0, Math.min(100, inclusionScore))`

**Decision:**
Since `inclusionScore` is used in the analytics panel's scoreCards array (first card: "IA Shortlisting"), we MUST preserve the variable but can suppress the unused variable warning with a void statement if the linter flags it. The scoreCards reference is:

```tsx
const scoreCards = [
  {
    label: "IA Shortlisting",
    value: Math.max(0, Math.min(100, inclusionScore)),
    hint: recommendedCandidates.length > 0 ? `+${Math.max(6, recommendedCandidates.length * 2)}% ce mois-ci` : "Actif",
  },
  // ...
];
```

This means `inclusionScore` IS used elsewhere and must be preserved.

### Type Definitions

No type modifications are required. The component maintains its existing interfaces:

```typescript
interface EntrepriseHomeProps {
  utilisateurNom: string;
  stats: WorkspaceStatCard[];
  loadingStats: boolean;
  erreurStats: string | null;
}

type WorkspaceStatCard = {
  label: string;
  value: number | string;
  hint?: string;
};

// ... other existing types remain unchanged
```

## Data Models

No data model changes are required. The component continues to work with:

- `CandidateApplication[]` from the candidatures API
- `InterviewItem[]` from the entretiens API
- Computed metrics derived from these datasets

The removal is purely presentational and does not affect data structures or API contracts.

## Error Handling

### Compilation Safety

**Type Safety:**
- The removal does not introduce any type errors
- All props and state types remain unchanged
- The `inclusionScore` variable remains typed as `number`

**Runtime Safety:**
- No conditional rendering logic is affected
- The orbital-shell container structure is preserved
- All child elements (rings and tags) maintain their parent-child relationships

### CSS Safety

**Selector Specificity:**
- The removed `.orbital-core` selectors do not conflict with other rules
- Removing these rules will not affect specificity cascades
- The `.orbital-ring` and `.floating-tag` rules are independent

**Layout Impact:**
- The `orbital-core` element uses `position: absolute` with `inset: 50%` positioning
- Its removal does not affect the flow layout of siblings
- Orbital rings and floating tags are also absolutely positioned and independent

### Edge Cases

1. **Empty orbital-shell**: After removal, the orbital-shell div will contain only five children (3 rings + 2 tags). This is valid and will render correctly.
2. **Animation continuity**: Orbital ring animations are defined on `.orbital-ring` classes, not on `.orbital-core`, so animations continue unaffected.
3. **Accessibility**: The `ops-hero-visual` div has `aria-hidden="true"`, so screen readers already ignore this section. No accessibility regression occurs.

## Testing Strategy

This feature involves a focused UI modification with no complex business logic or data transformations. Property-based testing is **NOT applicable** because:

1. **No universal properties to test**: The change is a DOM element removal, not a transformation that should hold across inputs
2. **No input variation**: There are no inputs that vary meaningfully - the component either renders the element or doesn't
3. **UI rendering focus**: This is pure UI layout modification, best verified through snapshot tests and visual verification

### Testing Approach

**Unit Tests:**
- Verify the component compiles without TypeScript errors
- Verify the component renders without React runtime errors
- Verify the `inclusionScore` variable is computed correctly (existing test)
- Verify scoreCards array includes the IA Shortlisting card with inclusionScore value

**Visual Verification:**
- Manually inspect the hero section in development mode
- Confirm orbital rings animate correctly
- Confirm floating tags (Diversite and Impact) are visible and positioned correctly
- Confirm no visual gaps or artifacts appear where orbital-core was removed

**Snapshot Tests:**
- Create a Jest snapshot test for the EntrepriseHome component
- Compare rendered output before and after removal
- Verify the snapshot does not contain `orbital-core` class or inclusion score text

**Integration Tests:**
- Test the full page load with mocked API responses
- Verify no console errors or warnings
- Verify data fetching and computed metrics work as expected

### Test Scenarios

**Scenario 1: Component Renders Successfully**
- **Given**: The EntrepriseHome component is mounted with valid props
- **When**: The component renders
- **Then**: No runtime errors occur AND the hero section displays

**Scenario 2: Orbital Visualization is Intact**
- **Given**: The EntrepriseHome component is rendered
- **When**: Inspecting the ops-hero-visual element
- **Then**: Three orbital-ring elements are present AND two floating-tag elements are present AND no orbital-core element exists

**Scenario 3: Computed Metrics Are Preserved**
- **Given**: The component has loaded applications and interviews data
- **When**: The inclusionScore useMemo hook executes
- **Then**: A valid number between 0 and 100 is returned AND the scoreCards array contains the IA Shortlisting card with this value

**Scenario 4: Analytics Panel Displays Correctly**
- **Given**: The component is rendered with scoreCards data
- **When**: The hero-analytics-panel renders
- **Then**: Three score cards are displayed including "IA Shortlisting" with the inclusionScore percentage

### Example Test Code

```typescript
import { render, screen } from '@testing-library/react';
import { EntrepriseHome } from './entreprise-home';

describe('EntrepriseHome - Inclusion Score Removal', () => {
  const mockProps = {
    utilisateurNom: 'Test Company',
    stats: [],
    loadingStats: false,
    erreurStats: null,
  };

  it('should render without orbital-core element', () => {
    const { container } = render(<EntrepriseHome {...mockProps} />);
    
    // Verify orbital-core is NOT present
    const orbitalCore = container.querySelector('.orbital-core');
    expect(orbitalCore).toBeNull();
  });

  it('should preserve orbital rings and floating tags', () => {
    const { container } = render(<EntrepriseHome {...mockProps} />);
    
    // Verify orbital rings are present
    expect(container.querySelector('.orbital-ring-outer')).toBeInTheDocument();
    expect(container.querySelector('.orbital-ring-mid')).toBeInTheDocument();
    expect(container.querySelector('.orbital-ring-inner')).toBeInTheDocument();
    
    // Verify floating tags are present
    expect(container.querySelector('.floating-tag-top')).toBeInTheDocument();
    expect(container.querySelector('.floating-tag-bottom')).toBeInTheDocument();
  });

  it('should not render inclusion score text', () => {
    render(<EntrepriseHome {...mockProps} />);
    
    // Verify inclusion score label is not in the document
    expect(screen.queryByText(/Score d'inclusion/i)).not.toBeInTheDocument();
  });

  it('should compute inclusionScore for analytics panel', () => {
    const { container } = render(<EntrepriseHome {...mockProps} />);
    
    // Verify the analytics panel still shows IA Shortlisting card
    const iaCard = screen.getByText(/IA Shortlisting/i);
    expect(iaCard).toBeInTheDocument();
  });
});
```

### Test Coverage Requirements

- **Unit test coverage**: Minimum 80% for the EntrepriseHome component
- **Snapshot coverage**: Full component snapshot
- **Visual regression**: Manual verification in development and staging environments
- **Integration coverage**: Full page load with mocked API responses

## Implementation Steps

### Step 1: Remove orbital-core JSX Element

**File:** `handi_front-master_abir/components/entreprise-home.tsx`

**Action:** Locate and delete the following JSX block (approximately lines 565-570):

```tsx
<div className="orbital-core">
  <small>Score d&apos;inclusion</small>
  <strong>{inclusionScore}%</strong>
  <span>+{Math.max(6, recommendedCandidates.length * 2)}% ce mois-ci</span>
</div>
```

**Verification:** After deletion, the orbital-shell div should contain exactly 5 children:
- 3 orbital-ring divs
- 2 floating-tag divs

### Step 2: Remove orbital-core CSS Rules

**File:** `handi_front-master_abir/components/entreprise-home.tsx`

**Action:** Locate and delete the following CSS rule blocks from the `<style jsx>` section (approximately lines 800-830):

```css
.orbital-core {
  position: absolute;
  inset: 50%;
  translate: -50% -50%;
  display: grid;
  gap: 2px;
  text-align: center;
  color: var(--ht-purple);
  z-index: 4;
}

.orbital-core small {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ht-muted);
}

.orbital-core strong {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: var(--ht-purple);
}

.orbital-core span {
  font-size: 11px;
  font-weight: 500;
  color: var(--ht-muted);
}
```

**Verification:** Run TypeScript compilation to ensure no CSS parsing errors occur.

### Step 3: Verify inclusionScore Variable Usage

**File:** `handi_front-master_abir/components/entreprise-home.tsx`

**Action:** Verify that the `inclusionScore` variable is still used in the scoreCards array. The variable should be preserved with its current implementation:

```tsx
const inclusionScore = Math.max(0, Math.min(100, averageAiScore || (recommendedCandidates.length > 0 ? 68 : 0)));
```

**Verification:** Ensure this line is NOT removed since scoreCards[0].value references it.

### Step 4: Run Type Checking and Linting

**Commands:**
```bash
npm run type-check
# or
tsc --noEmit

npm run lint
```

**Expected Result:** No errors or warnings related to the EntrepriseHome component.

### Step 5: Visual Verification

**Action:** Start the development server and navigate to the enterprise home page:

```bash
npm run dev
```

**Verification Checklist:**
- [ ] Hero section renders without gaps or layout issues
- [ ] Three concentric orbital rings are visible and animating
- [ ] "Diversite" floating tag is visible in the top position
- [ ] "Impact" floating tag is visible in the bottom position
- [ ] No inclusion score text or percentage is visible in the center
- [ ] Analytics panel displays "IA Shortlisting" card with a percentage value
- [ ] No console errors or React warnings

### Step 6: Create Unit Tests

**File:** Create `handi_front-master_abir/components/__tests__/entreprise-home.test.tsx`

**Action:** Implement the unit tests described in the Testing Strategy section above.

**Verification:** Run tests and ensure all pass:
```bash
npm run test
```

### Step 7: Create Snapshot Test

**File:** Same test file as Step 6

**Action:** Add a snapshot test:

```typescript
it('should match snapshot without orbital-core', () => {
  const { container } = render(<EntrepriseHome {...mockProps} />);
  expect(container).toMatchSnapshot();
});
```

**Verification:** Review the snapshot file to confirm no orbital-core references exist.

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Rollback**: Revert the commit that removed the orbital-core element
2. **Git Command:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
3. **Verify Rollback**: Confirm the inclusion score display is restored
4. **Root Cause Analysis**: Investigate what went wrong (layout issues, missing dependencies, etc.)
5. **Fix Forward**: Create a new branch with the corrected implementation

## Acceptance Checklist

Before marking this feature as complete:

- [ ] orbital-core JSX element has been removed
- [ ] Four CSS rules for orbital-core have been removed
- [ ] inclusionScore variable is preserved and used in scoreCards
- [ ] Component compiles without TypeScript errors
- [ ] Component renders without React errors
- [ ] Orbital rings are visible and animating
- [ ] Floating tags (Diversite and Impact) are visible
- [ ] No inclusion score text appears in the hero section
- [ ] Analytics panel displays correctly with IA Shortlisting card
- [ ] Unit tests pass with >80% coverage
- [ ] Snapshot test created and passing
- [ ] Manual visual verification completed in dev environment
- [ ] No console errors or warnings

## Future Considerations

### Potential Follow-up Work

1. **Analytics Panel Refactoring**: If the inclusion score concept is being deprecated entirely, consider whether the "IA Shortlisting" card in the analytics panel should also be renamed or removed in a future iteration.

2. **Variable Naming**: The `inclusionScore` variable name may be misleading if it's now only used for AI shortlisting metrics. Consider renaming to `aiShortlistingScore` in a follow-up PR for clarity.

3. **Design System Update**: If this removal is part of a broader design refresh, document the new orbital visualization pattern (rings + tags only, no center element) in the design system for consistency across other pages.

4. **Performance Optimization**: With one fewer element in the orbital visualization, consider whether additional animations or effects could be added to the rings or tags without impacting performance.

### Migration Path

This is a standalone UI change with no migration requirements. No database schema changes, API modifications, or data migrations are needed.

## Conclusion

This design provides a complete specification for removing the inclusion score display from the enterprise home page. The implementation is straightforward and low-risk:

- **Single file modification**: Only `entreprise-home.tsx` needs changes
- **Surgical deletion**: Remove one JSX element and four CSS rules
- **No data impact**: All API calls and data processing remain unchanged
- **Preserved functionality**: Orbital rings, floating tags, and analytics panel continue working

The testing strategy focuses on verification rather than property-based testing, as this is a presentational change with no complex logic to test across input variations. Visual verification and snapshot testing are the primary validation methods.
