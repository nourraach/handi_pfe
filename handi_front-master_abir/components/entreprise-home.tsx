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

type NotificationItem = {
  id: string;
  type?: string;
  titre?: string;
  message?: string;
  created_at?: string;
};

type CandidateApplication = {
  id: string;
  statut: string;
  date_postulation: string;
  candidat: {
    nom: string;
    email?: string;
    competences?: string[];
  };
  offre: {
    titre: string;
  };
  score_test?: number | null;
};

type CandidateApplicationApiItem = {
  candidature?: {
    id?: string;
    statut?: string;
    date_postulation?: string;
    created_at?: string;
    score_test?: number | string | null;
  };
  candidat?: {
    nom?: string;
    email?: string;
    competences?: string[];
  };
  offre?: {
    titre?: string;
  };
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

function asOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function getRelativeTimeFr(dateValue?: string) {
  if (!dateValue) return "recemment";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "recemment";

  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function initials(name?: string) {
  const parts = String(name || "Candidat")
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "C";
}

function scoreForApplication(item: CandidateApplication, index: number) {
  const rawScore = asNumber(item.score_test);
  if (rawScore > 0) return Math.min(100, Math.round(rawScore));
  return Math.max(72, 96 - index * 5);
}

function IconBriefcase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="7" width="16" height="13" rx="2.2" />
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
      <path d="M4 12h16" />
    </svg>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="3" />
      <path d="M4 20v-1a5 5 0 0 1 10 0v1" />
      <path d="M16 11a3 3 0 0 0 0-6" />
      <path d="M17 20v-1a5 5 0 0 0-2-4" />
    </svg>
  );
}

function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="5.5" width="16" height="15" rx="2.4" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10h16" />
    </svg>
  );
}

function IconArrow(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconSpark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
    </svg>
  );
}

function IconCheck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.8 2.8L16 9.5" />
    </svg>
  );
}

function DecorativeTeam() {
  return (
    <div className="team-visual" aria-hidden="true">
      <div className="glass-panel" />
      <div className="person person-main" />
      <div className="person person-left" />
      <div className="person person-right" />
      <div className="base-ring" />
    </div>
  );
}

export function EntrepriseHome({ utilisateurNom, stats, loadingStats, erreurStats }: EntrepriseHomeProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);

  useEffect(() => {
    let active = true;

    const loadSideData = async () => {
      const [notificationsRes, applicationsRes] = await Promise.allSettled([
        authenticatedFetch(construireUrlApi("/api/notifications?limit=8")),
        authenticatedFetch(construireUrlApi("/api/candidatures/entreprise?limit=6")),
      ]);

      if (notificationsRes.status === "fulfilled") {
        const payload = await notificationsRes.value.json().catch(() => ({}));
        if (notificationsRes.value.ok && active) {
          setNotifications(Array.isArray(payload?.donnees) ? payload.donnees : []);
        }
      }

      if (applicationsRes.status === "fulfilled") {
        const payload = await applicationsRes.value.json().catch(() => ({}));
        const raw: CandidateApplicationApiItem[] = Array.isArray(payload?.donnees) ? payload.donnees : [];
        if (applicationsRes.value.ok && active) {
          setApplications(
            raw.map((item, index) => ({
              id: item?.candidature?.id ?? `application-${index}`,
              statut: item?.candidature?.statut ?? "pending",
              date_postulation: item?.candidature?.date_postulation ?? item?.candidature?.created_at ?? "",
              score_test: asOptionalNumber(item?.candidature?.score_test),
              candidat: {
                nom: item?.candidat?.nom ?? "Candidat",
                email: item?.candidat?.email ?? "",
                competences: Array.isArray(item?.candidat?.competences) ? item.candidat.competences : [],
              },
              offre: {
                titre: item?.offre?.titre ?? "Offre",
              },
            })),
          );
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
    const interview = find(["interview", "entretien"]);
    const accepted = find(["acceptes", "accepted", "recrutements confirmes"]);

    if (total || pending || shortlisted || interview || accepted) {
      return { total, pending, shortlisted, interview, accepted };
    }

    const fromApplications = applications.reduce(
      (acc, item) => {
        const status = normalizeStatus(item.statut);
        acc.total += 1;
        if (status === "shortlisted") acc.shortlisted += 1;
        else if (status === "interview_scheduled") acc.interview += 1;
        else if (status === "accepted") acc.accepted += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, pending: 0, shortlisted: 0, interview: 0, accepted: 0 },
    );

    return fromApplications;
  }, [applications, stats]);

  const topApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => scoreForApplication(b, 0) - scoreForApplication(a, 0))
        .slice(0, 3),
    [applications],
  );

  const recentActivity = useMemo(() => {
    const activity = notifications.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.titre || "Activite recente",
      subtitle: item.message || "Mise a jour dans votre espace.",
      time: getRelativeTimeFr(item.created_at),
      type: item.type || "system",
    }));

    if (activity.length > 0) return activity;

    return applications.slice(0, 4).map((item) => ({
      id: item.id,
      title: "Nouvelle candidature",
      subtitle: `${item.candidat.nom} a postule au poste ${item.offre.titre}`,
      time: getRelativeTimeFr(item.date_postulation),
      type: item.statut,
    }));
  }, [applications, notifications]);

  const companyName = utilisateurNom?.trim() || "Entreprise Nour";
  const matchScore = parsed.total > 0 ? Math.round(((parsed.shortlisted + parsed.interview + parsed.accepted) / parsed.total) * 100) : 78;
  const candidateCards =
    topApplications.length > 0
      ? topApplications.map((item, index) => ({
          name: item.candidat.nom,
          role: item.offre.titre,
          city: "Tunisie",
          score: scoreForApplication(item, index),
          tags: item.candidat.competences?.slice(0, 3) || ["React", "Figma"],
        }))
      : [
          { name: "Yasmine B.", role: "UX Designer", city: "Paris", score: 91, tags: ["UX/UI", "Figma", "Recherche"] },
          { name: "Karim D.", role: "Developpeur Frontend", city: "Lyon", score: 88, tags: ["React", "TypeScript", "Next.js"] },
          { name: "Sofia M.", role: "Cheffe de projet", city: "Marseille", score: 85, tags: ["Agile", "Jira", "Management"] },
          { name: "Mehdi T.", role: "Data Analyst", city: "Toulouse", score: 82, tags: ["SQL", "Power BI", "Python"] },
        ];

  if (loadingStats) {
    return (
      <div className="enterprise-dashboard-loading">
        <div className="enterprise-dashboard-spinner" />
        <p>Chargement du dashboard entreprise...</p>
      </div>
    );
  }

  return (
    <section className="enterprise-dashboard" aria-label={`Dashboard entreprise ${companyName}`}>
      <main className="new-main">
        <header className="new-topbar">
          <label>
            <input type="search" placeholder="Rechercher..." />
            <IconArrow />
          </label>
          <Link href="/notifications" className="new-alert"><IconSpark /><span>2</span></Link>
          <Link href="/entreprise/offres" className="new-publish"><IconPlus /> Publier une offre</Link>
        </header>

        {erreurStats ? <div className="dashboard-error">{erreurStats}</div> : null}

        <div className="new-grid">
          <section className="new-hero">
            <div className="new-hero-copy">
              <h1>Bonjour,<span>{companyName}</span><em>👋</em></h1>
              <p>Votre impact cree des opportunites.<br />Continuons a construire des equipes inclusives.</p>
              <Link href="/entreprise/candidatures" className="new-discover">
                <IconSpark /><span><b>Decouvrir</b><small>23 nouveaux candidats</small></span><IconArrow />
              </Link>
            </div>
            <div className="new-orbit" aria-hidden="true">
              <div className="new-blob one" />
              <div className="new-blob two" />
              <div className="new-score"><IconSpark /><small>Score d&apos;inclusion</small><b>{matchScore}%</b><span>+12% ce mois-ci</span></div>
              <div className="new-float ai"><IconSpark /><b>IA Shortlisting</b><span>Actif</span></div>
              <div className="new-float pipe"><IconBriefcase /><b>Pipeline</b><span>En cours</span></div>
              <div className="new-float diversity"><IconCheck /><b>Diversite</b><span>68%</span></div>
              <div className="new-float impact"><IconSpark /><b>Impact</b><span>Eleve</span></div>
            </div>
          </section>

          <section className="new-impact">
            <h2>Votre impact</h2>
            {[
              { label: "Recrutement inclusif", value: 78, trend: "+12% ce mois-ci", tone: "violet", icon: <IconUsers /> },
              { label: "Inclusion & diversite", value: 65, trend: "+8% ce mois-ci", tone: "pink", icon: <IconSpark /> },
              { label: "Satisfaction candidats", value: 91, trend: "+15% ce mois-ci", tone: "amber", icon: <IconCheck /> },
            ].map((item) => (
              <article key={item.label}>
                <span className={`impact-icon ${item.tone}`}>{item.icon}</span>
                <div><b>{item.label}</b><i><span style={{ width: `${item.value}%` }} /></i><small>{item.trend}</small></div>
                <em>{item.value}%</em>
              </article>
            ))}
            <Link href="/entreprise/rapports">Voir le rapport complet <IconArrow /></Link>
          </section>

          <section className="new-candidates">
            <div className="new-card-head"><h2><IconSpark /> Candidats recommandes par notre IA</h2><Link href="/entreprise/candidatures">Voir tous</Link></div>
            <div className="new-candidate-list">
              {candidateCards.slice(0, 4).map((candidate, index) => (
                <article key={`${candidate.name}-${index}`}>
                  <span className={`new-photo tone-${index}`}>{initials(candidate.name)}</span>
                  <span className="new-score-badge">{candidate.score}%</span>
                  <h3>{candidate.name}</h3><p>{candidate.role}</p><small>⌖ {candidate.city}</small>
                  <div>{candidate.tags.map((tag) => <em key={tag}>{tag}</em>)}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="new-activity">
            <div className="new-card-head"><h2>Activite recente</h2><Link href="/notifications">Voir tout</Link></div>
            <div>
              {(recentActivity.length > 0 ? recentActivity.slice(0, 4) : [
                { id: "a1", title: "Nouvelle candidature", subtitle: "Fatima Zahra a postule pour Developpeur Frontend", time: "2m" },
                { id: "a2", title: "Entretien planifie", subtitle: "Entretien avec Ahmed Benali", time: "1h" },
                { id: "a3", title: "Offre publiee", subtitle: "Offre Charge de projet publiee", time: "3h" },
                { id: "a4", title: "Rapport genere", subtitle: "Rapport d'inclusion - Avril 2025", time: "1j" },
              ]).map((item, index) => (
                <article key={item.id}><span className={`activity-dot tone-${index}`} /><div><b>{item.title}</b><p>{item.subtitle}</p></div><time>{item.time}</time></article>
              ))}
            </div>
          </section>

          <section className="new-pipeline">
            <div className="new-card-head"><h2><IconUsers /> Pipeline de recrutement</h2><Link href="/entreprise/candidatures">Voir le pipeline</Link></div>
            <div>
              {[
                { label: "Candidatures", value: parsed.total || 128, delta: "+24", icon: <IconUsers /> },
                { label: "Shortlistes", value: parsed.shortlisted || 36, delta: "+8", icon: <IconSpark /> },
                { label: "Entretiens", value: parsed.interview || 14, delta: "+3", icon: <IconCalendar /> },
                { label: "Offres", value: 5, delta: "+1", icon: <IconBriefcase /> },
                { label: "Acceptes", value: parsed.accepted || 2, delta: "+1", icon: <IconCheck /> },
              ].map((step) => (
                <article key={step.label}><span>{step.icon}</span><b>{step.label}</b><strong>{step.value}</strong><em>{step.delta}</em></article>
              ))}
            </div>
          </section>

          <section className="new-cta">
            <div><h2>Pret a aller plus loin ?</h2><p>Laissez notre IA trouver les meilleurs talents correspondant a vos besoins.</p><Link href="/entreprise/candidatures"><IconSpark /> Lancer une recherche</Link></div>
            <div className="new-person" aria-hidden="true"><span /><b /><i /><em className="b1" /><em className="b2" /><em className="b3" /></div>
          </section>
        </div>
      </main>

      <div className="dashboard-shell">
        <main className="dashboard-main">
          <header className="hero-section">
            <div className="hero-copy">
              <span className="spark spark-left">+</span>
              <h1>Bonjour, {companyName}</h1>
              <p>
                Pret a construire des <strong>equipes inclusives</strong>
                <br />
                et a fort impact aujourd&apos;hui ?
              </p>
            </div>
            <DecorativeTeam />
          </header>

          {erreurStats ? <div className="dashboard-error">{erreurStats}</div> : null}

          <section className="quick-actions" aria-label="Actions principales">
            <Link href="/entreprise/offres" className="quick-card">
              <span className="quick-icon violet"><IconPlus /></span>
              <strong>Créer une offre d&apos;emploi</strong>
              <span className="quick-arrow"><IconArrow /></span>
            </Link>
            <Link href="/entreprise/candidatures" className="quick-card">
              <span className="quick-icon violet"><IconUsers /></span>
              <strong>Voir les candidatures</strong>
              <span className="quick-arrow"><IconArrow /></span>
            </Link>
            <Link href="/entreprise/entretiens" className="quick-card">
              <span className="quick-icon amber"><IconCalendar /></span>
              <strong>Planifier un entretien</strong>
              <span className="quick-arrow"><IconArrow /></span>
            </Link>
          </section>

          <section className="pipeline-card">
            <div className="section-head">
              <div>
                <h2>Pipeline de recrutement</h2>
                <p>Vue d&apos;ensemble de votre processus</p>
              </div>
            </div>

            <div className="pipeline-flow">
              <article className="pipeline-step step-violet">
                <span className="step-icon"><IconBriefcase /></span>
                <small>Candidatures</small>
                <strong>{parsed.total}</strong>
                <em>+{parsed.pending} cette semaine</em>
              </article>
              <article className="pipeline-step step-purple">
                <span className="step-icon"><IconSpark /></span>
                <small>Shortlistes</small>
                <strong>{parsed.shortlisted}</strong>
                <em>+{parsed.shortlisted} cette semaine</em>
              </article>
              <article className="pipeline-step step-amber">
                <span className="step-icon"><IconCalendar /></span>
                <small>Entretiens</small>
                <strong>{parsed.interview}</strong>
                <em>+{parsed.interview} cette semaine</em>
              </article>
              <article className="pipeline-step step-green">
                <span className="step-icon"><IconCheck /></span>
                <small>Acceptes</small>
                <strong>{parsed.accepted}</strong>
                <em>+{parsed.accepted} cette semaine</em>
              </article>
            </div>
          </section>

        </main>

        <aside className="dashboard-side">
          <section className="ai-card">
            <div className="ai-head">
              <h2><IconSpark /> IA Shortlisting</h2>
              <span>Actif</span>
            </div>
            <p>Score moyen de correspondance</p>
            <div className="score-row">
              <strong>{matchScore}%</strong>
              <span>{parsed.total > 0 ? `sur ${parsed.total} candidatures` : "aucune candidature"}</span>
            </div>
            <div className="brain-visual" aria-hidden="true" />

            <div className="candidate-list">
              <div className="mini-head">
                <strong>Top candidats recommandes</strong>
                <Link href="/entreprise/candidatures">Voir tout</Link>
              </div>
              {topApplications.length > 0 ? (
                topApplications.map((item, index) => (
                  <article key={item.id} className="candidate-row">
                    <span className="avatar">{initials(item.candidat.nom)}</span>
                    <div>
                      <strong>{item.candidat.nom}</strong>
                      <p>{item.offre.titre}</p>
                    </div>
                    <em>{scoreForApplication(item, index)}%</em>
                  </article>
                ))
              ) : (
                <p className="empty-candidates">Aucune recommandation disponible.</p>
              )}
            </div>
          </section>

          <section className="activity-card">
            <div className="section-head row">
              <h2>Activite recente</h2>
              <Link href="/notifications">Filtrer</Link>
            </div>
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((item, index) => (
                  <article key={item.id} className="activity-item">
                    <span className={`activity-dot tone-${index % 4}`} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.subtitle}</p>
                    </div>
                    <time>{item.time}</time>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-activity">Aucune activite recente.</p>
            )}
            <Link href="/notifications" className="all-activity">
              Voir toute l&apos;activite <IconArrow />
            </Link>
          </section>
        </aside>
      </div>

      <style jsx>{`
        .enterprise-dashboard {
          --ink: #15083b;
          --muted: #68618d;
          --purple: #35063e;
          --purple-2: #6f2cff;
          --line: #ebe6f6;
          --soft: #f7f3ff;
          min-height: 100%;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 16px;
          overflow-x: hidden;
          color: var(--ink);
          background:
            radial-gradient(circle at 34% 10%, rgba(111, 44, 255, 0.12), transparent 26%),
            radial-gradient(circle at 88% 0%, rgba(53, 6, 62, 0.08), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #f8f6ff 100%);
        }

        .enterprise-dashboard *,
        .enterprise-dashboard *::before,
        .enterprise-dashboard *::after {
          box-sizing: border-box;
        }

        .enterprise-dashboard :global(svg) {
          width: 1em;
          height: 1em;
          flex-shrink: 0;
        }

        .dashboard-shell {
          display: none !important;
        }

        :global(.new-main) {
          min-height: calc(100vh - 32px);
          margin-left: 0;
          padding: 18px 18px 28px;
        }

        :global(.new-topbar) {
          height: 54px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        :global(.new-topbar label) {
          width: 318px;
          height: 42px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          border: 1px solid #e9e3f7;
          border-radius: 999px;
          background: rgba(255,255,255,0.84);
          box-shadow: 0 10px 24px rgba(31, 18, 85, 0.08);
        }

        :global(.new-topbar input) {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #21154f;
          font-size: 0.8rem;
        }

        :global(.new-alert) {
          position: relative;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.72);
          color: #18104a;
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(31, 18, 85, 0.08);
        }

        :global(.new-alert span) {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ff4267;
          color: #fff;
          font-size: 0.62rem;
          font-weight: 900;
        }

        :global(.new-publish) {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 18px;
          border-radius: 999px;
          color: #fff;
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 850;
          background: linear-gradient(135deg, var(--app-primary, #35063e), var(--app-primary-hover, #4c0d59));
          box-shadow: 0 14px 28px rgba(var(--app-primary-rgb, 53, 6, 62), 0.24);
        }

        :global(.new-publish:hover) {
          background: linear-gradient(135deg, var(--app-primary-hover, #4c0d59), var(--app-primary-deep, #24042b));
        }

        :global(.new-grid) {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.92fr);
          gap: 24px;
        }

        :global(.new-hero) {
          min-height: 360px;
          display: grid;
          grid-template-columns: minmax(280px, 0.86fr) minmax(420px, 1.14fr);
          align-items: center;
          position: relative;
          overflow: visible;
        }

        :global(.new-hero-copy h1) {
          margin: 0;
          display: grid;
          gap: 6px;
          color: #151044;
          font-size: clamp(2rem, 3vw, 3.4rem);
          line-height: 1.02;
          font-weight: 500;
        }

        :global(.new-hero-copy h1 span) {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          font-weight: 950;
          background: linear-gradient(90deg, #5d28ec, #ef5bd3);
          -webkit-background-clip: text;
          color: transparent;
        }

        :global(.new-hero-copy h1 em) {
          display: inline-block;
          margin-left: 12px;
          font-style: normal;
          color: initial;
        }

        :global(.new-hero-copy p) {
          margin: 18px 0 34px;
          color: #66609b;
          font-size: 1rem;
          line-height: 1.55;
        }

        :global(.new-discover) {
          width: 300px;
          min-height: 76px;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 36px;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          color: #fff;
          text-decoration: none;
          border-radius: 22px;
          background: linear-gradient(120deg, var(--app-primary, #35063e), var(--app-primary-hover, #4c0d59));
          box-shadow: 0 24px 48px rgba(var(--app-primary-rgb, 53, 6, 62), 0.24);
        }

        :global(.new-discover:hover) {
          background: linear-gradient(120deg, var(--app-primary-hover, #4c0d59), var(--app-primary-deep, #24042b));
        }

        :global(.new-discover b) {
          display: block;
          font-size: 0.94rem;
        }

        :global(.new-discover small) {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,0.86);
        }

        :global(.new-orbit) {
          position: relative;
          min-height: 350px;
          max-width: 520px;
        }

        :global(.new-orbit::before) {
          content: "";
          position: absolute;
          left: 8px;
          top: 22px;
          width: 405px;
          height: 305px;
          border: 1px dashed rgba(116, 84, 213, 0.18);
          border-radius: 50%;
        }

        :global(.new-blob) {
          position: absolute;
          left: 92px;
          top: 62px;
          width: 250px;
          height: 230px;
          border-radius: 48% 52% 46% 54%;
          filter: drop-shadow(0 34px 70px rgba(99, 55, 217, 0.28));
        }

        :global(.new-blob.one) {
          background: radial-gradient(circle at 28% 25%, #fff 0 18%, #d8bcff 30%, #8d63ff 58%, #6c3ef0 100%);
          transform: rotate(-18deg);
        }

        :global(.new-blob.two) {
          left: 136px;
          top: 92px;
          width: 210px;
          height: 200px;
          opacity: 0.78;
          background: linear-gradient(145deg, rgba(255,255,255,0.9), rgba(139,88,255,0.45), rgba(94,50,224,0.84));
          transform: rotate(28deg);
        }

        :global(.new-score) {
          position: absolute;
          left: 170px;
          top: 108px;
          width: 142px;
          height: 142px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 5px;
          border-radius: 50%;
          background: #fff;
          color: #130b3f;
          box-shadow: 0 24px 54px rgba(72, 38, 177, 0.2);
        }

        :global(.new-score b) {
          font-size: 2.35rem;
          line-height: 1;
        }

        :global(.new-score small) {
          font-size: 0.62rem;
          font-weight: 850;
        }

        :global(.new-score span) {
          color: #16a464;
          font-size: 0.68rem;
          font-weight: 850;
        }

        :global(.new-float) {
          position: absolute;
          min-width: 106px;
          min-height: 54px;
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          padding: 10px;
          border-radius: 16px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 18px 38px rgba(44, 23, 120, 0.12);
        }

        :global(.new-float svg) {
          grid-row: span 2;
          color: #6d25ff;
        }

        :global(.new-float b) {
          font-size: 0.67rem;
        }

        :global(.new-float span) {
          color: #151044;
          font-size: 0.62rem;
        }

        :global(.new-float.ai) { left: 300px; top: 34px; }
        :global(.new-float.pipe) { left: 340px; top: 170px; }
        :global(.new-float.diversity) { left: 22px; bottom: 72px; }
        :global(.new-float.impact) { left: 264px; bottom: 42px; }

        :global(.new-impact),
        :global(.new-candidates),
        :global(.new-activity),
        :global(.new-pipeline),
        :global(.new-cta) {
          border: 1px solid rgba(61, 35, 120, 0.08);
          border-radius: 22px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 18px 48px rgba(45, 23, 101, 0.08);
        }

        :global(.new-impact) {
          min-height: 330px;
          padding: 24px;
          color: #fff;
          background: linear-gradient(145deg, #1b0e4f, #10072f);
          box-shadow: 0 24px 54px rgba(16, 8, 54, 0.22);
        }

        :global(.new-impact h2) {
          margin: 0 0 24px;
          font-size: 1.05rem;
        }

        :global(.new-impact article) {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr) 44px;
          align-items: center;
          gap: 14px;
          margin-top: 22px;
        }

        :global(.impact-icon) {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }

        :global(.impact-icon.pink) { color: #ff87ce; }
        :global(.impact-icon.amber) { color: #ffd05d; }
        :global(.impact-icon.violet) { color: #b78cff; }

        :global(.new-impact b) {
          font-size: 0.84rem;
        }

        :global(.new-impact i) {
          display: block;
          height: 7px;
          margin: 10px 0 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }

        :global(.new-impact i span) {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7c4dff, #b55cff);
        }

        :global(.new-impact small) {
          color: #62e48f;
          font-size: 0.68rem;
          font-weight: 800;
        }

        :global(.new-impact article em) {
          font-style: normal;
          font-size: 1rem;
          font-weight: 900;
        }

        :global(.new-impact > a) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 28px;
          color: #fff;
          text-decoration: none;
          font-size: 0.82rem;
        }

        :global(.new-card-head) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        :global(.new-card-head h2) {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0;
          font-size: 1rem;
          color: #151044;
        }

        :global(.new-card-head a) {
          color: #5b22e6;
          text-decoration: none;
          font-size: 0.76rem;
          font-weight: 900;
        }

        :global(.new-candidates) {
          grid-column: 1;
          padding: 18px;
        }

        :global(.new-candidate-list) {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        :global(.new-candidate-list article) {
          position: relative;
          min-height: 200px;
          padding: 20px;
          border: 1px solid #eee8fb;
          border-radius: 14px;
          background: #fff;
        }

        :global(.new-photo) {
          width: 62px;
          height: 62px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #fff;
          font-weight: 950;
          background: linear-gradient(135deg, #191044, #7a63d8);
        }

        :global(.new-photo.tone-1) { background: linear-gradient(135deg, #202136, #b58a73); }
        :global(.new-photo.tone-2) { background: linear-gradient(135deg, #64235d, #e5a7c5); }
        :global(.new-photo.tone-3) { background: linear-gradient(135deg, #0c829a, #6ed9ef); }

        :global(.new-score-badge) {
          position: absolute;
          right: 18px;
          top: 20px;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 2px solid #b8f2d0;
          border-radius: 50%;
          color: #19bf64;
          font-size: 0.72rem;
          font-weight: 950;
        }

        :global(.new-candidate-list h3) {
          margin: 14px 0 4px;
          color: #151044;
          font-size: 0.95rem;
        }

        :global(.new-candidate-list p),
        :global(.new-candidate-list small) {
          margin: 0;
          color: #5d5a8a;
          font-size: 0.75rem;
        }

        :global(.new-candidate-list div) {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 18px;
        }

        :global(.new-candidate-list em) {
          padding: 5px 8px;
          border-radius: 999px;
          color: #6731e8;
          background: #f0e9ff;
          font-size: 0.62rem;
          font-style: normal;
          font-weight: 850;
        }

        :global(.new-activity) {
          grid-column: 2;
          padding: 20px;
        }

        :global(.new-activity article) {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
        }

        :global(.activity-dot) {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: #efe6ff;
        }

        :global(.activity-dot.tone-1) { background: #e6f8eb; }
        :global(.activity-dot.tone-2) { background: #fff0d3; }
        :global(.activity-dot.tone-3) { background: #f1e7ff; }

        :global(.new-activity b) {
          color: #151044;
          font-size: 0.78rem;
        }

        :global(.new-activity p) {
          margin: 3px 0 0;
          color: #66609b;
          font-size: 0.72rem;
        }

        :global(.new-activity time) {
          color: #5b22e6;
          font-size: 0.72rem;
        }

        :global(.new-pipeline) {
          grid-column: 1;
          min-height: 240px;
          padding: 22px;
        }

        :global(.new-pipeline > div:last-child) {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          position: relative;
          margin-top: 26px;
        }

        :global(.new-pipeline > div:last-child::before) {
          content: "";
          position: absolute;
          left: 9%;
          right: 9%;
          top: 31px;
          height: 2px;
          background: linear-gradient(90deg, #d7cbff, #ffc6e9, #d7cbff);
        }

        :global(.new-pipeline article) {
          position: relative;
          z-index: 2;
          display: grid;
          justify-items: center;
          gap: 7px;
          text-align: center;
          border-left: 1px solid #f0eafd;
        }

        :global(.new-pipeline article:first-child) {
          border-left: 0;
        }

        :global(.new-pipeline article span) {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #6d25ff;
          background: #fff;
          box-shadow: 0 0 0 8px #f8f4ff, 0 14px 26px rgba(61, 35, 120, 0.12);
        }

        :global(.new-pipeline article b) {
          margin-top: 10px;
          color: #151044;
          font-size: 0.78rem;
        }

        :global(.new-pipeline article strong) {
          color: #151044;
          font-size: 1.25rem;
        }

        :global(.new-pipeline article em) {
          color: #19a965;
          font-size: 0.72rem;
          font-style: normal;
        }

        :global(.new-cta) {
          grid-column: 2;
          min-height: 240px;
          display: grid;
          grid-template-columns: 1fr 220px;
          align-items: center;
          overflow: hidden;
          padding: 28px 28px 0;
          color: #fff;
          background: linear-gradient(135deg, #5438ef, #bd66f1);
        }

        :global(.new-cta h2) {
          margin: 0 0 14px;
          font-size: 1.25rem;
        }

        :global(.new-cta p) {
          margin: 0 0 22px;
          color: rgba(255,255,255,0.86);
          font-size: 0.82rem;
          line-height: 1.5;
        }

        :global(.new-cta a) {
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 12px;
          color: #5b22e6;
          background: #fff;
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 950;
        }

        :global(.new-person) {
          position: relative;
          height: 220px;
        }

        :global(.new-person span) {
          position: absolute;
          left: 82px;
          top: 38px;
          width: 74px;
          height: 74px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 34%, #ffd5bc, #bd683d 76%);
        }

        :global(.new-person b) {
          position: absolute;
          left: 58px;
          top: 100px;
          width: 120px;
          height: 86px;
          border-radius: 44px 44px 18px 18px;
          background: linear-gradient(135deg, #28116f, #8d5cff);
        }

        :global(.new-person i) {
          position: absolute;
          left: 28px;
          bottom: 12px;
          width: 178px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #e8d7ff, #8f71ff);
          box-shadow: 0 18px 28px rgba(41, 19, 115, 0.18);
        }

        :global(.new-person em) {
          position: absolute;
          display: block;
          width: 50px;
          height: 34px;
          border-radius: 8px;
          background: rgba(255,255,255,0.5);
        }

        :global(.new-person .b1) { right: 18px; top: 42px; }
        :global(.new-person .b2) { right: 2px; top: 112px; }
        :global(.new-person .b3) { left: 10px; top: 24px; }

        .dashboard-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
          gap: 16px;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        .dashboard-main,
        .dashboard-side {
          min-width: 0;
          max-width: 100%;
        }

        .dashboard-main > *,
        .dashboard-side > * {
          min-width: 0;
        }

        .dashboard-main {
          display: grid;
          gap: 14px;
        }

        .hero-section {
          display: grid;
          grid-template-columns: minmax(260px, 0.78fr) minmax(260px, 1fr);
          align-items: center;
          min-height: 190px;
          position: relative;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          padding-left: 8px;
        }

        .hero-copy h1 {
          margin: 0;
          font-size: clamp(2.6rem, 4vw, 4.2rem);
          line-height: 0.95;
          letter-spacing: 0;
          color: var(--ink);
        }

        .hero-copy p {
          margin: 14px 0 0;
          font-size: clamp(1rem, 1.25vw, 1.22rem);
          line-height: 1.55;
          color: #6d68a0;
        }

        .hero-copy strong {
          color: var(--purple-2);
          font-weight: 800;
        }

        .spark {
          color: var(--purple-2);
          font-size: 2rem;
          font-weight: 900;
        }

        .spark-left {
          position: absolute;
          top: -20px;
          left: 0;
        }

        .team-visual {
          position: relative;
          height: 210px;
          overflow: hidden;
        }

        .glass-panel {
          position: absolute;
          inset: 18px 34px 34px 78px;
          border: 2px solid rgba(121, 72, 255, 0.16);
          background: linear-gradient(135deg, rgba(255,255,255,0.65), rgba(147,104,255,0.14));
          clip-path: polygon(0 20%, 62% 0, 100% 16%, 100% 100%, 0 100%);
          box-shadow: inset 0 0 40px rgba(111,44,255,0.09);
        }

        .base-ring {
          position: absolute;
          left: 72px;
          right: 30px;
          bottom: 22px;
          height: 70px;
          border-radius: 50%;
          border: 1px solid rgba(111, 44, 255, 0.22);
          background: radial-gradient(circle, rgba(111,44,255,0.2), rgba(255,255,255,0.1) 64%, transparent 68%);
          filter: drop-shadow(0 28px 35px rgba(111,44,255,0.16));
        }

        .person {
          position: absolute;
          border-radius: 999px 999px 38px 38px;
          background: linear-gradient(145deg, #f3eaff 0%, #7c3cff 45%, #3e0f91 100%);
          box-shadow: inset 12px 12px 22px rgba(255,255,255,0.45), 0 24px 42px rgba(88, 40, 207, 0.3);
        }

        .person::before {
          content: "";
          position: absolute;
          top: -54px;
          left: 50%;
          width: 88px;
          height: 88px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: inherit;
          box-shadow: inset 12px 12px 18px rgba(255,255,255,0.5);
        }

        .person-main {
          width: 102px;
          height: 130px;
          left: 50%;
          bottom: 52px;
          transform: translateX(-50%);
          z-index: 3;
        }

        .person-left,
        .person-right {
          width: 76px;
          height: 102px;
          bottom: 52px;
          opacity: 0.62;
          z-index: 2;
        }

        .person-left { left: 92px; }
        .person-right { right: 54px; }

        .person-left::before,
        .person-right::before {
          width: 66px;
          height: 66px;
          top: -42px;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 158px);
          gap: 14px;
          position: relative;
          z-index: 4;
          margin-top: -10px;
          padding: 0;
          align-items: stretch;
          background: transparent;
        }

        :global(.quick-card) {
          width: 158px;
          min-height: 52px;
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr) 14px;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          text-decoration: none;
          color: var(--ink);
          border: 1px solid rgba(53, 6, 62, 0.08);
          border-radius: 9px;
          background: rgba(255,255,255,0.94);
          box-shadow: 0 10px 24px rgba(33, 15, 75, 0.1);
          transition: transform 150ms ease, box-shadow 150ms ease;
        }

        :global(.quick-card:first-child) {
          color: #fff;
          border-color: transparent;
          background: linear-gradient(135deg, #6d25ff 0%, #5f19f4 48%, #3b0fcf 100%);
          box-shadow: 0 14px 30px rgba(84, 28, 226, 0.32);
        }

        :global(.quick-card:hover) {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(33, 15, 75, 0.14);
        }

        :global(.quick-card:first-child:hover) {
          box-shadow: 0 18px 36px rgba(84, 28, 226, 0.38);
        }

        .quick-icon,
        .quick-arrow,
        .step-icon {
          display: grid;
          place-items: center;
        }

        .quick-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
        }

        .quick-icon :global(svg),
        .quick-arrow :global(svg),
        .step-icon :global(svg) {
          width: 16px;
          height: 16px;
        }

        .quick-icon.violet {
          color: var(--purple-2);
          background: #efe5ff;
        }

        :global(.quick-card:first-child) .quick-icon {
          color: #6f2cff;
          background: rgba(255,255,255,0.22);
        }

        .quick-icon.amber {
          color: #e58a00;
          background: #ffe4aa;
        }

        :global(.quick-card) strong {
          max-width: 105px;
          font-size: 0.68rem;
          line-height: 1.28;
          font-weight: 900;
          white-space: normal;
        }

        .quick-arrow {
          width: 14px;
          height: 14px;
          color: var(--ink);
          background: transparent;
          box-shadow: none;
        }

        :global(.quick-card:first-child) .quick-arrow {
          color: #fff;
        }

        .pipeline-card,
        .activity-card {
          border: 1px solid var(--line);
          border-radius: 28px;
          background: rgba(255,255,255,0.84);
          box-shadow: 0 18px 48px rgba(33, 15, 75, 0.08);
        }

        .pipeline-card {
          position: relative;
          overflow: hidden;
          padding: 22px;
        }

        .pipeline-card::after {
          content: "";
          position: absolute;
          right: 18px;
          top: 74px;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(111,44,255,0.25), transparent 64%);
          pointer-events: none;
        }

        .section-head {
          position: relative;
          z-index: 2;
          margin-bottom: 20px;
        }

        .section-head.row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .section-head h2,
        .activity-card h2 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--ink);
        }

        .section-head p {
          margin: 8px 0 0;
          color: var(--muted);
        }

        .section-head p span {
          color: var(--purple-2);
          font-weight: 800;
        }

        .section-head a {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--purple-2);
          font-size: 0.85rem;
          font-weight: 800;
        }

        .section-head a :global(svg) {
          width: 16px;
          height: 16px;
        }

        .pipeline-flow {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .pipeline-step {
          min-height: 136px;
          padding: 18px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 14px 32px rgba(33, 15, 75, 0.08);
          display: grid;
          align-content: center;
          gap: 8px;
          clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%, 20px 50%);
        }

        .pipeline-step:first-child {
          clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%);
          border-radius: 20px 0 0 20px;
        }

        .pipeline-step:last-child {
          border-radius: 0 20px 20px 0;
        }

        .step-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
        }

        .pipeline-step small {
          font-weight: 900;
          color: var(--ink);
        }

        .pipeline-step strong {
          font-size: 2rem;
          line-height: 1;
        }

        .pipeline-step em {
          font-style: normal;
          font-size: 0.78rem;
          color: var(--muted);
        }

        .step-violet .step-icon { color: #6f2cff; background: #efe6ff; }
        .step-purple .step-icon { color: #8244ff; background: #f1e9ff; }
        .step-amber .step-icon { color: #f08b00; background: #fff1d6; }
        .step-green .step-icon { color: #1baa64; background: #e3f8eb; }

        .dashboard-side {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .ai-card {
          position: relative;
          overflow: hidden;
          min-height: 322px;
          border-radius: 22px;
          padding: 18px 20px 20px;
          color: #fff;
          background:
            radial-gradient(circle at 80% 28%, rgba(126,72,255,0.55), transparent 28%),
            linear-gradient(145deg, #16104d 0%, #1a0c4f 45%, #09072a 100%);
          box-shadow: 0 18px 42px rgba(16, 9, 54, 0.22);
        }

        .ai-head {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .ai-head h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 0.9rem;
        }

        .ai-head h2 :global(svg) {
          width: 17px;
          height: 17px;
        }

        .ai-head span {
          border-radius: 999px;
          padding: 7px 10px;
          background: rgba(255,255,255,0.12);
          font-size: 0.72rem;
          font-weight: 900;
        }

        .ai-card > p {
          position: relative;
          z-index: 2;
          margin: 22px 0 0;
          color: rgba(255,255,255,0.86);
          font-size: 0.85rem;
          font-weight: 800;
        }

        .score-row {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin-top: 8px;
        }

        .score-row strong {
          font-size: 2.35rem;
          line-height: 1;
          color: #b278ff;
        }

        .score-row span {
          color: #76f0a7;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .brain-visual {
          position: absolute;
          right: 32px;
          top: 96px;
          width: 96px;
          height: 64px;
          border-radius: 48% 52% 45% 55%;
          background:
            radial-gradient(circle at 34% 35%, rgba(255,255,255,0.72), transparent 13%),
            radial-gradient(circle at 58% 44%, rgba(255,255,255,0.5), transparent 16%),
            linear-gradient(145deg, #d1b5ff, #5f20ff 65%, #32107d);
          box-shadow: 0 16px 30px rgba(111,44,255,0.34);
          opacity: 0.95;
        }

        .brain-visual::before,
        .brain-visual::after {
          content: "";
          position: absolute;
          inset: -14px;
          border: 1px solid rgba(188,160,255,0.45);
          border-radius: 50%;
          transform: rotate(-14deg);
        }

        .brain-visual::after {
          inset: -24px;
          opacity: 0.45;
        }

        .candidate-list {
          position: relative;
          z-index: 2;
          margin-top: 32px;
          display: grid;
          gap: 8px;
        }

        .mini-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #fff;
          font-size: 0.78rem;
        }

        .mini-head a {
          color: #c89cff;
          text-decoration: none;
          font-size: 0.72rem;
          font-weight: 900;
        }

        .candidate-row {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .candidate-row:first-of-type {
          border-top: 0;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: var(--purple);
          background: #fff;
          font-size: 0.7rem;
          font-weight: 900;
        }

        .candidate-row strong {
          color: #fff;
          font-size: 0.82rem;
        }

        .candidate-row p,
        .empty-candidates {
          margin: 3px 0 0;
          color: rgba(255,255,255,0.72);
          font-size: 0.72rem;
        }

        .candidate-row em {
          padding: 7px 9px;
          border-radius: 9px;
          background: rgba(126,72,255,0.34);
          color: #fff;
          font-size: 0.78rem;
          font-style: normal;
          font-weight: 900;
        }

        .activity-card {
          padding: 20px;
        }

        .activity-list {
          display: grid;
          gap: 16px;
        }

        .activity-item {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
        }

        .activity-dot {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: #efe6ff;
          position: relative;
        }

        .activity-dot::after {
          content: "";
          position: absolute;
          inset: 13px;
          border-radius: 50%;
          background: var(--purple-2);
        }

        .activity-dot.tone-1 { background: #e6f9ed; }
        .activity-dot.tone-1::after { background: #24b86c; }
        .activity-dot.tone-2 { background: #f1e8ff; }
        .activity-dot.tone-3 { background: #fff0d6; }
        .activity-dot.tone-3::after { background: #f59b18; }

        .activity-item strong {
          font-size: 0.84rem;
          color: var(--ink);
        }

        .activity-item p {
          margin: 3px 0 0;
          color: var(--muted);
          font-size: 0.76rem;
          line-height: 1.35;
        }

        .activity-item time {
          color: var(--muted);
          font-size: 0.72rem;
          white-space: nowrap;
        }

        .empty-activity {
          color: var(--muted);
        }

        .all-activity {
          min-height: 48px;
          margin-top: 18px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 18px;
          text-decoration: none;
          color: var(--ink);
          font-weight: 900;
          background: linear-gradient(90deg, #efe6ff, #f8f4ff);
        }

        .all-activity :global(svg) {
          width: 18px;
          height: 18px;
        }

        .dashboard-error {
          border: 1px solid #f1bdc6;
          border-radius: 16px;
          padding: 12px 14px;
          color: #9e2335;
          background: #fff1f3;
          font-weight: 700;
        }

        .enterprise-dashboard-loading {
          min-height: 420px;
          display: grid;
          place-content: center;
          gap: 12px;
          color: #535a76;
          font-weight: 700;
        }

        .enterprise-dashboard-spinner {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 4px solid rgba(53, 6, 62, 0.16);
          border-top-color: var(--purple);
          justify-self: center;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1320px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }

          .dashboard-side {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .hero-section,
          .quick-actions,
          .pipeline-flow {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
            justify-content: stretch;
          }

          :global(.quick-card) {
            width: 100%;
          }

          :global(.quick-card) strong {
            white-space: normal;
          }

          .hero-copy {
            padding-left: 0;
          }

          .team-visual {
            display: none;
          }

          .pipeline-step,
          .pipeline-step:first-child,
          .pipeline-step:last-child {
            clip-path: none;
            border-radius: 20px;
          }

        }

        @media (max-width: 640px) {
          .enterprise-dashboard {
            padding: 12px;
          }

          .activity-item,
          .candidate-row {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .activity-item time,
          .candidate-row em {
            grid-column: 2;
          }
        }
      `}</style>
    </section>
  );
}
