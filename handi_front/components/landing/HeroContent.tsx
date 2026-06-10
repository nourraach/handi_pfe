"use client";

import { ButtonLink } from "@/components/ui/button";
import type { CtaButton } from "./HeroSection";

interface HeroContentProps {
  badge: string;
  title: string;
  highlightText: string;
  description: string;
  primaryCta: CtaButton;
  secondaryCta: CtaButton;
  trustBadges: string[];
}

/**
 * HeroContent sub-component
 * 
 * Displays:
 * - Badge, title with highlight, and description
 * - Primary and secondary CTA buttons
 * - Trust badges below CTAs
 * - Responsive typography using clamp()
 * 
 * Validates: Requirements 2.4, 2.5, 9.1, 13.1, 13.2
 */
export function HeroContent({
  badge,
  title,
  highlightText,
  description,
  primaryCta,
  secondaryCta,
  trustBadges,
}: HeroContentProps) {
  return (
    <div className="hero-content flex flex-col gap-6">
      {/* Badge */}
      <div className="inline-flex">
        <span className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium">
          {badge}
        </span>
      </div>

      {/* Title with highlight */}
      <h1 className="font-heading font-extrabold text-hero text-white leading-tight">
        {title}{" "}
        <span className="text-purple-200 relative inline-block">
          {highlightText}
        </span>
      </h1>

      {/* Description */}
      <p className="text-white/90 text-lg leading-relaxed max-w-xl">
        {description}
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <ButtonLink
          href={primaryCta.href}
          variant="secondary"
          size="lg"
          aria-label={primaryCta.label}
        >
          {primaryCta.label}
        </ButtonLink>
        <ButtonLink
          href={secondaryCta.href}
          variant="ghost"
          size="lg"
          className="!bg-white/10 !text-white hover:!bg-white/20 border border-white/30"
          aria-label={secondaryCta.label}
        >
          {secondaryCta.label}
        </ButtonLink>
      </div>

      {/* Trust Badges */}
      {trustBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-6 border-t border-white/20">
          <span className="text-white/70 text-sm font-medium">
            Trusted by:
          </span>
          {trustBadges.map((badge, index) => (
            <span
              key={index}
              className="text-white/90 text-sm font-medium px-3 py-1 rounded-lg bg-white/10"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
