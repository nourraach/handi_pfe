/**
 * Design System Test Page
 * This page demonstrates the premium design system configuration
 */

export default function DesignSystemTest() {
  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Typography Test */}
        <section className="rounded-lg bg-bg-white p-8 shadow-soft border border-border">
          <h1 className="font-heading text-hero text-text-primary mb-4">
            Typography Test
          </h1>
          <h2 className="font-heading text-h2 text-text-primary mb-4">
            Heading Level 2
          </h2>
          <h3 className="font-heading text-h3 text-text-primary mb-4">
            Heading Level 3
          </h3>
          <p className="font-body text-body text-text-muted mb-4">
            This is body text using Plus Jakarta Sans. It demonstrates the responsive typography with proper line height and spacing.
          </p>
          <p className="font-body text-small text-text-muted">
            This is small text for secondary information.
          </p>
        </section>

        {/* Color Palette Test */}
        <section className="rounded-lg bg-bg-white p-8 shadow-soft border border-border">
          <h2 className="font-heading text-h3 text-text-primary mb-6">
            Color Palette
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-purple-900"></div>
              <p className="text-tiny font-body">purple-900</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-purple-800"></div>
              <p className="text-tiny font-body">purple-800</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-purple-700"></div>
              <p className="text-tiny font-body">purple-700</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-purple-600"></div>
              <p className="text-tiny font-body">purple-600</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-md bg-purple-200"></div>
              <p className="text-tiny font-body">purple-200</p>
            </div>
          </div>
        </section>

        {/* Border Radius Test */}
        <section className="rounded-lg bg-bg-white p-8 shadow-soft border border-border">
          <h2 className="font-heading text-h3 text-text-primary mb-6">
            Border Radius Scale
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 rounded-xl bg-purple-600"></div>
              <p className="text-tiny font-body">rounded-xl (52px)</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-purple-700"></div>
              <p className="text-tiny font-body">rounded-lg (30px)</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-md bg-purple-800"></div>
              <p className="text-tiny font-body">rounded-md (22px)</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-sm bg-purple-900"></div>
              <p className="text-tiny font-body">rounded-sm (16px)</p>
            </div>
          </div>
        </section>

        {/* Shadow Test */}
        <section className="rounded-lg bg-bg-white p-8 shadow-soft border border-border">
          <h2 className="font-heading text-h3 text-text-primary mb-6">
            Shadow Scale
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 rounded-lg bg-bg-white shadow-soft border border-border flex items-center justify-center">
              <p className="text-small font-body">shadow-soft</p>
            </div>
            <div className="h-32 rounded-lg bg-bg-white shadow-mid border border-border flex items-center justify-center">
              <p className="text-small font-body">shadow-mid</p>
            </div>
            <div className="h-32 rounded-lg bg-bg-white shadow-strong border border-border flex items-center justify-center">
              <p className="text-small font-body">shadow-strong</p>
            </div>
          </div>
        </section>

        {/* Gradient Test */}
        <section className="rounded-xl bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 p-8 shadow-strong">
          <h2 className="font-heading text-h2 text-white mb-4">
            Premium Gradient
          </h2>
          <p className="font-body text-body text-white/90">
            This demonstrates the premium purple gradient used in hero sections.
          </p>
        </section>

        {/* Spacing Test */}
        <section className="rounded-lg bg-bg-white p-8 shadow-soft border border-border">
          <h2 className="font-heading text-h3 text-text-primary mb-6">
            Spacing Scale
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-xs h-8 bg-purple-600 rounded"></div>
              <p className="text-small font-body">xs (8px)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-sm h-8 bg-purple-600 rounded"></div>
              <p className="text-small font-body">sm (12px)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-md h-8 bg-purple-600 rounded"></div>
              <p className="text-small font-body">md (16px)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-lg h-8 bg-purple-600 rounded"></div>
              <p className="text-small font-body">lg (24px)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-xl h-8 bg-purple-600 rounded"></div>
              <p className="text-small font-body">xl (34px)</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
