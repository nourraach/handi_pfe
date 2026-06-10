import type { HTMLAttributes } from "react";

type CardTone = "default" | "accent" | "dark";
type CardPadding = "sm" | "md" | "lg";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const toneClassMap: Record<CardTone, string> = {
  default: "",
  accent: "ui-card-accent",
  dark: "ui-card-dark",
};

const paddingClassMap: Record<CardPadding, string> = {
  sm: "p-4 md:p-6",
  md: "p-6",
  lg: "p-6 sm:p-8",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  interactive?: boolean;
}

export function Card({
  tone = "default",
  padding = "md",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={classes("ui-card", toneClassMap[tone], paddingClassMap[padding], interactive && "ui-card-interactive", className)}
    />
  );
}
