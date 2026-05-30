"use client";

import { TableauDemandesAdmin } from "@/components/tableau-demandes-admin";

export default function DemandesEnAttentePage() {
  return (
    <main className="page-centree section-page app-theme">
      <div className="admin-queue-page">
        <section className="admin-queue-hero">
          <div>
            <p className="admin-queue-kicker">Review queue</p>
            <h1>Registration approvals</h1>
          </div>
        </section>
        <TableauDemandesAdmin />
      </div>
    </main>
  );
}
