"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main className="app-theme error-page">
          <section className="error-panel">
            <p className="badge">Erreur</p>
            <h1 className="page-title page-title-sm">L'application n'a pas pu se charger</h1>
            <p className="page-description">Relancez le rendu de la page pour revenir a votre espace.</p>
            <button type="button" onClick={reset}>
              Reessayer
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
