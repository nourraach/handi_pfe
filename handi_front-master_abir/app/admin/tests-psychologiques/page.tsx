"use client";

import { RouteProtegee } from "@/components/route-protegee";
import { GestionTestsPsychologiques } from "@/components/gestion-tests-psychologiques";
import { PageHeader } from "@/components/ui/layout";

export default function TestsPsychologiquesAdminPage() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <div className="app-page">
        <PageHeader
          badge="Tests Soft Skills"
          title="Creation et gestion des tests Soft Skills"
          description="Creez, modifiez et suivez les evaluations Soft Skills disponibles pour les candidats."
        />
        <GestionTestsPsychologiques />
      </div>
    </RouteProtegee>
  );
}
