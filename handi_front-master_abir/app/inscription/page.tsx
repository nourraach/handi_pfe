"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signup-icon">
      <path d="M6 6l12 12M18 6L6 18" />
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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signup-icon">
      <path d="M5 12h14M13 7l5 5-5 5" />
    </svg>
  );
}

const accountCards = [
  { key: "candidate", badge: "CANDIDAT", href: "/inscription/candidat" },
  { key: "company", badge: "ENTREPRISE", href: "/inscription/entreprise" },
] as const;

export default function InscriptionPage() {
  const router = useRouter();

  const closeSignup = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <main className="signup-exact">
      <section className="signup-exact__container" aria-labelledby="signup-title">
        <button type="button" className="signup-exact__close" aria-label="Fermer" onClick={closeSignup}>
          <CloseIcon />
        </button>

        <header className="signup-exact__brand-header" aria-label="HandiTalents">
          <div className="signup-exact__brand">
            <span className="signup-exact__brand-logo" aria-hidden="true" />
            <span className="signup-exact__brand-copy">
              <strong>
                Handi<span>Talents</span>
              </strong>
              <small>PLATEFORME DE RECRUTEMENT INCLUSIVE</small>
            </span>
          </div>
        </header>

        <section className="signup-exact__hero">
          <div className="signup-exact__hero-copy">
            <p className="signup-exact__security-badge">
              <ShieldIcon />
              <span>INSCRIPTION SECURISEE</span>
            </p>
            <h1 id="signup-title">Creez votre compte</h1>
            <p>Choisissez le type de compte qui correspond a vos besoins.</p>
          </div>
        </section>

        <section className="signup-exact__cards" aria-label="Account options">
          {accountCards.map((card) => (
            <article key={card.key} className={`signup-exact__card signup-exact__card-${card.key}`}>
              <span className="signup-exact__card-icon" aria-hidden="true">
                {card.key === "candidate" ? <CandidateIcon /> : <CompanyIcon />}
              </span>
              <h2>{card.badge}</h2>
              <div className="signup-exact__card-actions">
                <Link href={card.href} className="signup-exact__circle-arrow" aria-label={`Choisir ${card.badge.toLowerCase()}`}>
                  <ArrowRightIcon />
                </Link>
              </div>
            </article>
          ))}
        </section>

        <div className="signup-exact__or" aria-hidden="true">
          <span />
          <strong>ou</strong>
          <span />
        </div>

        <footer className="signup-exact__footer">
          <div className="signup-exact__footer-security">
            <span className="signup-exact__footer-shield" aria-hidden="true">
              <ShieldIcon />
            </span>
            <p>
              <strong>Vos donnees sont en securite</strong>
              <span>Nous protegeons vos informations personnelles.</span>
            </p>
          </div>

          <p className="signup-exact__signin">
            Vous avez deja un compte ? <Link href="/connexion">Se connecter</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}
