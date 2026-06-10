"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ComplianceReportDetail, ComplianceReportSummary, fetchSupervisionResource } from "@/lib/supervision";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Soumis",
  validated: "Valide",
  rejected: "Refuse",
};

const ITEMS_PER_PAGE = 25;

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
      setError(cause instanceof Error ? cause.message : "Impossible de charger les rapports des entreprises.");
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
        setError(cause instanceof Error ? cause.message : "Impossible de charger le détail du rapport.");
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
            <p className="admin-reports-kicker">Rapports entreprise</p>
            <h1>Rapports de conformite des entreprises</h1>
          </div>
          <div className="admin-reports-summary" aria-label="Resume des rapports">
            <span><strong>{summary.total}</strong>Total</span>
            <span><strong>{summary.submitted}</strong>Soumis</span>
            <span><strong>{summary.validated}</strong>Valides</span>
            <span><strong>{summary.rejected}</strong>Refuses</span>
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
                <option value="rejected">Refuse</option>
              </select>
            </div>

            {error ? <p className="message message-erreur">{error}</p> : null}

            <div className="admin-reports-table-wrap">
              <table className="admin-reports-table">
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th>Periode</th>
                    <th>Statut</th>
                    <th>Candidatures</th>
                    <th>Acceptes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}>Chargement des rapports...</td></tr>
                  ) : visibleReports.length === 0 ? (
                    <tr><td colSpan={5}>Aucun rapport ne correspond a ces filtres.</td></tr>
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
              <span>Page {pageCourante} / {totalPages} - {filteredReports.length} rapport(s)</span>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={pageCourante <= 1}>Precedent</button>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={pageCourante >= totalPages}>Suivant</button>
              </div>
            </footer>
          </article>

          <aside className="admin-reports-detail-panel">
            {detailLoading ? (
              <p className="admin-reports-detail-empty">Ouverture du detail du rapport...</p>
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
                  <span><strong>{selectedReport.workforce_total}</strong>Effectif</span>
                  <span><strong>{selectedReport.disabled_employees}</strong>Employes en situation de handicap</span>
                  <span><strong>{selectedReport.active_offers}</strong>Offres actives</span>
                  <span><strong>{selectedReport.shortlisted_count}</strong>Preselection</span>
                </div>

                <div className="admin-reports-detail-block">
                  <strong>Rapport genere</strong>
                  <p>{selectedReport.accommodation_actions || "Aucun contenu de rapport ni action d'accompagnement n'a ete fourni."}</p>
                </div>

                <div className="admin-reports-detail-block">
                  <strong>Historique de revue</strong>
                  <p>Soumis par {selectedReport.submitted_by_name || "-"} le {formatDate(selectedReport.submitted_at)}.</p>
                  <p>Revu par {selectedReport.reviewed_by_name || "-"} {selectedReport.reviewed_at ? `le ${formatDate(selectedReport.reviewed_at)}` : ""}</p>
                  {selectedReport.review_comment ? <p>{selectedReport.review_comment}</p> : null}
                </div>

                <div className="admin-reports-detail-block">
                  <strong>Recommandations</strong>
                  {selectedReport.recommendations.length === 0 ? (
                    <p>Aucune recommandation n&apos;a été ajoutée.</p>
                  ) : (
                    selectedReport.recommendations.map((item) => (
                      <p key={item.id}>{item.text}</p>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="admin-reports-detail-empty">Selectionnez un rapport pour afficher son contenu.</p>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}
