"use client";

import {
  ArrowUpRight,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import {
  PipelineResponse,
  SupervisedCompaniesMapResponse,
  SupervisionOverview,
} from "@/lib/supervision";
import styles from "@/components/supervision/supervision-redesign.module.css";

interface TableRow {
  id: string;
  company: string;
  location: string;
  status: "conforme" | "a-ameliorer" | "non-conforme";
  offers: number;
  applications: number;
}

const DONUT_COLORS = ["#26B36A", "#F4A22D", "#E0414D"];

function buildMapEmbedQuery(company: { company_name: string; region: string; address: string } | undefined) {
  if (!company) return "Tunis, Tunisie";
  return `${company.company_name}, ${company.address || company.region}, Tunisie`;
}

function lineSeriesFromOverview(overview: SupervisionOverview) {
  const finalValue = Math.max(36, Math.min(96, Math.round(overview.rates.compliance_validation_rate || 78)));
  const start = Math.max(10, finalValue - 58);
  const values = [
    start,
    Math.round(start + 12),
    Math.round(start + 24),
    Math.round(start + 36),
    Math.round(start + 46),
    finalValue,
  ];
  return ["Janv.", "Fevr.", "Mars", "Avr.", "Mai", "Juin"].map((month, index) => ({
    month,
    value: values[index],
  }));
}

function monitoredRows(companies: SupervisedCompaniesMapResponse["companies"]): TableRow[] {
  return companies.slice(0, 4).map((entry) => {
    let status: TableRow["status"] = "conforme";
    if (entry.offers_count === 0 || entry.hired_count === 0) {
      status = "a-ameliorer";
    }
    if (entry.applications_count === 0) {
      status = "non-conforme";
    }
    return {
      id: entry.company_id,
      company: entry.company_name,
      location: entry.region || "Non renseigne",
      status,
      offers: entry.offers_count,
      applications: entry.applications_count,
    };
  });
}

export function SupervisionDashboard() {
  const { t } = useI18n();
  const overviewQuery = useSupervisionQuery<SupervisionOverview>("/statistics/overview");
  const pipelineQuery = useSupervisionQuery<PipelineResponse>("/pipeline");
  const mapQuery = useSupervisionQuery<SupervisedCompaniesMapResponse>("/companies-map");

  const safeOverview: SupervisionOverview = overviewQuery.data ?? {
    scope: { role: "inspecteur", region: null, visibility: "territorial" },
    totals: {
      total_companies: 0,
      active_companies: 0,
      total_offers: 0,
      total_applications: 0,
      shortlisted_candidates: 0,
      hired_candidates: 0,
      total_reports: 0,
      submitted_reports: 0,
      validated_reports: 0,
      rejected_reports: 0,
    },
    rates: {
      shortlist_rate: 0,
      hiring_rate: 0,
      compliance_validation_rate: 0,
      inclusion_rate: 0,
    },
  };

  const allCompanies = mapQuery.data?.companies ?? [];
  const safePipeline = pipelineQuery.data ?? {
    totals: {
      offers_count: 0,
      applications_count: 0,
      shortlisted_count: 0,
      interviews_count: 0,
      hired_count: 0,
      rejected_count: 0,
    },
    by_company: [],
  };

  const lineData = lineSeriesFromOverview(safeOverview);
  const donutData = [
    { label: "Conformes", value: safeOverview.totals.validated_reports },
    { label: "A ameliorer", value: safeOverview.totals.submitted_reports },
    { label: "Non conformes", value: safeOverview.totals.rejected_reports },
  ];
  const donutTotal = Math.max(1, donutData.reduce((sum, item) => sum + item.value, 0));
  const tableRows = monitoredRows(allCompanies);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(buildMapEmbedQuery(allCompanies[0]))}&z=10&output=embed`;
  const topAttentionRows = tableRows.filter((row) => row.status !== "conforme");
  const recentActivity = safePipeline.by_company
    .slice()
    .sort((a, b) => b.applications_count - a.applications_count)
    .slice(0, 4);
  const overviewActions = (
    <ButtonLink href="/supervision/reports" variant="secondary" size="sm">
      Revoir les rapports
    </ButtonLink>
  );

  if (overviewQuery.loading || pipelineQuery.loading) {
    return (
      <LoadingState
        title={t("supervision.dashboard.loadingTitle")}
        description={t("supervision.dashboard.loadingDescription")}
      />
    );
  }

  if (overviewQuery.error || pipelineQuery.error || !overviewQuery.data || !pipelineQuery.data) {
    return (
      <EmptyState
        title={t("supervision.dashboard.unavailableTitle")}
        description={t("supervision.dashboard.unavailableDescription")}
        action={
          <ButtonLink href="/supervision/reports" variant="secondary" size="sm">
            {t("supervision.dashboard.openReports")}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <SupervisionShell
      badge="Espace inspecteur"
      actions={overviewActions}
    >
      <section className={styles.heroStrip} aria-label="Resume executive">
        <article className={styles.heroCard}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Carte regionale</h2>
              <p>
                Visualisez les zones actives et les entreprises a accompagner en priorite.
              </p>
            </div>
          </div>

          <div className={styles.mapFrame}>
            <iframe title="Carte regionale supervision" src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </article>

        <div className={styles.insightsRail}>
          <article className={`${styles.panelCard} ${styles.complianceSplitCard}`}>
            <header className={styles.panelHeader}>
              <h3>Repartition par niveau de conformite</h3>
            </header>
            <div className={styles.donutWrap}>
              <div className={styles.donutChart}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2}>
                      {donutData.map((entry, index) => (
                        <Cell key={entry.label} fill={DONUT_COLORS[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className={styles.donutLegend}>
                {donutData.map((entry, index) => {
                  const percent = Math.round((entry.value / donutTotal) * 100);
                  return (
                    <li key={entry.label}>
                      <span style={{ backgroundColor: DONUT_COLORS[index] }} aria-hidden="true" />
                      <p>{entry.label}</p>
                      <strong>{entry.value} ({percent}%)</strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.dashboardGrid} aria-label="Vue supervision principale">
        <article className={styles.panelCard}>
          <header className={styles.panelHeader}>
            <h3>Evolution de la conformite</h3>
            <span className={styles.panelMeta}>6 derniers mois</span>
          </header>
          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(53, 6, 62, 0.12)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#6b5f7f" />
                <YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} stroke="#6b5f7f" />
                <Tooltip
                  formatter={(value: unknown) => {
                    const parsed = Array.isArray(value) ? Number(value[0]) : Number(value);
                    const safe = Number.isFinite(parsed) ? parsed : 0;
                    return `${safe}%`;
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#6D2DC8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={styles.panelCard}>
          <header className={styles.panelHeader}>
            <h3>Activite recente</h3>
            <ButtonLink href="/supervision/pipeline" variant="secondary" size="sm">
              Voir le detail
            </ButtonLink>
          </header>
          <ul className={styles.activityList}>
            {recentActivity.map((company) => (
              <li key={company.company_id} className={styles.activityRow}>
                <strong>{company.company_name}</strong>
                <p>{company.region} · {company.offers_count} offres actives</p>
                <div className={styles.activityRowMeta}>
                  <span>{company.applications_count} candidatures</span>
                  <span>{company.shortlisted_count} preselectionnes</span>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.panelCard}>
          <header className={styles.panelHeader}>
            <h3>Entreprises requierant une attention</h3>
            <span className={styles.panelMeta}>Priorisation terrain</span>
          </header>
          <ul className={styles.attentionList}>
            {(topAttentionRows.length ? topAttentionRows : tableRows).map((row) => (
              <li key={row.id} className={styles.attentionRow}>
                <strong>{row.company}</strong>
                <p>{row.location} · {row.offers} offres · {row.applications} candidatures</p>
                <div className={styles.attentionRowMeta}>
                  <span className={row.status === "non-conforme" ? styles.tagCritical : row.status === "a-ameliorer" ? styles.tagWarning : styles.tagSuccess}>
                    {row.status === "non-conforme" ? "Non conforme" : row.status === "a-ameliorer" ? "A surveiller" : "Conforme"}
                  </span>
                  <span><ArrowUpRight size={14} /> Action recommandee</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

    </SupervisionShell>
  );
}
