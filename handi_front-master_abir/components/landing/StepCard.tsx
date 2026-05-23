import React from "react";

/**
 * Props for the StepCard component
 */
export interface StepCardProps {
  /** Step number (e.g., "1", "2", "3") */
  step: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Optional icon or visual preview element */
  icon?: React.ReactNode;
  /** Whether to show connecting arrow (for desktop layout) */
  showArrow?: boolean;
}

/**
 * StepCard component displays a process step with numbered badge
 * 
 * Requirements:
 * - 6.3: Display step number, title, and description
 * - 6.5: Include visual preview or icon
 * - 5.4: Apply consistent card styling (white background, border, shadow)
 */
export function StepCard({ 
  step, 
  title, 
  description, 
  icon,
  showArrow = false 
}: StepCardProps) {
  return (
    <div className="relative flex items-center">
      {/* Step Card */}
      <article
        className="step-card rounded-[22px] bg-white border border-purple-200/40 shadow-soft p-6 
                   transition-transform duration-300 hover:-translate-y-2 hover:shadow-mid
                   motion-reduce:transition-none motion-reduce:hover:transform-none
                   flex-1"
      >
        {/* Numbered Badge */}
        <div 
          className="step-badge w-12 h-12 rounded-full bg-gradient-to-br from-purple-800 to-purple-600 
                     flex items-center justify-center text-white font-bold text-lg font-heading
                     shadow-md"
          aria-label={`Step ${step}`}
        >
          {step}
        </div>

        {/* Icon or Visual Preview */}
        {icon && (
          <div className="step-icon mt-4 w-16 h-16 rounded-xl bg-gradient-to-br from-purple-800/10 to-purple-600/20 
                         flex items-center justify-center text-purple-700">
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

      {/* Connecting Arrow (Desktop only) */}
      {showArrow && (
        <div 
          className="hidden lg:flex items-center justify-center mx-4 text-purple-600"
          aria-hidden="true"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="arrow-icon"
          >
            <path 
              d="M5 12H19M19 12L12 5M19 12L12 19" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
