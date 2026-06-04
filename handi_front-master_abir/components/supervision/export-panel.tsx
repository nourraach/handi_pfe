"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { downloadSupervisionExport } from "@/lib/supervision";

const datasets = [
  { key: "statistics", title: "Statistiques", description: "Exporter les indicateurs du pipeline par entreprise et les totaux de supervision." },
  { key: "offers", title: "Offres", description: "Exporter les entreprises, les offres, les vues, les prelections et les embauches." },
  { key: "reports", title: "Rapports de conformite", description: "Exporter le statut des rapports, les dates de revue et les recommandations." },
  { key: "candidates", title: "Candidats visibles", description: "Exporter des references candidates conformes aux regles de confidentialite et leur etape visible." },
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
      setMessage(`Export ${dataset} genere au format ${format.toUpperCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de generer l'export.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <SupervisionShell
      badge="Exports de supervision"
      title="Generez les exports institutionnels pour la supervision, la conformite et le recrutement inclusif."
      description="Les exports respectent les restrictions territoriales des inspecteurs et la confidentialite des candidatures."
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
                {busyKey === `${dataset.key}:csv` ? "Generation du CSV..." : "Exporter en CSV"}
              </Button>
              <Button variant="secondary" onClick={() => void download(dataset.key, "excel")} disabled={busyKey !== null}>
                {busyKey === `${dataset.key}:excel` ? "Generation du fichier Excel..." : "Exporter en Excel"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </SupervisionShell>
  );
}
