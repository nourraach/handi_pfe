"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/ui/layout";

export default function InscriptionPage() {
  const { t } = useI18n();

  const options = [
    {
      title: t("signup.jobSeeker"),
      description: t("signup.jobSeekerDescription"),
      href: "/inscription/candidat",
    },
    {
      title: t("signup.company"),
      description: t("signup.companyDescription"),
      href: "/inscription/entreprise",
    },
  ];

  return (
    <AuthShell
      badge={t("signup.chooseBadge")}
      title={t("signup.chooseTitle")}
      description={t("signup.chooseDescription")}
      layout="centered"
    >
      <div className="stack-lg">
        <div>
          <h2 className="page-title page-title-sm">{t("signup.createTitle")}</h2>
          <p className="page-description" style={{ margin: "12px 0 0" }}>
            {t("signup.createDescription")}
          </p>
        </div>

        <div className="surface-grid surface-grid-2">
          {options.map((option) => (
            <Card key={option.href} interactive padding="lg">
              <div className="stack-lg">
                <div>
                  <p className="badge">{option.title}</p>
                  <h3 style={{ margin: 0, fontSize: "1.45rem", fontFamily: "var(--app-heading)" }}>{option.title}</h3>
                  <p className="texte-secondaire" style={{ margin: "12px 0 0" }}>
                    {option.description}
                  </p>
                </div>
                <ButtonLink href={option.href}>{t("common.actions.continue")}</ButtonLink>
              </div>
            </Card>
          ))}
        </div>

        <p className="texte-secondaire" style={{ margin: 0 }}>
          {t("signup.alreadyHave")}{" "}
          <Link href="/connexion" style={{ color: "var(--app-primary)", fontWeight: 700 }}>
            {t("signup.signInHere")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
