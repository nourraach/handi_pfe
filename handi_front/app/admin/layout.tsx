"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/ui/layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { utilisateur, chargement } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (chargement) return;
    if (!utilisateur) {
      router.push("/connexion");
      return;
    }
    if (!["admin", "inspecteur", "aneti"].includes(utilisateur.role)) {
      router.push("/");
    }
  }, [chargement, utilisateur, router]);

  if (chargement || !utilisateur) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("common.loadingWorkspaceTitle")}
          description={t("common.loadingWorkspaceDescription")}
        />
      </main>
    );
  }

  return <AppShell utilisateur={utilisateur}>{children}</AppShell>;
}
