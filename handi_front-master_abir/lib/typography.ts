export const typography = {
  fontFamily:
    "var(--font-inter), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  scale: {
    display: "clamp(2rem, 3vw, 2.75rem)",
    page: "clamp(1.9rem, 2.6vw, 2.25rem)",
    section: "1.375rem",
    cardTitle: "1.125rem",
    stat: "clamp(1.75rem, 2.4vw, 2rem)",
    body: "0.875rem",
    bodySmall: "0.8125rem",
    caption: "0.75rem",
  },
  lineHeight: {
    tight: "1.08",
    heading: "1.2",
    body: "1.55",
    caption: "1.35",
  },
} as const;

export type HeadingVariant = "display" | "page" | "section" | "card";
export type TextVariant = "body" | "small" | "muted";
