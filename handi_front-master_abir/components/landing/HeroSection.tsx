"use client";

import type { ReactNode } from "react";
import { HeroContent } from "./HeroContent";
import { HeroVisual } from "./HeroVisual";

export interface CtaButton {
  label: string;
  href: string;
}

export interface FloatingCardData {
  type: "match" | "stats" | "progress";
  position: "top" | "right" | "bottom" | "left";
  content: ReactNode;
}

interface HeroSectionProps {
  badge: string;
  title: string;
  highlightText: string;
  description: string;
  primaryCta: CtaButton;
  secondaryCta: CtaButton;
  trustBadges: string[];
  heroImage: string;
  floatingCards: FloatingCardData[];
}

/**
 * HeroSection component with rounded container and gradient background
 * 
 * Renders the main hero section with:
 * - 52px border-radius container
 * - Purple gradient background (purple-900 → purple-800 → purple-600)
 * - Two-column grid layout on desktop
 * - Responsive single-column layout on mobile
 * 
 * Validates: Requirements 2.1, 1.5, 2.6, 3.1, 3.2, 3.3
 */
export function HeroSection({
  badge,
  title,
  highlightText,
  description,
  primaryCta,
  secondaryCta,
  trustBadges,
  heroImage,
  floatingCards,
}: HeroSectionProps) {
  return (
    <section className="hero relative w-full py-8 md:py-12" role="banner">
      <div className="hero-card rounded-[52px] bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 p-8 md:p-14 shadow-strong overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <HeroContent
            badge={badge}
            title={title}
            highlightText={highlightText}
            description={description}
            primaryCta={primaryCta}
            secondaryCta={secondaryCta}
            trustBadges={trustBadges}
          />
          <HeroVisual
            heroImage={heroImage}
            floatingCards={floatingCards}
          />
        </div>
      </div>
    </section>
  );
}
