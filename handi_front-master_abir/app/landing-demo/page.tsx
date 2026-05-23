"use client";

import { TopBar } from "@/components/landing/TopBar";
import { Navbar, MenuItem } from "@/components/landing/Navbar";
import { HeroSection, FloatingCardData } from "@/components/landing/HeroSection";
import { FloatingCardContent } from "@/components/ui/floating-card";
import { FeaturesSection, Feature } from "@/components/landing/FeaturesSection";
import { StepCard } from "@/components/landing/StepCard";

const menuItems: MenuItem[] = [
  { label: "Features", href: "#features", active: false },
  { label: "How It Works", href: "#how-it-works", active: false },
  { label: "Testimonials", href: "#testimonials", active: false },
  { label: "About", href: "#about", active: false },
];

const floatingCards: FloatingCardData[] = [
  {
    type: "match",
    position: "top",
    content: (
      <FloatingCardContent
        kicker="Top match for you"
        title="UI/UX Designer"
        subtitle="94% Match"
      />
    ),
  },
  {
    type: "stats",
    position: "right",
    content: (
      <FloatingCardContent
        kicker="Success Rate"
        title="87%"
        subtitle="Placement Success"
        badge="Verified"
      />
    ),
  },
  {
    type: "progress",
    position: "bottom",
    content: (
      <FloatingCardContent
        kicker="Your Progress"
        title="Profile Complete"
        subtitle="3 steps remaining"
      />
    ),
  },
];

const features: Feature[] = [
  {
    title: "Smart Matching",
    text: "Our AI-powered algorithm matches candidates with the right opportunities based on skills, experience, and accessibility needs.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Inclusive Workspace",
    text: "Built with accessibility in mind, our platform ensures everyone can navigate, apply, and succeed regardless of their abilities.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: "Verified Employers",
    text: "All companies on our platform are verified and committed to creating inclusive work environments for diverse talent.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Career Support",
    text: "Get access to career coaching, interview preparation, and ongoing support to help you succeed in your new role.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export default function LandingDemo() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <TopBar email="contact@handitalents.com" phone="+216 50 370 046" />
      <Navbar
        logoSrc="/branding/logo-handitalents.png"
        logoAlt="HandiTalents Logo"
        menuItems={menuItems}
        loginHref="/connexion"
        ctaHref="/inscription"
      />
      
      {/* Demo Content */}
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Hero Section Demo */}
        <HeroSection
          badge="🚀 Inclusive Hiring Platform"
          title="Connect Talent with"
          highlightText="Opportunity"
          description="HandiTalents bridges the gap between talented individuals with disabilities and forward-thinking employers. Build diverse teams and unlock potential."
          primaryCta={{
            label: "Get Started Free",
            href: "/inscription",
          }}
          secondaryCta={{
            label: "Learn More",
            href: "#features",
          }}
          trustBadges={["500+ Companies", "10,000+ Candidates", "ISO Certified"]}
          heroImage="/branding/hero-reference.png"
          floatingCards={floatingCards}
        />

        <section className="min-h-screen flex items-center justify-center mt-16">
          <div className="text-center">
            <h1 className="text-hero font-heading font-bold text-purple-900 mb-6">
              Hero Section Demo
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto mb-8">
              The hero section above demonstrates the rounded container with gradient background,
              floating cards with glassmorphism effect, and responsive layout.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="#features"
                className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
              >
                View Features
              </a>
              <a
                href="#section2"
                className="px-6 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                Scroll to Section 2
              </a>
            </div>
          </div>
        </section>

        {/* Features Section Demo */}
        <section id="features" className="mb-16">
          <FeaturesSection
            features={features}
            heading="Fonctionnalités clés"
            description="Découvrez comment HandiTalents facilite la connexion entre talents et opportunités"
          />
        </section>

        {/* How It Works Section Demo - StepCard */}
        <section id="how-it-works" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-h2 font-heading font-bold text-purple-900 mb-4">
              Comment ça marche
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Suivez ces étapes simples pour commencer votre parcours avec HandiTalents
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <StepCard
              step="1"
              title="Créez votre profil"
              description="Inscrivez-vous et complétez votre profil avec vos compétences, expériences et besoins d'accessibilité."
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              showArrow={true}
            />
            
            <StepCard
              step="2"
              title="Découvrez les opportunités"
              description="Parcourez les offres d'emploi adaptées à votre profil et postulez en un clic."
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              showArrow={true}
            />
            
            <StepCard
              step="3"
              title="Commencez votre carrière"
              description="Passez les entretiens et démarrez votre nouvelle aventure professionnelle."
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
              showArrow={false}
            />
          </div>
        </section>

        <section id="section1" className="min-h-screen flex items-center justify-center bg-white rounded-xl shadow-soft p-12 mb-8">
          <div className="text-center">
            <h2 className="text-h2 font-heading font-bold text-purple-900 mb-4">
              Section 1
            </h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              This section demonstrates the sticky navbar behavior. As you scroll,
              the navbar should stick to the top with a glassmorphism backdrop effect.
            </p>
          </div>
        </section>

        <section id="section2" className="min-h-screen flex items-center justify-center bg-white rounded-xl shadow-soft p-12">
          <div className="text-center">
            <h2 className="text-h2 font-heading font-bold text-purple-900 mb-4">
              Section 2
            </h2>
            <p className="text-lg text-text-muted max-w-xl mx-auto">
              The mobile menu appears when the screen width is less than 768px.
              Try resizing your browser window to see the hamburger menu icon.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
