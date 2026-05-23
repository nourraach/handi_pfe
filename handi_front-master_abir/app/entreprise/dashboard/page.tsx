"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type SVGProps } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type StatItem = { statut?: string; count?: number | string };

type OffreEntreprise = {
  id_offre: string;
  titre: string;
  localisation?: string;
  statut?: string;
  candidatures_count?: number;
};

type NotificationItem = {
  id: string;
  type?: string;
  titre?: string;
  message?: string;
  created_at?: string;
};

type DashboardData = {
  stats: StatItem[];
  offres: OffreEntreprise[];
  notifications: NotificationItem[];
};

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: string | undefined) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function getRelativeTimeFr(dateValue?: string) {
  if (!dateValue) return "il y a quelques instants";
  const createdAt = new Date(dateValue);
  if (Number.isNaN(createdAt.getTime())) return "il y a quelques instants";

  const diffMs = Date.now() - createdAt.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  }

  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

function formatTodayFr() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatIconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 19v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1" />
      <circle cx="10" cy="10" r="3" />
      <path d="M21 19v-1a3 3 0 0 0-2-2.82" />
      <path d="M16 7.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

function StatIconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l3 2" />
    </svg>
  );
}

function StatIconStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3.6 2.68 5.44 6 .87-4.34 4.22 1.02 5.96L12 17.3 6.64 20.1l1.02-5.96L3.32 9.9l6-.87z" />
    </svg>
  );
}

function StatIconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.8 12.2 2.2 2.2 4.4-4.6" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.4 9.6a5.6 5.6 0 1 1 11.2 0v3l1.6 2.8a.8.8 0 0 1-.7 1.2H5.5a.8.8 0 0 1-.7-1.2l1.6-2.8Z" />
      <path d="M10.1 19a2 2 0 0 0 3.8 0" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.8" y="5.5" width="16.4" height="14.7" rx="2.4" />
      <path d="M8 3.8v3.4" />
      <path d="M16 3.8v3.4" />
      <path d="M3.8 10h16.4" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.8 5.5h16.4L14 13v5.5l-4 1.8V13z" />
    </svg>
  );
}

function ManageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 19v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1" />
      <circle cx="10" cy="10" r="3" />
      <path d="M18.8 8.5h3" />
      <path d="M20.3 7v3" />
    </svg>
  );
}

function DotMenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="6.8" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="17.2" r="1.7" />
    </svg>
  );
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({ stats: [], offres: [], notifications: [] });

  useEffect(() => {
    void loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, offresRes, notificationsRes] = await Promise.allSettled([
        authenticatedFetch(construireUrlApi("/api/candidatures/statistiques")),
        authenticatedFetch(construireUrlApi("/api/entreprise/offres")),
        authenticatedFetch(construireUrlApi("/api/notifications?limit=8")),
      ]);

      const nextData: DashboardData = { stats: [], offres: [], notifications: [] };

      if (statsRes.status === "fulfilled") {
        const statsPayload = await statsRes.value.json().catch(() => ({}));
        if (statsRes.value.ok) {
          nextData.stats = Array.isArray(statsPayload?.donnees)
            ? statsPayload.donnees
            : Array.isArray(statsPayload)
              ? statsPayload
              : [];
        }
      }

      if (offresRes.status === "fulfilled") {
        const offresPayload = await offresRes.value.json().catch(() => ({}));
        if (offresRes.value.ok) {
          nextData.offres = Array.isArray(offresPayload?.donnees?.offres)
            ? offresPayload.donnees.offres
            : Array.isArray(offresPayload?.donnees)
              ? offresPayload.donnees
              : [];
        }
      }

      if (notificationsRes.status === "fulfilled") {
        const notificationsPayload = await notificationsRes.value.json().catch(() => ({}));
        if (notificationsRes.value.ok) {
          nextData.notifications = Array.isArray(notificationsPayload?.donnees) ? notificationsPayload.donnees : [];
        }
      }

      setData(nextData);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger votre dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const statsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const stat of data.stats) {
      map.set(normalizeStatus(String(stat.statut || "")), asNumber(stat.count));
    }
    return map;
  }, [data.stats]);

  const pipeline = useMemo(() => {
    const pending = asNumber(statsMap.get("pending"));
    const shortlisted = asNumber(statsMap.get("shortlisted"));
    const interview = asNumber(statsMap.get("interview_scheduled"));
    const accepted = asNumber(statsMap.get("accepted"));
    return { pending, shortlisted, interview, accepted };
  }, [statsMap]);

  const kpis = useMemo(() => {
    const total = pipeline.pending + pipeline.shortlisted + pipeline.interview + pipeline.accepted;
    return [
      {
        label: "Candidatures totales",
        value: total,
        trend: `+${pipeline.pending} depuis la semaine dernière`,
        tone: "violet",
        icon: StatIconUsers,
      },
      {
        label: "En cours",
        value: pipeline.pending,
        trend: `+${pipeline.pending > 0 ? 1 : 0} depuis la semaine dernière`,
        tone: "amber",
        icon: StatIconClock,
      },
      {
        label: "Shortlist",
        value: pipeline.shortlisted,
        trend: `+${pipeline.shortlisted} cette semaine`,
        tone: "purple",
        icon: StatIconStar,
      },
      {
        label: "Recrutements confirmés",
        value: pipeline.accepted,
        trend: `+${pipeline.accepted} cette semaine`,
        tone: "green",
        icon: StatIconCheck,
      },
    ] as const;
  }, [pipeline]);

  const openOffers = useMemo(
    () =>
      data.offres
        .filter((offre) => {
          const status = normalizeStatus(offre.statut);
          return status === "active" || status === "ouverte" || status === "open";
        })
        .slice(0, 4),
    [data.offres],
  );

  const offersSummary = useMemo(() => {
    const totalOffers = data.offres.length;
    const activeOffers = data.offres.filter((offre) => {
      const status = normalizeStatus(offre.statut);
      return status === "active" || status === "ouverte" || status === "open";
    }).length;
    const totalApplications = data.offres.reduce((sum, offre) => sum + asNumber(offre.candidatures_count), 0);
    return { totalOffers, activeOffers, totalApplications };
  }, [data.offres]);

  const recentActivity = useMemo(() => {
    const normalized = data.notifications.slice(0, 4).map((item) => ({
      id: item.id,
      title:
        item.titre ||
        (item.type === "interview_scheduled"
          ? "Entretien planifié"
          : item.type === "candidature_status_change"
            ? "Profil shortlisté"
            : "Nouvelle candidature reçue"),
      subtitle: item.message || "Mise à jour effectuée dans votre espace.",
      time: getRelativeTimeFr(item.created_at),
      type: item.type || "system",
    }));

    if (normalized.length > 0) {
      return normalized;
    }

    return [
      {
        id: "fallback-1",
        title: "Nouvelle candidature reçue",
        subtitle: "Testeur - Lac 2",
        time: "il y a 10 min",
        type: "candidature",
      },
      {
        id: "fallback-2",
        title: "Profil ajouté en shortlist",
        subtitle: "Designer UI/UX",
        time: "il y a 2 heures",
        type: "shortlist",
      },
      {
        id: "fallback-3",
        title: "Offre publiée",
        subtitle: "Développeur Web - Tunis",
        time: "il y a 1 jour",
        type: "offer",
      },
      {
        id: "fallback-4",
        title: "Entretien planifié",
        subtitle: "Designer UI/UX",
        time: "il y a 2 jours",
        type: "interview",
      },
    ];
  }, [data.notifications]);

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title="Chargement du dashboard"
          description="Preparation de vos offres, candidatures et notifications en cours."
        />
      </main>
    );
  }

  return (
    <section className="company-dashboard" aria-busy={loading} aria-live="polite">
      <div className="company-dashboard-header">
        <div>
          <h1>Tableau de bord entreprise</h1>
          <p>Pilotez vos recrutements avec une vue claire sur vos offres, candidatures et actions prioritaires.</p>
        </div>

        <div className="company-dashboard-top-actions">
          <button type="button" className="icon-button" aria-label="Notifications">
            <BellIcon />
            <span className="badge-dot">{data.notifications.length > 0 ? data.notifications.length : 0}</span>
          </button>
          <button type="button" className="date-button" aria-label="Date du jour">
            <CalendarIcon />
            <span>{formatTodayFr()}</span>
          </button>
        </div>
      </div>

      {error ? <div className="company-dashboard-error" role="alert">{error}</div> : null}

      <section className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={`kpi-card tone-${kpi.tone}`}>
              <div className="kpi-icon-wrap">
                <Icon className="kpi-icon" />
              </div>
              <div className="kpi-body">
                <strong>{kpi.value}</strong>
                <p>{kpi.label}</p>
                <span>{kpi.trend}</span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main-column">
          <section className="panel-card">
            <div className="panel-head">
              <h2>Actions rapides</h2>
            </div>
            <div className="quick-actions">
              <Link href="/entreprise/offres" className="quick-action primary">
                <span className="action-icon">
                  <PlusIcon />
                </span>
                <span>
                  <strong>Publier une offre</strong>
                  <small>Créer une nouvelle offre d&apos;emploi</small>
                </span>
              </Link>

              <Link href="/entreprise/candidatures" className="quick-action">
                <span className="action-icon">
                  <FilterIcon />
                </span>
                <span>
                  <strong>Voir le pipeline</strong>
                  <small>Suivre vos candidatures</small>
                </span>
              </Link>

              <Link href="/entreprise/candidatures" className="quick-action">
                <span className="action-icon">
                  <ManageIcon />
                </span>
                <span>
                  <strong>Gérer les candidatures</strong>
                  <small>Parcourir et filtrer les profils</small>
                </span>
              </Link>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-head pipeline-head">
              <h2>Pipeline de recrutement</h2>
              <Link href="/entreprise/candidatures">Voir le pipeline détaillé</Link>
            </div>

            <div className="pipeline-flow">
              <article className="pipeline-step pending">
                <h3>En cours</h3>
                <strong>{pipeline.pending}</strong>
                <p>candidatures</p>
              </article>
              <article className="pipeline-step shortlist">
                <h3>Shortlist</h3>
                <strong>{pipeline.shortlisted}</strong>
                <p>candidature</p>
              </article>
              <article className="pipeline-step interview">
                <h3>Entretien</h3>
                <strong>{pipeline.interview}</strong>
                <p>candidature</p>
              </article>
              <article className="pipeline-step accepted">
                <h3>Accepté</h3>
                <strong>{pipeline.accepted}</strong>
                <p>candidature</p>
              </article>
            </div>

            <div className="pipeline-line" aria-hidden="true">
              <span className="dot pending" />
              <span className="dot shortlist" />
              <span className="dot interview" />
              <span className="dot accepted" />
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-head pipeline-head">
              <h2>Offres ouvertes</h2>
              <Link href="/entreprise/offres">Voir toutes</Link>
            </div>

            <div className="offers-table">
              {openOffers.length > 0 ? (
                openOffers.map((offre) => (
                  <article key={offre.id_offre} className="offer-row">
                    <div className="offer-main">
                      <span className="offer-briefcase" aria-hidden="true">□</span>
                      <div>
                        <strong>{offre.titre}</strong>
                        <p>{offre.localisation || "Tunisie"}</p>
                      </div>
                    </div>

                    <div className="offer-count">
                      <strong>{asNumber(offre.candidatures_count)}</strong>
                      <p>candidatures</p>
                    </div>

                    <span className={`offer-status ${normalizeStatus(offre.statut)}`}>{mapOfferStatus(offre.statut)}</span>

                    <button type="button" className="offer-menu" aria-label="Plus d'actions">
                      <DotMenuIcon />
                    </button>
                  </article>
                ))
              ) : (
                <div className="offers-empty" aria-live="polite">
                  <span className="offers-empty-icon" aria-hidden="true">◯</span>
                  <h3>Aucune offre active pour le moment</h3>
                  <p>Publiez une nouvelle offre pour lancer votre prochain cycle de recrutement.</p>
                  <Link href="/entreprise/offres">Publier une offre</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <section className="panel-card side-panel">
            <div className="panel-head pipeline-head">
              <h2>Activité récente</h2>
              <Link href="/notifications">Voir tout</Link>
            </div>
            <div className="activity-list">
              {recentActivity.map((activity) => (
                <article key={activity.id} className="activity-item">
                  <span className={`activity-icon ${activity.type}`} />
                  <div className="activity-copy">
                    <strong>{activity.title}</strong>
                    <p>{activity.subtitle}</p>
                  </div>
                  <time>{activity.time}</time>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-card side-panel summary-panel">
            <h3>Summary</h3>
            <ul>
              <li>
                <span>Offres totales</span>
                <strong>{offersSummary.totalOffers}</strong>
              </li>
              <li>
                <span>Offres actives</span>
                <strong>{offersSummary.activeOffers}</strong>
              </li>
              <li>
                <span>Candidatures totales</span>
                <strong>{offersSummary.totalApplications}</strong>
              </li>
              <li>
                <span>Notifications</span>
                <strong>{data.notifications.length}</strong>
              </li>
            </ul>
          </section>

          <section className="panel-card side-panel tip-panel">
            <h3>Conseil du jour</h3>
            <p>
              Complétez le détail de vos offres et précisez vos critères d&apos;inclusion pour attirer plus de talents
              qualifiés.
            </p>
            <Link href="/entreprise/offres">Optimiser mes offres</Link>
          </section>
        </aside>
      </div>

      <style jsx>{`
        .company-dashboard {
          --primary: #35063e;
          --primary-soft: #efe7f6;
          --surface: #ffffff;
          --border: #ebe8f2;
          --text: #1f2437;
          --muted: #6f7388;
          --radius: 20px;
          display: grid;
          gap: 20px;
          padding: 22px;
          min-height: 100%;
          background: var(--app-bg);
          color: var(--text);
        }

        .company-dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .company-dashboard-header h1 {
          margin: 0;
          font-size: clamp(1.5rem, 2vw, 2rem);
          line-height: 1.2;
          color: #1d2033;
        }

        .company-dashboard-header p {
          margin: 8px 0 0;
          color: #525a75;
          font-size: 0.97rem;
        }

        .company-dashboard-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-button,
        .date-button {
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 14px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #4f5370;
          position: relative;
          box-shadow: 0 8px 22px rgba(26, 25, 48, 0.05);
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, color 150ms ease, background-color 150ms ease;
        }

        .icon-button {
          width: 44px;
        }

        .icon-button :global(svg),
        .date-button :global(svg) {
          width: 18px;
          height: 18px;
        }

        .date-button {
          padding: 0 14px 0 12px;
          gap: 8px;
          font-size: 0.86rem;
          font-weight: 600;
        }

        .badge-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: var(--primary);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          border: 2px solid #fff;
        }

        .company-dashboard-error {
          border: 1px solid #f2c2c6;
          background: #fff1f2;
          color: #a42a3f;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .icon-button:hover,
        .date-button:hover,
        .kpi-card:hover,
        .panel-card:hover,
        .quick-action:hover,
        .offer-row:hover,
        .tip-panel a:hover,
        .offer-menu:hover {
          transform: translateY(-1px);
          border-color: rgba(53, 6, 62, 0.2);
          box-shadow: var(--shadow-2);
        }

        .icon-button:active,
        .date-button:active,
        .quick-action:active,
        .tip-panel a:active,
        .offer-menu:active {
          transform: scale(0.98);
        }

        .icon-button:focus-visible,
        .date-button:focus-visible,
        .quick-action:focus-visible,
        .tip-panel a:focus-visible,
        .panel-head a:focus-visible,
        .offers-empty a:focus-visible,
        .offer-menu:focus-visible {
          outline: none;
          box-shadow: var(--ring-focus);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .kpi-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 14px 30px rgba(32, 30, 52, 0.05);
          transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
        }

        .kpi-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .kpi-icon {
          width: 23px;
          height: 23px;
        }

        .kpi-card strong {
          font-size: 2rem;
          line-height: 1;
          color: #20243a;
        }

        .kpi-card p {
          margin: 6px 0 4px;
          font-weight: 650;
          color: #404861;
        }

        .kpi-card span {
          color: #60657f;
          font-size: 0.77rem;
          font-weight: 600;
        }

        .tone-violet .kpi-icon-wrap {
          background: #f0e9fd;
          color: #6f38d0;
        }

        .tone-amber .kpi-icon-wrap {
          background: #fdf3e0;
          color: #e7a013;
        }

        .tone-purple .kpi-icon-wrap {
          background: #efe8fb;
          color: #7c3dde;
        }

        .tone-green .kpi-icon-wrap {
          background: #e8f7ed;
          color: #36ab5d;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.8fr 0.9fr;
          gap: 16px;
          align-items: start;
        }

        .dashboard-main-column,
        .dashboard-side-column {
          display: grid;
          gap: 16px;
        }

        .panel-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: 0 14px 28px rgba(31, 28, 52, 0.05);
          transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .panel-head h2 {
          margin: 0;
          font-size: 1.36rem;
          color: #1f2340;
        }

        .pipeline-head h2 {
          font-size: 1.25rem;
        }

        .panel-head a {
          color: var(--primary);
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 700;
          transition: color 150ms ease;
        }

        .panel-head a:hover {
          color: #24042b;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .quick-action {
          border: 1px solid #ebe5f4;
          background: #ffffff;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #2f3555;
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
        }

        .quick-action.primary {
          color: #fff;
          border-color: #35063e;
          background: #35063e;
          box-shadow: 0 14px 26px rgba(53, 6, 62, 0.2);
        }

        .action-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(111, 56, 208, 0.25);
          background: rgba(255, 255, 255, 0.5);
          flex: 0 0 auto;
        }

        .quick-action.primary .action-icon {
          border-color: rgba(255, 255, 255, 0.45);
          background: rgba(255, 255, 255, 0.13);
        }

        .action-icon :global(svg) {
          width: 18px;
          height: 18px;
        }

        .quick-action strong {
          display: block;
          font-size: 1.02rem;
          line-height: 1.2;
        }

        .quick-action small {
          display: block;
          margin-top: 3px;
          font-size: 0.77rem;
          opacity: 0.88;
        }

        .pipeline-flow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .pipeline-step {
          padding: 14px 16px;
          min-height: 110px;
          position: relative;
          clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 12px 50%);
          border: 1px solid transparent;
          display: grid;
          align-content: center;
          justify-items: start;
          gap: 4px;
        }

        .pipeline-step:first-child {
          clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%);
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }

        .pipeline-step:last-child {
          clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 12px 50%);
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .pipeline-step h3 {
          margin: 0;
          font-size: 0.97rem;
        }

        .pipeline-step strong {
          font-size: 2rem;
          line-height: 1;
        }

        .pipeline-step p {
          margin: 0;
          font-size: 0.82rem;
          color: #6b718b;
        }

        .pipeline-step.pending {
          background: #fffaf0;
          border-color: #f4d190;
          color: #dc8e11;
        }

        .pipeline-step.shortlist {
          background: #f4effd;
          border-color: #dfd3f8;
          color: #7a49d6;
        }

        .pipeline-step.interview {
          background: #edf4fd;
          border-color: #d5e5fa;
          color: #3b8bdd;
        }

        .pipeline-step.accepted {
          background: #edf8f2;
          border-color: #cde9db;
          color: #42a165;
        }

        .pipeline-line {
          margin-top: 10px;
          position: relative;
          height: 24px;
          border-top: 2px dashed #d9d7e8;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
        }

        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          margin-top: -5px;
          margin-left: 40px;
        }

        .dot.pending {
          background: #f2a113;
        }

        .dot.shortlist {
          background: #7a49d6;
        }

        .dot.interview {
          background: #3b8bdd;
        }

        .dot.accepted {
          background: #42a165;
        }

        .offers-table {
          display: grid;
        }

        .offer-row {
          display: grid;
          grid-template-columns: 1.4fr 0.5fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 12px 4px;
          border-top: 1px solid #f0edf6;
          border-radius: 12px;
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
        }

        .offer-row:first-child {
          border-top: none;
        }

        .offer-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .offer-briefcase {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          border: 1px solid #e8def9;
          background: #f6f0fe;
          color: #6f38d0;
          display: grid;
          place-items: center;
          font-size: 0.7rem;
        }

        .offer-main strong {
          font-size: 1rem;
          color: #272b43;
        }

        .offer-main p,
        .offer-count p {
          margin: 4px 0 0;
          color: #6a7088;
          font-size: 0.82rem;
        }

        .offer-count strong {
          font-size: 1.12rem;
          color: #2a2f4b;
        }

        .offer-status {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 700;
          background: #f0eff8;
          color: #5d4f88;
          text-transform: capitalize;
          animation: fade-in-status 200ms ease both;
        }

        .offer-status.active,
        .offer-status.ouverte,
        .offer-status.open {
          background: #ecf9ef;
          color: #2ea857;
        }

        .offer-status.pending {
          background: #fff8e7;
          color: #d79315;
        }

        .offer-status.shortlisted {
          background: #f2ebff;
          color: #7a49d6;
        }

        .offer-menu {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 8px;
          background: #f6f4fb;
          color: #6b7088;
          display: grid;
          place-items: center;
          border: 1px solid #e7e2f2;
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
        }

        .offer-menu :global(svg) {
          width: 15px;
          height: 15px;
        }

        .offers-empty {
          border-top: 1px solid #f0edf6;
          padding: 22px 4px 8px;
          color: #676d87;
          display: grid;
          gap: 10px;
          text-align: start;
        }

        .offers-empty-icon {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d8caf6;
          color: #35063e;
          background: #f7f3fe;
        }

        .offers-empty h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #2a2f4b;
        }

        .offers-empty a {
          text-decoration: none;
          color: #35063e;
          font-weight: 700;
          font-size: 0.9rem;
          transition: color 150ms ease;
        }

        .offers-empty a:hover {
          color: #24042b;
        }

        .side-panel h3 {
          margin: 0 0 12px;
          font-size: 1.25rem;
          color: #252a45;
        }

        .activity-list {
          display: grid;
          gap: 10px;
        }

        .activity-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: start;
          padding: 6px 0;
        }

        .activity-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          margin-top: 2px;
          background: #ecf6ef;
          border: 1px solid #dbefe2;
        }

        .activity-icon.interview,
        .activity-icon.interview_scheduled {
          background: #fff4e7;
          border-color: #ffe3bf;
        }

        .activity-icon.offer,
        .activity-icon.system {
          background: #edf4fd;
          border-color: #d5e5fa;
        }

        .activity-icon.shortlist,
        .activity-icon.candidature_status_change {
          background: #f1ebff;
          border-color: #e4d7fb;
        }

        .activity-copy strong {
          font-size: 0.96rem;
          color: #242944;
        }

        .activity-copy p {
          margin: 2px 0 0;
          font-size: 0.83rem;
          color: #6a7088;
        }

        .activity-item time {
          font-size: 0.76rem;
          color: #7b8198;
          font-weight: 600;
          margin-top: 3px;
        }

        .summary-panel ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }

        .summary-panel li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px dashed #e4e0ef;
          padding-bottom: 8px;
          color: #5d627a;
          font-size: 0.9rem;
        }

        .summary-panel li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .summary-panel li strong {
          color: #262b45;
          font-size: 1rem;
        }

        .tip-panel {
          background: #f7f3fe;
          border-color: #e7ddf5;
        }

        .tip-panel p {
          margin: 0 0 12px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #505671;
        }

        .tip-panel a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          border-radius: 12px;
          padding: 0 18px;
          text-decoration: none;
          background: #35063e;
          color: #fff;
          font-weight: 700;
          font-size: 0.92rem;
          box-shadow: 0 12px 24px rgba(53, 6, 62, 0.2);
          transition: transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
        }

        @keyframes fade-in-status {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1220px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .company-dashboard {
            padding: 14px;
            gap: 14px;
          }

          .company-dashboard-header {
            flex-direction: column;
          }

          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .pipeline-flow {
            grid-template-columns: 1fr;
          }

          .pipeline-step,
          .pipeline-step:first-child,
          .pipeline-step:last-child {
            clip-path: none;
            border-radius: 14px;
          }

          .pipeline-line {
            display: none;
          }

          .offer-row {
            grid-template-columns: 1fr;
            justify-items: start;
            gap: 8px;
          }

          .offer-menu {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

function mapOfferStatus(raw?: string) {
  const status = normalizeStatus(raw);
  if (status === "active" || status === "ouverte" || status === "open") return "En cours";
  if (status === "shortlisted") return "Shortlist";
  if (status === "accepted") return "Accepté";
  if (status === "inactive") return "Inactive";
  if (status === "expiree") return "Expirée";
  if (status === "pourvue") return "Pourvue";
  return raw || "En cours";
}

export default function DashboardPageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <DashboardPage />
    </RouteProtegee>
  );
}
