const typography = {
  fontFamily: {
    sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    heading: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    body: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
  },
  fontSize: {
    "display": ["clamp(2rem, 3vw, 2.75rem)", { lineHeight: "1.05", letterSpacing: "0" }],
    "page": ["clamp(1.9rem, 2.6vw, 2.25rem)", { lineHeight: "1.08", letterSpacing: "0" }],
    "section": ["1.375rem", { lineHeight: "1.2", letterSpacing: "0" }],
    "card-title": ["1.125rem", { lineHeight: "1.3", letterSpacing: "0" }],
    "stat": ["clamp(1.75rem, 2.4vw, 2rem)", { lineHeight: "1", letterSpacing: "0" }],
    "body": ["0.875rem", { lineHeight: "1.55", letterSpacing: "0" }],
    "body-sm": ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0" }],
    "caption": ["0.75rem", { lineHeight: "1.35", letterSpacing: "0.08em" }],
  },
};

module.exports = typography;
