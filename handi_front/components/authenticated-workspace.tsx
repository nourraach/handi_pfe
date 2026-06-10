"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/i18n-provider";
import { RouteProtegee } from "@/components/route-protegee";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/layout";

export function AuthenticatedWorkspace({
  children,
  rolesAutorises,
}: {
  children: ReactNode;
  rolesAutorises?: string[];
}) {
  const { utilisateur, chargement } = useAuth();
  const { t } = useI18n();

  return (
    <RouteProtegee rolesAutorises={rolesAutorises}>
      {chargement || !utilisateur ? (
        <main className="page-centree section-page app-theme">
          <LoadingState
            title={t("common.loadingWorkspaceTitle")}
            description={t("common.loadingWorkspaceDescription")}
          />
        </main>
      ) : (
        <AppShell utilisateur={utilisateur}>{children}</AppShell>
      )}
    </RouteProtegee>
  );
}
