import type { ElementType, HTMLAttributes, ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type HeadingVariant = "display" | "page" | "section" | "card";
type TextVariant = "body" | "small" | "muted";

const headingClassMap: Record<HeadingVariant, string> = {
  display: "ht-heading ht-heading-display",
  page: "ht-heading ht-heading-page",
  section: "ht-heading ht-heading-section",
  card: "ht-heading ht-heading-card",
};

const textClassMap: Record<TextVariant, string> = {
  body: "ht-text",
  small: "ht-text ht-text-small",
  muted: "ht-text ht-text-muted",
};

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
  variant?: HeadingVariant;
}

export function Heading({ as: Component = "h2", variant = "section", className, ...props }: HeadingProps) {
  return <Component {...props} className={classes(headingClassMap[variant], className)} />;
}

interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: TextVariant;
}

export function Text({ as: Component = "p", variant = "body", className, ...props }: TextProps) {
  return <Component {...props} className={classes(textClassMap[variant], className)} />;
}

interface CaptionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export function Caption({ as: Component = "span", className, ...props }: CaptionProps) {
  return <Component {...props} className={classes("ht-caption", className)} />;
}

interface StatProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  size?: "default" | "compact";
}

export function Stat({ value, label, hint, size = "default", className, ...props }: StatProps) {
  return (
    <div {...props} className={classes("ht-stat", size === "compact" && "ht-stat-compact", className)}>
      <strong>{value}</strong>
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
