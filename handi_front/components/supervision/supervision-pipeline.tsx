"use client";

import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { PipelineResponse } from "@/lib/supervision";

export function SupervisionPipeline() {
  const pipeline = useSupervisionQuery<PipelineResponse>("/pipeline");

  if (pipeline.loading) {
    return <LoadingState title="Loading pipeline supervision" description="Preparing company-by-company recruitment flow visibility." />;
  }

  if (pipeline.error || !pipeline.data) {
    return <EmptyState title="Pipeline unavailable" description={pipeline.error || "No pipeline data is available."} />;
  }

  return (
    <SupervisionShell>
      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Region</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Offers</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applications</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Shortlisted</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Interviews</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Hired</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rejected</th>
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
