"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { UtilisateurConnecte } from "@/types/api";

export function AppShell({ utilisateur, children }: { utilisateur: UtilisateurConnecte; children: ReactNode }) {
  const roleClassName = `app-shell-${utilisateur.role}`;
  const isAdmin = utilisateur.role === "admin";
  const isEntreprise = utilisateur.role === "entreprise";
  const [candidateSidebarCollapsedState, setCandidateSidebarCollapsedState] = useState(false);
  const [adminSidebarCollapsed, setAdminSidebarCollapsed] = useState(true);
  const [entrepriseSidebarCollapsed, setEntrepriseSidebarCollapsed] = useState(true);
  const hasCollapsibleSidebar = utilisateur.role === "candidat" || isAdmin || isEntreprise;
  const candidateSidebarCollapsed = hasCollapsibleSidebar
    ? isAdmin
      ? adminSidebarCollapsed
      : isEntreprise
      ? entrepriseSidebarCollapsed
      : candidateSidebarCollapsedState
    : false;
  const collapsedClassName =
    hasCollapsibleSidebar && candidateSidebarCollapsed
      ? isAdmin
        ? "app-shell-admin-collapsed"
        : isEntreprise
        ? "app-shell-entreprise-collapsed"
        : "app-shell-candidat-collapsed"
      : "";

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
          if (isAdmin) {
            setAdminSidebarCollapsed((current) => !current);
            return;
          }
          if (isEntreprise) {
            setEntrepriseSidebarCollapsed((current) => !current);
            return;
          }
          setCandidateSidebarCollapsedState((current) => !current);
        }}
      />
      <main className={`app-main ${roleClassName}-main`}>{children}</main>
    </div>
  );
}
