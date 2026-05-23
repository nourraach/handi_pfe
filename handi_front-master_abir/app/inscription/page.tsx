"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signup-icon">
      <path d="M14.5 6.5L9 12l5.5 5.5M10 12h9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signup-icon">
      <path d="M12 3l7 3v5c0 4.8-3 8.7-7 10-4-1.3-7-5.2-7-10V6l7-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.2-3.2" />
    </svg>
  );
}

function CandidateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signup-icon">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20a7 7 0 0114 0" />
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signup-icon">
      <path d="M3.5 20.5h17M5 20.5V8.5h6v12M11 20.5V4.5h8v16" />
      <path d="M7.5 11h1M7.5 14h1M13.5 7h1M16.5 7h1M13.5 10h1M16.5 10h1M13.5 13h1M16.5 13h1" />
    </svg>
  );
}

const accountCards = [
  {
    key: "candidate",
    badge: "CANDIDATE",
    index: "01",
    title: "Job seeker",
    description:
      "Create a candidate account to explore roles, save favorites, and track applications in one place.",
    benefits: ["Explorer des offres inclusives", "Suivre vos candidatures", "Centraliser votre profil"],
    href: "/inscription/candidat",
  },
  {
    key: "company",
    badge: "ENTREPRISE",
    index: "02",
    title: "Company or staff",
    description:
      "Create a company account to publish jobs, review applicants, and coordinate interviews with your team.",
    benefits: ["Publier des offres rapidement", "Analyser les candidatures", "Planifier les entretiens"],
    href: "/inscription/entreprise",
  },
] as const;

export default function InscriptionPage() {
  const { t } = useI18n();

  return (
    <main className="signup-exact">
      <section className="signup-exact__container" aria-labelledby="signup-title">
        <header className="signup-exact__topbar">
          <Link href="/" className="signup-exact__brand" aria-label="HandiTalents home">
            <span className="signup-exact__brand-logo" aria-hidden="true" />
            <span className="signup-exact__brand-copy">
              <strong>HandiTalents</strong>
              <small>INCLUSIVE HIRING PLATFORM</small>
            </span>
          </Link>

          <Link href="/" className="signup-exact__back" aria-label={t("authShell.backToLanding")}>
            <ArrowLeftIcon />
            <span>{t("authShell.backToLanding")}</span>
          </Link>
        </header>

        <section className="signup-exact__hero">
          <div className="signup-exact__hero-copy">
            <p className="signup-exact__security-badge">
              <ShieldIcon />
              <span>INSCRIPTION SECURISEE</span>
            </p>
            <h1 id="signup-title">Create your account</h1>
            <p>Choose the account that matches your role and continue.</p>
          </div>
        </section>

        <section className="signup-exact__cards" aria-label="Account options">
          {accountCards.map((card) => (
            <article key={card.key} className={`signup-exact__card signup-exact__card-${card.key}`}>
              <div className="signup-exact__card-head">
                <div className="signup-exact__card-badge-wrap">
                  <span className="signup-exact__card-icon" aria-hidden="true">
                    {card.key === "candidate" ? <CandidateIcon /> : <CompanyIcon />}
                  </span>
                  <span className="signup-exact__card-badge">{card.badge}</span>
                </div>
                <span className="signup-exact__card-index">{card.index}</span>
              </div>

              <h2>{card.title}</h2>
              <p className="signup-exact__card-description">{card.description}</p>

              <ul className="signup-exact__card-benefits">
                {card.benefits.map((item) => (
                  <li key={`${card.key}-${item}`}>
                    <span className="signup-exact__check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="signup-exact__card-actions">
                <Link href={card.href} className="signup-exact__cta">
                  Continue
                </Link>
                <span className="signup-exact__circle-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </article>
          ))}
        </section>

        <footer className="signup-exact__footer">
          <div className="signup-exact__footer-security">
            <span className="signup-exact__footer-shield" aria-hidden="true">
              <ShieldIcon />
            </span>
            <p>
              <strong>Your data is safe with us.</strong>
              <span>We use advanced security to protect your information.</span>
            </p>
          </div>

          <p className="signup-exact__signin">
            Already have an account? <Link href="/connexion">Sign in here</Link>
            <span aria-hidden="true">→</span>
          </p>
        </footer>
      </section>
    </main>
  );
}
