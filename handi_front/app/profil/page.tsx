"use client";

import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/components/i18n-provider";
import { RouteProtegee } from "@/components/route-protegee";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { LoadingState, PageHeader } from "@/components/ui/layout";
import { useAuth } from "@/hooks/useAuth";
import { ProfilAdmin } from "@/components/profil-admin";
import { ProfilCandidat } from "@/components/profil-candidat";
import { ProfilEntreprise } from "@/components/profil-entreprise";
import { ProfilInspecteurAneti } from "@/components/profil-inspecteur-aneti";

export default function ProfilPage() {
  const { utilisateur, chargement } = useAuth();
  const { t } = useI18n();

  return (
    <RouteProtegee>
      {chargement || !utilisateur ? (
        <main className="page-centree section-page app-theme">
          <LoadingState
            title={t("common.loadingWorkspaceTitle")}
            description={t("common.loadingWorkspaceDescription")}
          />
        </main>
      ) : utilisateur.role === "inspecteur" || utilisateur.role === "aneti" ? (
        <SupervisionShell>
          <ProfilContent />
        </SupervisionShell>
      ) : (
        <AppShell utilisateur={utilisateur}>
          <ProfilContent />
        </AppShell>
      )}
    </RouteProtegee>
  );
}

function ProfilContent() {
  const { utilisateur } = useAuth();
  const { t } = useI18n();

  if (!utilisateur) {
    return null;
  }

  const renderProfilComponent = () => {
    switch (utilisateur.role) {
      case "candidat":
        return <ProfilCandidat utilisateur={utilisateur} />;
      case "entreprise":
        return <ProfilEntreprise utilisateur={utilisateur} />;
      case "admin":
        return <ProfilAdmin utilisateur={utilisateur} />;
      case "inspecteur":
      case "aneti":
        return <ProfilInspecteurAneti utilisateur={utilisateur} />;
      default:
        return (
          <div className="empty-state">
            <strong>{t("profile.unknownTitle")}</strong>
            <p>{t("profile.unknownDescription")}</p>
          </div>
        );
    }
  };

  return (
    <div className="app-page">
      {utilisateur.role === "candidat" || utilisateur.role === "admin" || utilisateur.role === "inspecteur" || utilisateur.role === "aneti" ? (
        renderProfilComponent()
      ) : (
        <>
          <PageHeader
            badge={t("profile.workspaceBadge")}
            title={t("profile.workspaceTitle")}
            description={t("profile.workspaceDescription")}
          />
          {renderProfilComponent()}
        </>
      )}
    </div>
  );
}
