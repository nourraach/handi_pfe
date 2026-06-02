"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { SignupChoiceCard } from "@/components/signup-choice-card";
import styles from "@/app/connexion/page.module.css";

export default function InscriptionModalPage() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={`${styles.page} auth-modal-route`}>
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.center}>
        <SignupChoiceCard />
      </div>
    </div>,
    document.body
  );
}
