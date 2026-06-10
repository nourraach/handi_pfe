import React from "react";

/**
 * Props for the FeatureCard component
 */
export interface FeatureCardProps {
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Optional icon element */
  icon?: React.ReactNode;
}

/**
 * FeatureCard component displays an individual feature with hover animation
 * 
 * Requirements:
 * - 5.3: Display icon, title, and description
 * - 5.4: Apply white background, border, and soft shadow
 * - 5.2: Implement hover lift animation (-8px translate, 300ms duration)
 * - 12.1: Smooth hover animations
 */
export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <article
      className="feature-card rounded-[22px] bg-white border border-purple-200/40 shadow-soft p-6 
                 transition-transform duration-300 hover:-translate-y-2 hover:shadow-mid
                 motion-reduce:transition-none motion-reduce:hover:transform-none"
    >
      {/* Icon */}
      {icon && (
        <div className="feature-icon w-10 h-10 rounded-xl bg-gradient-to-br from-purple-800/20 to-purple-600/40 flex items-center justify-center text-purple-700">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="mt-4 text-lg font-semibold text-text-primary font-heading">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-3 text-text-muted text-sm leading-relaxed font-body">
        {description}
      </p>
    </article>
  );
}
