import { RouteProtegee } from "@/components/route-protegee";
import { TransferRequestBuilder } from "@/components/enterprise-reporting/transfer-request-builder";

export default function EnterpriseTransferRequestPage() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <TransferRequestBuilder />
    </RouteProtegee>
  );
}
