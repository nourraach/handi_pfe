"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormulaireConnexion } from "@/components/formulaire-connexion";
import styles from "./connexion-modal.module.css";

type ConnexionModalProps = {
  inline?: boolean;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.closeIcon}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.badgeIcon}>
      <path d="M12 3l7 3v5c0 4.8-3 8.7-7 10-4-1.3-7-5.2-7-10V6l7-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.2-3.2" />
    </svg>
  );
}

function ConnexionDialog({ onClose }: { onClose: () => void }) {
  return (
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="connexion-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className={styles.closeButton} aria-label="Fermer" title="Fermer" onClick={onClose}>
        <CloseIcon />
      </button>

      <header className={styles.header}>
        <div className={styles.brandMark} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.headerCopy}>
          <p className={styles.badge}>
            <ShieldIcon />
            <span>Connexion securisee</span>
          </p>
          <h1 id="connexion-modal-title">Connectez-vous</h1>
          <p>Connectez-vous pour acceder a votre espace.</p>
        </div>
      </header>

      <div className={styles.formWrap}>
        <FormulaireConnexion />
      </div>

      <p className={styles.footerText}>
        Pas encore de compte ? <Link href="/inscription">Creer un compte</Link>
      </p>
    </section>
  );
}

export function ConnexionModal({ inline = false }: ConnexionModalProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  const closeModal = useCallback(() => {
    if (typeof window !== "undefined") {
      setVisible(false);
      window.location.replace("/");
      return;
    }

    setVisible(false);
    router.replace("/");
  }, [router]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal]);

  if (!visible) {
    return null;
  }

  if (inline) {
    return <ConnexionDialog onClose={closeModal} />;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} onMouseDown={closeModal}>
      <ConnexionDialog onClose={closeModal} />
    </div>,
    document.body
  );
}
