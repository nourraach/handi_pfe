"use client";

import { TableauDemandesAdmin } from "@/components/tableau-demandes-admin";
import { useAuth } from "@/hooks/useAuth";

export default function DemandesEnAttentePage() {
  const { utilisateur } = useAuth();

  return (
    <main className="page-centree section-page app-theme">
      <div className="admin-queue-page">
        <section className="admin-queue-hero">
          <div>
            <p className="admin-queue-kicker">Review queue</p>
            <h1>Registration approvals</h1>
            <p>Validate new candidate and company accounts before they enter the platform.</p>
          </div>
          <div className="admin-queue-session" aria-label="Current administrator">
            <span>Signed in as</span>
            <strong>{utilisateur?.nom ?? "Administrateur"}</strong>
          </div>
        </section>
        <TableauDemandesAdmin />
      </div>
    </main>
  );
}
