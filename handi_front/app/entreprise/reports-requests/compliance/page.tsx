import { RouteProtegee } from "@/components/route-protegee";
import { ComplianceReportBuilder } from "@/components/enterprise-reporting/compliance-report-builder";

export default function EnterpriseComplianceReportBuilderPage() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <ComplianceReportBuilder />
    </RouteProtegee>
  );
}
