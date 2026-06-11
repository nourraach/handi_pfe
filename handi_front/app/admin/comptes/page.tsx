"use client";

import Link from "next/link";
import { RouteProtegee } from "@/components/route-protegee";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/layout";

const cartes = [
  {
    titre: "Pending requests",
    description: "Approve or refuse new account submissions from one clean review surface.",
    href: "/admin/demandes-en-attente",
  },
  {
    titre: "Users",
    description: "Manage account roles, status, and export flows inside the shared system.",
    href: "/admin/utilisateurs",
  },
];

function ComptesPage() {
  return (
    <div className="app-page">
      <PageHeader
        badge="Account operations"
        title="Keep requests and user administration inside one consistent admin surface."
        description="This overview page now matches the same rounded cards, soft shadows, spacing, and typography used everywhere else."
      />

      <div className="surface-grid surface-grid-2">
        {cartes.map((carte) => (
          <Card key={carte.href} interactive padding="lg">
            <div className="stack-lg">
              <div>
                <p className="badge">{carte.titre}</p>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontFamily: "var(--app-heading)" }}>{carte.titre}</h2>
                <p className="texte-secondaire" style={{ margin: "12px 0 0" }}>
                  {carte.description}
                </p>
              </div>
              <Link href={carte.href} className="ui-button ui-button-secondary">
                Open section
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <ComptesPage />
    </RouteProtegee>
  );
}
