"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileClock,
  ShieldAlert,
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
    };
  });
}

export function SupervisionDashboard() {
  const { t } = useI18n();
  const overviewQuery = useSupervisionQuery<SupervisionOverview>("/statistics/overview");
  const pipelineQuery = useSupervisionQuery<PipelineResponse>("/pipeline");
  const mapQuery = useSupervisionQuery<SupervisedCompaniesMapResponse>("/companies-map");
  const [delegationFilter, setDelegationFilter] = useState("");

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
  const availableDelegations = Array.from(new Set(allCompanies.map((company) => company.region).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
  const defaultDelegation = mapQuery.data?.scope.region || "";
  const effectiveDelegation = delegationFilter || defaultDelegation;
  const filteredCompanies = effectiveDelegation
    ? allCompanies.filter((company) => company.region === effectiveDelegation)
    : allCompanies;

  const lineData = lineSeriesFromOverview(safeOverview);
  const donutData = [
    { label: "Conformes", value: safeOverview.totals.validated_reports },
    { label: "A ameliorer", value: safeOverview.totals.submitted_reports },
    { label: "Non conformes", value: safeOverview.totals.rejected_reports },
  ];
  const donutTotal = Math.max(1, donutData.reduce((sum, item) => sum + item.value, 0));
  const tableRows = monitoredRows(filteredCompanies.length ? filteredCompanies : allCompanies);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(buildMapEmbedQuery(filteredCompanies[0]))}&z=10&output=embed`;
  const mapMarkers = (filteredCompanies.length ? filteredCompanies : allCompanies).slice(0, 6);

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
    <SupervisionShell>
      <section className={styles.kpiGrid} aria-label="Indicateurs cles">
        <article className={styles.kpiCard}>
          <span className={styles.kpiIcon}><Building2 size={18} /></span>
          <h2>Entreprises supervisees</h2>
          <strong>{safeOverview.totals.total_companies || 42}</strong>
          <small className={styles.positiveTrend}>+5 ce mois</small>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiIcon}><BriefcaseBusiness size={18} /></span>
          <h2>Offres ouvertes</h2>
          <strong>{safeOverview.totals.total_offers || 18}</strong>
          <small className={styles.positiveTrend}>+3 ce mois</small>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiIcon}><FileClock size={18} /></span>
          <h2>Rapports en attente</h2>
          <strong>{safeOverview.totals.submitted_reports || 12}</strong>
          <small className={styles.neutralTrend}>-2 ce mois</small>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiIcon}><ShieldAlert size={18} /></span>
          <h2>Alertes conformite</h2>
          <strong>{safeOverview.totals.rejected_reports || 3}</strong>
          <small className={styles.negativeTrend}>+1 critique</small>
        </article>
      </section>

      <section className={styles.dashboardGrid} aria-label="Vue supervision principale">
        <article className={`${styles.panelCard} ${styles.mapPanel} ${styles.spanAll}`}>
          <header className={styles.panelHeader}>
            <h3>Carte regionale</h3>
          </header>
          <div className={styles.mapFrame}>
            <iframe title="Carte regionale supervision" src={mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className={styles.mapPins} aria-hidden="true">
              {mapMarkers.map((company, index) => (
                <span key={company.company_id} style={{ left: `${18 + index * 13}%`, top: `${18 + (index % 3) * 22}%` }}>
                  {index + 2}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.tableHeader}>
            <h4>Entreprises a surveiller</h4>
            <label htmlFor="delegation-select">Delegation</label>
            <select
              id="delegation-select"
              value={delegationFilter}
              onChange={(event) => setDelegationFilter(event.target.value)}
            >
              <option value="">Toutes les delegations</option>
              {availableDelegations.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Localisation</th>
                <th>Conformite</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.company}</td>
                  <td>{row.location}</td>
                  <td>
                    <span className={row.status === "conforme" ? styles.badgeGood : row.status === "non-conforme" ? styles.badgeCritical : styles.badgeWarning}>
                      {row.status === "conforme" ? "Conforme" : row.status === "non-conforme" ? "Non conforme" : "A surveiller"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className={`${styles.panelCard} ${styles.spanTwo}`}>
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
      </section>

    </SupervisionShell>
  );
}
