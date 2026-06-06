"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { ComplianceReportSummary } from "@/lib/supervision";
import styles from "@/components/supervision/supervision-redesign.module.css";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Soumis",
  validated: "Valide",
  rejected: "Refuse",
};

function statusClass(status: string) {
  if (status === "validated") return styles.tagSuccess;
  if (status === "rejected") return styles.tagCritical;
  return styles.tagWarning;
}

function compactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function ComplianceReportsList() {
  const reports = useSupervisionQuery<ComplianceReportSummary[]>("/reports");

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
    return <LoadingState title="Chargement des rapports de conformite" description="Preparation de la file de revue et de l historique des recommandations." />;
  }

  if (reports.error || !reports.data) {
    return <EmptyState title="Rapports indisponibles" description={reports.error || "Les rapports de conformite n ont pas pu etre charges."} />;
  }

  return (
    <SupervisionShell>
      <section className={styles.sectionStack}>
        <div className={styles.metricGrid}>
          <article className={styles.metricCard}>
            <span>Total rapports</span>
            <strong>{summary.total}</strong>
            <p>Portefeuille de dossiers visible dans l espace supervision.</p>
          </article>
          <article className={styles.metricCard}>
            <span>Soumis</span>
            <strong>{summary.submitted}</strong>
            <p>File d attente pour revue ou validation regionale.</p>
          </article>
          <article className={styles.metricCard}>
            <span>Valides</span>
            <strong>{summary.validated}</strong>
            <p>Dossiers fermes positivement apres analyse.</p>
          </article>
          <article className={styles.metricCard}>
            <span>Refuses</span>
            <strong>{summary.rejected}</strong>
            <p>Rapports ayant besoin d un suivi entreprise plus ferme.</p>
          </article>
        </div>

        <section className={styles.reportsList}>
          {reports.data.length === 0 ? (
            <div className={`${styles.panelCard} ${styles.emptyCard}`}>
              <h3>Aucun rapport pour ce filtre</h3>
              <p>Essayez un autre statut pour retrouver des dossiers a revoir ou a valider.</p>
            </div>
          ) : (
            reports.data.map((report) => (
              <article key={report.id} className={styles.reportCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIdentity}>
                    <h3>{report.company_name}</h3>
                    <p>
                      {report.company_region} · {compactDate(report.reporting_period_start)} au {compactDate(report.reporting_period_end)}
                    </p>
                  </div>
                  <span className={statusClass(report.status)}>{STATUS_LABELS[report.status] || report.status}</span>
                </div>

                <p className={styles.sectionSubtle}>{report.summary}</p>

                <div className={styles.reportMetrics}>
                  <div className={styles.reportMetric}>
                    <span>Candidatures</span>
                    <strong>{report.applications_count}</strong>
                  </div>
                  <div className={styles.reportMetric}>
                    <span>Preselection</span>
                    <strong>{report.shortlisted_count}</strong>
                  </div>
                  <div className={styles.reportMetric}>
                    <span>Recrutements</span>
                    <strong>{report.hired_count}</strong>
                  </div>
                  <div className={styles.reportMetric}>
                    <span>Recommandations</span>
                    <strong>{report.recommendations.length}</strong>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.sectionSubtle}>Soumis le {compactDate(report.submitted_at)}</span>
                  <span className={styles.matchBadge}><Sparkles size={14} /> Lecture executive</span>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </SupervisionShell>
  );
}
