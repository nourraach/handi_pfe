"use client";

import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { VisibleCandidate } from "@/lib/supervision";

export function CandidatesVisibilityView() {
  const candidates = useSupervisionQuery<VisibleCandidate[]>("/candidates");

  if (candidates.loading) {
    return <LoadingState title="Chargement de la vue candidats" description="Preparation de la visibilite des profils en preselection et des profils recrutes." />;
  }

  if (candidates.error || !candidates.data) {
    return <EmptyState title="Candidates unavailable" description={candidates.error || "Visible candidates could not be loaded."} />;
  }

  return (
    <SupervisionShell>
      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Offer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Region</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {candidates.data.map((candidate) => (
              <tr key={candidate.application_id}>
                <td className="px-4 py-3 font-medium text-gray-900">{candidate.candidate_reference}</td>
                <td className="px-4 py-3 text-gray-600">{candidate.stage}</td>
                <td className="px-4 py-3 text-gray-600">{candidate.company_name}</td>
                <td className="px-4 py-3 text-gray-600">{candidate.offer_title}</td>
                <td className="px-4 py-3 text-gray-600">{candidate.region}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(candidate.updated_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </SupervisionShell>
  );
}
