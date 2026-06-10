import { RouteProtegee } from "@/components/route-protegee";
import { ComplianceReportsList } from "@/components/supervision/compliance-reports-list";

export default function ComplianceReportsPage() {
  return (
    <RouteProtegee rolesAutorises={["inspecteur", "aneti"]}>
      <ComplianceReportsList />
    </RouteProtegee>
  );
}
