import React from "react";
import { FeatureCard } from "./FeatureCard";

/**
 * Feature data structure
 */
export interface Feature {
  /** Feature title (max 60 characters) */
  title: string;
  /** Feature description (max 200 characters) */
  text: string;
  /** Optional icon element */
  icon?: React.ReactNode;
}

/**
 * Props for the FeaturesSection component
 */
export interface FeaturesSectionProps {
  /** Array of features to display (minimum 4 required) */
  features: Feature[];
  /** Optional section heading */
  heading?: string;
  /** Optional section description */
  description?: string;
}

/**
 * FeaturesSection component displays a grid of feature cards
 * 
 * Requirements:
 * - 5.1: Display at least four feature cards in a grid layout
 * - 5.5: Apply 4-column layout on desktop, 2-column on tablet, 1-column on mobile
 * - 3.1, 3.2, 3.3: Responsive layout across devices
 */
export function FeaturesSection({
  features,
  heading = "Fonctionnalités clés",
  description,
}: FeaturesSectionProps) {
  return (
    <section className="features-section py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-h2 font-bold text-text-primary font-heading">
            {heading}
          </h2>
          {description && (
            <p className="mt-4 text-lg text-text-muted font-body max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          role="list"
        >
          {features.map((feature, index) => (
            <div key={index} role="listitem">
              <FeatureCard
                title={feature.title}
                description={feature.text}
                icon={feature.icon}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
