# Bugfix Requirements Document

## Introduction

The company profile page hero section has layout and alignment issues where the dark analytics card overlaps the circular inclusion score visual, making the "Score d'inclusion 80%" text unreadable. Elements are positioned too close together, creating a visually crowded and unprofessional appearance. This fix will establish proper spacing and alignment while maintaining the premium dark-purple visual identity and all existing components.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the hero section renders on desktop screens THEN the dark analytics panel overlaps the circular score visual making content unreadable

1.2 WHEN the hero section renders THEN there is insufficient spacing (less than 32px) between the circular inclusion score and the dark analytics card

1.3 WHEN the hero section renders THEN the "Score d'inclusion 80%" text is hidden behind the dark purple analytics card

1.4 WHEN the hero section renders THEN all visual elements compete for space instead of having a clear three-column layout structure

1.5 WHEN the hero section renders on smaller screens THEN elements do not stack properly in a vertical layout

### Expected Behavior (Correct)

2.1 WHEN the hero section renders on desktop screens THEN the dark analytics panel SHALL NOT overlap the circular score visual and all content SHALL be fully visible

2.2 WHEN the hero section renders THEN there SHALL be at least 32px spacing between the circular inclusion score and the dark analytics card

2.3 WHEN the hero section renders THEN the "Score d'inclusion 80%" text SHALL be fully visible and readable above any background elements

2.4 WHEN the hero section renders THEN the layout SHALL follow a clear three-column structure: left (greeting, subtitle, CTA), center (circular inclusion score), right (dark analytics card)

2.5 WHEN the hero section renders on smaller screens THEN elements SHALL stack vertically in order: greeting section, circular score, analytics card

2.6 WHEN the hero section layout is adjusted THEN the hero height SHALL be reduced if necessary to maintain visual balance

2.7 WHEN the layout changes are applied THEN the layout SHALL use CSS grid with `grid-template-columns: 1fr 300px 340px; gap: 32px; align-items: center;` for the three-column structure

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the layout is fixed THEN all colored hero cards SHALL CONTINUE TO be displayed

3.2 WHEN the layout is fixed THEN the dark purple analytics card SHALL CONTINUE TO have its dark gradient background (linear-gradient(180deg, #2d1236, #1f0d2a))

3.3 WHEN the layout is fixed THEN the circular score visual with orbital rings SHALL CONTINUE TO be displayed

3.4 WHEN the layout is fixed THEN the colored progress bars in the analytics card SHALL CONTINUE TO be displayed

3.5 WHEN the layout is fixed THEN the CTA button with gradient background SHALL CONTINUE TO be displayed

3.6 WHEN the layout is fixed THEN the hero greeting text SHALL CONTINUE TO be displayed

3.7 WHEN the layout is fixed THEN all color values SHALL CONTINUE TO remain unchanged (no color modifications)

3.8 WHEN the layout is fixed THEN all interactive functionality (buttons, links) SHALL CONTINUE TO work as before

3.9 WHEN the layout is fixed THEN the floating tags (Diversite and Impact) on the orbital visual SHALL CONTINUE TO be displayed

3.10 WHEN the layout is fixed THEN the premium dark-purple visual identity SHALL CONTINUE TO be maintained
