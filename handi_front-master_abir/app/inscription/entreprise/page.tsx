"use client";

import { useI18n } from "@/components/i18n-provider";
import { FormulaireInscriptionEntreprise } from "@/components/formulaire-inscription-entreprise";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default function InscriptionEntreprisePage() {
  const { t } = useI18n();

  return (
    <main className="app-theme">
      <section className="auth-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 20px" }}>
        <Card className="auth-panel" padding="lg" style={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          <div className="stack-lg">
            <ButtonLink href="/inscription" variant="ghost" size="sm">
              {t("signup.backToChoice")}
            </ButtonLink>
            <div>
              <h2 className="page-title page-title-sm">{t("signup.companyTitle")}</h2>
              <p className="page-description" style={{ margin: "12px 0 0" }}>
                {t("signup.companyPageDescription")}
              </p>
            </div>
            <FormulaireInscriptionEntreprise />
          </div>
        </Card>
      </section>
    </main>
  );
}
