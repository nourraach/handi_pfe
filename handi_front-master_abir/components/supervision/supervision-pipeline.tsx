"use client";

import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { PipelineResponse } from "@/lib/supervision";

export function SupervisionPipeline() {
  const pipeline = useSupervisionQuery<PipelineResponse>("/pipeline");

  if (pipeline.loading) {
    return <LoadingState title="Chargement du pipeline de supervision" description="Preparation de la visibilite du recrutement entreprise par entreprise." />;
  }

  if (pipeline.error || !pipeline.data) {
    return <EmptyState title="Pipeline indisponible" description={pipeline.error || "Aucune donnee de pipeline n'est disponible."} />;
  }

  return (
    <SupervisionShell>
      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Entreprise</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Region</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Offres</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Candidatures</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Preselection</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Entretiens</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Acceptes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Refuses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {pipeline.data.by_company.map((company) => (
              <tr key={company.company_id}>
                <td className="px-4 py-3 font-medium text-gray-900">{company.company_name}</td>
                <td className="px-4 py-3 text-gray-600">{company.region}</td>
                <td className="px-4 py-3 text-gray-600">{company.offers_count}</td>
                <td className="px-4 py-3 text-gray-600">{company.applications_count}</td>
                <td className="px-4 py-3 text-gray-600">{company.shortlisted_count}</td>
                <td className="px-4 py-3 text-gray-600">{company.interviews_count}</td>
                <td className="px-4 py-3 text-gray-600">{company.hired_count}</td>
                <td className="px-4 py-3 text-gray-600">{company.rejected_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </SupervisionShell>
  );
}
