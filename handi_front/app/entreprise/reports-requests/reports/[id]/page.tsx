import { RouteProtegee } from "@/components/route-protegee";
import { EnterpriseGeneratedReportDetailView } from "@/components/enterprise-reporting/generated-report-detail";

export default async function EnterpriseGeneratedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <EnterpriseGeneratedReportDetailView reportId={resolvedParams.id} />
    </RouteProtegee>
  );
}
