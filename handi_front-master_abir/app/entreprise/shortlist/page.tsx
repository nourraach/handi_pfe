"use client";

import ShortlistPanel from "@/components/ShortlistPanel";
import { RouteProtegee } from "@/components/route-protegee";

export default function EntrepriseShortlistPage() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <ShortlistPanel />
    </RouteProtegee>
  );
}
