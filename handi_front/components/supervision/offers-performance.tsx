"use client";

import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { OfferPerformance } from "@/lib/supervision";

export function OffersPerformanceView() {
  const offers = useSupervisionQuery<OfferPerformance[]>("/offers");

  if (offers.loading) {
    return <LoadingState title="Loading offers performance" description="Fetching company offers, view counts, and hiring outcomes." />;
  }

  if (offers.error || !offers.data) {
    return <EmptyState title="Offers unavailable" description={offers.error || "No offers could be loaded for supervision."} />;
  }

  return (
    <SupervisionShell>
      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Offer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Region</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Views</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applications</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Shortlisted</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Hired</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {offers.data.map((offer) => (
              <tr key={offer.offer_id}>
                <td className="px-4 py-3 text-gray-900 font-medium">{offer.company_name}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{offer.offer_title}</div>
                  <div className="text-xs text-gray-500">{offer.type_poste} · {offer.offer_status}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{offer.region}</td>
                <td className="px-4 py-3 text-gray-600">{offer.views_count}</td>
                <td className="px-4 py-3 text-gray-600">{offer.applications_count}</td>
                <td className="px-4 py-3 text-gray-600">{offer.shortlisted_count}</td>
                <td className="px-4 py-3 text-gray-600">{offer.hired_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </SupervisionShell>
  );
}
