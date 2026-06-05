export const typography = {
  fontFamily:
    "var(--font-geist), Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  scale: {
    display: "44px",
    page: "44px",
    section: "28px",
    cardTitle: "20px",
    stat: "clamp(1.75rem, 2.4vw, 2rem)",
    body: "15px",
    bodySmall: "14px",
    caption: "12px",
  },
  lineHeight: {
    tight: "1.1",
    heading: "1.2",
    body: "1.6",
    caption: "1.35",
  },
} as const;

export type HeadingVariant = "display" | "page" | "section" | "card";
export type TextVariant = "body" | "small" | "muted";
