"use client";

import { RouteProtegee } from "@/components/route-protegee";
import { GestionTestsPsychologiques } from "@/components/gestion-tests-psychologiques";
import { PageHeader } from "@/components/ui/layout";
import { useI18n } from "@/components/i18n-provider";

export default function TestsPsychologiquesAdminPage() {
  const { t } = useI18n();
  
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <div className="app-page">
        <PageHeader
          badge={t("assessments.candidate.badge")}
          title="Gestion des évaluations psychologiques"
          description="Créez, gérez et supervisez les tests psychologiques avec le même système de design unifié."
        />
        <GestionTestsPsychologiques />
      </div>
    </RouteProtegee>
  );
}
