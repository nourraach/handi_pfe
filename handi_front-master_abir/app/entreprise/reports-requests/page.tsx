import { RouteProtegee } from "@/components/route-protegee";
import { EnterpriseReportsRequestsHub } from "@/components/enterprise-reporting/reports-requests-hub";

export default function EnterpriseReportsRequestsPage() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <EnterpriseReportsRequestsHub />
    </RouteProtegee>
  );
}
