import { RouteProtegee } from "@/components/route-protegee";
import { OffersPerformanceView } from "@/components/supervision/offers-performance";

export default function SupervisionOffersPage() {
  return (
    <RouteProtegee rolesAutorises={["inspecteur", "aneti"]}>
      <OffersPerformanceView />
    </RouteProtegee>
  );
}
