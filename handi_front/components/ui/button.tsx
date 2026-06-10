"use client";

import Link, { LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function buttonClassName(variant: ButtonVariant, size: ButtonSize, fullWidth?: boolean, className?: string) {
  return classes(
    "ui-button",
    `ui-button-${variant}`,
    size === "sm" && "ui-button-sm",
    size === "lg" && "ui-button-lg",
    fullWidth && "ui-button-full",
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  "aria-label"?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buttonClassName(variant, size, fullWidth, className)}
      aria-label={ariaLabel}
    />
  );
}

interface ButtonLinkProps extends LinkProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  "aria-label"?: string;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  "aria-label": ariaLabel,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={buttonClassName(variant, size, fullWidth, className)}
      aria-label={ariaLabel}
    />
  );
}
