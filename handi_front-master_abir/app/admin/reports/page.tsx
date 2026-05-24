"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ComplianceReportDetail, ComplianceReportSummary, fetchSupervisionResource } from "@/lib/supervision";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  validated: "Validated",
  rejected: "Rejected",
};

const ITEMS_PER_PAGE = 7;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ComplianceReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<ComplianceReportDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = status ? `/reports?status=${status}` : "/reports";
      const result = await fetchSupervisionResource<ComplianceReportSummary[]>(query);
      setReports(result);
      setSelectedId((current) => current ?? result[0]?.id ?? null);
    } catch (cause) {
      setReports([]);
      setSelectedReport(null);
      setSelectedId(null);
      setError(cause instanceof Error ? cause.message : "Unable to load company reports.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedReport(null);
      return;
    }

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        const detail = await fetchSupervisionResource<ComplianceReportDetail>(`/reports/${selectedId}`);
        setSelectedReport(detail);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load report detail.");
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedId]);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (!term) return true;
      return [
        report.company_name,
        report.company_region,
        report.summary,
        report.submitted_by_name,
        report.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [reports, search]);

  const summary = useMemo(
    () => ({
      total: reports.length,
      submitted: reports.filter((report) => report.status === "submitted").length,
      validated: reports.filter((report) => report.status === "validated").length,
      rejected: reports.filter((report) => report.status === "rejected").length,
    }),
    [reports],
  );

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const visibleReports = filteredReports.slice((pageCourante - 1) * ITEMS_PER_PAGE, pageCourante * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  return (
    <main className="page-centree section-page app-theme">
      <section className="admin-reports-page">
        <header className="admin-reports-hero">
          <div>
            <p className="admin-reports-kicker">Enterprise reports</p>
            <h1>Company compliance reports</h1>
            <p>Review every report submitted by companies, inspect metrics, and open the generated report body without leaving the admin workspace.</p>
          </div>
          <div className="admin-reports-summary" aria-label="Reports summary">
            <span><strong>{summary.total}</strong>Total</span>
            <span><strong>{summary.submitted}</strong>Submitted</span>
            <span><strong>{summary.validated}</strong>Validated</span>
            <span><strong>{summary.rejected}</strong>Rejected</span>
          </div>
        </header>

        <section className="admin-reports-grid">
          <article className="admin-reports-list-panel">
            <div className="admin-reports-toolbar">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company, region, report..."
                aria-label="Search reports"
              />
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter reports by status">
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
              </select>
              <button type="button" onClick={() => void loadReports()}>
                Refresh
              </button>
            </div>

            {error ? <p className="message message-erreur">{error}</p> : null}

            <div className="admin-reports-table-wrap">
              <table className="admin-reports-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}>Loading reports...</td></tr>
                  ) : visibleReports.length === 0 ? (
                    <tr><td colSpan={5}>No reports match these filters.</td></tr>
                  ) : (
                    visibleReports.map((report) => (
                      <tr
                        key={report.id}
                        className={selectedId === report.id ? "is-selected" : ""}
                        onClick={() => setSelectedId(report.id)}
                      >
                        <td>
                          <strong>{report.company_name}</strong>
                          <span>{report.company_region || report.region || "-"}</span>
                        </td>
                        <td>{formatDate(report.reporting_period_start)} - {formatDate(report.reporting_period_end)}</td>
                        <td><span className={`admin-reports-status admin-reports-status--${report.status}`}>{STATUS_LABELS[report.status] || report.status}</span></td>
                        <td>{report.applications_count}</td>
                        <td>{report.hired_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <footer className="admin-reports-pagination">
              <span>Page {pageCourante} / {totalPages} - {filteredReports.length} report(s)</span>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={pageCourante <= 1}>Previous</button>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={pageCourante >= totalPages}>Next</button>
              </div>
            </footer>
          </article>

          <aside className="admin-reports-detail-panel">
            {detailLoading ? (
              <p className="admin-reports-detail-empty">Opening report detail...</p>
            ) : selectedReport ? (
              <>
                <div className="admin-reports-detail-head">
                  <span className={`admin-reports-status admin-reports-status--${selectedReport.status}`}>
                    {STATUS_LABELS[selectedReport.status] || selectedReport.status}
                  </span>
                  <h2>{selectedReport.summary}</h2>
                  <p>{selectedReport.company_name} - {selectedReport.company_region || selectedReport.region || "-"}</p>
                </div>

                <div className="admin-reports-detail-metrics">
                  <span><strong>{selectedReport.workforce_total}</strong>Workforce</span>
                  <span><strong>{selectedReport.disabled_employees}</strong>Disabled employees</span>
                  <span><strong>{selectedReport.active_offers}</strong>Active offers</span>
                  <span><strong>{selectedReport.shortlisted_count}</strong>Shortlisted</span>
                </div>

                <div className="admin-reports-detail-block">
                  <strong>Generated report</strong>
                  <p>{selectedReport.accommodation_actions || "No generated report body or accommodation actions were provided."}</p>
                </div>

                <div className="admin-reports-detail-block">
                  <strong>Review history</strong>
                  <p>Submitted by {selectedReport.submitted_by_name || "-"} on {formatDate(selectedReport.submitted_at)}.</p>
                  <p>Reviewed by {selectedReport.reviewed_by_name || "-"} {selectedReport.reviewed_at ? `on ${formatDate(selectedReport.reviewed_at)}` : ""}</p>
                  {selectedReport.review_comment ? <p>{selectedReport.review_comment}</p> : null}
                </div>

                <div className="admin-reports-detail-block">
                  <strong>Recommendations</strong>
                  {selectedReport.recommendations.length === 0 ? (
                    <p>No recommendations have been added.</p>
                  ) : (
                    selectedReport.recommendations.map((item) => (
                      <p key={item.id}>{item.text}</p>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="admin-reports-detail-empty">Select a report to view its content.</p>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}
