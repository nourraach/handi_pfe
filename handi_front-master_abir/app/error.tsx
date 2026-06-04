"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="app-theme error-page">
      <section className="error-panel">
        <p className="badge">Erreur</p>
        <h1 className="page-title page-title-sm">Une erreur est survenue</h1>
        <p className="page-description">Vous pouvez recharger cette section sans quitter votre espace.</p>
        <Button onClick={reset}>Reessayer</Button>
      </section>
    </main>
  );
}
