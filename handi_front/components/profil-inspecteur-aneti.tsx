"use client";

import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilInspecteurAnetiProps {
  utilisateur: UtilisateurConnecte;
}

export function ProfilInspecteurAneti({ utilisateur }: ProfilInspecteurAnetiProps) {
  const { t } = useI18n();
  const roleLabel = t(`common.roles.${utilisateur.role}`);
  const regionLabel = utilisateur.region || t("profile.candidate.notProvided");

  return (
    <div className="stack-lg">
      <Card tone="accent" padding="lg" className="profile-overview-card">
        <div className="profile-surface-head">
          <div className="page-header-copy">
            <p className="badge">{roleLabel}</p>
            <h2 className="page-title page-title-sm">{utilisateur.nom}</h2>
            <p className="page-description">{utilisateur.email}</p>
          </div>
          <div className="profile-surface-actions">
            <ButtonLink href="/supervision" size="sm">
              {t("navbar.openSupervision")}
            </ButtonLink>
          </div>
        </div>

        <div className="details-grid">
          <div className="detail-box">
            <strong>{t("profile.admin.fields.email")}</strong>
            <span>{utilisateur.email}</span>
          </div>
          <div className="detail-box">
            <strong>{t("profile.admin.fields.fullName")}</strong>
            <span>{utilisateur.nom}</span>
          </div>
          <div className="detail-box">
            <strong>Role</strong>
            <span>{roleLabel}</span>
          </div>
          <div className="detail-box">
            <strong>Delegation</strong>
            <span>{regionLabel}</span>
          </div>
        </div>
      </Card>

      <Card className="profile-surface">
        <div className="profile-surface-head">
          <div>
            <strong>{t("supervision.dashboard.title")}</strong>
          </div>
        </div>
        <p className="page-description" style={{ margin: 0 }}>
          {t("supervision.dashboard.description")}
        </p>
      </Card>
    </div>
  );
}
