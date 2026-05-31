"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/layout";
import {
  EnterpriseDraftRecord,
  EnterpriseGeneratedReportSummary,
  deleteEnterpriseDraft,
  downloadTextDocument,
  listEnterpriseDrafts,
  listEnterpriseGeneratedReports,
} from "@/lib/enterprise-reports";

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

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  validated: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASSES: Record<string, string> = {
  submitted: "status-submitted",
  validated: "status-approved",
  rejected: "status-rejected",
};

export function EnterpriseReportsRequestsHub() {
  const [reports, setReports] = useState<EnterpriseGeneratedReportSummary[]>([]);
  const [drafts, setDrafts] = useState<EnterpriseDraftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportsResult = await listEnterpriseGeneratedReports();
      setReports(reportsResult);
      setDrafts(listEnterpriseDrafts());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load company reports.");
      setDrafts(listEnterpriseDrafts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const removeDraft = (draftId: string) => {
    deleteEnterpriseDraft(draftId);
    setDrafts(listEnterpriseDrafts());
  };

  const exportReport = (report: EnterpriseGeneratedReportSummary) => {
    const content = [
      `Report: ${report.summary}`,
      `Period: ${formatDate(report.reporting_period_start)} - ${formatDate(report.reporting_period_end)}`,
      `Status: ${STATUS_LABELS[report.status] || report.status}`,
      `Submitted on: ${formatDate(report.submitted_at)}`,
      `Applications: ${report.applications_count}`,
      `Shortlisted: ${report.shortlisted_count}`,
      `Hired: ${report.hired_count}`,
    ].join("\n");

    downloadTextDocument(`compliance-report-${report.id}.txt`, content);
  };

  const getSubmittedTo = (report: EnterpriseGeneratedReportSummary) => {
    if (report.reviewed_by_name) {
      return report.reviewed_by_name;
    }

    return report.region ? "Labour Inspectorate" : "ANETI";
  };

  if (loading) {
    return (
      <main className="reports-requests-page">
        <LoadingState
          title="Loading reports and requests"
          description="Preparing the company reporting workspace and your saved drafts."
        />
      </main>
    );
  }

  return (
    <main className="reports-requests-page">
      <section className="rr-header">
        <div>
          <p className="rr-eyebrow">REPORTS & REQUESTS</p>
          <h1>Generate compliance documents and manage your company drafts</h1>
          <p className="rr-subtitle">
            Create the compliance report for law n 41-2016, prepare a transfer request, and reopen your saved work
            whenever needed.
          </p>
        </div>
        <div className="rr-hero-art" aria-hidden="true" />
      </section>

      {error ? <div className="message message-erreur">{error}</div> : null}

      <section className="rr-stepper">
        <article className="rr-step">
          <span className="rr-step-icon">📄</span>
          <div>
            <strong>Generate report</strong>
            <p>Build your compliance report from live data</p>
          </div>
        </article>
        <span className="rr-step-link" aria-hidden="true" />
        <article className="rr-step">
          <span className="rr-step-icon">👁</span>
          <div>
            <strong>Review</strong>
            <p>Review and validate the report</p>
          </div>
        </article>
        <span className="rr-step-link" aria-hidden="true" />
        <article className="rr-step">
          <span className="rr-step-icon">✈</span>
          <div>
            <strong>Submit</strong>
            <p>Submit to inspector or ANETI</p>
          </div>
        </article>
        <span className="rr-step-link" aria-hidden="true" />
        <article className="rr-step">
          <span className="rr-step-icon">✓</span>
          <div>
            <strong>Follow-up</strong>
            <p>Track status and follow actions</p>
          </div>
        </article>
      </section>

      <section className="rr-actions-grid">
        <article className="rr-action-card rr-action-primary">
          <div className="rr-action-copy">
            <h2>Generate compliance report</h2>
            <p>Build the law n 41-2016 report from your live hiring data.</p>
            <ButtonLink href="/entreprise/reports-requests/compliance">Start report</ButtonLink>
          </div>
          <div className="rr-action-art" aria-hidden="true" />
        </article>

        <article className="rr-action-card rr-action-secondary">
          <div className="rr-action-copy">
            <h2>Create transfer request</h2>
            <p>Prepare a structured transfer request for your inclusion follow-up.</p>
            <ButtonLink href="/entreprise/reports-requests/transfer" variant="secondary">
              Start request
            </ButtonLink>
          </div>
          <div className="rr-action-art rr-action-art-transfer" aria-hidden="true" />
        </article>
      </section>

      <div className="rr-content-grid">
        <section className="rr-panel">
          <header className="rr-panel-head">
            <h3>
              Published reports <span>{reports.length}</span>
            </h3>
          </header>

          {reports.length === 0 ? (
            <div className="rr-empty">
              <strong>No reports yet</strong>
              <p>Start by generating your first compliance report</p>
              <ButtonLink href="/entreprise/reports-requests/compliance">Generate report</ButtonLink>
            </div>
          ) : (
            <div className="rr-table-wrap">
              <table className="rr-table">
                <thead>
                  <tr>
                    <th>Report name</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Submitted to</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.summary}</td>
                      <td>
                        {formatDate(report.reporting_period_start)} - {formatDate(report.reporting_period_end)}
                      </td>
                      <td>
                        <span className={`rr-status ${STATUS_CLASSES[report.status] || "status-submitted"}`}>
                          {STATUS_LABELS[report.status] || report.status}
                        </span>
                      </td>
                      <td>{getSubmittedTo(report)}</td>
                      <td>{formatDate(report.submitted_at)}</td>
                      <td>
                        <div className="rr-actions-inline">
                          <ButtonLink href={`/entreprise/reports-requests/reports/${report.id}`} variant="ghost" size="sm">
                            View
                          </ButtonLink>
                          <Button onClick={() => exportReport(report)} variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rr-panel">
          <header className="rr-panel-head">
            <h3>
              Saved drafts <span>{drafts.length}</span>
            </h3>
          </header>

          {drafts.length === 0 ? (
            <div className="rr-empty">
              <strong>No reports yet</strong>
              <p>Start by generating your first compliance report</p>
              <ButtonLink href="/entreprise/reports-requests/compliance">Generate report</ButtonLink>
            </div>
          ) : (
            <div className="rr-table-wrap">
              <table className="rr-table">
                <thead>
                  <tr>
                    <th>Draft name</th>
                    <th>Type</th>
                    <th>Last updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => {
                    const editHref =
                      draft.type === "compliance"
                        ? `/entreprise/reports-requests/compliance?draft=${draft.id}`
                        : `/entreprise/reports-requests/transfer?draft=${draft.id}`;

                    return (
                      <tr key={draft.id}>
                        <td>{draft.title}</td>
                        <td>
                          <span className={`rr-type-pill ${draft.type === "compliance" ? "type-report" : "type-request"}`}>
                            {draft.type === "compliance" ? "Report" : "Request"}
                          </span>
                        </td>
                        <td>{formatDate(draft.updated_at)}</td>
                        <td>
                          <div className="rr-actions-inline">
                            <ButtonLink href={editHref} variant="ghost" size="sm">
                              Edit
                            </ButtonLink>
                            <Button onClick={() => removeDraft(draft.id)} variant="ghost" size="sm">
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      <style jsx>{`
        .reports-requests-page {
          --rr-primary: #35063e;
          --rr-surface: #ffffff;
          --rr-border: #ebe8f2;
          --rr-text: #24273f;
          --rr-muted: #6b7088;
          display: grid;
          gap: 18px;
          padding: 20px;
          background: radial-gradient(circle at 18% 0%, rgba(53, 6, 62, 0.06), transparent 38%), #f7f5fb;
          color: var(--rr-text);
        }

        .rr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .rr-eyebrow {
          margin: 0 0 10px;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          font-weight: 800;
          color: #6f38d0;
        }

        .rr-header h1 {
          margin: 0;
          font-size: clamp(2rem, 2.4vw, 2.8rem);
          line-height: 1.1;
          max-width: 760px;
          color: #1f2340;
        }

        .rr-subtitle {
          margin: 12px 0 0;
          color: var(--rr-muted);
          max-width: 700px;
          line-height: 1.55;
        }

        .rr-hero-art {
          width: 180px;
          height: 140px;
          border-radius: 28px;
          background: radial-gradient(circle at 30% 20%, rgba(116, 64, 224, 0.35), rgba(116, 64, 224, 0) 62%),
            linear-gradient(145deg, #ede4fb 0%, #cfb7ff 100%);
          position: relative;
          box-shadow: inset 0 0 0 1px rgba(114, 56, 207, 0.1), 0 18px 32px rgba(53, 6, 62, 0.12);
          flex: 0 0 auto;
        }

        .rr-stepper {
          background: var(--rr-surface);
          border: 1px solid var(--rr-border);
          border-radius: 20px;
          box-shadow: 0 14px 28px rgba(30, 24, 55, 0.05);
          padding: 18px;
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          align-items: center;
          gap: 12px;
        }

        .rr-step {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .rr-step-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 1rem;
          background: #f3edff;
          color: #6f38d0;
          border: 1px solid #e7dcfb;
          flex: 0 0 auto;
        }

        .rr-step strong {
          display: block;
          font-size: 0.98rem;
        }

        .rr-step p {
          margin: 4px 0 0;
          color: var(--rr-muted);
          font-size: 0.8rem;
          line-height: 1.35;
        }

        .rr-step-link {
          width: 46px;
          border-top: 1px dashed #d6d2e6;
          opacity: 0.9;
        }

        .rr-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .rr-action-card {
          border-radius: 20px;
          border: 1px solid var(--rr-border);
          box-shadow: 0 14px 28px rgba(30, 24, 55, 0.06);
          padding: 22px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          min-height: 186px;
        }

        .rr-action-primary {
          background: linear-gradient(150deg, #3f0b63 0%, #6f2fd2 100%);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.15);
        }

        .rr-action-secondary {
          background: linear-gradient(155deg, #f5efff 0%, #f0e8fc 100%);
        }

        .rr-action-copy h2 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.1;
        }

        .rr-action-copy p {
          margin: 10px 0 18px;
          max-width: 470px;
          line-height: 1.5;
          color: inherit;
          opacity: 0.92;
        }

        .rr-action-secondary .rr-action-copy p {
          color: #5f6480;
        }

        .rr-action-art {
          width: 150px;
          border-radius: 16px;
          background: radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0) 60%),
            linear-gradient(160deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.08));
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
          flex: 0 0 auto;
        }

        .rr-action-art-transfer {
          background: radial-gradient(circle at 35% 25%, rgba(116, 64, 224, 0.3), rgba(116, 64, 224, 0) 56%),
            linear-gradient(160deg, #efe6ff, #e4d7fb);
          box-shadow: inset 0 0 0 1px rgba(114, 56, 207, 0.14);
        }

        .rr-content-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 14px;
          align-items: start;
        }

        .rr-panel {
          background: var(--rr-surface);
          border: 1px solid var(--rr-border);
          border-radius: 20px;
          box-shadow: 0 14px 28px rgba(30, 24, 55, 0.05);
          padding: 16px;
          min-height: 320px;
        }

        .rr-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .rr-panel-head h3 {
          margin: 0;
          font-size: 1.35rem;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .rr-panel-head h3 span {
          min-width: 24px;
          height: 24px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.78rem;
          background: #ede4fb;
          color: #6f38d0;
          border: 1px solid #decdf8;
        }

        .rr-table-wrap {
          overflow: auto;
        }

        .rr-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.86rem;
        }

        .rr-table th,
        .rr-table td {
          text-align: left;
          padding: 10px 8px;
          border-bottom: 1px solid #f0edf6;
          vertical-align: middle;
        }

        .rr-table th {
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #7a8099;
          font-weight: 800;
        }

        .rr-table td {
          color: #313751;
          font-weight: 500;
        }

        .rr-status,
        .rr-type-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .status-submitted {
          background: #eef3ff;
          color: #446bd4;
          border: 1px solid #d9e5ff;
        }

        .status-approved {
          background: #e9f8ee;
          color: #2f9d53;
          border: 1px solid #d3efd9;
        }

        .status-rejected {
          background: #fff1f1;
          color: #c55555;
          border: 1px solid #ffd8d8;
        }

        .type-report {
          background: #f3edff;
          color: #6f38d0;
          border: 1px solid #e2d6fb;
        }

        .type-request {
          background: #eceefe;
          color: #4f63cf;
          border: 1px solid #d6ddff;
        }

        .rr-actions-inline {
          display: inline-flex;
          gap: 6px;
          align-items: center;
        }

        .rr-empty {
          min-height: 220px;
          border: 1px dashed #ddd6ed;
          border-radius: 16px;
          display: grid;
          place-content: center;
          text-align: center;
          gap: 10px;
          padding: 20px;
          background: #faf8fd;
        }

        .rr-empty strong {
          font-size: 1.2rem;
          color: #242945;
        }

        .rr-empty p {
          margin: 0;
          color: #68708a;
        }

        @media (max-width: 1320px) {
          .rr-content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1020px) {
          .rr-stepper {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .rr-step-link {
            display: none;
          }

          .rr-actions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .reports-requests-page {
            padding: 14px;
          }

          .rr-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .rr-hero-art {
            display: none;
          }

        }
      `}</style>
    </main>
  );
}

