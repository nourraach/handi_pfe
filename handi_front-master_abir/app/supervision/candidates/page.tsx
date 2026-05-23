import { RouteProtegee } from "@/components/route-protegee";
import { CandidatesVisibilityView } from "@/components/supervision/candidates-visibility";

export default function SupervisionCandidatesPage() {
  return (
    <RouteProtegee rolesAutorises={["inspecteur", "aneti"]}>
      <CandidatesVisibilityView />
    </RouteProtegee>
  );
}
