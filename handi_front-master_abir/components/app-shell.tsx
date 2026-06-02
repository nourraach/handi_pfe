"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { UtilisateurConnecte } from "@/types/api";

export function AppShell({ utilisateur, children }: { utilisateur: UtilisateurConnecte; children: ReactNode }) {
  const roleClassName = `app-shell-${utilisateur.role}`;
  const [candidateSidebarCollapsedState, setCandidateSidebarCollapsedState] = useState(false);
  const hasCollapsibleSidebar = utilisateur.role === "candidat";
  const candidateSidebarCollapsed = hasCollapsibleSidebar ? candidateSidebarCollapsedState : false;
  const collapsedClassName = hasCollapsibleSidebar && candidateSidebarCollapsed ? "app-shell-candidat-collapsed" : "";

  return (
    <div
      className={`app-shell app-theme ${roleClassName} ${
        collapsedClassName
      }`}
    >
      <Navbar
        utilisateur={utilisateur}
        candidateSidebarCollapsed={candidateSidebarCollapsed}
        onToggleCandidateSidebar={() => {
          setCandidateSidebarCollapsedState((current) => !current);
        }}
      />
      <main className={`app-main ${roleClassName}-main`}>{children}</main>
    </div>
  );
}
