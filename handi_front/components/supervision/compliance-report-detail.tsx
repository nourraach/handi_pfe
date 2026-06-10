"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { ComplianceReportDetail, downloadSupervisionReportPdf, mutateSupervisionResource } from "@/lib/supervision";

export function ComplianceReportDetailView({ reportId }: { reportId: string }) {
  const report = useSupervisionQuery<ComplianceReportDetail>(`/reports/${reportId}`);
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    if (!report.data) {
      return;
    }

    try {
      setDownloadingPdf(true);
      setError(null);
      await downloadSupervisionReportPdf(reportId, report.data.report_pdf_filename || `${report.data.summary}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de télécharger le PDF du rapport.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const submit = async (action: "validate" | "reject" | "recommend") => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (action === "validate") {
        await mutateSupervisionResource(`/reports/${reportId}/validate`, "POST", { comment });
        setMessage("Rapport validé avec succès.");
      }

      if (action === "reject") {
        await mutateSupervisionResource(`/reports/${reportId}/reject`, "POST", { comment, recommendation });
        setMessage("Rapport refusé avec recommandation.");
      }

      if (action === "recommend") {
        await mutateSupervisionResource(`/reports/${reportId}/recommendations`, "POST", { recommendation });
        setMessage("Recommandation ajoutée.");
      }

      setRecommendation("");
      await report.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de terminer l'action de revue demandée.");
    } finally {
      setSaving(false);
    }
  };

  if (report.loading) {
    return <LoadingState title="Chargement du détail du rapport" description="Récupération des indicateurs, commentaires et historiques de revue." />;
  }

  if (report.error || !report.data) {
    return <EmptyState title="Rapport indisponible" description={report.error || "Le rapport de conformité demandé n'a pas pu être chargé."} />;
  }

  const data = report.data;

  return (
    <SupervisionShell
      badge="Revue du rapport"
      title={`Revue de conformité pour ${data.company_name}`}
      description="Validez les rapports conformes, refusez ceux qui ne le sont pas avec des recommandations obligatoires, et conservez une traçabilité complète."
    >
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 space-y-5">
          <div>
            <p className="text-sm text-gray-500">{data.company_region}</p>
            <h2 className="text-xl font-semibold text-gray-900">{data.summary}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Période de référence : {new Date(data.reporting_period_start).toLocaleDateString("fr-FR")} au{" "}
              {new Date(data.reporting_period_end).toLocaleDateString("fr-FR")}
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => void downloadPdf()} disabled={downloadingPdf}>
              {downloadingPdf ? "Téléchargement..." : "Télécharger le PDF envoyé"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-sm text-gray-500">Effectif</p><strong className="text-2xl text-gray-900">{data.workforce_total}</strong></div>
            <div><p className="text-sm text-gray-500">Employés en situation de handicap</p><strong className="text-2xl text-gray-900">{data.disabled_employees}</strong></div>
            <div><p className="text-sm text-gray-500">Offres actives</p><strong className="text-2xl text-gray-900">{data.active_offers}</strong></div>
            <div><p className="text-sm text-gray-500">Candidatures</p><strong className="text-2xl text-gray-900">{data.applications_count}</strong></div>
            <div><p className="text-sm text-gray-500">Présélection</p><strong className="text-2xl text-gray-900">{data.shortlisted_count}</strong></div>
            <div><p className="text-sm text-gray-500">Recrutements</p><strong className="text-2xl text-gray-900">{data.hired_count}</strong></div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Actions d&apos;aménagement</h3>
            <p className="mt-2 text-sm text-gray-700">{data.accommodation_actions || "Aucune note d'aménagement n'a été fournie dans ce rapport."}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Historique des recommandations</h3>
            {data.recommendations.length === 0 ? (
              <p className="text-sm text-gray-600">Aucune recommandation n&apos;a encore été ajoutée.</p>
            ) : (
              data.recommendations.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-gray-900">{item.type === "rejection" ? "Recommandation de refus" : "Recommandation"}</strong>
                    <span className="text-xs uppercase tracking-wide text-gray-500">{item.author_role}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{item.text}</p>
                  <p className="mt-2 text-xs text-gray-500">{new Date(item.created_at).toLocaleString("fr-FR")}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Actions de revue</h3>
            <p className="mt-1 text-sm text-gray-600">Le refus d&apos;un rapport exige une recommandation. Les recommandations restent visibles dans la trace d&apos;audit.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire de revue</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Commentaire optionnel pour le dossier de l'entreprise."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommandation</label>
            <textarea
              value={recommendation}
              onChange={(event) => setRecommendation(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Obligatoire pour un refus, facultative pour une recommandation seule."
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button onClick={() => void submit("validate")} disabled={saving}>
              Valider le rapport
            </Button>
            <Button variant="danger" onClick={() => void submit("reject")} disabled={saving}>
              Refuser avec recommandation
            </Button>
            <Button variant="secondary" onClick={() => void submit("recommend")} disabled={saving}>
              Ajouter une recommandation
            </Button>
          </div>
        </Card>
      </div>
    </SupervisionShell>
  );
}
