import { RouteProtegee } from "@/components/route-protegee";
import { SupervisionDashboard } from "@/components/supervision/supervision-dashboard";

export default function SupervisionDashboardPage() {
  return (
    <RouteProtegee rolesAutorises={["inspecteur", "aneti"]}>
      <SupervisionDashboard />
    </RouteProtegee>
  );
}
