"use client";

import { useEffect } from "react";
import HomePage from "@/app/page";
import { ConnexionModal } from "@/components/connexion-modal";
import styles from "./page.module.css";

export default function ConnexionPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const previousOverflow = document.body.style.overflow;
    document.body.dataset.authModal = "true";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.authModal;
    };
  }, []);

  return (
    <main className={`${styles.page} auth-modal-route`}>
      <div className={styles.backdrop} aria-hidden="true">
        <HomePage />
      </div>
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.center}>
        <ConnexionModal inline />
      </div>
    </main>
  );
}
