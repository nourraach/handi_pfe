"use client";

import { RouteProtegee } from "@/components/route-protegee";
import { GestionTestsPsychologiques } from "@/components/gestion-tests-psychologiques";

export default function TestsPsychologiquesAdminPage() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <div className="app-page">
        <GestionTestsPsychologiques />
      </div>
    </RouteProtegee>
  );
}
