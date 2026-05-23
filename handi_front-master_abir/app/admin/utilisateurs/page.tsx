"use client";

import { RouteProtegee } from "@/components/route-protegee";
import { GestionUtilisateurs } from "@/components/gestion-utilisateurs";
import { PageHeader } from "@/components/ui/layout";

export default function UtilisateursAdminPage() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <div className="app-page">
        <PageHeader
          badge="User operations"
          title="Manage platform accounts in a workspace that matches the landing page style."
          description="Filters, tables, actions, and modals now sit inside the same shared UI language as the candidate and company flows."
        />
        <GestionUtilisateurs />
      </div>
    </RouteProtegee>
  );
}
