"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { LoadingState } from "@/components/ui/layout";

export default function AdminStatistiquesRedirectPage() {
  return (
    <AuthenticatedWorkspace rolesAutorises={["admin"]}>
      <RedirectToHomeStats />
    </AuthenticatedWorkspace>
  );
}

function RedirectToHomeStats() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home#admin-stats");
  }, [router]);

  return (
    <main className="page-centree section-page app-theme">
      <LoadingState
        title="Redirection vers le dashboard"
        description="Les statistiques admin sont maintenant integrees dans la page d'accueil."
      />
    </main>
  );
}
