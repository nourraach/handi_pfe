# Premium Landing Page Design System

This document describes the design system configuration for the HandiTalents premium landing page redesign.

## Color Palette

### Purple Scale
- `purple-900`: #3b1d72 (Darkest purple)
- `purple-800`: #4e2b91
- `purple-700`: #6f45be
- `purple-600`: #8657d6
- `purple-200`: #d8c5ff (Lightest purple)

### Background Colors
- `bg-primary`: #f7f4ff
- `bg-soft`: #f4edff
- `bg-white`: #ffffff

### Text Colors
- `text-primary`: #1f1736
- `text-muted`: #6c5f8f

### Border Color
- `border`: rgba(83, 49, 145, 0.14)

## Typography

### Font Families
- **Headings**: Outfit (via `font-heading` class)
- **Body**: Plus Jakarta Sans (via `font-body` class)

### Font Sizes (Responsive with clamp())
- `text-hero`: clamp(2.15rem, 4.8vw, 4rem)
- `text-h2`: clamp(1.8rem, 3.2vw, 2.8rem)
- `text-h3`: clamp(1.5rem, 2.6vw, 2rem)
- `text-body`: 1rem
- `text-small`: 0.9rem
- `text-tiny`: 0.74rem

## Border Radius Scale
- `rounded-xl`: 52px (Hero containers)
- `rounded-lg`: 30px (Large cards)
- `rounded-md`: 22px (Medium cards)
- `rounded-sm`: 16px (Small elements)
- `rounded-full`: 999px (Fully rounded)

## Shadow Scale
- `shadow-soft`: 0 16px 40px rgba(75, 38, 141, 0.1)
- `shadow-mid`: 0 24px 60px rgba(66, 33, 126, 0.18)
- `shadow-strong`: 0 34px 90px rgba(47, 21, 93, 0.3)

## Spacing System
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 34px
- `2xl`: 48px
- `3xl`: 58px

## Usage Examples

### Headings
```tsx
<h1 className="font-heading text-hero text-text-primary">
  Premium Landing Page
</h1>
```

### Body Text
```tsx
<p className="font-body text-body text-text-muted">
  This is body text using Plus Jakarta Sans
</p>
```

### Cards
```tsx
<div className="rounded-lg bg-bg-white shadow-soft border border-border">
  Card content
</div>
```

### Hero Container
```tsx
<div className="rounded-xl bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 shadow-strong">
  Hero content
</div>
```

## Configuration Files

- **Tailwind Config**: `handi_front-master/tailwind.config.js`
- **Root Layout**: `handi_front-master/app/layout.tsx`
- **Global Styles**: `handi_front-master/app/globals.css`

## Requirements Validated

This design system configuration validates the following requirements:
- **1.1**: Purple color palette (#3b1d72, #4e2b91, #6f45be, #8657d6, #d8c5ff)
- **1.2**: Border-radius scale (52px, 30px, 22px, 16px)
- **1.3**: Shadow scale (soft, mid, strong)
- **1.4**: Font families (Outfit for headings, Plus Jakarta Sans for body)
- **13.2**: Responsive typography using clamp() functions
- **16.1**: Spacing scale (8px, 12px, 16px, 24px, 34px, 48px, 58px)
- **16.2**: Consistent border-radius values
- **16.3**: Shadow values from defined scale
- **16.4**: Colors from defined purple palette
- **16.5**: Typography scale with consistent font families, sizes, and weights
