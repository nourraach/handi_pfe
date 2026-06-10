"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { downloadEnterpriseReportPdf, getEnterpriseGeneratedReport, type EnterpriseGeneratedReportDetail } from "@/lib/enterprise-reports";

function extractReportBody(report: EnterpriseGeneratedReportDetail) {
  const raw = String(report.accommodation_actions ?? "").trim();
  const prefix = "Rapport genere:\n\n";

  if (!raw) {
    return report.summary;
  }

  return raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
}

export function EnterpriseGeneratedReportDetailView({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<EnterpriseGeneratedReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    if (!report) {
      return;
    }

    try {
      setDownloadingPdf(true);
      setError(null);
      await downloadEnterpriseReportPdf(report.id, report.report_pdf_filename || `${report.summary}.pdf`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de telecharger le PDF du rapport.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getEnterpriseGeneratedReport(reportId);
        setReport(result);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Impossible de charger le detail du rapport.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [reportId]);

  const reportBody = useMemo(() => (report ? extractReportBody(report) : ""), [report]);

  if (loading) {
    return (
      <main className="app-page">
        <LoadingState title="Chargement du detail du rapport" description="Ouverture du rapport de conformite publie." />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="app-page">
        <EmptyState title="Rapport indisponible" description={error || "Ce rapport de conformite est introuvable."} />
      </main>
    );
  }

  return (
    <main className="app-page compliance-report-page">
      <section className="report-actions">
        <ButtonLink href="/entreprise/reports-requests" variant="ghost">
          Retour
        </ButtonLink>
        <Button onClick={() => void downloadPdf()} disabled={downloadingPdf} variant="secondary">
          {downloadingPdf ? "Telechargement..." : "Telecharger le PDF envoye"}
        </Button>
      </section>
      <section className="report-body-only">
        <pre>{reportBody}</pre>
      </section>
      <style jsx>{`
        .compliance-report-page {
          padding-top: 8px;
        }

        .report-body-only {
          max-width: 920px;
          margin: 0 auto;
          padding: 20px;
        }

        .report-actions {
          max-width: 920px;
          margin: 0 auto 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
        }

        .report-body-only pre {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.7;
          font-size: 0.98rem;
          color: var(--app-text-soft);
          background: rgba(255,255,255,0.82);
          border: 1px solid var(--app-border);
          border-radius: 18px;
          padding: 24px;
        }

        @media (max-width: 768px) {
          .report-actions {
            padding: 0 12px;
            flex-wrap: wrap;
          }

          .report-body-only {
            padding: 12px;
          }

          .report-body-only pre {
            padding: 16px;
            font-size: 0.92rem;
          }
        }
      `}</style>
    </main>
  );
}
