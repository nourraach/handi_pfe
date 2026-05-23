"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { FloatingCard, FloatingCardContent } from "@/components/ui/floating-card";

/**
 * Demo page for UI components created in Task 2
 * This page demonstrates the Button and FloatingCard components
 */
export default function UIComponentsDemo() {
  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            UI Components Demo
          </h1>
          <p className="text-text-muted">
            Showcasing Button and FloatingCard components from Task 2
          </p>
        </div>

        {/* Button Component Demo */}
        <section className="bg-white rounded-lg p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">
            Button Component
          </h2>
          
          <div className="space-y-6">
            {/* Primary and Secondary Variants */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>

            {/* Full Width */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Full Width
              </h3>
              <Button variant="primary" fullWidth>
                Full Width Button
              </Button>
            </div>

            {/* With ARIA Labels */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Accessibility (with ARIA labels)
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" aria-label="Submit form">
                  Submit
                </Button>
                <ButtonLink href="/inscription" variant="secondary" aria-label="Navigate to registration page">
                  Get Started
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        {/* FloatingCard Component Demo */}
        <section className="bg-white rounded-lg p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">
            FloatingCard Component
          </h2>
          
          <div className="space-y-8">
            {/* Match Card */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Match Card (with glassmorphism effect)
              </h3>
              <div className="relative h-64 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 rounded-[52px] p-8">
                <FloatingCard type="match" position="top">
                  <FloatingCardContent
                    kicker="Top match for you"
                    title="UI/UX Designer"
                    subtitle="94% Match"
                  />
                </FloatingCard>
              </div>
            </div>

            {/* Stats Card */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Stats Card
              </h3>
              <div className="relative h-64 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 rounded-[52px] p-8">
                <FloatingCard type="stats" position="right">
                  <FloatingCardContent
                    kicker="Success Rate"
                    title="98%"
                    subtitle="Placement Success"
                    badge="Verified"
                  />
                </FloatingCard>
              </div>
            </div>

            {/* Progress Card */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                Progress Card
              </h3>
              <div className="relative h-64 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 rounded-[52px] p-8">
                <FloatingCard type="progress" position="bottom">
                  <FloatingCardContent
                    kicker="Your Progress"
                    title="Profile 75% Complete"
                    subtitle="Almost there!"
                  />
                </FloatingCard>
              </div>
            </div>

            {/* All Cards Together */}
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-3">
                All Cards Together (Hero Section Preview)
              </h3>
              <div className="relative h-96 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 rounded-[52px] p-8 overflow-hidden">
                <div className="text-white">
                  <h2 className="text-3xl font-bold mb-4">
                    Find Your Perfect Match
                  </h2>
                  <p className="text-white/85 mb-6">
                    Connect with opportunities that match your skills and aspirations
                  </p>
                  <div className="flex gap-4">
                    <Button variant="primary">Get Started</Button>
                    <Button variant="secondary">Learn More</Button>
                  </div>
                </div>

                <FloatingCard type="match" position="top">
                  <FloatingCardContent
                    kicker="Top match for you"
                    title="UI/UX Designer"
                    subtitle="94% Match"
                  />
                </FloatingCard>

                <FloatingCard type="stats" position="right">
                  <FloatingCardContent
                    kicker="Success Rate"
                    title="98%"
                    subtitle="Placement Success"
                  />
                </FloatingCard>

                <FloatingCard type="progress" position="bottom">
                  <FloatingCardContent
                    kicker="Your Progress"
                    title="Profile 75% Complete"
                    subtitle="Almost there!"
                  />
                </FloatingCard>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="bg-white rounded-lg p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">
            Technical Details
          </h2>
          
          <div className="space-y-4 text-text-muted">
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Button Component</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Supports primary, secondary, ghost, and danger variants</li>
                <li>Three sizes: small, medium, large</li>
                <li>Hover state transitions with 300ms duration</li>
                <li>Keyboard navigation support (tabIndex=0)</li>
                <li>ARIA attributes for accessibility</li>
                <li>Full width option available</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-text-primary mb-2">FloatingCard Component</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Glassmorphism effect with backdrop-blur and opacity &lt; 0.2</li>
                <li>Three card types: match, stats, progress</li>
                <li>Positioning logic ensures cards stay within container bounds</li>
                <li>Responsive behavior for mobile devices</li>
                <li>ARIA role and labels for accessibility</li>
                <li>Customizable content with FloatingCardContent helper</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
