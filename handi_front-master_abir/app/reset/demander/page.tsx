"use client";

import Link from "next/link";
import { useState } from "react";
import { construireUrlApi } from "@/lib/config";
import styles from "./reset-request.module.css";

export default function DemanderResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [testLink, setTestLink] = useState<string | null>(null);

  const envoyer = async () => {
    setLoading(true);
    setMessage(null);
    setErreur(null);
    setTestLink(null);

    try {
      const res = await fetch(construireUrlApi("/api/auth/demander-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      if (data.donnees?.lien_reset) {
        setTestLink(data.donnees.lien_reset);
        setMessage("SMTP non configure: le lien ci-dessous est genere pour le test local.");
      } else if (data.donnees?.token) {
        setMessage(`Token demo: ${data.donnees.token}`);
      } else {
        setMessage("If the account exists, a reset email or SMS has been sent.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unable to send reset link.";
      setErreur(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    await envoyer();
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-label="Password reset">
        <aside className={styles.brandPanel} aria-label="HandiTalents branding">
          <span className={styles.bgOrbOne} aria-hidden="true" />
          <span className={styles.bgOrbTwo} aria-hidden="true" />
          <span className={styles.bgGrid} aria-hidden="true" />
          <span className={styles.bgParticles} aria-hidden="true" />

          <header className={styles.brandHeader}>
            <div className={styles.logoMark} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong className={styles.brandName}>HandiTalents</strong>
              <p className={styles.brandSub}>Inclusive Hiring Platform</p>
            </div>
          </header>

          <div className={styles.brandContent}>
            <p className={styles.badge}>
              <ShieldIcon />
              Secure Account Recovery
            </p>
            <h1 className={styles.heroTitle}>Reset your password</h1>
            <p className={styles.heroText}>
              No worries, it happens. Enter your email and we&apos;ll send you a secure link to reset your password.
            </p>
          </div>
        </aside>

        <section className={styles.formPanel} aria-label="Password reset form">
          <div className={styles.formCard}>
            <div className={styles.topAction}>
              <Link href="/" className={styles.backButton}>
                <ArrowLeftIcon />
                Back to website
              </Link>
            </div>

            <div className={styles.formHeader}>
              <h2>Reset your password</h2>
              <p>
                Enter the email address associated with your account and we&apos;ll send you a link to reset your
                password.
              </p>
            </div>

            <form onSubmit={onSubmit} className={styles.form} noValidate>
              <label htmlFor="email-reset" className={styles.fieldLabel}>
                Email address
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <MailIcon />
                </span>
                <input
                  id="email-reset"
                  type="email"
                  className={styles.input}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  aria-required="true"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !email.trim()}
                aria-label="Send password reset link"
              >
                {loading ? "Sending..." : "Send reset link"}
                <SendIcon />
              </button>

              {message ? (
                <p className={styles.feedbackInfo} role="status" aria-live="polite">
                  {message}
                </p>
              ) : null}

              {testLink ? (
                <p className={styles.feedbackInfo} role="status" aria-live="polite">
                  <a href={testLink} target="_blank" rel="noreferrer">
                    Open reset link
                  </a>
                </p>
              ) : null}

              {erreur ? (
                <p className={styles.feedbackError} role="alert" aria-live="assertive">
                  {erreur}
                </p>
              ) : null}
            </form>

            <div className={styles.divider} aria-hidden="true">
              <span />
              <em>or</em>
              <span />
            </div>

            <Link href="/connexion" className={styles.signInLink}>
              Back to sign in
            </Link>

            <p className={styles.securityNote}>
              <ShieldIcon />
              The reset link will expire in 15 minutes for your security.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function BaseIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function MailIcon() {
  return (
    <BaseIcon>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 5.8L19.5 7" />
    </BaseIcon>
  );
}

function ArrowLeftIcon() {
  return (
    <BaseIcon>
      <path d="M15 18 9 12l6-6" />
      <path d="M10 12h8" />
    </BaseIcon>
  );
}

function SendIcon() {
  return (
    <BaseIcon>
      <path d="M3.2 11.7 20.8 4.5l-6 15-3.3-5-5.1 3.1 1.2-5.4-4.4-.5Z" />
    </BaseIcon>
  );
}

function ShieldIcon() {
  return (
    <BaseIcon>
      <path d="M12 3.5 19 6v6.6c0 4.3-2.9 7.5-7 8.9-4.1-1.4-7-4.6-7-8.9V6l7-2.5Z" />
      <path d="m9.8 12.4 1.8 1.8 3-3" />
    </BaseIcon>
  );
}
