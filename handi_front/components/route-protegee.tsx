"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/layout";

interface RouteProtegeeProps {
  children: React.ReactNode;
  rolesAutorises?: string[];
}

export function RouteProtegee({ children, rolesAutorises }: RouteProtegeeProps) {
  const { utilisateur, chargement, estConnecte } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!chargement) {
      if (!estConnecte) {
        router.push("/connexion");
        return;
      }

      if (rolesAutorises && utilisateur && !rolesAutorises.includes(utilisateur.role)) {
        router.push("/home");
      }
    }
  }, [chargement, estConnecte, utilisateur, router, rolesAutorises]);

  if (chargement) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("routeProtegee.loadingTitle")}
          description={t("routeProtegee.loadingDescription")}
        />
      </main>
    );
  }

  if (!estConnecte) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("routeProtegee.redirectSignInTitle")}
          description={t("routeProtegee.redirectSignInDescription")}
        />
      </main>
    );
  }

  if (rolesAutorises && utilisateur && !rolesAutorises.includes(utilisateur.role)) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("routeProtegee.redirectDeniedTitle")}
          description={t("routeProtegee.redirectDeniedDescription")}
        />
      </main>
    );
  }

  return <>{children}</>;
}
