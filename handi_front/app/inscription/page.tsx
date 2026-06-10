"use client";

import { useEffect } from "react";
import HomePage from "@/app/page";
import { SignupChoiceCard } from "@/components/signup-choice-card";
import styles from "./page.module.css";

export default function InscriptionPage() {
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
        <SignupChoiceCard />
      </div>
    </main>
  );
}
