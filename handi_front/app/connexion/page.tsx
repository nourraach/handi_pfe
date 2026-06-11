"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { FormulaireConnexion } from "@/components/formulaire-connexion";
import { ButtonLink } from "@/components/ui/button";
import { AuthShell } from "@/components/ui/layout";

export default function ConnexionPage() {
  const { t } = useI18n();

  return (
    <AuthShell
      badge={t("login.shellBadge")}
      title={t("login.shellTitle")}
      description={t("login.shellDescription")}
      layout="centered"
    >
      <div className="stack-lg">
        <div>
          <h2 className="page-title page-title-sm">{t("login.title")}</h2>
          <p className="page-description" style={{ margin: "12px 0 0" }}>
            {t("login.description")}
          </p>
        </div>

        <FormulaireConnexion />

        <p className="texte-secondaire" style={{ margin: 0 }}>
          {t("login.noAccount")}{" "}
          <Link href="/inscription" style={{ color: "var(--app-primary)", fontWeight: 700 }}>
            {t("login.createAccount")}
          </Link>
        </p>

        <div className="page-header-actions">
          <ButtonLink href="/reset/demander" variant="secondary" size="sm">
            {t("login.forgotPassword")}
          </ButtonLink>
        </div>
      </div>
    </AuthShell>
  );
}
