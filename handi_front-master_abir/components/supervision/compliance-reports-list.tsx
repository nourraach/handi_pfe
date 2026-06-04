"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { ComplianceReportSummary } from "@/lib/supervision";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Soumis",
  validated: "Validé",
  rejected: "Refusé",
};

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-800",
  validated: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

export function ComplianceReportsList() {
  const [statusFilter, setStatusFilter] = useState("");
  const reports = useSupervisionQuery<ComplianceReportSummary[]>(`/reports${statusFilter ? `?status=${statusFilter}` : ""}`);

  const summary = useMemo(() => {
    const rows = reports.data ?? [];
    return {
      total: rows.length,
      submitted: rows.filter((row) => row.status === "submitted").length,
      validated: rows.filter((row) => row.status === "validated").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
    };
  }, [reports.data]);

  if (reports.loading) {
    return <LoadingState title="Chargement des rapports de conformité" description="Préparation de la file de revue et de l'historique des recommandations." />;
  }

  if (reports.error || !reports.data) {
    return <EmptyState title="Rapports indisponibles" description={reports.error || "Les rapports de conformité n'ont pas pu être chargés."} />;
  }

  return (
    <SupervisionShell>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="space-y-1"><p className="text-sm text-gray-500">Total</p><strong className="text-2xl text-gray-900">{summary.total}</strong></Card>
        <Card className="space-y-1"><p className="text-sm text-gray-500">Soumis</p><strong className="text-2xl text-gray-900">{summary.submitted}</strong></Card>
        <Card className="space-y-1"><p className="text-sm text-gray-500">Validés</p><strong className="text-2xl text-gray-900">{summary.validated}</strong></Card>
        <Card className="space-y-1"><p className="text-sm text-gray-500">Refusés</p><strong className="text-2xl text-gray-900">{summary.rejected}</strong></Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtre de statut</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Tous les statuts</option>
              <option value="submitted">Soumis</option>
              <option value="validated">Validé</option>
              <option value="rejected">Refusé</option>
            </select>
          </div>
        </div>

        {reports.data.length === 0 ? (
          <p className="text-sm text-gray-600">Aucun rapport de conformité ne correspond au filtre actuel.</p>
        ) : (
          <div className="space-y-4">
            {reports.data.map((report) => (
              <div key={report.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{report.company_name}</p>
                    <p className="text-sm text-gray-500">
                      {report.company_region} · {new Date(report.reporting_period_start).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(report.reporting_period_end).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[report.status] || "bg-gray-100 text-gray-800"}`}>
                    {STATUS_LABELS[report.status] || report.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-700">{report.summary}</p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                  <div><strong className="block text-gray-900">{report.applications_count}</strong>Candidatures</div>
                  <div><strong className="block text-gray-900">{report.shortlisted_count}</strong>Présélection</div>
                  <div><strong className="block text-gray-900">{report.hired_count}</strong>Recrutements</div>
                  <div><strong className="block text-gray-900">{report.recommendations.length}</strong>Recommandations</div>
                </div>

                <div className="mt-4 flex justify-end text-xs text-gray-500">
                  La vue détaillée n&apos;est pas disponible dans cet espace.
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </SupervisionShell>
  );
}
