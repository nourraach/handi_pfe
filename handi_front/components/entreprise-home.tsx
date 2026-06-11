"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type SVGProps } from "react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type WorkspaceStatCard = {
  label: string;
  value: number | string;
  hint?: string;
};

type EntrepriseOffer = {
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

interface EntrepriseHomeProps {
  utilisateurNom: string;
  stats: WorkspaceStatCard[];
  loadingStats: boolean;
  erreurStats: string | null;
}

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeStatus(value?: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function todayFr() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 19v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1" />
      <circle cx="10" cy="10" r="3" />
      <path d="M21 19v-1a3 3 0 0 0-2-2.82" />
      <path d="M16 7.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l3 2" />
    </svg>
  );
}

function IconStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3.6 2.68 5.44 6 .87-4.34 4.22 1.02 5.96L12 17.3 6.64 20.1l1.02-5.96L3.32 9.9l6-.87z" />
    </svg>
  );
}

function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.8 12.2 2.2 2.2 4.4-4.6" />
    </svg>
  );
}

function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.4 9.6a5.6 5.6 0 1 1 11.2 0v3l1.6 2.8a.8.8 0 0 1-.7 1.2H5.5a.8.8 0 0 1-.7-1.2l1.6-2.8Z" />
      <path d="M10.1 19a2 2 0 0 0 3.8 0" />
    </svg>
  );
}

function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.8" y="5.5" width="16.4" height="14.7" rx="2.4" />
      <path d="M8 3.8v3.4" />
      <path d="M16 3.8v3.4" />
      <path d="M3.8 10h16.4" />
    </svg>
  );
}

function IconDots(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="6.8" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="17.2" r="1.7" />
    </svg>
  );
}

export function EntrepriseHome({ utilisateurNom, stats, loadingStats, erreurStats }: EntrepriseHomeProps) {
  const [offers, setOffers] = useState<EntrepriseOffer[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let active = true;

    const loadSideData = async () => {
      const [offersRes, notificationsRes] = await Promise.allSettled([
        authenticatedFetch(construireUrlApi("/api/entreprise/offres")),
        authenticatedFetch(construireUrlApi("/api/notifications?limit=8")),
      ]);

      if (offersRes.status === "fulfilled") {
        const payload = await offersRes.value.json().catch(() => ({}));
        if (offersRes.value.ok && active) {
          const list = Array.isArray(payload?.donnees?.offres)
            ? payload.donnees.offres
            : Array.isArray(payload?.donnees)
              ? payload.donnees
              : [];
          setOffers(list);
        }
      }

      if (notificationsRes.status === "fulfilled") {
        const payload = await notificationsRes.value.json().catch(() => ({}));
        if (notificationsRes.value.ok && active) {
          setNotifications(Array.isArray(payload?.donnees) ? payload.donnees : []);
        }
      }
    };

    void loadSideData();

    return () => {
      active = false;
    };
  }, []);

  const parsed = useMemo(() => {
    const find = (keywords: string[]) => {
      const entry = stats.find((item) => {
        const label = normalizeLabel(item.label);
        return keywords.some((word) => label.includes(normalizeLabel(word)));
      });
      return asNumber(entry?.value);
    };

    const total = find(["total candidatures", "total des candidatures"]);
    const pending = find(["en attente", "pending"]);
    const shortlisted = find(["preselection", "shortlist", "shortlisted"]);
    const accepted = find(["acceptes", "accepted", "recrutements confirmes"]);
    return { total, pending, shortlisted, accepted };
  }, [stats]);

  const pipeline = useMemo(
    () => ({
      pending: parsed.pending,
      shortlisted: parsed.shortlisted,
      interview: Math.max(0, parsed.shortlisted - parsed.accepted),
      accepted: parsed.accepted,
    }),
    [parsed],
  );

  const kpis = useMemo(
    () => [
      {
        label: "Candidatures totales",
        value: parsed.total,
        trend: `+${parsed.pending} depuis la semaine dernière`,
        tone: "violet",
        Icon: IconUsers,
      },
      {
        label: "En cours",
        value: pipeline.pending,
        trend: `+${pipeline.pending > 0 ? 1 : 0} depuis la semaine dernière`,
        tone: "amber",
        Icon: IconClock,
      },
      {
        label: "Shortlist",
        value: pipeline.shortlisted,
        trend: `+${pipeline.shortlisted} cette semaine`,
        tone: "purple",
        Icon: IconStar,
      },
      {
        label: "Recrutements confirmés",
        value: pipeline.accepted,
        trend: `+${pipeline.accepted} cette semaine`,
        tone: "green",
        Icon: IconCheck,
      },
    ],
    [parsed, pipeline],
  );

  const activeOffers = useMemo(
    () =>
      offers
        .filter((offre) => {
          const status = normalizeStatus(offre.statut);
          return status === "active" || status === "ouverte" || status === "open";
        })
        .slice(0, 4),
    [offers],
  );

    const companyLabel = utilisateurNom?.trim() || "entreprise";

  if (loadingStats) {
    return (
      <div className="enterprise-dashboard-loading">
        <div className="enterprise-dashboard-spinner" />
        <p>Chargement du dashboard entreprise...</p>
      </div>
    );
  }

  return (
    <section className="enterprise-dashboard" aria-label={`Dashboard entreprise ${companyLabel}`}>
      <header className="enterprise-dashboard-header">
        <div>
            <h1>Bonjour entreprise</h1>
          <p>Voici un aperçu de vos recrutements et de vos candidatures</p>
        </div>
        <div className="enterprise-top-actions">
          <button type="button" className="icon-button" aria-label="Notifications">
            <IconBell />
            <span className="badge-dot">{notifications.length}</span>
          </button>
          <button type="button" className="date-button" aria-label="Date actuelle">
            <IconCalendar />
            <span>{todayFr()}</span>
          </button>
        </div>
      </header>

      {erreurStats ? <div className="enterprise-dashboard-error">{erreurStats}</div> : null}

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`kpi-card tone-${kpi.tone}`}>
            <div className="kpi-icon-wrap">
              <kpi.Icon className="kpi-icon" />
            </div>
            <div className="kpi-body">
              <strong>{kpi.value}</strong>
              <p>{kpi.label}</p>
              <span>{kpi.trend}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="main-column">

          <section className="panel-card">
            <div className="panel-head with-link">
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
            <div className="panel-head with-link">
              <h2>Offres ouvertes</h2>
              <Link href="/entreprise/offres">Voir toutes</Link>
            </div>

            <div className="offers-table">
              {activeOffers.length > 0 ? (
                activeOffers.map((offer) => (
                  <article key={offer.id_offre} className="offer-row">
                    <div className="offer-main">
                      <span className="offer-briefcase" aria-hidden="true">□</span>
                      <div>
                        <strong>{offer.titre}</strong>
                        <p>{offer.localisation || "Tunisie"}</p>
                      </div>
                    </div>

                    <div className="offer-count">
                      <strong>{asNumber(offer.candidatures_count)}</strong>
                      <p>candidatures</p>
                    </div>

                    <span className={`offer-status ${normalizeStatus(offer.statut)}`}>{mapOfferStatus(offer.statut)}</span>

                    <button type="button" className="offer-menu" aria-label="Actions">
                      <IconDots />
                    </button>
                  </article>
                ))
              ) : (
                <div className="offers-empty">
                  <p>Aucune offre active pour le moment.</p>
                  <Link href="/entreprise/offres">Publier une offre</Link>
                </div>
              )}
            </div>
          </section>
        </div>

      <style jsx>{`
        .enterprise-dashboard {
          --primary: #35063e;
          --surface: #ffffff;
          --border: #ebe8f2;
          --text: #1f2437;
          --radius: 20px;
          display: grid;
          gap: 20px;
          padding: 22px;
          min-height: 100%;
          background: radial-gradient(circle at 8% 2%, rgba(53, 6, 62, 0.05), transparent 38%), #f5f4fa;
          color: var(--text);
        }

        .enterprise-dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .enterprise-dashboard-header h1 {
          margin: 0;
          font-size: clamp(1.5rem, 2vw, 2rem);
          line-height: 1.2;
          color: #1d2033;
        }

        .enterprise-dashboard-header p {
          margin: 8px 0 0;
          color: #525a75;
          font-size: 0.97rem;
        }

        .enterprise-top-actions {
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
        }

        .icon-button { width: 44px; }

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

        .enterprise-dashboard-error {
          border: 1px solid #f2c2c6;
          background: #fff1f2;
          color: #a42a3f;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 0.9rem;
          font-weight: 600;
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
        }

        .kpi-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .kpi-icon { width: 23px; height: 23px; }

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

        .tone-violet .kpi-icon-wrap { background: #f0e9fd; color: #6f38d0; }
        .tone-amber .kpi-icon-wrap { background: #fdf3e0; color: #e7a013; }
        .tone-purple .kpi-icon-wrap { background: #efe8fb; color: #7c3dde; }
        .tone-green .kpi-icon-wrap { background: #e8f7ed; color: #36ab5d; }
         .main-column {
          display: grid;
          gap: 16px;
        }

        .panel-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: 0 14px 28px rgba(31, 28, 52, 0.05);
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .panel-head h2 {
          margin: 0;
          font-size: 1.26rem;
          color: #1f2340;
        }

        .panel-head.with-link a {
          color: #6f38d0;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 700;
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

        .pipeline-step h3 { margin: 0; font-size: 0.97rem; }
        .pipeline-step strong { font-size: 2rem; line-height: 1; }
        .pipeline-step p { margin: 0; font-size: 0.82rem; color: #6b718b; }

        .pipeline-step.pending { background: #fffaf0; border-color: #f4d190; color: #dc8e11; }
        .pipeline-step.shortlist { background: #f4effd; border-color: #dfd3f8; color: #7a49d6; }
        .pipeline-step.interview { background: #edf4fd; border-color: #d5e5fa; color: #3b8bdd; }
        .pipeline-step.accepted { background: #edf8f2; border-color: #cde9db; color: #42a165; }

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

        .dot.pending { background: #f2a113; }
        .dot.shortlist { background: #7a49d6; }
        .dot.interview { background: #3b8bdd; }
        .dot.accepted { background: #42a165; }

        .offer-row {
          display: grid;
          grid-template-columns: 1.4fr 0.5fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 12px 4px;
          border-top: 1px solid #f0edf6;
        }

        .offer-row:first-child { border-top: none; }

        .offer-main { display: flex; align-items: center; gap: 10px; }

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

        .offer-main strong { font-size: 1rem; color: #272b43; }
        .offer-main p, .offer-count p { margin: 4px 0 0; color: #6a7088; font-size: 0.82rem; }
        .offer-count strong { font-size: 1.12rem; color: #2a2f4b; }

        .offer-status {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 700;
          background: #f0eff8;
          color: #5d4f88;
        }

        .offer-status.active, .offer-status.ouverte, .offer-status.open { background: #ecf9ef; color: #2ea857; }
        .offer-status.inactive { background: #f4f1f8; color: #8c809f; }
        .offer-status.expiree { background: #fff1f1; color: #bb5050; }

        .offer-menu {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 8px;
          background: #f6f4fb;
          color: #6b7088;
          display: grid;
          place-items: center;
        }

        .offer-menu :global(svg) { width: 15px; height: 15px; }

        .offers-empty {
          border-top: 1px solid #f0edf6;
          padding: 16px 4px 6px;
          color: #676d87;
          display: grid;
          gap: 8px;
        }

        .offers-empty a {
          text-decoration: none;
          color: #6f38d0;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .enterprise-dashboard-loading {
          min-height: 420px;
          display: grid;
          place-content: center;
          gap: 12px;
          color: #535a76;
          font-weight: 600;
        }

        .enterprise-dashboard-spinner {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 4px solid rgba(53, 6, 62, 0.16);
          border-top-color: #35063e;
          justify-self: center;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1220px) {
          .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 860px) {
          .enterprise-dashboard { padding: 14px; gap: 14px; }
          .enterprise-dashboard-header { flex-direction: column; }
          .kpi-grid { grid-template-columns: 1fr; }
          .pipeline-flow { grid-template-columns: 1fr; }
          .pipeline-step, .pipeline-step:first-child { clip-path: none; border-radius: 14px; }
          .pipeline-line { display: none; }
          .offer-row { grid-template-columns: 1fr; justify-items: start; gap: 8px; }
          .offer-menu { display: none; }
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




