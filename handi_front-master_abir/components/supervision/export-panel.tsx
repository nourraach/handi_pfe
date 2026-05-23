"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { downloadSupervisionExport } from "@/lib/supervision";

const datasets = [
  { key: "statistics", title: "Statistics", description: "Export company-level pipeline metrics and KPI-ready supervision totals." },
  { key: "offers", title: "Offers", description: "Export company names, offers, views, shortlisted counts, and hired counts." },
  { key: "reports", title: "Compliance reports", description: "Export report status, review dates, and recommendations." },
  { key: "candidates", title: "Visible candidates", description: "Export privacy-safe candidate references and their allowed supervision stage." },
];

export function SupervisionExportPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const download = async (dataset: string, format: "csv" | "excel") => {
    setBusyKey(`${dataset}:${format}`);
    setMessage(null);
    setError(null);

    try {
      await downloadSupervisionExport(dataset, format);
      setMessage(`${dataset} export generated in ${format.toUpperCase()} format.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate the export.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <SupervisionShell
      badge="Statistics Export"
      title="Generate institutional exports for supervision, compliance, and inclusive hiring reporting."
      description="Exports respect territorial restrictions for inspectors and privacy constraints for candidate visibility."
    >
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {datasets.map((dataset) => (
          <Card key={dataset.key} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{dataset.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{dataset.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void download(dataset.key, "csv")} disabled={busyKey !== null}>
                {busyKey === `${dataset.key}:csv` ? "Generating CSV..." : "Export CSV"}
              </Button>
              <Button variant="secondary" onClick={() => void download(dataset.key, "excel")} disabled={busyKey !== null}>
                {busyKey === `${dataset.key}:excel` ? "Generating Excel..." : "Export Excel"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </SupervisionShell>
  );
}
