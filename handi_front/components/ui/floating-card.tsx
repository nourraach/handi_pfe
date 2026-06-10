"use client";

import type { ReactNode } from "react";

type FloatingCardType = "match" | "stats" | "progress";
type FloatingCardPosition = "top" | "right" | "bottom" | "left";

interface FloatingCardProps {
  type: FloatingCardType;
  position?: FloatingCardPosition;
  children: ReactNode;
  className?: string;
}

/**
 * FloatingCard component with glassmorphism effect
 * 
 * Applies backdrop-filter blur with opacity < 0.2 for glassmorphism effect
 * Positions cards absolutely within their container
 * Ensures cards stay within container bounds
 */
export function FloatingCard({
  type,
  position = "top",
  children,
  className = "",
}: FloatingCardProps) {
  // Calculate position based on type and position prop
  const positionClasses = getPositionClasses(type, position);
  
  return (
    <div
      className={`floating-card absolute rounded-[20px] border border-white/30 bg-white/15 backdrop-blur-sm p-4 shadow-mid ${positionClasses} ${className}`}
      role="complementary"
      aria-label={`${type} information card`}
    >
      {children}
    </div>
  );
}

/**
 * Get position classes based on card type and position
 * Ensures cards stay within container bounds
 */
function getPositionClasses(type: FloatingCardType, position: FloatingCardPosition): string {
  const positions: Record<FloatingCardType, Record<FloatingCardPosition, string>> = {
    match: {
      top: "top-[-8px] right-2 w-[220px]",
      right: "right-[-12px] top-[40px] w-[220px]",
      bottom: "bottom-[-8px] right-2 w-[220px]",
      left: "left-2 top-[-8px] w-[220px]",
    },
    stats: {
      top: "top-[-12px] right-[-12px] w-[248px]",
      right: "right-[-12px] top-[182px] w-[248px]",
      bottom: "bottom-[-12px] right-[-12px] w-[248px]",
      left: "left-[-12px] top-[182px] w-[248px]",
    },
    progress: {
      top: "top-[-6px] left-16 w-[260px]",
      right: "right-[-6px] bottom-16 w-[260px]",
      bottom: "bottom-[-6px] left-16 w-[260px]",
      left: "left-16 bottom-[-6px] w-[260px]",
    },
  };

  return positions[type][position] || positions[type].top;
}

/**
 * FloatingCardContent - Helper component for common card content patterns
 */
interface FloatingCardContentProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function FloatingCardContent({
  kicker,
  title,
  subtitle,
  badge,
}: FloatingCardContentProps) {
  return (
    <>
      {kicker && (
        <span className="text-xs uppercase tracking-wider text-white/85">
          {kicker}
        </span>
      )}
      <strong className="block mt-2 text-lg text-white font-semibold">
        {title}
      </strong>
      {subtitle && (
        <p className="mt-1 text-sm text-white/85">
          {subtitle}
        </p>
      )}
      {badge && (
        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs text-white font-medium">
          {badge}
        </span>
      )}
    </>
  );
}
