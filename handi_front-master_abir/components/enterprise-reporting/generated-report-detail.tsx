"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui/layout";
import { downloadPdfDocument, downloadTextDocument, getEnterpriseGeneratedReport, type EnterpriseGeneratedReportDetail } from "@/lib/enterprise-reports";

const STATUS_LABELS: Record<string, string> = {
  submitted: "En attente de revue",
  validated: "Valide",
  rejected: "Rejete",
};

const STATUS_CLASSES: Record<string, string> = {
  submitted: "message-neutre",
  validated: "message-info",
  rejected: "message-erreur",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("fr-FR");
}

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
        <LoadingState title="Loading report detail" description="Opening the published compliance report." />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="app-page">
        <EmptyState title="Report unavailable" description={error || "This compliance report could not be found."} />
      </main>
    );
  }

  return (
    <main className="app-page">
      <PageHeader
        badge="Generated report"
        title={report.summary}
        description="Review the generated legal text, submission metrics, and the supervision feedback attached to this report."
        actions={
          <div className="page-header-actions">
            <a href="/entreprise/reports-requests" className="ui-button ui-button-ghost ui-button-sm">
              Return Reports & Requests
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadTextDocument(`${report.summary || "compliance-report"}.txt`, reportBody)}
            >
              Download text
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadPdfDocument(`${report.summary || "compliance-report"}.pdf`, reportBody)}
            >
              Download PDF
            </Button>
          </div>
        }
      />

      <section className="surface-grid surface-grid-2">
        <Card padding="lg" className="stack-lg">
          <div className="notification-meta">
            <div>
              <strong style={{ display: "block", fontSize: "1.05rem" }}>{report.company_name}</strong>
              <p className="texte-secondaire" style={{ margin: "8px 0 0" }}>
                {formatDate(report.reporting_period_start)} - {formatDate(report.reporting_period_end)}
              </p>
            </div>
            <span className={`status-pill ${STATUS_CLASSES[report.status] || "message-neutre"}`}>
              {STATUS_LABELS[report.status] || report.status}
            </span>
          </div>

          <div className="details-grid">
            <div className="detail-box">
              <strong>Region</strong>
              <p>{report.region || "-"}</p>
            </div>
            <div className="detail-box">
              <strong>Submitted</strong>
              <p>{formatDate(report.submitted_at)}</p>
            </div>
            <div className="detail-box">
              <strong>Reviewed</strong>
              <p>{formatDate(report.reviewed_at)}</p>
            </div>
            <div className="detail-box">
              <strong>Reviewed by</strong>
              <p>{report.reviewed_by_name || "-"}</p>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-box">
              <strong>Effectif total</strong>
              <p>{report.workforce_total}</p>
            </div>
            <div className="detail-box">
              <strong>Collaborateurs handicapes</strong>
              <p>{report.disabled_employees}</p>
            </div>
            <div className="detail-box">
              <strong>Offres actives</strong>
              <p>{report.active_offers}</p>
            </div>
            <div className="detail-box">
              <strong>Candidatures</strong>
              <p>{report.applications_count}</p>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-box">
              <strong>Shortlisted</strong>
              <p>{report.shortlisted_count}</p>
            </div>
            <div className="detail-box">
              <strong>Hired</strong>
              <p>{report.hired_count}</p>
            </div>
            <div className="detail-box">
              <strong>Review comment</strong>
              <p>{report.review_comment || "-"}</p>
            </div>
            <div className="detail-box">
              <strong>Last recommendation</strong>
              <p>{report.last_recommendation || "-"}</p>
            </div>
          </div>

          <div className="stack-lg">
            <strong>Recommendations</strong>
            {report.recommendations.length === 0 ? (
              <p className="texte-secondaire" style={{ margin: 0 }}>
                No recommendation has been attached to this report yet.
              </p>
            ) : (
              <div className="list-stack">
                {report.recommendations.map((recommendation) => (
                  <Card key={recommendation.id} padding="md">
                    <strong style={{ display: "block" }}>{recommendation.type === "rejection" ? "Rejection recommendation" : "Recommendation"}</strong>
                    <p style={{ margin: "10px 0 0" }}>{recommendation.text}</p>
                    <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                      {recommendation.author_role} - {formatDate(recommendation.created_at)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="stack-lg">
            <strong>Evidence URLs</strong>
            {report.evidence_urls && report.evidence_urls.length > 0 ? (
              <div className="list-stack">
                {report.evidence_urls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="ui-button ui-button-ghost">
                    {url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="texte-secondaire" style={{ margin: 0 }}>
                No evidence URL was attached to this report.
              </p>
            )}
          </div>
        </Card>

        <Card padding="lg" className="stack-lg">
          <div>
            <strong style={{ fontSize: "1.1rem" }}>Generated report body</strong>
            <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
              This is the generated text submitted by the company for the compliance review workflow.
            </p>
          </div>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              fontSize: "0.96rem",
              color: "var(--app-text-soft)",
              minHeight: "540px",
              border: "1px solid var(--app-border)",
              borderRadius: "20px",
              padding: "20px",
              background: "rgba(255,255,255,0.7)",
            }}
          >
            {reportBody}
          </div>
        </Card>
      </section>
    </main>
  );
}
