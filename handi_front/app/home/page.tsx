"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { useI18n } from "@/components/i18n-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState, PageHeader, StatCard } from "@/components/ui/layout";
import { EntrepriseHome } from "@/components/entreprise-home";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { fetchSupervisionResource, type SupervisionOverview } from "@/lib/supervision";

type CandidateStatItem = {
  statut: string;
  count: number;
};

type AdminUserStatistics = {
  total_utilisateurs?: number;
  utilisateurs_actifs_periode?: number;
  actifs?: number;
};

type PendingRequestsPayload = {
  demandes?: unknown[];
};

type StatParStatut = { statut: string; count: number };
type EntrepriseActive = { entreprise_nom: string; nombre_offres: number; nombre_candidatures: number };

type StatistiquesAdmin = {
  stats_par_statut: StatParStatut[];
  taux_recrutement: number;
  temps_moyen_traitement_jours: number;
  total_candidatures: number;
  entreprises_actives: EntrepriseActive[];
};

type WorkflowPoint = {
  date: string;
  nouvelles: number;
  shortlistees: number;
  entretiens: number;
  acceptees: number;
  refusees: number;
};

type EntrepriseOffreStat = {
  statut?: string;
};

type WorkspaceStatCard = {
  label: string;
  value: number | string;
  hint?: string;
};

type WorkspaceAction = {
  title: string;
  text: string;
  href: string;
};

type WorkspaceContent = {
  badge: string;
  title: string;
  description: string;
  actions: WorkspaceAction[];
};

type RecommendationItem = {
  id: string;
  job_offer_id: string;
  score_final: number;
  status: "pending" | "notified" | "viewed" | "applied" | "dismissed";
  explanation: {
    matchedSkills?: string[];
    missingSkills?: string[];
    preferenceMatches?: string[];
    accessibilityMatches?: string[];
    notes?: string[];
  };
  created_at: string;
  offre: {
    titre: string;
    localisation: string;
    type_poste: string;
    salaire_min?: string | null;
    salaire_max?: string | null;
    nom_entreprise?: string | null;
  };
};

function isShowcaseWorkspaceRole(role: string) {
  return role === "admin" || role === "inspecteur" || role === "aneti";
}

async function fetchApiData<T>(path: string): Promise<T> {
  const response = await authenticatedFetch(construireUrlApi(path));
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Unable to load workspace data.");
  }

  return (payload?.donnees ?? payload) as T;
}

function buildWorkspaceContent(
  role: string,
  t: (key: string, replacements?: Record<string, string | number>) => string,
): WorkspaceContent {
  if (role === "entreprise") {
    return {
      badge: t("home.workspace.entreprise.badge"),
      title: t("home.workspace.entreprise.title"),
      description: t("home.workspace.entreprise.description"),
      actions: [
        {
          title: t("home.workspace.entreprise.actions.rolesTitle"),
          text: t("home.workspace.entreprise.actions.rolesText"),
          href: "/entreprise/offres",
        },
        {
          title: t("home.workspace.entreprise.actions.applicantsTitle"),
          text: t("home.workspace.entreprise.actions.applicantsText"),
          href: "/entreprise/candidatures",
        },
        {
          title: t("home.workspace.entreprise.actions.profileTitle"),
          text: t("home.workspace.entreprise.actions.profileText"),
          href: "/entreprise/profil",
        },
      ],
    };
  }

  if (role === "admin") {
    return {
      badge: t("home.workspace.admin.badge"),
      title: t("home.workspace.admin.title"),
      description: t("home.workspace.admin.description"),
      actions: [
        {
          title: t("home.workspace.admin.actions.accountsTitle"),
          text: t("home.workspace.admin.actions.accountsText"),
          href: "/admin/comptes",
        },
        {
          title: t("home.workspace.admin.actions.usersTitle"),
          text: t("home.workspace.admin.actions.usersText"),
          href: "/admin/utilisateurs",
        },
        {
          title: t("home.workspace.admin.actions.statsTitle"),
          text: t("home.workspace.admin.actions.statsText"),
          href: "#admin-stats",
        },
      ],
    };
  }

  if (role === "inspecteur") {
    return {
      badge: t("home.workspace.inspecteur.badge"),
      title: t("home.workspace.inspecteur.title"),
      description: t("home.workspace.inspecteur.description"),
      actions: [
        {
          title: t("home.workspace.inspecteur.actions.statsTitle"),
          text: t("home.workspace.inspecteur.actions.statsText"),
          href: "/supervision",
        },
        {
          title: t("home.workspace.inspecteur.actions.profileTitle"),
          text: t("home.workspace.inspecteur.actions.profileText"),
          href: "/profil",
        },
        {
          title: t("home.workspace.inspecteur.actions.messagesTitle"),
          text: t("home.workspace.inspecteur.actions.messagesText"),
          href: "/messages",
        },
      ],
    };
  }

  return {
    badge: t("home.workspace.aneti.badge"),
    title: t("home.workspace.aneti.title"),
    description: t("home.workspace.aneti.description"),
    actions: [
      {
        title: t("home.workspace.aneti.actions.statsTitle"),
        text: t("home.workspace.aneti.actions.statsText"),
        href: "/supervision",
      },
      {
        title: t("home.workspace.aneti.actions.profileTitle"),
        text: t("home.workspace.aneti.actions.profileText"),
        href: "/profil",
      },
      {
        title: t("home.workspace.aneti.actions.messagesTitle"),
        text: t("home.workspace.aneti.actions.messagesText"),
        href: "/messages",
      },
    ],
  };
}

export default function HomePage() {
  return (
    <AuthenticatedWorkspace>
      <HomeContent />
    </AuthenticatedWorkspace>
  );
}

function HomeContent() {
  const router = useRouter();
  const { t } = useI18n();
  const { utilisateur } = useAuth();
  const [candidateStats, setCandidateStats] = useState<CandidateStatItem[]>([]);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStatCard[]>([]);
  const [adminStats, setAdminStats] = useState<StatistiquesAdmin | null>(null);
  const [adminWorkflow, setAdminWorkflow] = useState<WorkflowPoint[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [erreurStats, setErreurStats] = useState<string | null>(null);

  useEffect(() => {
    if (!utilisateur) {
      return;
    }

    let active = true;

    const charger = async () => {
      setLoadingStats(true);
      setErreurStats(null);

      try {
        if (utilisateur.role === "candidat") {
          const data = await fetchApiData<CandidateStatItem[]>("/api/candidatures/mes-statistiques");
          if (active) {
            setCandidateStats(Array.isArray(data) ? data : []);
            setWorkspaceStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
          }
          return;
        }

        if (utilisateur.role === "admin") {
          const [pendingResult, userStatsResult, applicationsResult, workflowResult] =
            await Promise.allSettled([
              fetchApiData<PendingRequestsPayload>("/api/admin/demandes-en-attente"),
              fetchApiData<AdminUserStatistics>("/api/admin/utilisateurs/statistiques?periode=mois"),
              fetchApiData<StatistiquesAdmin>("/api/admin/candidatures/statistiques-globales"),
              fetchApiData<WorkflowPoint[]>("/api/admin/workflow-recrutement?periode=30"),
            ]);

          const cards: WorkspaceStatCard[] = [];

          if (pendingResult.status === "fulfilled") {
            const pendingCount = Array.isArray(pendingResult.value)
              ? pendingResult.value.length
              : Array.isArray(pendingResult.value?.demandes)
                ? pendingResult.value.demandes.length
                : 0;
            cards.push({
              label: t("home.workspace.admin.stats.pendingRequests"),
              value: pendingCount,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (userStatsResult.status === "fulfilled") {
            cards.push({
              label: t("home.workspace.admin.stats.activeUsers"),
              value:
                userStatsResult.value.utilisateurs_actifs_periode ??
                userStatsResult.value.actifs ??
                0,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (applicationsResult.status === "fulfilled") {
            cards.push({
              label: t("home.workspace.admin.stats.totalApplications"),
              value: applicationsResult.value.total_candidatures ?? 0,
              hint: t("home.workspace.admin.stats.realDataHint"),
            });
          }

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(applicationsResult.status === "fulfilled" ? applicationsResult.value : null);
            setAdminWorkflow(
              workflowResult.status === "fulfilled" && Array.isArray(workflowResult.value)
                ? workflowResult.value
                : [],
            );
          }
          return;
        }

        if (utilisateur.role === "entreprise") {
          const [candidaturesResult, offresResult] = await Promise.allSettled([
            fetchApiData<{ donnees: CandidateStatItem[] }>("/api/candidatures/statistiques"),
            fetchApiData<{ donnees: { offres: EntrepriseOffreStat[] } }>("/api/entreprise/offres"),
          ]);

          const cards: WorkspaceStatCard[] = [];

          // Process candidatures statistics
          if (candidaturesResult.status === "fulfilled") {
            const candidaturesData = candidaturesResult.value;
            const stats = Array.isArray(candidaturesData.donnees) ? candidaturesData.donnees : 
                         Array.isArray(candidaturesData) ? candidaturesData : [];
            
            const getStatValue = (statut: string) => {
              const stat = stats.find(s => s.statut === statut);
              return stat ? stat.count : 0;
            };

            const total = stats.reduce((sum, stat) => sum + (Number(stat.count) || 0), 0);
            
            cards.push(
              {
                label: "Total des candidatures",
                value: total,
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - Candidatures reÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ues",
              },
              {
                label: "Candidatures en attente",
                value: getStatValue("pending"),
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - En cours d'examen",
              },
              {
                label: "Candidats prÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lectionnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s",
                value: getStatValue("shortlisted"),
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - Retenus pour entretien",
              },
              {
                label: "Candidats acceptÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s",
                value: getStatValue("accepted"),
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - EmbauchÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s avec succÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s",
              }
            );
          }

          // Process offers statistics
          if (offresResult.status === "fulfilled") {
            const offresData = offresResult.value;
            const offres = offresData.donnees?.offres || [];
            const activeOffers = offres.filter((offre) => offre.statut === "active" || offre.statut === "ouverte").length;
            
            cards.push({
              label: "Offres actives",
              value: activeOffers,
              hint: `DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - ${offres.length} offres au total`,
            });
          }

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
          }
          return;
        }

        if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
          const overview = await fetchSupervisionResource<SupervisionOverview>("/statistics/overview");
          const cards: WorkspaceStatCard[] = [
            {
              label: t("supervision.dashboard.companiesInScope"),
              value: overview.totals.total_companies,
              hint: t("supervision.dashboard.activeCompanies", {
                count: overview.totals.active_companies,
              }),
            },
            {
              label: t("supervision.dashboard.openRoles"),
              value: overview.totals.total_offers,
              hint: t("supervision.dashboard.applicationsTracked", {
                count: overview.totals.total_applications,
              }),
            },
            {
              label: t("supervision.dashboard.shortlistedCandidates"),
              value: overview.totals.shortlisted_candidates,
              hint: t("supervision.dashboard.applicationsRate", {
                rate: overview.rates.shortlist_rate,
              }),
            },
            {
              label: t("supervision.dashboard.hiredCandidates"),
              value: overview.totals.hired_candidates,
              hint: t("supervision.dashboard.hiringRate", {
                rate: overview.rates.hiring_rate,
              }),
            },
          ];

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
          }
          return;
        }

        if (active) {
          setWorkspaceStats([]);
          setCandidateStats([]);
          setAdminStats(null);
          setAdminWorkflow([]);
        }
      } catch (error: unknown) {
        if (active) {
          setWorkspaceStats([]);
          setCandidateStats([]);
          setAdminStats(null);
          setAdminWorkflow([]);
          setErreurStats(
            error instanceof Error
              ? error.message
              : utilisateur.role === "candidat"
                ? t("home.candidate.loadStatsError")
                : t("home.workspace.noRealDataDescription"),
          );
        }
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    };

    void charger();

    return () => {
      active = false;
    };
  }, [t, utilisateur]);

  if (!utilisateur) {
    return null;
  }

  if (utilisateur.role === "candidat") {
    return (
      <CandidateHome
        utilisateurNom={utilisateur.nom}
        stats={candidateStats}
        loadingStats={loadingStats}
        erreurStats={erreurStats}
        t={t}
      />
    );
  }

  if (utilisateur.role === "entreprise") {
    return (
      <EntrepriseHome
        utilisateurNom={utilisateur.nom}
        stats={workspaceStats}
        loadingStats={loadingStats}
        erreurStats={erreurStats}
      />
    );
  }

  const contenu = buildWorkspaceContent(utilisateur.role, t);

  if (isShowcaseWorkspaceRole(utilisateur.role)) {
    return (
      <RoleWorkspaceHome
        role={utilisateur.role}
        utilisateurNom={utilisateur.nom}
        content={contenu}
        stats={workspaceStats}
        adminStats={adminStats}
        adminWorkflow={adminWorkflow}
        loadingStats={loadingStats}
        erreurStats={erreurStats}
        t={t}
      />
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        badge={contenu.badge}
        title={contenu.title}
        description={contenu.description}
        tone="dark"
        actions={
          <ButtonLink href={contenu.actions[0].href} variant="secondary">
            {t("home.workspace.openNextStep")}
          </ButtonLink>
        }
      />

      {loadingStats && (utilisateur.role === "admin" || utilisateur.role === "inspecteur" || utilisateur.role === "aneti") ? (
        <LoadingState
          title={t("common.loadingWorkspaceTitle")}
          description={t("common.loadingWorkspaceDescription")}
        />
      ) : null}

      {workspaceStats.length > 0 ? (
        <section className="stat-grid">
          {workspaceStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
          ))}
        </section>
      ) : null}

      {erreurStats && workspaceStats.length === 0 && utilisateur.role === "entreprise" ? (
        <div className="message message-erreur">{erreurStats}</div>
      ) : null}

      <section className="surface-grid surface-grid-3">
        {contenu.actions.map((action) => (
          <Card key={action.href} interactive padding="lg">
            <div className="stack-lg">
              <div>
                <p className="badge">{action.title}</p>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontFamily: "var(--app-heading)" }}>
                  {action.title}
                </h2>
                <p className="texte-secondaire" style={{ margin: "12px 0 0" }}>
                  {action.text}
                </p>
              </div>
              <button
                className="ui-button ui-button-secondary"
                onClick={() => router.push(action.href)}
                type="button"
              >
                {t("home.workspace.openSection")}
              </button>
            </div>
          </Card>
        ))}
      </section>

      <Card tone="accent" padding="lg">
        <div className="split-grid">
          <div>
            <p className="badge">{t("home.workspace.oneSystemBadge")}</p>
            <h2 style={{ margin: 0, fontSize: "2rem", fontFamily: "var(--app-heading)" }}>
              {t("home.workspace.oneSystemTitle")}
            </h2>
          </div>
          <p className="texte-secondaire" style={{ margin: 0 }}>
            {t("home.workspace.oneSystemDescription")}
          </p>
        </div>
      </Card>
    </div>
  );
}

function RoleWorkspaceHome({
  role,
  utilisateurNom,
  content,
  stats,
  adminStats,
  adminWorkflow,
  loadingStats,
  erreurStats,
  t,
}: {
  role: string;
  utilisateurNom: string;
  content: WorkspaceContent;
  stats: WorkspaceStatCard[];
  adminStats: StatistiquesAdmin | null;
  adminWorkflow: WorkflowPoint[];
  loadingStats: boolean;
  erreurStats: string | null;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const firstName = utilisateurNom.split(" ")[0] || utilisateurNom || "HandiTalents";
  const primaryAction = content.actions[0];
  const secondaryAction = content.actions[1] ?? content.actions[0];
  const highlightedStats =
    stats.length > 0
      ? stats.slice(0, 2)
      : content.actions.slice(0, 2).map((action) => ({
          label: action.title,
          value: "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â",
          hint: action.text,
        }));
  const insightItems =
    stats.length > 0
      ? stats.slice(0, 3).map((item) => ({
          title: item.label,
          text: item.hint || t("home.workspace.showcase.realDataText"),
        }))
      : content.actions.slice(0, 3).map((action) => ({
          title: action.title,
          text: action.text,
        }));
  const stripItems = Array.from(
    new Set(
      (stats.length > 0 ? stats.map((item) => item.label) : content.actions.map((action) => action.title)).slice(0, 5),
    ),
  );

  if (loadingStats && stats.length === 0) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("common.loadingWorkspaceTitle")}
          description={t("common.loadingWorkspaceDescription")}
        />
      </main>
    );
  }

  return (
    <div className="candidate-showcase">
      <section className="candidate-showcase-hero">
        <div className="candidate-showcase-copy">
          <p className="candidate-showcase-tag">{content.badge}</p>
          <h1>{content.title}</h1>
          <p>{t("home.workspace.showcase.welcome", { name: firstName, description: content.description })}</p>
          <div className="candidate-showcase-actions">
            <ButtonLink href={primaryAction.href}>{primaryAction.title}</ButtonLink>
            {secondaryAction ? (
              <ButtonLink href={secondaryAction.href} variant="secondary">
                {secondaryAction.title}
              </ButtonLink>
            ) : null}
          </div>
        </div>

        <div className="candidate-showcase-visual">
          <div className="candidate-showcase-image-wrap">
            <div className="candidate-showcase-image" aria-hidden="true" />
          </div>
          {highlightedStats[0] ? (
            <div className="candidate-showcase-pill candidate-showcase-pill-top">
              <strong>{highlightedStats[0].value}</strong>
              <span>{highlightedStats[0].label}</span>
            </div>
          ) : null}
          {highlightedStats[1] ? (
            <div className="candidate-showcase-pill candidate-showcase-pill-right">
              <strong>{highlightedStats[1].value}</strong>
              <span>{highlightedStats[1].label}</span>
            </div>
          ) : null}
        </div>
      </section>

      {stripItems.length > 0 ? (
        <section className="candidate-showcase-strip">
          {stripItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </section>
      ) : null}

      {erreurStats ? <div className="message message-erreur">{erreurStats}</div> : null}

      {role === "admin" && adminStats ? (
        <section id="admin-stats" className="stack-lg">
          <div className="surface-grid surface-grid-4">
            <StatCard
              label={t("adminStats.totalApplications")}
              value={adminStats.total_candidatures ?? 0}
            />
            <StatCard
              label={t("adminStats.hiringRate")}
              value={`${formatPercent(adminStats.taux_recrutement)} %`}
            />
            <StatCard
              label={t("adminStats.averageTime")}
              value={formatPercent(adminStats.temps_moyen_traitement_jours)}
            />
            <StatCard
              label={t("adminStats.pending")}
              value={sumStatuses(adminStats.stats_par_statut, ["pending", "en_attente"])}
            />
          </div>

          <Card className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <strong>{t("adminStats.statusBreakdown")}</strong>
              </div>
            </div>

            <div className="surface-grid surface-grid-3">
              {adminStats.stats_par_statut.map((item) => (
                <div key={`${item.statut}-${item.count}`} className="detail-box">
                  <strong>{translateStatusLabel(item.statut, t)}</strong>
                  <span>{item.count ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <strong>{t("adminStats.workflowTitle")}</strong>
                <p className="texte-secondaire" style={{ margin: "6px 0 0" }}>
                  {t("adminStats.workflowDescription")}
                </p>
              </div>
            </div>

            {adminWorkflow.length === 0 ? (
              <p className="texte-secondaire" style={{ margin: 0 }}>
                {t("adminStats.noRecentData")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tableau">
                  <thead>
                    <tr>
                      <th>{t("adminStats.columns.date")}</th>
                      <th>{t("adminStats.columns.new")}</th>
                      <th>{t("adminStats.columns.shortlisted")}</th>
                      <th>{t("adminStats.columns.interviews")}</th>
                      <th>{t("adminStats.columns.accepted")}</th>
                      <th>{t("adminStats.columns.rejected")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminWorkflow.map((point) => (
                      <tr key={point.date}>
                        <td>{formatDate(point.date)}</td>
                        <td>{point.nouvelles ?? 0}</td>
                        <td>{point.shortlistees ?? 0}</td>
                        <td>{point.entretiens ?? 0}</td>
                        <td>{point.acceptees ?? 0}</td>
                        <td>{point.refusees ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <strong>{t("adminStats.topCompaniesTitle")}</strong>
              </div>
            </div>

            {adminStats.entreprises_actives.length === 0 ? (
              <p className="texte-secondaire" style={{ margin: 0 }}>
                {t("adminStats.noCompanyActivity")}
              </p>
            ) : (
              <div className="space-y-3">
                {adminStats.entreprises_actives.map((entreprise) => (
                  <div key={entreprise.entreprise_nom} className="profile-preference-row">
                    <div className="profile-preference-copy">
                      <strong>{entreprise.entreprise_nom}</strong>
                      <p>
                        {t("adminStats.companySummary", {
                          offers: entreprise.nombre_offres ?? 0,
                          applications: entreprise.nombre_candidatures ?? 0,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      ) : null}

      <section className="candidate-showcase-learning">
        <div className="candidate-showcase-collage">
          <div className="candidate-showcase-collage-image" aria-hidden="true" />
        </div>
        <div className="candidate-showcase-learning-copy">
          <p className="candidate-showcase-tag">{t("home.workspace.showcase.focusTag")}</p>
          <h2>{t("home.workspace.showcase.focusTitle")}</h2>
          <div className="candidate-showcase-benefits">
            {insightItems.map((item) => (
              <div key={item.title} className="candidate-showcase-benefit">
                <div className="candidate-showcase-benefit-icon" aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="candidate-showcase-courses">
        <div className="candidate-showcase-courses-head">
          <p className="candidate-showcase-tag">{t("home.workspace.showcase.sectionsTag")}</p>
          <h2>{t("home.workspace.showcase.sectionsTitle")}</h2>
        </div>
        <div className="candidate-showcase-cards">
          {content.actions.map((action, index) => (
            <article key={action.href} className="candidate-showcase-card">
              <div
                className={`candidate-showcase-card-image candidate-showcase-card-image-${(index % 3) + 1}`}
                aria-hidden="true"
              />
              <strong>{action.title}</strong>
              <p>{action.text}</p>
              <ButtonLink href={action.href} variant="secondary">
                {t("home.workspace.openSection")}
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      {stats.length > 0 ? (
        <section className="candidate-showcase-stats">
          {stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="candidate-showcase-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>
      ) : (
        <section className="candidate-showcase-search">
          <p className="candidate-showcase-tag">{t("home.workspace.oneSystemBadge")}</p>
          <h2>{t("home.workspace.noRealDataTitle")}</h2>
          <p className="texte-secondaire" style={{ margin: "12px auto 0", maxWidth: 680 }}>
            {t("home.workspace.noRealDataDescription")}
          </p>
        </section>
      )}

      <section className="candidate-showcase-final">
        <div className="candidate-showcase-final-copy">
          <p className="candidate-showcase-tag">{t("home.workspace.oneSystemBadge")}</p>
          <h2>{t("home.workspace.oneSystemTitle")}</h2>
          <p>{t("home.workspace.oneSystemDescription")}</p>
          <div className="candidate-showcase-actions">
            {content.actions.map((action) => (
              <ButtonLink key={action.href} href={action.href} variant="secondary">
                {action.title}
              </ButtonLink>
            ))}
          </div>
        </div>
        <div className="candidate-showcase-final-visual">
          <div className="candidate-showcase-final-image" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}

function CandidateHome({
  utilisateurNom,
  stats,
  loadingStats,
  erreurStats,
  t,
}: {
  utilisateurNom: string;
  stats: CandidateStatItem[];
  loadingStats: boolean;
  erreurStats: string | null;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [profileProgress, setProfileProgress] = useState<number | null>(null);
  const [profileSnapshot, setProfileSnapshot] = useState<Record<string, unknown> | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null);
  const [interviewsCount, setInterviewsCount] = useState<number | null>(null);
  const [applicationsCount, setApplicationsCount] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [pendingRecommendationAction, setPendingRecommendationAction] = useState<Record<string, boolean>>({});
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const statsMap = useMemo(
    () =>
      stats.reduce<Record<string, number>>((acc, item) => {
        acc[item.statut] = Number(item.count) || 0;
        return acc;
      }, {}),
    [stats],
  );

  useEffect(() => {
    if (!utilisateur || utilisateur.role !== "candidat") {
      return;
    }

    let active = true;

    const loadDashboardData = async () => {
      setProfileError(null);
      setApplicationsError(null);
      setInterviewsError(null);
      setFavoritesError(null);
      setRecommendationError(null);
      setLoadingRecommendations(true);

      const profilePromise = authenticatedFetch(construireUrlApi(`/api/candidats/profil/${utilisateur.id_utilisateur}`)).then(
        async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload?.message || "Unable to load profile.");
          return payload?.donnees ?? payload;
        },
      );

      const candidaturesPromise = authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures")).then(
        async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload?.message || "Unable to load applications.");
          return Array.isArray(payload?.donnees) ? payload.donnees : [];
        },
      );

      const interviewsPromise = authenticatedFetch(construireUrlApi("/api/entretiens/candidat")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Unable to load interviews.");
        return Array.isArray(payload?.donnees) ? payload.donnees : [];
      });

      const favorisPromise = authenticatedFetch(construireUrlApi("/api/favoris")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Unable to load favorites.");
        return Array.isArray(payload?.donnees) ? payload.donnees : [];
      });

      const recommendationsPromise = authenticatedFetch(construireUrlApi("/api/recommandations/candidat")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Impossible de charger les recommandations.");
        const rows = Array.isArray(payload?.donnees) ? payload.donnees : [];
        return rows as RecommendationItem[];
      });

      const [profileResult, candidaturesResult, interviewsResult, favorisResult, recommendationsResult] = await Promise.allSettled([
        profilePromise,
        candidaturesPromise,
        interviewsPromise,
        favorisPromise,
        recommendationsPromise,
      ]);

      if (!active) return;

      if (profileResult.status === "fulfilled") {
        const profil = profileResult.value as Record<string, unknown>;
        setProfileSnapshot(profil);
        const completionValues = [
          profil.nom,
          profil.email,
          profil.telephone,
          profil.addresse,
          profil.experience,
          profil.formation,
          profil.handicap,
          profil.salaire_souhaite,
        ];
        const completed = completionValues.filter((value) => typeof value === "string" && value.trim().length > 0).length;
        setProfileProgress(Math.round((completed / completionValues.length) * 100));
      } else {
        setProfileSnapshot(null);
        setProfileProgress(null);
        setProfileError(profileResult.reason instanceof Error ? profileResult.reason.message : "Impossible de charger le profil.");
      }

      if (candidaturesResult.status === "fulfilled") {
        setApplicationsCount(candidaturesResult.value.length);
      } else {
        setApplicationsCount(null);
        setApplicationsError(
          candidaturesResult.reason instanceof Error
            ? candidaturesResult.reason.message
            : "Impossible de charger les candidatures.",
        );
      }

      if (interviewsResult.status === "fulfilled") {
        const now = Date.now();
        const upcoming = interviewsResult.value.filter((item: Record<string, unknown>) => {
          const entretien = (item.entretien || {}) as Record<string, unknown>;
          const ts = new Date(String(entretien.date_heure || "")).getTime();
          return !Number.isNaN(ts) && ts >= now;
        }).length;
        setInterviewsCount(upcoming);
      } else {
        setInterviewsCount(null);
        setInterviewsError(
          interviewsResult.reason instanceof Error ? interviewsResult.reason.message : "Impossible de charger les entretiens.",
        );
      }

      if (favorisResult.status === "fulfilled") {
        setFavoritesCount(favorisResult.value.length);
      } else {
        setFavoritesCount(null);
        setFavoritesError(favorisResult.reason instanceof Error ? favorisResult.reason.message : "Impossible de charger les favoris.");
      }

      if (recommendationsResult.status === "fulfilled") {
        const rows = recommendationsResult.value.filter((row) => row.status !== "dismissed");
        setRecommendations(rows);
      } else {
        setRecommendations([]);
        setRecommendationError(
          recommendationsResult.reason instanceof Error
            ? recommendationsResult.reason.message
            : "Impossible de charger les recommandations.",
        );
      }

      setLoadingRecommendations(false);
    };

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, [utilisateur]);

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const pending = statsMap.pending || 0;
  const shortlistAndInterview = (statsMap.shortlisted || 0) + (statsMap.interview_scheduled || 0);
  const firstName = utilisateurNom.split(" ")[0] || utilisateurNom || "HandiTalents";
  const profileValue = profileProgress ?? 0;
  const applicationsValue = applicationsCount ?? total;
  const interviewsValue = interviewsCount ?? shortlistAndInterview;
  const favoritesValue = favoritesCount ?? 0;
  const profileSections = [
    {
      label: "Informations personnelles",
      done:
        hasText(profileSnapshot?.nom) &&
        hasText(profileSnapshot?.email) &&
        hasText(profileSnapshot?.telephone),
    },
    {
      label: "Experience & formation",
      done: hasText(profileSnapshot?.experience) || hasText(profileSnapshot?.formation),
    },
    {
      label: "Competences",
      done: hasText(profileSnapshot?.experience) || hasText(profileSnapshot?.formation),
    },
    {
      label: "CV ajoute",
      done: profileValue >= 60,
    },
    {
      label: "Preferences d'accessibilite",
      done: hasText(profileSnapshot?.handicap) || hasText(profileSnapshot?.salaire_souhaite),
    },
  ];
  const responseWaiting = Math.max(applicationsValue - pending - interviewsValue, 0);
  const spotlightRecommendations = recommendations.slice(0, 3);
  const interviewsSubtitle = interviewsValue > 0 ? "Demain a 10:00" : "Aucun entretien a venir";
  const favoritesSubtitle = favoritesValue > 0 ? `${favoritesValue} expire${favoritesValue > 1 ? "nt" : ""} bientot` : "Aucune offre sauvegardee";
  const dashboardErrorMessage = [erreurStats, applicationsError, interviewsError, favoritesError, recommendationError]
    .filter(Boolean)
    .join(" ");

  const markRecommendation = async (id: string, action: "view" | "dismiss" | "apply") => {
    if (!utilisateur || pendingRecommendationAction[id]) return;
    try {
      setPendingRecommendationAction((current) => ({ ...current, [id]: true }));
      const res = await authenticatedFetch(construireUrlApi(`/api/recommandations/${id}/${action}`), {
        method: "POST",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || "Action impossible sur la recommandation.");
      }

      setRecommendations((current) =>
        current
          .map((item) => {
            if (item.id !== id) return item;
            const nextStatus: RecommendationItem["status"] =
              action === "dismiss" ? "dismissed" : action === "apply" ? "applied" : "viewed";
            return { ...item, status: nextStatus };
          })
          .filter((item) => item.status !== "dismissed"),
      );
    } catch (error) {
      setRecommendationError(error instanceof Error ? error.message : "Action impossible sur la recommandation.");
    } finally {
      setPendingRecommendationAction((current) => ({ ...current, [id]: false }));
    }
  };

  if (loadingStats && stats.length === 0) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState title={t("common.loadingWorkspaceTitle")} description={t("common.loadingWorkspaceDescription")} />
      </main>
    );
  }

  return (
    <div className="candidate-dashboard-ref">
      {erreurStats ? <div className="message message-erreur">{erreurStats}</div> : null}

      <section className="candidate-dashboard-ref__hero">
        <div className="candidate-dashboard-ref__hero-copy">
          <h2>Bonjour {firstName}</h2>
          <p>Ravi de vous revoir ! Voici un apercu de vos opportunites.</p>
          <div className="candidate-dashboard-ref__hero-actions">
            <ButtonLink href="/offres">Explorer les offres</ButtonLink>
            <ButtonLink href="/candidat/cv" variant="secondary">Ameliorer mon profil</ButtonLink>
          </div>
        </div>
        <div className="candidate-dashboard-ref__hero-visual" aria-hidden="true">
          <Image src="/uploads/home.png" alt="" width={340} height={250} className="candidate-dashboard-ref__hero-image" />
        </div>
      </section>

      <section className="candidate-dashboard-ref__insights">
        <article className="candidate-dashboard-ref__card">
          <h3>Completion du profil</h3>
          <div className="candidate-dashboard-ref__profile-layout">
            <div className="candidate-dashboard-ref__ring" style={{ ["--progress" as string]: `${profileValue}%` }}>
              <span>{profileProgress === null ? "?" : `${profileValue}%`}</span>
              <small>complete</small>
            </div>
            <ul className="candidate-dashboard-ref__checklist">
              {profileSections.map((section) => (
                <li key={section.label}>
                  <span>{section.label}</span>
                  <b className={section.done ? "ok" : "warn"}>{section.done ? "OK" : "!"}</b>
                </li>
              ))}
            </ul>
          </div>
          <ButtonLink href="/candidat/cv" variant="secondary" className="candidate-dashboard-ref__full-btn">Completer maintenant</ButtonLink>
          {profileError ? <p className="candidate-dashboard-ref__inline-error">{profileError}</p> : null}
        </article>

        <article className="candidate-dashboard-ref__card">
          <div className="candidate-dashboard-ref__card-head">
            <h3>Activite recente</h3>
            <ButtonLink href="/candidat/candidatures" variant="secondary" size="sm">Voir tout</ButtonLink>
          </div>
          <div className="candidate-dashboard-ref__activity-list">
            <Link href="/candidat/candidatures" className="candidate-dashboard-ref__activity-item">
              <div>
                <strong>{applicationsValue} candidatures</strong>
                <small>{responseWaiting} en attente de reponse</small>
              </div>
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link href="/candidat/entretiens" className="candidate-dashboard-ref__activity-item">
              <div>
                <strong>{interviewsValue} entretien planifie</strong>
                <small>{interviewsSubtitle}</small>
              </div>
              <span aria-hidden="true">&gt;</span>
            </Link>
            <Link href="/favoris" className="candidate-dashboard-ref__activity-item">
              <div>
                <strong>{favoritesValue} offres sauvegardees</strong>
                <small>{favoritesSubtitle}</small>
              </div>
              <span aria-hidden="true">&gt;</span>
            </Link>
          </div>
        </article>

        <article className="candidate-dashboard-ref__card candidate-dashboard-ref__tips">
          <h3>Conseils pour vous</h3>
          <div>
            <strong>Completez votre profil</strong>
            <p>Les profils complets recoivent 35% plus de reponses.</p>
            <ButtonLink href="/candidat/cv" variant="secondary" size="sm">Voir les elements manquants</ButtonLink>
          </div>
        </article>
      </section>

      <section className="candidate-dashboard-ref__jobs">
        <div className="candidate-dashboard-ref__jobs-head">
          <div>
            <h3>Offres recommandees pour vous</h3>
            <p>Des opportunites qui correspondent a votre profil et vos preferences.</p>
          </div>
          <ButtonLink href="/offres" variant="secondary" size="sm">Voir toutes les offres</ButtonLink>
        </div>

        <div className="candidate-dashboard-ref__jobs-grid">
          <div className="candidate-dashboard-ref__jobs-list">
            {loadingRecommendations ? (
              <div className="candidate-dashboard-ref__empty" aria-busy="true" aria-live="polite">
                <strong>Chargement des recommandations...</strong>
                <p>Nous analysons les offres qui correspondent a votre profil.</p>
              </div>
            ) : spotlightRecommendations.length > 0 ? (
              spotlightRecommendations.map((recommendation) => {
                const offer = recommendation.offre;
                const score = clamp(Math.round((recommendation.score_final || 0) * 100), 0, 99);
                const matchedSkills = Array.isArray(recommendation.explanation?.matchedSkills)
                  ? recommendation.explanation.matchedSkills.slice(0, 2)
                  : [];
                const fallbackTag = offer.type_poste || "Type non precise";
                const isBusy = Boolean(pendingRecommendationAction[recommendation.id]);

                return (
                <article key={recommendation.id} className="candidate-dashboard-ref__job-card">
                  <div className="candidate-dashboard-ref__job-top">
                    <span className="candidate-dashboard-ref__job-mark">{buildOfferMark(offer.nom_entreprise ?? undefined)}</span>
                    <div>
                      <h4>{offer.titre}</h4>
                      <p>{offer.nom_entreprise || "Entreprise non precise"} - {offer.localisation || "Localisation non precise"}</p>
                    </div>
                  </div>
                  <div className="candidate-dashboard-ref__tags">
                    <span>{fallbackTag}</span>
                    {matchedSkills.length > 0 ? matchedSkills.map((skill) => <span key={`${recommendation.id}-${skill}`}>{skill}</span>) : null}
                    <span>{formatSalaryRange(offer.salaire_min, offer.salaire_max)}</span>
                  </div>
                  <div className="candidate-dashboard-ref__match">
                    <small>Match</small>
                    <div><i style={{ width: `${score}%` }} /></div>
                    <b>{score}%</b>
                  </div>
                  <div className="candidate-dashboard-ref__job-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isBusy}
                      onClick={async () => {
                        await markRecommendation(recommendation.id, "view");
                        router.push("/offres");
                      }}
                    >
                      Voir l&apos;offre
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void markRecommendation(recommendation.id, "dismiss")}
                    >
                      Ignorer
                    </Button>
                    <Button
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void markRecommendation(recommendation.id, "apply")}
                    >
                      J&apos;ai postule
                    </Button>
                  </div>
                </article>
                );
              })
            ) : (
              <div className="candidate-dashboard-ref__empty">
                <strong>Aucune offre prioritaire pour le moment.</strong>
                <p>Nous afficherons ici les nouvelles opportunites des qu&apos;elles seront disponibles.</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {dashboardErrorMessage ? <div className="message message-erreur">{dashboardErrorMessage}</div> : null}
    </div>
  );
}
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatSalaryRange(min?: string | null, max?: string | null) {
  const left = typeof min === "string" && min.trim().length > 0 ? Number(min) : NaN;
  const right = typeof max === "string" && max.trim().length > 0 ? Number(max) : NaN;
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return "Salaire a discuter";
  }

  return `${left.toLocaleString("fr-FR")} - ${right.toLocaleString("fr-FR")} TND`;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildOfferMark(company?: string) {
  const clean = company?.trim() || "HT";
  const parts = clean.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "H") + (parts[1]?.[0] || parts[0]?.[1] || "T");
}
function sumStatuses(items: StatParStatut[] | undefined, statuses: string[]) {
  if (!items) {
    return 0;
  }

  const normalized = new Set(statuses.map(normalizeStatus));
  return items.reduce((total, item) => {
    return total + (normalized.has(normalizeStatus(item.statut)) ? item.count : 0);
  }, 0);
}

function translateStatusLabel(status: string, t: (key: string) => string) {
  switch (normalizeStatus(status)) {
    case "pending":
    case "en_attente":
      return t("adminStats.statuses.pending");
    case "new":
    case "nouvelles":
    case "nouvelle":
      return t("adminStats.statuses.new");
    case "shortlisted":
    case "shortlistees":
    case "shortlistee":
      return t("adminStats.statuses.shortlisted");
    case "interviews":
    case "interview":
    case "entretiens":
    case "entretien":
      return t("adminStats.statuses.interviews");
    case "accepted":
    case "acceptees":
    case "acceptee":
      return t("adminStats.statuses.accepted");
    case "rejected":
    case "refusees":
    case "refusee":
      return t("adminStats.statuses.rejected");
    default:
      return humanizeStatus(status);
  }
}

function normalizeStatus(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function humanizeStatus(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatPercent(value: number | undefined) {
  return Number(value ?? 0).toFixed(1);
}


