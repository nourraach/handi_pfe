"use client";

import Image from "next/image";
import { FloatingCard } from "@/components/ui/floating-card";
import type { FloatingCardData } from "./HeroSection";

interface HeroVisualProps {
  heroImage: string;
  floatingCards: FloatingCardData[];
}

/**
 * HeroVisual sub-component
 * 
 * Displays:
 * - Hero image using Next.js Image component with priority loading
 * - Floating cards positioned absolutely with glassmorphism effect
 * - Ensures floating cards stay within container bounds
 * 
 * Validates: Requirements 2.2, 10.7, 18.2, 18.4, 3.5
 */
export function HeroVisual({ heroImage, floatingCards }: HeroVisualProps) {
  return (
    <div className="hero-visual relative w-full h-full min-h-[400px] lg:min-h-[500px]">
      {/* Hero Image Container */}
      <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-white/10 backdrop-blur-sm">
        <Image
          src={heroImage}
          alt="HandiTalents platform preview"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Floating Cards */}
      {floatingCards.map((card, index) => (
        <FloatingCard
          key={index}
          type={card.type}
          position={card.position}
        >
          {card.content}
        </FloatingCard>
      ))}
    </div>
  );
}
