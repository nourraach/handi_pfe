"use client";

import { TableauDemandesAdmin } from "@/components/tableau-demandes-admin";

export default function DemandesEnAttentePage() {
  return (
    <main className="page-centree section-page app-theme">
      <div className="admin-queue-page">
        <TableauDemandesAdmin />
      </div>
    </main>
  );
}
