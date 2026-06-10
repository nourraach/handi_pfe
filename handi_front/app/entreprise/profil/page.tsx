"use client";

import { RouteProtegee } from "@/components/route-protegee";
import { ProfilEntreprise } from "@/components/profil-entreprise";
import { LoadingState } from "@/components/ui/layout";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilEntreprisePageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <ProfilEntreprisePage />
    </RouteProtegee>
  );
}

function ProfilEntreprisePage() {
  const { utilisateur, chargement } = useAuth();

  if (chargement || !utilisateur) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title="Chargement du profil entreprise"
          description="Nous preparons les informations de votre organisation."
        />
      </main>
    );
  }

  return (
    <div className="app-page">
      <ProfilEntreprise utilisateur={utilisateur} />
    </div>
  );
}
