# Bugfix Requirements Document

## Introduction

This bugfix addresses a React duplicate key error in the accessibility widget component's link navigator dropdown. The error occurs when multiple anchor tags on the page share the same `href` value, causing React to encounter duplicate keys in the rendered option elements. This violates React's requirement that each child in a list must have a unique key prop. The fix ensures that each option element receives a guaranteed-unique key while maintaining all existing functionality of the link navigator feature.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN multiple anchor tags on the page have the same `href` value (e.g., multiple links to `/offres`) THEN the system generates duplicate React keys for option elements in the link navigator dropdown

1.2 WHEN the accessibility widget renders the link navigator with duplicate href values THEN React logs a console error: "Encountered two children with the same key"

1.3 WHEN anchors are collected from the DOM using `document.querySelectorAll` THEN the system uses `item.href` as the React key without ensuring uniqueness

### Expected Behavior (Correct)

2.1 WHEN multiple anchor tags on the page have the same `href` value THEN the system SHALL generate unique React keys for each option element in the link navigator dropdown

2.2 WHEN the accessibility widget renders the link navigator THEN React SHALL NOT log duplicate key errors

2.3 WHEN anchors are collected from the DOM THEN the system SHALL assign a unique identifier to each item that ensures no key collisions occur

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user selects a link from the link navigator dropdown THEN the system SHALL CONTINUE TO navigate to the selected URL correctly

3.2 WHEN the accessibility widget opens and scans for anchor tags THEN the system SHALL CONTINUE TO collect up to 150 links from `main.app-main a[href]` elements

3.3 WHEN option elements are rendered in the dropdown THEN the system SHALL CONTINUE TO display the anchor's text content (or href as fallback) as the visible label

3.4 WHEN anchors with empty labels are encountered THEN the system SHALL CONTINUE TO filter them out from the links array

3.5 WHEN the "Ouvrir le lien" button is clicked THEN the system SHALL CONTINUE TO navigate to the selected link using `window.location.assign`
