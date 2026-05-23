"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { construireUrlApi } from "@/lib/config";
import { ReponseApi, UtilisateurConnecte } from "@/types/api";
import styles from "./login-modern.module.css";

export default function ConnexionPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChargement(true);
    setMessage(null);
    setErreur(null);

    try {
      const reponse = await fetch(construireUrlApi("/api/auth/connexion"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mdp }),
      });

      const resultat = (await reponse.json()) as ReponseApi<{
        token?: string;
        utilisateur?: UtilisateurConnecte;
      }>;

      if (!reponse.ok) {
        throw new Error(resultat.message ?? t("login.signInFailed"));
      }

      if (typeof window !== "undefined" && resultat.donnees?.token) {
        localStorage.setItem("token_auth", resultat.donnees.token);
        localStorage.setItem("utilisateur_connecte", JSON.stringify(resultat.donnees.utilisateur ?? null));
        if (rememberMe) localStorage.setItem("remember_email", email);
        setMessage(t("login.signInSuccess"));
        router.push("/home");
      }
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : t("login.unknownError"));
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className={styles.page}>
      <span className={styles.bgCircleTop} aria-hidden="true" />
      <span className={styles.bgCircleBottom} aria-hidden="true" />
      <span className={styles.dotTop} aria-hidden="true" />
      <span className={styles.dotBottom} aria-hidden="true" />

      <section className={styles.authCard} aria-label="Login form">
        <header className={styles.brandHeader}>
          <div className={styles.logoCluster} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
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

        <div className={styles.headline}>
          <h1>Welcome back</h1>
          <p>Sign in to continue your inclusive hiring journey.</p>
        </div>

        <form className={styles.form} onSubmit={soumettre}>
          <div className={styles.field}>
            <label htmlFor="login-email">{t("login.email")}</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon} aria-hidden="true">
                <MailIcon />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">{t("login.password")}</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon} aria-hidden="true">
                <LockIcon />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={mdp}
                onChange={(event) => setMdp(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon />
              </button>
            </div>
          </div>

          <div className={styles.optionsRow}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <Link href="/reset/demander" className={styles.forgotLink}>
              {t("login.forgotPassword")}?
            </Link>
          </div>

          <button className={styles.submitButton} disabled={chargement} type="submit">
            {chargement ? t("login.signingIn") : t("login.signInButton")}
          </button>
        </form>

        {message ? (
          <p className={styles.feedbackInfo} role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
        {erreur ? (
          <p className={styles.feedbackError} role="alert" aria-live="assertive">
            {erreur}
          </p>
        ) : null}

        <div className={styles.divider} aria-hidden="true" />

        <p className={styles.footerText}>
          {t("login.noAccount")}{" "}
          <Link href="/inscription" className={styles.createLink}>
            {t("login.createAccount")}
          </Link>
        </p>
      </section>

      <p className={styles.copyright}>© 2025 HandiTalents. All rights reserved.</p>
    </main>
  );
}

function BaseIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function LockIcon() {
  return (
    <BaseIcon>
      <rect x="5" y="10" width="14" height="10" rx="2.2" />
      <path d="M8 10V7.8a4 4 0 1 1 8 0V10" />
      <circle cx="12" cy="14.7" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

function EyeIcon() {
  return (
    <BaseIcon>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </BaseIcon>
  );
}
