"use client";

import { RouteProtegee } from "@/components/route-protegee";
import { GestionUtilisateurs } from "@/components/gestion-utilisateurs";

export default function UtilisateursAdminPage() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <div className="app-page">
        <GestionUtilisateurs />
      </div>
    </RouteProtegee>
  );
}
