"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export interface MenuItem {
  label: string;
  href: string;
  active?: boolean;
}

interface NavbarProps {
  logoSrc: string;
  logoAlt: string;
  menuItems: MenuItem[];
  loginHref: string;
  ctaHref: string;
}

export function Navbar({
  logoSrc,
  logoAlt,
  menuItems,
  loginHref,
  ctaHref,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-soft"
          : "bg-transparent"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-[1280px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="HandiTalents home"
          >
            <img
              src={logoSrc}
              alt={logoAlt}
              className="h-10 w-auto"
              width={40}
              height={40}
            />
            <span className="font-heading font-bold text-xl text-purple-900 hidden sm:inline">
              HandiTalents
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  item.active
                    ? "text-purple-700 font-semibold"
                    : "text-text-muted hover:text-purple-700"
                }`}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ButtonLink
              href={loginHref}
              variant="ghost"
              size="sm"
              aria-label="Login to your account"
            >
              Login
            </ButtonLink>
            <ButtonLink
              href={ctaHref}
              variant="primary"
              size="sm"
              aria-label="Get started with HandiTalents"
            >
              Get Started
            </ButtonLink>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-purple-900 hover:bg-purple-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden mt-4 pb-4 border-t border-purple-200 pt-4 animate-fadeIn"
          >
            <div className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    item.active
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-text-muted hover:bg-purple-50 hover:text-purple-700"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={item.active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-purple-200">
                <ButtonLink
                  href={loginHref}
                  variant="ghost"
                  fullWidth
                  aria-label="Login to your account"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </ButtonLink>
                <ButtonLink
                  href={ctaHref}
                  variant="primary"
                  fullWidth
                  aria-label="Get started with HandiTalents"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </ButtonLink>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
