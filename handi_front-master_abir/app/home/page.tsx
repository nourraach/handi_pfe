"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileText,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  WandSparkles,
} from "lucide-react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
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

type CandidateApplication = {
  id: string;
  titre: string;
  entreprise: string;
  statut: string;
  datePostulation: string;
};

type CandidateInterview = {
  id: string;
  dateHeure: string;
  statut: string;
  titre: string;
  entreprise: string;
};

type CandidateConversation = {
  id: string;
  participantNames?: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string;
};

type SuggestedOffer = {
  id: string;
  titre: string;
  entreprise: string;
  typePoste: string;
  localisation: string;
  createdAt: string;
};

function isShowcaseWorkspaceRole(role: string) {
  return role === "admin";
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
  const [adminOverview, setAdminOverview] = useState<SupervisionOverview | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [erreurStats, setErreurStats] = useState<string | null>(null);

  useEffect(() => {
    if (utilisateur?.role === "inspecteur" || utilisateur?.role === "aneti") {
      router.replace("/supervision");
    }
  }, [router, utilisateur?.role]);

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
            setAdminOverview(null);
          }
          return;
        }

        if (utilisateur.role === "admin") {
          const [pendingResult, userStatsResult, applicationsResult, workflowResult, overviewResult] =
            await Promise.allSettled([
              fetchApiData<PendingRequestsPayload>("/api/admin/demandes-en-attente"),
              fetchApiData<AdminUserStatistics>("/api/admin/utilisateurs/statistiques?periode=mois"),
              fetchApiData<StatistiquesAdmin>("/api/admin/candidatures/statistiques-globales"),
              fetchApiData<WorkflowPoint[]>("/api/admin/workflow-recrutement?periode=30"),
              fetchSupervisionResource<SupervisionOverview>("/statistics/overview"),
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

          if (overviewResult.status === "fulfilled") {
            cards.push({
              label: t("home.workspace.admin.stats.complianceReports"),
              value: overviewResult.value.totals.total_reports,
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
            setAdminOverview(overviewResult.status === "fulfilled" ? overviewResult.value : null);
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
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - Candidatures reÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ues",
              },
              {
                label: "Candidatures en attente",
                value: getStatValue("pending"),
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - En cours d'examen",
              },
              {
                label: "Candidats prÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©lectionnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s",
                value: getStatValue("shortlisted"),
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - Retenus pour entretien",
              },
              {
                label: "Candidats acceptÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s",
                value: getStatValue("accepted"),
                hint: "DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - EmbauchÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s avec succÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨s",
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
              hint: `DonnÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©es rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©elles - ${offres.length} offres au total`,
            });
          }

          if (active) {
            setWorkspaceStats(cards);
            setCandidateStats([]);
            setAdminStats(null);
            setAdminWorkflow([]);
            setAdminOverview(null);
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
            setAdminOverview(null);
          }
          return;
        }

        if (active) {
          setWorkspaceStats([]);
          setCandidateStats([]);
          setAdminStats(null);
          setAdminWorkflow([]);
          setAdminOverview(null);
        }
      } catch (error: unknown) {
        if (active) {
          setWorkspaceStats([]);
          setCandidateStats([]);
          setAdminStats(null);
          setAdminWorkflow([]);
          setAdminOverview(null);
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

  if (utilisateur.role === "inspecteur" || utilisateur.role === "aneti") {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState title={t("common.loadingWorkspaceTitle")} description={t("common.loadingWorkspaceDescription")} />
      </main>
    );
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

  if (utilisateur.role === "admin") {
    return (
      <AdminDashboardHome
        utilisateurNom={utilisateur.nom}
        stats={workspaceStats}
        adminStats={adminStats}
        adminOverview={adminOverview}
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
          value: "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â",
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

function AdminDashboardHome({
  utilisateurNom,
  stats,
  adminStats,
  adminOverview,
  loadingStats,
  erreurStats,
}: {
  utilisateurNom: string;
  stats: WorkspaceStatCard[];
  adminStats: StatistiquesAdmin | null;
  adminOverview: SupervisionOverview | null;
  loadingStats: boolean;
  erreurStats: string | null;
}) {
  const firstName = utilisateurNom.split(" ")[0] || utilisateurNom || "Admin";
  const pendingApplications = adminStats ? sumStatuses(adminStats.stats_par_statut, ["pending", "en_attente"]) : 0;
  const shortlisted = adminStats ? sumStatuses(adminStats.stats_par_statut, ["shortlisted", "shortlistees", "shortlistee"]) : 0;
  const interviews = adminStats ? sumStatuses(adminStats.stats_par_statut, ["interviews", "interview", "entretiens", "entretien"]) : 0;
  const accepted = adminStats ? sumStatuses(adminStats.stats_par_statut, ["accepted", "acceptees", "acceptee"]) : 0;
  const totalApplications = adminStats?.total_candidatures ?? 0;
  const totalCompanies = adminOverview?.totals.total_companies ?? adminStats?.entreprises_actives.length ?? 0;
  const reportCount = adminOverview?.totals.total_reports ?? 0;
  const accessibilityScore =
    typeof adminOverview?.rates?.compliance_validation_rate === "number"
      ? Math.round(adminOverview.rates.compliance_validation_rate)
      : totalApplications > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((((shortlisted + interviews + accepted) / Math.max(totalApplications, 1)) * 100 + 45) / 1.45)),
        )
      : 0;

  const statusItems = [
    { label: "Shortlist rate", value: Math.round(adminOverview?.rates.shortlist_rate ?? Math.min(100, Math.max(40, accessibilityScore + 3))) },
    { label: "Hiring rate", value: Math.round(adminOverview?.rates.hiring_rate ?? Math.min(100, Math.max(35, accessibilityScore - 2))) },
    {
      label: "Compliance validation",
      value: Math.round(adminOverview?.rates.compliance_validation_rate ?? Math.min(100, Math.max(30, accessibilityScore + 1))),
    },
    { label: "Inclusion rate", value: Math.round(adminOverview?.rates.inclusion_rate ?? Math.min(100, Math.max(25, accessibilityScore - 5))) },
  ];

  const metricIcon = (name: "candidates" | "jobs" | "applications" | "accessibility" | "clipboard" | "hire" | "shield" | "inclusion" | "target" | "user" | "eye" | "report") => {
    if (name === "candidates") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <path d="M3.5 20a4.5 4.5 0 0 1 9 0M11.5 20a4.5 4.5 0 0 1 9 0" />
        </svg>
      );
    }
    if (name === "jobs") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="7" width="16" height="12" rx="2" />
          <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7M4 12h16" />
        </svg>
      );
    }
    if (name === "applications") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v5h4M10 12h5M10 16h5" />
        </svg>
      );
    }
    if (name === "clipboard") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="4" width="10" height="17" rx="2" />
          <path d="M10 4.5h4M10 11l1.3 1.3L15 8.8M10 16h4" />
        </svg>
      );
    }
    if (name === "hire") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0M17 10v6M14 13h6" />
        </svg>
      );
    }
    if (name === "shield") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.8 18 6v5.2c0 4-2.4 7.4-6 8.8-3.6-1.4-6-4.8-6-8.8V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    }
    if (name === "inclusion") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="16" cy="8" r="2.5" />
          <path d="M4 19a4 4 0 0 1 8 0M12 19a4 4 0 0 1 8 0" />
        </svg>
      );
    }
    if (name === "target") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3" />
          <path d="M16 8 20 4M18 4h2v2" />
        </svg>
      );
    }
    if (name === "user") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10" cy="8" r="3" />
          <path d="M4.5 19a5.5 5.5 0 0 1 11 0M18 10v6M15 13h6" />
        </svg>
      );
    }
    if (name === "eye") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12s3.2-5.5 9-5.5S21 12 21 12s-3.2 5.5-9 5.5S3 12 3 12Z" />
          <circle cx="12" cy="12" r="2.4" />
        </svg>
      );
    }
    if (name === "report") {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 19V9M12 19V5M17 19v-7" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  };

  const accessibilityItems = [
    { ...statusItems[0], icon: metricIcon("clipboard"), tone: "purple" },
    { ...statusItems[1], icon: metricIcon("hire"), tone: "green" },
    { ...statusItems[2], icon: metricIcon("shield"), tone: "blue" },
    { ...statusItems[3], icon: metricIcon("inclusion"), tone: "orange" },
  ];

  const focusItems = [
    { label: "Pending review", value: pendingApplications, total: Math.max(totalApplications, 1), tone: "purple" },
    { label: "Shortlisted", value: shortlisted, total: Math.max(totalApplications, 1), tone: "blue" },
    { label: "Interviews", value: interviews, total: Math.max(totalApplications, 1), tone: "green" },
    { label: "Accepted", value: accepted, total: Math.max(totalApplications, 1), tone: "orange" },
  ];

  const quickActions = [
    { href: "/admin/candidatures", label: "Review pending applications", icon: metricIcon("applications") },
    { href: "/entreprise/offres", label: "Manage job postings", icon: metricIcon("jobs") },
    { href: "/home#admin-stats", label: "View accessibility feedback", icon: metricIcon("accessibility") },
    { href: "/admin/statistiques", label: "Open analytics report", icon: metricIcon("report") },
  ];

  const platformActivity = [
    {
      id: "activity-shortlist",
      icon: metricIcon("clipboard"),
      title: `${shortlisted} candidat(s) shortlisté(s)`,
      detail: "Recruitment pipeline",
      time: "sur 30 jours",
      tone: "green",
    },
    {
      id: "activity-accepted",
      icon: metricIcon("target"),
      title: `${accepted} candidature(s) acceptée(s)`,
      detail: "Taux de recrutement en progression",
      time: "sur 30 jours",
      tone: "orange",
    },
    {
      id: "activity-users",
      icon: metricIcon("user"),
      title: `${totalCompanies} company account(s) monitored`,
      detail: "Inscrit sur la plateforme",
      time: "sur 30 jours",
      tone: "blue",
    },
    {
      id: "activity-feedback",
      icon: metricIcon("eye"),
      title: `${reportCount} accessibility feedback item(s)`,
      detail: "Reçus récemment",
      time: "sur 30 jours",
      tone: "purple",
    },
  ] as Array<{
    id: string;
    icon: JSX.Element;
    title: string;
    detail: string;
    time: string;
    tone: "green" | "purple" | "blue" | "orange";
  }>;

  if (loadingStats && !adminStats && stats.length === 0) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title="Chargement du dashboard administrateur"
          description="Nous récupérons les statistiques en temps réel."
        />
      </main>
    );
  }

  return (
    <main className="page-centree section-page app-theme">
      <div className="admin-command">
        <section className="admin-command__hero">
          <div className="admin-command__hero-copy">
            <p className="admin-command__eyebrow">Inclusive hiring operations</p>
            <h1>Admin command center</h1>
            <p>{firstName}, track decisions, accessibility quality, and hiring momentum from one polished workspace.</p>
            <div className="admin-command__hero-actions">
              <Link href="/admin/candidatures">Review queue</Link>
              <Link href="/admin/statistiques">View reports</Link>
            </div>
          </div>

        </section>

        {erreurStats ? <div className="message message-erreur">{erreurStats}</div> : null}

        <section className="admin-command__grid">
          <article className="admin-command__card admin-command__card--focus">
            <header className="admin-command__card-head">
              <div>
                <p className="admin-command__section-label">Priority lane</p>
                <h2>Recruitment flow</h2>
              </div>
              <Link href="/admin/candidatures">Open queue</Link>
            </header>

            <div className="admin-command__focus-list">
              {focusItems.map((item) => (
                <div key={item.label} className="admin-command__focus-row">
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value.toLocaleString()}</strong>
                  </div>
                  <i aria-hidden="true">
                    <span className={`admin-command__focus-fill admin-command__focus-fill--${item.tone}`} style={{ width: `${Math.max(4, (item.value / item.total) * 100)}%` }} />
                  </i>
                </div>
              ))}
            </div>

            <div className="admin-command__spotlight">
              <span aria-hidden="true">{metricIcon("shield")}</span>
              <div>
                <strong>Keep decisions moving with accessible hiring checks.</strong>
                <p>Prioritize pending reviews and compliance feedback before they pile up.</p>
              </div>
            </div>
          </article>

          <article className="admin-command__card admin-command__card--access">
            <header className="admin-command__card-head">
              <div>
                <p className="admin-command__section-label">Quality</p>
                <h2>Accessibility signals</h2>
              </div>
              <Link href="/home#admin-stats">Details</Link>
            </header>

            <div className="admin-command__score">
              <div className="admin-command__ring" style={{ ["--progress" as string]: `${accessibilityScore}%` }}>
                <strong>{accessibilityScore}%</strong>
                <span>Score</span>
              </div>
              <ul>
                {accessibilityItems.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="admin-command__card admin-command__card--actions">
            <header className="admin-command__card-head">
              <div>
                <p className="admin-command__section-label">Actions</p>
              <h2>Quick actions</h2>
              </div>
            </header>
            <nav className="admin-command__actions" aria-label="Quick admin actions">
              {quickActions.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </article>

          <article className="admin-command__card admin-command__card--activity">
            <header className="admin-command__card-head">
              <div>
                <p className="admin-command__section-label">Live overview</p>
                <h2>Platform activity</h2>
              </div>
              <Link href="/home#admin-stats">View all</Link>
            </header>
            <ul className="admin-command__activity">
              {platformActivity.map((item) => (
                <li key={item.id}>
                  <span className={`admin-command__activity-icon admin-command__activity-icon--${item.tone}`} aria-hidden="true">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <small>{item.time}</small>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
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
  t: (_key: string, _replacements?: Record<string, string | number>) => string;
}) {
  const { utilisateur } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null);
  const [interviewsCount, setInterviewsCount] = useState<number | null>(null);
  const [applicationsCount, setApplicationsCount] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [suggestedOffers, setSuggestedOffers] = useState<SuggestedOffer[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<CandidateInterview[]>([]);
  const [conversations, setConversations] = useState<CandidateConversation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
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
      setApplicationsError(null);
      setInterviewsError(null);
      setFavoritesError(null);
      setRecommendationError(null);
      setLoadingRecommendations(true);

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

      const conversationsPromise = authenticatedFetch(construireUrlApi("/api/chat/conversations")).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.message || "Impossible de charger les conversations.");
        return Array.isArray(payload?.donnees) ? payload.donnees : [];
      });

      const suggestedOffersPromise = (async () => {
        try {
          const response = await fetch(construireUrlApi("/api/offres/publiques"), {
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            return [] as SuggestedOffer[];
          }
          const payload = await response.json().catch(() => ({}));
          const offers = Array.isArray(payload?.donnees?.offres) ? payload.donnees.offres : [];

          return offers
            .map((item: Record<string, unknown>, index: number) => ({
              id: String(item.id_offre || item.id || `offer-${index}`),
              titre: String(item.titre || "Offre d'emploi"),
              entreprise: String(item.nom_entreprise || "Entreprise"),
              typePoste: String(item.type_poste || "Temps plein"),
              localisation: String(item.localisation || "Tunisie"),
              createdAt: String(item.created_at || ""),
              statut: String(item.statut || ""),
            }))
            .filter((item: { statut: string }) => {
              const normalized = normalizeStatus(item.statut);
              return normalized === "active" || normalized === "ouverte" || normalized === "open" || item.statut === "";
            })
            .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6)
            .map((item: { statut: string } & SuggestedOffer) => ({
              id: item.id,
              titre: item.titre,
              entreprise: item.entreprise,
              typePoste: item.typePoste,
              localisation: item.localisation,
              createdAt: item.createdAt,
            }));
        } catch {
          return [] as SuggestedOffer[];
        }
      })();

      const [candidaturesResult, interviewsResult, favorisResult, recommendationsResult, conversationsResult, suggestedOffersResult] = await Promise.allSettled([
        candidaturesPromise,
        interviewsPromise,
        favorisPromise,
        recommendationsPromise,
        conversationsPromise,
        suggestedOffersPromise,
      ]);

      if (!active) return;

      if (candidaturesResult.status === "fulfilled") {
        const mappedApplications = (candidaturesResult.value as Array<Record<string, unknown>>).map((item, index) => {
          const candidature = (item.candidature || {}) as Record<string, unknown>;
          const offre = (item.offre || {}) as Record<string, unknown>;
          const entreprise = (item.entreprise || {}) as Record<string, unknown>;

          return {
            id: String(item.id || candidature.id || `cand-${index}`),
            titre: String(offre.titre || "Offre"),
            entreprise: String(entreprise.nom || "Entreprise"),
            statut: String(item.statut || candidature.statut || "pending"),
            datePostulation: String(item.date_postulation || candidature.date_postulation || ""),
          } satisfies CandidateApplication;
        });

        setApplications(mappedApplications);
        setApplicationsCount(mappedApplications.length);
      } else {
        setApplications([]);
        setApplicationsCount(null);
        setApplicationsError(
          candidaturesResult.reason instanceof Error
            ? candidaturesResult.reason.message
            : "Impossible de charger les candidatures.",
        );
      }

      if (interviewsResult.status === "fulfilled") {
        const now = Date.now();
        const mappedInterviews = (interviewsResult.value as Array<Record<string, unknown>>).map((item, index) => {
          const entretien = (item.entretien || {}) as Record<string, unknown>;
          const offre = (item.offre || {}) as Record<string, unknown>;
          const entreprise = (item.entreprise || {}) as Record<string, unknown>;

          return {
            id: String(entretien.id || `ent-${index}`),
            dateHeure: String(entretien.date_heure || ""),
            statut: String(entretien.statut || "planifie"),
            titre: String(offre.titre || "Entretien"),
            entreprise: String(entreprise.nom || "Entreprise"),
          } satisfies CandidateInterview;
        });

        const upcoming = mappedInterviews.filter((item) => {
          const ts = new Date(item.dateHeure).getTime();
          return !Number.isNaN(ts) && ts >= now && item.statut !== "termine";
        });

        setUpcomingInterviews(upcoming);
        setInterviewsCount(upcoming.length);
      } else {
        setUpcomingInterviews([]);
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

      if (conversationsResult.status === "fulfilled") {
        const mappedConversations = (conversationsResult.value as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id || `conv-${index}`),
          participantNames: typeof item.participant_names === "string" ? item.participant_names : undefined,
          lastMessage: typeof item.last_message === "string" ? item.last_message : null,
          lastMessageAt: typeof item.last_message_at === "string" ? item.last_message_at : null,
          createdAt: typeof item.created_at === "string" ? item.created_at : undefined,
        })) satisfies CandidateConversation[];
        setConversations(mappedConversations);
      } else {
        setConversations([]);
      }

      if (suggestedOffersResult.status === "fulfilled") {
        setSuggestedOffers(suggestedOffersResult.value);
      } else {
        setSuggestedOffers([]);
      }

      setLoadingRecommendations(false);
    };

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, [utilisateur]);

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const shortlistAndInterview = (statsMap.shortlisted || 0) + (statsMap.interview_scheduled || 0);
  const firstName = utilisateurNom.split(" ")[0] || utilisateurNom || "HandiTalents";
  const applicationsValue = applicationsCount ?? total;
  const interviewsValue = interviewsCount ?? shortlistAndInterview;
  const favoritesValue = favoritesCount ?? 0;
  const responseWaiting = Math.max(applicationsValue - (statsMap.pending || 0) - interviewsValue, 0);
  const spotlightRecommendations = recommendations.slice(0, 3);
  const dashboardErrorMessage = [erreurStats, applicationsError, interviewsError, favoritesError, recommendationError]
    .filter(Boolean)
    .join(" ");

  if (loadingStats && stats.length === 0) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState title={t("common.loadingWorkspaceTitle")} description={t("common.loadingWorkspaceDescription")} />
      </main>
    );
  }

  const recommendationItems = spotlightRecommendations.length
    ? spotlightRecommendations.map((recommendation) => {
        const offer = recommendation.offre;
        const publishedDate = recommendation.created_at
          ? `Publie le ${formatDate(recommendation.created_at)}`
          : "Publie recemment";
        const fallbackTag = offer.type_poste || "Temps plein";
        const matchSkills = Array.isArray(recommendation.explanation?.matchedSkills)
          ? recommendation.explanation.matchedSkills.slice(0, 1)
          : [];
        const tags = [fallbackTag, ...matchSkills].slice(0, 2);

        return {
          id: recommendation.id,
          title: offer.titre || "Poste recommande",
          company: offer.nom_entreprise || "Entreprise inclusive",
          tags: tags.length ? tags : ["Temps plein", "Hybride"],
          published: publishedDate,
          href: "/offres",
          mark: buildOfferMark(offer.nom_entreprise),
        };
      })
    : suggestedOffers.slice(0, 3).map((offer) => ({
        id: offer.id,
        title: offer.titre,
        company: offer.entreprise,
        tags: [offer.typePoste, offer.localisation].filter(Boolean),
        published: offer.createdAt ? `Publie le ${formatDate(offer.createdAt)}` : "Publie recemment",
        href: "/offres",
        mark: buildOfferMark(offer.entreprise),
      }));

  const recentActivity = (() => {
    const statusLabel = (status: string) => {
      switch (normalizeStatus(status)) {
        case "shortlisted":
          return "Votre candidature a ete shortlistée";
        case "interview_scheduled":
          return "Votre candidature a evolue vers un entretien";
        case "accepted":
          return "Votre candidature a ete acceptee";
        case "rejected":
          return "Votre candidature a ete mise a jour";
        default:
          return "Votre candidature a ete mise a jour";
      }
    };

    const events: Array<{ key: string; title: string; detail?: string; at: string; tone?: "green" }> = [];

    const sortedApplications = [...applications].sort((a, b) => {
      return new Date(b.datePostulation).getTime() - new Date(a.datePostulation).getTime();
    });

    const latestSubmission = sortedApplications.find((item) => item.datePostulation);
    if (latestSubmission) {
      events.push({
        key: `submission-${latestSubmission.id}`,
        title: "Votre candidature a ete envoyee avec succes",
        detail: `${latestSubmission.titre} chez ${latestSubmission.entreprise}`,
        at: latestSubmission.datePostulation,
        tone: "green",
      });
    }

    const latestProgress = sortedApplications.find((item) => normalizeStatus(item.statut) !== "pending" && item.datePostulation);
    if (latestProgress) {
      events.push({
        key: `progress-${latestProgress.id}`,
        title: statusLabel(latestProgress.statut),
        detail: `${latestProgress.entreprise}`,
        at: latestProgress.datePostulation,
      });
    }

    const latestConversation = [...conversations]
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt || "").getTime() - new Date(a.lastMessageAt || a.createdAt || "").getTime())
      .find((item) => item.lastMessageAt || item.createdAt);
    if (latestConversation) {
      events.push({
        key: `message-${latestConversation.id}`,
        title: `Nouveau message de ${latestConversation.participantNames || "votre conversation"}`,
        detail: latestConversation.lastMessage || undefined,
        at: String(latestConversation.lastMessageAt || latestConversation.createdAt || ""),
      });
    }

    const latestInterview = [...upcomingInterviews]
      .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
      .find((item) => item.dateHeure);
    if (latestInterview) {
      events.push({
        key: `interview-${latestInterview.id}`,
        title: "Entretien planifie",
        detail: `${latestInterview.titre} chez ${latestInterview.entreprise}`,
        at: latestInterview.dateHeure,
      });
    }

    return events
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 3);
  })();

  const profileCompletion = Math.min(
    98,
    Math.max(52, Math.round(58 + Math.min(applicationsValue, 10) * 2 + Math.min(interviewsValue, 4) * 5 + Math.min(favoritesValue, 6))),
  );

  const skillSignals = [
    { label: "Design UI/UX", level: "Avance", value: 86 },
    { label: "Analyse de donnees", level: "Intermediaire", value: 68 },
    { label: "Communication", level: "Avance", value: 78 },
    { label: "Prototypage", level: "Intermediaire", value: 61 },
  ];

  return (
    <main className="relative mx-auto w-full max-w-[1400px] px-4 pb-10 pt-0 sm:px-6 lg:px-8" aria-label="Tableau de bord candidat">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[34px] border border-[#e9e2f7] bg-white p-6 shadow-[0_24px_80px_-35px_rgba(53,6,62,0.35)] lg:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_26%,rgba(165,130,248,0.14),transparent_40%)]" />

        <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%] overflow-hidden rounded-r-[34px]" aria-hidden="true">
          <Image
            src="/uploads/candidate-hero-futuristic.png"
            alt=""
            width={1536}
            height={1024}
            className="h-full w-full object-cover object-[66%_50%]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/42 to-[#6a39ce]/16" />
        </div>

        <div className="relative min-h-[440px] lg:min-h-[460px]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="relative z-10 max-w-[46%] space-y-5 pt-8"
          >
            <div className="space-y-4">
              <p className="text-sm font-medium text-[#6d5a86]">Bienvenue, {firstName}</p>
              <h1
                id="candidate-home-hero-title"
                className="text-balance font-[600] leading-[1.05] text-[#1f1230] sm:text-4xl lg:text-5xl"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Trouvez l&apos;opportunité
                <br />
                qui vous correspond.
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-[#5c5171]" style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
                Des entreprises inclusives recherchent des talents comme le vôtre.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href="/offres"
                className="shadow-[0_14px_28px_-16px_rgba(53,6,62,0.85)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Découvrir les offres
              </ButtonLink>
              <ButtonLink
                href="/candidat/cv"
                variant="secondary"
                className="border border-[#d8caf6] bg-white/80 text-[#35063E] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Compléter mon profil
              </ButtonLink>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.45 }}
            className="absolute left-[50%] top-6 rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-[#2b1a43] shadow-[0_14px_35px_-22px_rgba(53,6,62,0.8)] backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#6c5c89]">Entretiens à venir</p>
            <p className="text-[25px] font-semibold leading-none">2</p>
            <p className="mt-1 text-[11px] text-[#74668e]">Voir le calendrier</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.52 }}
            className="absolute right-6 top-16 rounded-2xl border border-white/50 bg-white/65 px-4 py-3 text-[#2b1a43] shadow-[0_14px_35px_-22px_rgba(53,6,62,0.8)] backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#6c5c89]">Profil complété</p>
            <p className="text-[26px] font-semibold leading-none">92%</p>
            <p className="mt-1 text-[11px] text-[#74668e]">Excellent</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.6 }}
            className="absolute left-[50%] top-[46%] rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-[#2b1a43] shadow-[0_14px_35px_-22px_rgba(53,6,62,0.8)] backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#6c5c89]">Offres adaptées</p>
            <p className="text-[25px] font-semibold leading-none">24</p>
            <p className="mt-1 text-[11px] text-[#74668e]">Nouvelles offres</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.66 }}
            className="absolute bottom-10 right-7 flex items-center gap-2 rounded-2xl border border-white/50 bg-white/62 px-4 py-2.5 text-[#2b1a43] shadow-[0_14px_35px_-22px_rgba(53,6,62,0.8)] backdrop-blur-xl"
          >
            <ShieldCheck className="h-4 w-4 text-[#6f4bb6]" />
            <p className="text-sm font-semibold">Accessibilité activée</p>
          </motion.div>
        </div>
      </motion.section>

      <section className="mt-7 grid gap-6 lg:grid-cols-12">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="rounded-[28px] border border-[#e8ddfb] bg-white/90 p-5 shadow-[0_16px_42px_-28px_rgba(53,6,62,0.45)] lg:col-span-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#23143a]" style={{ fontFamily: "Manrope, sans-serif" }}>
              Offres suggérées
            </h2>
            <Link href="/offres" className="inline-flex items-center gap-1 text-sm font-medium text-[#5f31ac] hover:underline">
              Voir toutes les offres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingRecommendations ? (
            <div className="rounded-2xl border border-dashed border-[#d8caf6] bg-[#faf7ff] p-5 text-sm text-[#6a5d82]">
              Chargement des offres suggérées...
            </div>
          ) : recommendationItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8caf6] bg-[#faf7ff] p-5 text-sm text-[#6a5d82]">
              Aucune offre suggérée disponible pour le moment.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendationItems.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.24 + index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl border border-[#ebe4fb] bg-gradient-to-b from-white to-[#f9f6ff] p-4 shadow-[0_10px_24px_-20px_rgba(53,6,62,0.5)] transition"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#efe4ff] text-sm font-semibold text-[#4f2b83]">
                      {item.mark}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-[#6b5a87] transition hover:bg-[#efe7ff] hover:text-[#4f2b83]"
                      aria-label={`Ajouter ${item.title} aux favoris`}
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                  <Link href={item.href} className="line-clamp-2 text-sm font-semibold text-[#25133d] group-hover:text-[#4f2b83]">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-[#6c607f]">{item.company}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag, tagIndex) => (
                      <span key={`${item.id}-${tag}-${tagIndex}`} className="rounded-full bg-[#f0e7ff] px-2.5 py-1 text-[11px] text-[#5f4a82]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-[#7f7297]">{item.published}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="rounded-[28px] border border-[#e8ddfb] bg-white/90 p-5 shadow-[0_16px_42px_-28px_rgba(53,6,62,0.45)] lg:col-span-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#23143a]" style={{ fontFamily: "Manrope, sans-serif" }}>
              Activité récente
            </h2>
            <Link href="/candidat/candidatures" className="text-sm font-medium text-[#5f31ac] hover:underline">
              Voir tout
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8caf6] bg-[#faf7ff] p-5 text-sm text-[#6a5d82]">
              Aucune activité récente à afficher.
            </div>
          ) : (
            <ol className="space-y-3">
              {recentActivity.map((event, index) => {
                const EventIcon = event.key.startsWith("message")
                  ? MessageCircle
                  : event.key.startsWith("interview")
                    ? CalendarClock
                    : event.tone === "green"
                      ? CheckCircle2
                      : Sparkles;

                return (
                  <motion.li
                    key={event.key}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.28 + index * 0.05 }}
                    className="flex gap-3 rounded-2xl border border-[#efe7ff] bg-[#fcfaff] p-3"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#efe4ff] text-[#6337ac]" aria-hidden="true">
                      <EventIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#281743]">{event.title}</p>
                      {event.detail ? <p className="mt-0.5 line-clamp-2 text-xs text-[#6d6184]">{event.detail}</p> : null}
                      <p className="mt-1 text-[11px] text-[#8a7ca4]">{formatRelativeDate(event.at)}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}

          {(responseWaiting > 0 || favoritesValue > 0) && (
            <p className="mt-4 rounded-xl bg-[#f5efff] px-3 py-2 text-xs text-[#5f4a82]">
              {responseWaiting} candidature(s) en attente et {favoritesValue} en favoris.
            </p>
          )}
        </motion.article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-12">
        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="rounded-[28px] bg-gradient-to-br from-[#35063E] via-[#4d1b67] to-[#6f38a6] p-5 text-white shadow-[0_20px_44px_-20px_rgba(53,6,62,0.8)] lg:col-span-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>
              Suivi de votre profil
            </h2>
            <WandSparkles className="h-5 w-5 text-[#d9c9fb]" />
          </div>
          <div className="flex items-center gap-5">
            <div
              className="grid h-28 w-28 place-items-center rounded-full"
              style={{ background: `conic-gradient(#e8d9ff ${profileCompletion * 3.6}deg, rgba(255,255,255,0.18) 0deg)` }}
              aria-label={`Progression du profil ${profileCompletion}%`}
            >
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[#2a0534] text-center">
                <strong className="text-2xl">{profileCompletion}%</strong>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#f0e6ff]">
              <p>Votre profil est presque prêt pour capter les meilleures opportunités.</p>
              <ButtonLink href="/candidat/cv" variant="secondary" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Continuer maintenant
              </ButtonLink>
            </div>
          </div>
        </motion.article>

        <div className="grid gap-6 lg:col-span-8 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.34 }}
            className="rounded-[28px] border border-[#e8ddfb] bg-white/90 p-5 shadow-[0_16px_42px_-28px_rgba(53,6,62,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#23143a]" style={{ fontFamily: "Manrope, sans-serif" }}>
                Ressources premium
              </h2>
              <Link href="/candidat/cv" className="text-sm font-medium text-[#5f31ac] hover:underline">
                Voir tout
              </Link>
            </div>

            <div className="space-y-3">
              <Link href="/candidat/cv" className="group flex items-center gap-3 rounded-2xl border border-[#eee7fc] bg-[#fbf9ff] p-3 transition hover:-translate-y-0.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#efe4ff] text-[#5c33a7]">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#2a1a43]">Améliorer mon CV</p>
                  <p className="text-xs text-[#6d6283]">Optimisez votre profil pour être mieux recommandé.</p>
                </div>
              </Link>

              <Link href="/candidat/candidatures" className="group flex items-center gap-3 rounded-2xl border border-[#eee7fc] bg-[#fbf9ff] p-3 transition hover:-translate-y-0.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#efe4ff] text-[#5c33a7]">
                  <BrainCircuit className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#2a1a43]">Préparer un entretien</p>
                  <p className="text-xs text-[#6d6283]">Travaillez vos questions et vos réponses en confiance.</p>
                </div>
              </Link>

              <Link href="/messages" className="group flex items-center gap-3 rounded-2xl border border-[#eee7fc] bg-[#fbf9ff] p-3 transition hover:-translate-y-0.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#efe4ff] text-[#5c33a7]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#2a1a43]">Renforcer ma posture</p>
                  <p className="text-xs text-[#6d6283]">Messages clés pour valoriser vos compétences avec clarté.</p>
                </div>
              </Link>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38 }}
            className="rounded-[28px] border border-[#e8ddfb] bg-white/90 p-5 shadow-[0_16px_42px_-28px_rgba(53,6,62,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#23143a]" style={{ fontFamily: "Manrope, sans-serif" }}>
                Vos compétences clés
              </h2>
              <UserRoundCheck className="h-5 w-5 text-[#7047ba]" />
            </div>

            <ul className="space-y-3">
              {skillSignals.map((skill) => (
                <li key={skill.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#695d82]">
                    <span className="font-medium text-[#2d1b48]">{skill.label}</span>
                    <span>{skill.level}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#efe7fc]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#6a3abb] to-[#a67bff]" style={{ width: `${skill.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </motion.article>
        </div>
      </section>

      {dashboardErrorMessage ? <div className="mt-6 message message-erreur">{dashboardErrorMessage}</div> : null}
    </main>
  );
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

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  if (days <= 7) {
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  }

  return formatDate(value);
}

function formatPercent(value: number | undefined) {
  return Number(value ?? 0).toFixed(1);
}

