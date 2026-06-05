"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CircleCheckBig, MoveRight, Plus, Search, Sparkles, WandSparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/layout";
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
  score_test?: number | null;
  candidat: {
    nom: string;
    email?: string;
    telephone?: string | null;
    competences?: string[];
    experience?: string | null;
    localisation?: string | null;
    region?: string | null;
  };
  offre: {
    titre: string;
    localisation?: string | null;
  };
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
    telephone?: string | null;
    competences?: string[];
    experience?: string | null;
    localisation?: string | null;
    ville?: string | null;
    region?: string | null;
  };
  offre?: {
    titre?: string;
    localisation?: string | null;
  };
};

type InterviewItem = {
  entretien: {
    id: string;
    date_heure: string;
    type: "visio" | "presentiel" | "telephonique";
    statut: "planifie" | "confirme" | "reporte" | "annule" | "termine";
  };
  candidature?: {
    id?: string;
    statut?: string;
  };
  candidat?: {
    nom?: string;
  };
  offre?: {
    titre?: string;
  };
};

type InterviewPayload = {
  message?: string;
  donnees?: InterviewItem[];
};

type ActivityEvent = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  dateValue?: string;
  tone: "candidate" | "interview" | "offer" | "default";
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

function initials(name?: string) {
  const parts = String(name || "Candidat")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "CA";
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`;
}

function getRelativeTimeFr(dateValue?: string) {
  if (!dateValue) return "Recemment";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recemment";

  const minutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function formatInterviewDay(dateValue?: string) {
  if (!dateValue) return "Date a confirmer";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date a confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatInterviewTime(dateValue?: string) {
  if (!dateValue) return "--:--";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function scoreForApplication(item: CandidateApplication, index: number) {
  const rawScore = asNumber(item.score_test);
  if (rawScore > 0) {
    return Math.min(100, Math.round(rawScore));
  }

  return Math.max(72, 95 - index * 4);
}

function readStatValue(stats: WorkspaceStatCard[], keywords: string[]) {
  const entry = stats.find((item) => {
    const label = normalizeLabel(item.label);
    return keywords.some((keyword) => label.includes(normalizeLabel(keyword)));
  });

  return asNumber(entry?.value);
}

function getCandidateStatusMeta(status?: string) {
  switch (normalizeStatus(status)) {
    case "shortlisted":
      return { label: "Preselection", tone: "shortlisted" } as const;
    case "interview_scheduled":
      return { label: "Entretien planifie", tone: "interview" } as const;
    case "accepted":
      return { label: "Accepte", tone: "accepted" } as const;
    case "rejected":
      return { label: "Refuse", tone: "rejected" } as const;
    case "pending":
    default:
      return { label: "A revoir", tone: "pending" } as const;
  }
}

function getInterviewStatusMeta(status?: InterviewItem["entretien"]["statut"]) {
  switch (status) {
    case "confirme":
      return { label: "Confirme", tone: "confirmed" } as const;
    case "reporte":
      return { label: "Reporte", tone: "rescheduled" } as const;
    case "termine":
      return { label: "Termine", tone: "completed" } as const;
    case "annule":
      return { label: "Annule", tone: "cancelled" } as const;
    case "planifie":
    default:
      return { label: "Planifie", tone: "scheduled" } as const;
  }
}

function getActivityTone(type?: string): ActivityEvent["tone"] {
  const value = normalizeStatus(type);
  if (value.includes("interview") || value.includes("entretien")) return "interview";
  if (value.includes("offre") || value.includes("offer")) return "offer";
  if (value.includes("candidate") || value.includes("candidature") || value.includes("shortlisted")) return "candidate";
  return "default";
}

function isFutureInterview(item: InterviewItem, now: number) {
  const date = new Date(item.entretien.date_heure);
  return !Number.isNaN(date.getTime()) && date.getTime() >= now && item.entretien.statut !== "annule";
}

export function EntrepriseHome({ utilisateurNom, stats, loadingStats, erreurStats }: EntrepriseHomeProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [referenceNow] = useState(() => Date.now());
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadWorkspace = async () => {
      const results = await Promise.allSettled([
        authenticatedFetch(construireUrlApi("/api/notifications?limit=8")),
        authenticatedFetch(construireUrlApi("/api/candidatures/entreprise?limit=12")),
        authenticatedFetch(construireUrlApi("/api/entretiens/entreprise")),
      ]);

      if (!active) {
        return;
      }

      const failed: string[] = [];

      const notificationsRes = results[0];
      if (notificationsRes.status === "fulfilled") {
        const payload = await notificationsRes.value.json().catch(() => ({}));
        if (notificationsRes.value.ok) {
          setNotifications(Array.isArray(payload?.donnees) ? payload.donnees : []);
        } else {
          failed.push("notifications");
        }
      } else {
        failed.push("notifications");
      }

      const applicationsRes = results[1];
      if (applicationsRes.status === "fulfilled") {
        const payload = await applicationsRes.value.json().catch(() => ({}));
        const raw: CandidateApplicationApiItem[] = Array.isArray(payload?.donnees) ? payload.donnees : [];

        if (applicationsRes.value.ok) {
          setApplications(
            raw.map((item, index) => ({
              id: item?.candidature?.id ?? `application-${index}`,
              statut: item?.candidature?.statut ?? "pending",
              date_postulation: item?.candidature?.date_postulation ?? item?.candidature?.created_at ?? "",
              score_test: asOptionalNumber(item?.candidature?.score_test),
              candidat: {
                nom: item?.candidat?.nom ?? "Candidat",
                email: item?.candidat?.email ?? "",
                telephone: item?.candidat?.telephone ?? null,
                competences: Array.isArray(item?.candidat?.competences) ? item.candidat.competences : [],
                experience: item?.candidat?.experience ?? null,
                localisation: item?.candidat?.localisation ?? item?.candidat?.ville ?? null,
                region: item?.candidat?.region ?? null,
              },
              offre: {
                titre: item?.offre?.titre ?? "Offre",
                localisation: item?.offre?.localisation ?? null,
              },
            })),
          );
        } else {
          failed.push("candidatures");
        }
      } else {
        failed.push("candidatures");
      }

      const interviewsRes = results[2];
      if (interviewsRes.status === "fulfilled") {
        const payload = (await interviewsRes.value.json().catch(() => ({}))) as InterviewPayload;
        if (interviewsRes.value.ok) {
          setInterviews(Array.isArray(payload?.donnees) ? payload.donnees : []);
        } else {
          failed.push("entretiens");
        }
      } else {
        failed.push("entretiens");
      }

      if (failed.length === 3) {
        setWorkspaceNotice("Impossible de charger les donnees live du recrutement pour le moment.");
      } else if (failed.length > 0) {
        setWorkspaceNotice("Certaines sections utilisent des donnees partielles pour le moment.");
      } else {
        setWorkspaceNotice(null);
      }

      setLoadingWorkspace(false);
    };

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  const pipeline = useMemo(() => {
    const statsPending = readStatValue(stats, ["en attente", "pending"]);
    const statsShortlisted = readStatValue(stats, ["preselection", "shortlist", "shortlisted"]);
    const statsInterview = readStatValue(stats, ["interview", "entretien"]);
    const statsAccepted = readStatValue(stats, ["acceptes", "accepted", "recrutes", "embauches"]);

    if (statsPending || statsShortlisted || statsInterview || statsAccepted) {
      return {
        pending: statsPending,
        shortlisted: statsShortlisted,
        interview: statsInterview,
        accepted: statsAccepted,
      };
    }

    return applications.reduce(
      (acc, item) => {
        const status = normalizeStatus(item.statut);
        if (status === "shortlisted") acc.shortlisted += 1;
        else if (status === "interview_scheduled") acc.interview += 1;
        else if (status === "accepted") acc.accepted += 1;
        else if (status !== "rejected") acc.pending += 1;
        return acc;
      },
      { pending: 0, shortlisted: 0, interview: 0, accepted: 0 },
    );
  }, [applications, stats]);

  const activeOffers = useMemo(() => {
    const fromStats = readStatValue(stats, ["offres actives", "offres", "roles actifs", "postes actifs"]);
    const uniqueTitles = new Set<string>();

    for (const application of applications) {
      if (application.offre.titre) {
        uniqueTitles.add(application.offre.titre);
      }
    }

    for (const interview of interviews) {
      if (interview.offre?.titre) {
        uniqueTitles.add(interview.offre.titre);
      }
    }

    return fromStats || uniqueTitles.size;
  }, [applications, interviews, stats]);

  const recommendedCandidates = useMemo(() => {
    const pool = applications.filter((item) => {
      const status = normalizeStatus(item.statut);
      return status !== "rejected" && status !== "accepted";
    });

    const source = pool.length > 0 ? pool : applications;

    return [...source]
      .sort((left, right) => {
        const leftStatus = normalizeStatus(left.statut);
        const rightStatus = normalizeStatus(right.statut);
        const leftPriority = leftStatus === "shortlisted" ? 4 : leftStatus === "interview_scheduled" ? 3 : leftStatus === "pending" ? 2 : 1;
        const rightPriority = rightStatus === "shortlisted" ? 4 : rightStatus === "interview_scheduled" ? 3 : rightStatus === "pending" ? 2 : 1;

        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority;
        }

        const scoreDiff = asNumber(right.score_test) - asNumber(left.score_test);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return new Date(right.date_postulation).getTime() - new Date(left.date_postulation).getTime();
      })
      .slice(0, 6);
  }, [applications]);

  const upcomingInterviews = useMemo(() => {
    return [...interviews]
      .filter((item) => isFutureInterview(item, referenceNow))
      .sort((left, right) => new Date(left.entretien.date_heure).getTime() - new Date(right.entretien.date_heure).getTime())
      .slice(0, 5);
  }, [interviews, referenceNow]);

  const interviewsThisWeek = useMemo(() => {
    const weekLimit = referenceNow + 7 * 24 * 60 * 60 * 1000;

    return interviews.filter((item) => {
      const date = new Date(item.entretien.date_heure).getTime();
      return Number.isFinite(date) && date >= referenceNow && date <= weekLimit && item.entretien.statut !== "annule";
    }).length;
  }, [interviews, referenceNow]);

  const pendingReviewCount = useMemo(() => {
    return applications.filter((item) => {
      const status = normalizeStatus(item.statut);
      return status === "pending" || status === "shortlisted";
    }).length;
  }, [applications]);

  const interviewsNeedingConfirmation = useMemo(() => {
    return interviews.filter((item) => isFutureInterview(item, referenceNow) && item.entretien.statut !== "confirme").length;
  }, [interviews, referenceNow]);

  const totalApplications = useMemo(() => {
    const fromStats = readStatValue(stats, ["candidatures", "applications"]);
    if (fromStats > 0) {
      return fromStats;
    }

    const pipelineTotal = pipeline.pending + pipeline.shortlisted + pipeline.interview + pipeline.accepted;
    return Math.max(applications.length, pipelineTotal);
  }, [applications.length, pipeline, stats]);

  const averageAiScore = useMemo(() => {
    const scoredApplications = applications
      .map((item) => asOptionalNumber(item.score_test))
      .filter((value): value is number => value !== null);

    if (scoredApplications.length > 0) {
      return Math.round(scoredApplications.reduce((sum, value) => sum + value, 0) / scoredApplications.length);
    }

    if (recommendedCandidates.length > 0) {
      const scores = recommendedCandidates.map((candidate, index) => scoreForApplication(candidate, index));
      return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    }

    return 0;
  }, [applications, recommendedCandidates]);

  const nextAction = useMemo(() => {
    if (recommendedCandidates.length > 0) {
      return {
        label: `Revoir ${recommendedCandidates[0].candidat.nom}`,
        description: "Priorisez le profil le plus proche de vos criteres et faites avancer le pipeline aujourd hui.",
        href: `/entreprise/candidatures?focus=${recommendedCandidates[0].id}`,
      };
    }

    if (activeOffers === 0) {
      return {
        label: "Creer une offre",
        description: "Aucune offre active ne nourrit le pipeline pour le moment.",
        href: "/entreprise/offres",
      };
    }

    if (upcomingInterviews.length > 0) {
      return {
        label: `Confirmer l entretien de ${upcomingInterviews[0].candidat?.nom || "ce candidat"}`,
        description: "Verifiez les details logistiques pour garder la semaine de recrutement fluide.",
        href: "/entreprise/entretiens",
      };
    }

    return {
      label: "Ouvrir l activite recente",
      description: "Passez en revue les derniers mouvements pour identifier la prochaine action utile.",
      href: "/notifications",
    };
  }, [activeOffers, recommendedCandidates, upcomingInterviews]);

  const offersNeedingAction = useMemo(() => {
    const offerMap = new Map<
      string,
      {
        title: string;
        pending: number;
        shortlisted: number;
        interviews: number;
        toConfirm: number;
      }
    >();

    const ensureEntry = (title?: string | null) => {
      const safeTitle = title?.trim() || "Offre";
      const current = offerMap.get(safeTitle);
      if (current) {
        return current;
      }

      const next = { title: safeTitle, pending: 0, shortlisted: 0, interviews: 0, toConfirm: 0 };
      offerMap.set(safeTitle, next);
      return next;
    };

    for (const application of applications) {
      const entry = ensureEntry(application.offre.titre);
      const status = normalizeStatus(application.statut);

      if (status === "shortlisted") {
        entry.shortlisted += 1;
      } else if (status === "interview_scheduled") {
        entry.interviews += 1;
      } else if (status !== "accepted" && status !== "rejected") {
        entry.pending += 1;
      }
    }

    for (const interview of upcomingInterviews) {
      const entry = ensureEntry(interview.offre?.titre);
      entry.interviews += 1;
      if (interview.entretien.statut !== "confirme") {
        entry.toConfirm += 1;
      }
    }

    return [...offerMap.values()]
      .filter((item) => item.pending > 0 || item.shortlisted > 0 || item.interviews > 0 || item.toConfirm > 0)
      .sort((left, right) => {
        const leftWeight = left.toConfirm * 4 + left.pending * 3 + left.shortlisted * 2 + left.interviews;
        const rightWeight = right.toConfirm * 4 + right.pending * 3 + right.shortlisted * 2 + right.interviews;
        return rightWeight - leftWeight;
      })
      .slice(0, 4)
      .map((item) => {
        const parts: string[] = [];
        if (item.pending > 0) parts.push(`${item.pending} a revoir`);
        if (item.shortlisted > 0) parts.push(`${item.shortlisted} en preselection`);
        if (item.toConfirm > 0) parts.push(`${item.toConfirm} entretien${item.toConfirm > 1 ? "s" : ""} a confirmer`);
        if (parts.length === 0 && item.interviews > 0) {
          parts.push(`${item.interviews} entretien${item.interviews > 1 ? "s" : ""} planifie${item.interviews > 1 ? "s" : ""}`);
        }

        return {
          title: item.title,
          summary: parts.join(" • "),
          href: "/entreprise/offres",
        };
      });
  }, [applications, upcomingInterviews]);

  const activityFeed = useMemo(() => {
    const events: Array<ActivityEvent & { timestamp: number }> = [];

    for (const notification of notifications) {
      const timestamp = new Date(notification.created_at || "").getTime();
      events.push({
        id: `notif-${notification.id}`,
        title: notification.titre || "Activite recente",
        description: notification.message || "Une mise a jour vient d etre enregistree dans votre espace recrutement.",
        timeLabel: getRelativeTimeFr(notification.created_at),
        dateValue: notification.created_at,
        tone: getActivityTone(notification.type),
        timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      });
    }

    for (const application of applications.slice(0, 6)) {
      const timestamp = new Date(application.date_postulation || "").getTime();
      const status = getCandidateStatusMeta(application.statut);
      events.push({
        id: `application-${application.id}`,
        title: status.label === "Preselection" ? "Candidat shortlist" : "Nouvelle candidature",
        description: `${application.candidat.nom} pour ${application.offre.titre}`,
        timeLabel: getRelativeTimeFr(application.date_postulation),
        dateValue: application.date_postulation,
        tone: "candidate",
        timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      });
    }

    for (const interview of interviews.slice(0, 4)) {
      const timestamp = new Date(interview.entretien.date_heure || "").getTime();
      events.push({
        id: `interview-${interview.entretien.id}`,
        title: interview.entretien.statut === "confirme" ? "Entretien confirme" : "Entretien planifie",
        description: `${interview.candidat?.nom || "Candidat"} pour ${interview.offre?.titre || "votre offre"}`,
        timeLabel: getRelativeTimeFr(interview.entretien.date_heure),
        dateValue: interview.entretien.date_heure,
        tone: "interview",
        timestamp: Number.isFinite(timestamp) ? timestamp : 0,
      });
    }

    return events
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 6)
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        timeLabel: event.timeLabel,
        dateValue: event.dateValue,
        tone: event.tone,
      }));
  }, [applications, interviews, notifications]);

  const headerLead = loadingWorkspace
    ? "Nous actualisons les profils, entretiens et activites en direct."
    : recommendedCandidates.length > 0
      ? `${pluralize(recommendedCandidates.length, "nouveau profil", "nouveaux profils")} correspondent a vos criteres.`
      : activeOffers > 0
        ? "Vos recrutements sont en cours. Priorisez les candidatures les plus pertinentes des maintenant."
        : "Publiez une premiere offre pour lancer un pipeline de recrutement cible.";

  const companyName = utilisateurNom?.trim() || "Entreprise";
  void formatInterviewDay;
  const greeting = new Date(referenceNow).getHours() < 12 ? "Bonjour" : new Date(referenceNow).getHours() < 18 ? "Bon apres-midi" : "Bonsoir";
  const todayInterviews = upcomingInterviews.filter((item) => {
    const interviewDate = new Date(item.entretien.date_heure);
    const today = new Date(referenceNow);
    return (
      !Number.isNaN(interviewDate.getTime()) &&
      interviewDate.getFullYear() === today.getFullYear() &&
      interviewDate.getMonth() === today.getMonth() &&
      interviewDate.getDate() === today.getDate()
    );
  });

  void totalApplications;
  void interviewsThisWeek;

  const inclusionScore = Math.max(0, Math.min(100, averageAiScore || (recommendedCandidates.length > 0 ? 68 : 0)));
  const pipelineScore = totalApplications > 0 ? Math.round(((pipeline.shortlisted + pipeline.interview + pipeline.accepted) / totalApplications) * 100) : 0;
  const satisfactionScore =
    upcomingInterviews.length > 0
      ? Math.max(62, Math.min(96, Math.round(((upcomingInterviews.length - interviewsNeedingConfirmation) / upcomingInterviews.length) * 100)))
      : 91;
  const discoverLabel =
    recommendedCandidates.length > 0
      ? `${pluralize(recommendedCandidates.length, "nouveau candidat", "nouveaux candidats")}`
      : activeOffers > 0
        ? `${pluralize(activeOffers, "offre active", "offres actives")}`
        : "Lancer votre recrutement";
  const discoverHref = recommendedCandidates.length > 0 ? "/entreprise/candidatures" : "/entreprise/offres";
  const headlineName = companyName.includes("RH") ? companyName : `${companyName} RH`;
  const scoreCards = [
    {
      label: "IA Shortlisting",
      value: Math.max(0, Math.min(100, inclusionScore)),
      hint: recommendedCandidates.length > 0 ? `+${Math.max(6, recommendedCandidates.length * 2)}% ce mois-ci` : "Actif",
    },
    {
      label: "Pipeline",
      value: Math.max(0, Math.min(100, pipelineScore)),
      hint: pendingReviewCount > 0 ? `${pendingReviewCount} a revoir` : "En cours",
    },
    {
      label: "Satisfaction candidats",
      value: Math.max(0, Math.min(100, satisfactionScore)),
      hint: todayInterviews.length > 0 ? `${todayInterviews.length} entretien${todayInterviews.length > 1 ? "s" : ""} aujourd'hui` : "Stable",
    },
  ];

  if (loadingStats) {
    return <LoadingState title="Chargement de votre espace recrutement" description="Nous preparons vos priorites, candidats et entretiens." />;
  }

  return (
    <section className="enterprise-ops" aria-label={`Accueil recrutement ${companyName}`}>
      <header className="ops-hero">
        <div className="ops-hero-toolbar">
          <div className="ops-hero-search">
            <Search size={15} />
            <span>Rechercher...</span>
            <MoveRight size={14} />
          </div>
          <button type="button" className="ops-toolbar-chip" aria-label="Outils IA">
            <Sparkles size={15} />
            <span className="ops-toolbar-badge">2</span>
          </button>
          <ButtonLink href="/entreprise/offres" size="lg" className="hero-primary-action">
            <Plus size={16} /> Publier une offre
          </ButtonLink>
        </div>

        <div className="ops-hero-grid">
          <div className="ops-hero-copy">
            <span className="section-kicker">Cockpit recrutement</span>
            <h1>
              {greeting},
              <span>{headlineName}</span>
            </h1>
            <div className="ops-hero-wave" aria-hidden="true">👋</div>
            <p>{headerLead}</p>

            <div className="ops-priority-card">
              <span className="focus-kicker">A traiter aujourd hui</span>
              <strong>{nextAction.label}</strong>
              <p>{nextAction.description}</p>
              <div className="ops-priority-tags">
                {pendingReviewCount > 0 ? <span className="ops-priority-pill">{pendingReviewCount} a revoir</span> : null}
                {todayInterviews.length > 0 ? <span className="ops-priority-pill">{todayInterviews.length} entretien{todayInterviews.length > 1 ? "s" : ""} aujourd hui</span> : null}
                {interviewsNeedingConfirmation > 0 ? <span className="ops-priority-pill">{interviewsNeedingConfirmation} confirmation{interviewsNeedingConfirmation > 1 ? "s" : ""}</span> : null}
              </div>
            </div>

            <div className="ops-hero-actions">
              <ButtonLink href={discoverHref} size="lg" className="hero-discover">
                <div className="hero-discover-copy">
                  <strong>Decouvrir</strong>
                  <span>{discoverLabel}</span>
                </div>
                <ArrowRight size={18} />
              </ButtonLink>
            </div>
          </div>

          <div className="ops-hero-visual" aria-hidden="true">
            <div className="orbital-shell">
              <div className="orbital-ring orbital-ring-outer" />
              <div className="orbital-ring orbital-ring-mid" />
              <div className="orbital-ring orbital-ring-inner" />
              <div className="orbital-core">
                <small>Score d&apos;inclusion</small>
                <strong>{inclusionScore}%</strong>
                <span>+{Math.max(6, recommendedCandidates.length * 2)}% ce mois-ci</span>
              </div>
              <div className="floating-tag floating-tag-top">
                <WandSparkles size={14} />
                <div>
                  <strong>Diversite</strong>
                  <span>{Math.max(52, pipelineScore)}%</span>
                </div>
              </div>
              <div className="floating-tag floating-tag-bottom">
                <CircleCheckBig size={14} />
                <div>
                  <strong>Impact</strong>
                  <span>Eleve</span>
                </div>
              </div>
            </div>

            <aside className="hero-analytics-panel">
              <span className="focus-kicker">Vue impact</span>
              {scoreCards.map((card) => (
                <article className="hero-score-card" key={card.label}>
                  <div className="hero-score-head">
                    <div className="hero-score-chip">
                      {card.label === "Pipeline" ? <BriefcaseBusiness size={14} /> : <Sparkles size={14} />}
                    </div>
                    <div className="hero-score-copy">
                      <strong>{card.label}</strong>
                      <span>{card.hint}</span>
                    </div>
                    <b>{card.value}%</b>
                  </div>
                  <div className="hero-score-track">
                    <span style={{ width: `${card.value}%` }} />
                  </div>
                </article>
              ))}

              <Link href="/entreprise/reports-requests" className="hero-report-link">
                Voir le rapport complet <ArrowRight size={16} />
              </Link>
            </aside>
          </div>
        </div>
      </header>

      <div className="ops-backdrop" aria-hidden="true" />

      {erreurStats ? <p className="ops-notice ops-notice-warning">{erreurStats}</p> : null}
      {workspaceNotice ? <p className="ops-notice">{workspaceNotice}</p> : null}

      <section className="ops-section ops-section-pipeline">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Pipeline recrutement</span>
            <h2>Suivi des candidatures par etape</h2>
          </div>
        </div>

        <div className="pipeline-shell" aria-label="Etat du pipeline recrutement">
          {[
            { label: "En attente", value: pipeline.pending, tone: "pending" },
            { label: "Preselection", value: pipeline.shortlisted, tone: "shortlisted" },
            { label: "Entretien", value: pipeline.interview, tone: "interview" },
            { label: "Accepte", value: pipeline.accepted, tone: "accepted" },
          ].map((step, index) => (
            <div className="pipeline-step" key={step.label}>
              <span className={`pipeline-dot pipeline-dot-${step.tone}`} />
              <div>
                <small>{step.label}</small>
                <strong>{step.value}</strong>
              </div>
              {index < 3 ? <span className="pipeline-arrow" aria-hidden="true">?</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="ops-grid-two">
        <section className="ops-section ops-section-compact">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Candidats prioritaires</span>
              <h2>Profils a faire avancer</h2>
            </div>
            <Link href="/entreprise/candidatures" className="section-link">
              Voir toute la file <ArrowRight size={16} />
            </Link>
          </div>

          {recommendedCandidates.length > 0 ? (
            <div className="candidate-strip" role="list" aria-label="Candidats prioritaires">
              {recommendedCandidates.map((candidate, index) => {
                const score = scoreForApplication(candidate, index);
                const status = getCandidateStatusMeta(candidate.statut);
                const location = candidate.candidat.localisation || candidate.candidat.region || candidate.offre.localisation || "Localisation a confirmer";
                const skills = candidate.candidat.competences?.slice(0, 3) || [];

                return (
                  <article className="candidate-row" key={candidate.id} role="listitem">
                    <div className="candidate-identity">
                      <span className="candidate-avatar">{initials(candidate.candidat.nom)}</span>
                      <div className="candidate-copy">
                        <div className="candidate-header-line">
                          <h3>{candidate.candidat.nom}</h3>
                          <span className="match-pill">{score}% Match</span>
                          <span className={`status-pill status-pill-${status.tone}`}>{status.label}</span>
                        </div>
                        <p>{candidate.offre.titre}</p>
                      </div>
                    </div>

                    <div className="candidate-meta">
                      <div>
                        <span>Competences</span>
                        <strong>{skills.length > 0 ? skills.join(" • ") : "Profil en cours d enrichissement"}</strong>
                      </div>
                      <div>
                        <span>Localisation</span>
                        <strong>{location}</strong>
                      </div>
                    </div>

                    <div className="candidate-actions">
                      <ButtonLink href={`/entreprise/candidatures?focus=${candidate.id}`} variant="secondary" size="sm">
                        Voir profil
                      </ButtonLink>
                      <ButtonLink href={`/entreprise/entretiens?planifier=${candidate.id}`} size="sm">
                        Planifier
                      </ButtonLink>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-inline">
              <strong>Aucun candidat prioritaire pour le moment.</strong>
              <p>Ouvrez vos candidatures pour lancer la prochaine vague de revue.</p>
            </div>
          )}
        </section>

        <section className="ops-section ops-section-compact">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Aujourdhui</span>
              <h2>Entretiens du jour</h2>
            </div>
            <Link href="/entreprise/entretiens" className="section-link">
              Ouvrir le planning <ArrowRight size={16} />
            </Link>
          </div>

          {todayInterviews.length > 0 ? (
            <div className="timeline-table" role="list" aria-label="Entretiens du jour">
              {todayInterviews.map((item) => {
                const status = getInterviewStatusMeta(item.entretien.statut);
                return (
                  <article className="timeline-row" key={item.entretien.id} role="listitem">
                    <div className="timeline-primary">
                      <strong>{item.candidat?.nom || "Candidat"}</strong>
                      <span>{item.offre?.titre || "Offre"}</span>
                    </div>
                    <div className="timeline-date">
                      <span>Heure</span>
                      <strong>{formatInterviewTime(item.entretien.date_heure)}</strong>
                    </div>
                    <div className="timeline-type">
                      <span>Format</span>
                      <strong>{item.entretien.type}</strong>
                    </div>
                    <span className={`status-pill status-pill-${status.tone}`}>{status.label}</span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-inline">
              <strong>Aucun entretien aujourd hui.</strong>
              <p>Le planning du jour est libre pour avancer sur les candidatures prioritaires.</p>
            </div>
          )}
        </section>
      </section>

      <section className="ops-grid-two">
        <section className="ops-section ops-section-compact">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Activite recente</span>
              <h2>Ce qui sest passe recemment</h2>
            </div>
            <Link href="/notifications" className="section-link">
              Tout afficher <ArrowRight size={16} />
            </Link>
          </div>

          {activityFeed.length > 0 ? (
            <div className="activity-feed" role="list" aria-label="Activite recente">
              {activityFeed.map((event) => (
                <article className="activity-item" key={event.id} role="listitem">
                  <span className={`activity-dot activity-dot-${event.tone}`} aria-hidden="true" />
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.description}</p>
                  </div>
                  <time dateTime={event.dateValue}>{event.timeLabel}</time>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <strong>Aucune activite recente.</strong>
              <p>Les nouveaux evenements du recrutement apparaitront ici.</p>
            </div>
          )}
        </section>

        <section className="ops-section ops-section-compact">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Actions rapides</span>
              <h2>Que faire ensuite</h2>
            </div>
            <Link href={nextAction.href} className="section-link">
              Aller a la priorite <ArrowRight size={16} />
            </Link>
          </div>

          {offersNeedingAction.length > 0 ? (
            <div className="action-offer-list" role="list" aria-label="Actions rapides recrutement">
              {offersNeedingAction.map((offer) => (
                <article className="action-offer-row" key={offer.title} role="listitem">
                  <div className="action-offer-copy">
                    <span className="focus-kicker">Offre a suivre</span>
                    <strong>{offer.title}</strong>
                    <p>{offer.summary}</p>
                  </div>
                  <Link href={offer.href} className="section-link">
                    Ouvrir <ArrowRight size={16} />
                  </Link>
                </article>
              ))}

              <article className="action-offer-row action-offer-row-focus" role="listitem">
                <div className="action-offer-copy">
                  <span className="focus-kicker">Prochaine action</span>
                  <strong>{nextAction.label}</strong>
                  <p>{nextAction.description}</p>
                </div>
                <Link href={nextAction.href} className="section-link">
                  Traiter <ArrowRight size={16} />
                </Link>
              </article>
            </div>
          ) : (
            <div className="empty-inline">
              <strong>Aucune action urgente pour le moment.</strong>
              <p>Vos offres actives sont a jour pour le moment.</p>
            </div>
          )}
        </section>
      </section>

      <style jsx>{`
        .enterprise-ops {
          --ht-purple: #4a154b;
          --ht-purple-bright: #7d3f8b;
          --ht-plum-deep: #291032;
          --ht-ink: #231628;
          --ht-muted: #6f6272;
          --ht-line: rgba(74, 21, 75, 0.12);
          --ht-surface: rgba(255, 255, 255, 0.82);
          position: relative;
          display: grid;
          gap: 18px;
          padding: 8px 4px 24px;
          color: var(--ht-ink);
        }

        .ops-backdrop {
          position: absolute;
          inset: -12px -24px auto;
          height: 220px;
          border-radius: 32px;
          background:
            radial-gradient(circle at top left, rgba(123, 44, 191, 0.12), transparent 34%),
            radial-gradient(circle at 82% 12%, rgba(74, 21, 75, 0.12), transparent 30%),
            linear-gradient(180deg, rgba(248, 242, 250, 0.95), rgba(248, 242, 250, 0));
          pointer-events: none;
          z-index: 0;
        }

        .ops-hero,
        .ops-kpi-grid,
        .ops-section,
        .ops-grid-two,
        .ops-notice {
          position: relative;
          z-index: 1;
        }

        .ops-hero,
        .ops-section,
        .ops-kpi-card,
        .ops-priority-card {
          border: 1px solid var(--ht-line);
          background: var(--ht-surface);
          backdrop-filter: blur(18px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .ops-hero {
          display: grid;
          gap: 28px;
          padding: 26px 28px 24px;
          border-radius: 34px;
          overflow: hidden;
          background:
            radial-gradient(circle at 32% 18%, rgba(166, 124, 255, 0.22), transparent 26%),
            radial-gradient(circle at 67% 28%, rgba(255, 255, 255, 0.92), transparent 32%),
            linear-gradient(180deg, rgba(251, 247, 255, 0.96), rgba(255, 255, 255, 0.96));
        }

        .ops-hero-toolbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
        }

        .ops-hero-search {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: min(100%, 320px);
          min-height: 40px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(74, 21, 75, 0.08);
          color: #8d8091;
          font-size: 14px;
        }

        .ops-hero-search span {
          flex: 1 1 auto;
        }

        .ops-toolbar-chip {
          position: relative;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.94);
          color: var(--ht-purple);
          display: inline-grid;
          place-items: center;
        }

        .ops-toolbar-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #ff476f;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }

        .ops-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
          align-items: center;
          gap: 28px;
        }

        .ops-hero-copy {
          min-width: 0;
          display: grid;
          align-content: center;
          gap: 14px;
          padding: 20px 0 8px;
        }

        .ops-hero-copy h1 {
          margin: 0;
          font-size: clamp(46px, 5vw, 66px);
          line-height: 1.04;
          letter-spacing: -0.04em;
          max-width: 9ch;
        }

        .ops-hero-copy h1 span {
          display: block;
          color: var(--ht-purple-bright);
        }

        .ops-hero-wave {
          font-size: 40px;
          line-height: 1;
        }

        .ops-hero-copy p {
          margin: 0;
          font-size: 15px;
          line-height: 1.65;
          color: var(--ht-muted);
          max-width: 38ch;
        }

        .ops-priority-card {
          display: grid;
          gap: 10px;
          width: min(100%, 420px);
          padding: 16px 18px;
          border-radius: 22px;
          border: 1px solid var(--ht-line);
          background: rgba(255, 255, 255, 0.62);
          backdrop-filter: blur(14px);
        }

        .section-kicker,
        .focus-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          line-height: 1;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(74, 21, 75, 0.62);
        }

        .ops-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-discover {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          min-width: min(100%, 300px);
          min-height: 76px;
          padding: 0 22px;
          border-radius: 24px;
          background: linear-gradient(135deg, #4a154b, #6a2d73);
          color: #fff;
          border-color: transparent;
        }

        .hero-discover-copy {
          display: grid;
          gap: 5px;
          text-align: left;
        }

        .hero-discover-copy strong {
          font-size: 22px;
          line-height: 1;
        }

        .hero-discover-copy span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.76);
        }

        .ops-priority-card strong {
          font-size: 16px;
          line-height: 1.35;
          color: var(--ht-ink);
        }

        .ops-priority-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--ht-muted);
        }

        .ops-priority-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ops-priority-pill {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(74, 21, 75, 0.1);
          background: rgba(74, 21, 75, 0.05);
          color: var(--ht-purple);
          font-size: 13px;
          font-weight: 600;
        }

        :global(.hero-primary-action) {
          background: #4a154b;
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(91, 61, 245, 0.1);
        }

        .ops-hero-visual {
          position: relative;
          min-height: 460px;
          display: grid;
          align-items: center;
        }

        .orbital-shell {
          position: absolute;
          inset: 26px 160px 42px 34px;
          display: grid;
          place-items: center;
        }

        .orbital-shell::before {
          content: "";
          position: absolute;
          inset: 18px;
          border-radius: 999px;
          border: 1px dashed rgba(96, 63, 149, 0.18);
        }

        .orbital-ring {
          position: absolute;
          border-radius: 999px;
          mix-blend-mode: multiply;
        }

        .orbital-ring-outer {
          width: 230px;
          height: 230px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.88), rgba(208, 126, 165, 0.78) 58%, rgba(90, 26, 109, 0.9));
          transform: translateX(-24px);
        }

        .orbital-ring-mid {
          width: 186px;
          height: 186px;
          background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(224, 198, 231, 0.74) 55%, rgba(128, 66, 138, 0.92));
          transform: translate(34px, 6px);
        }

        .orbital-ring-inner {
          width: 142px;
          height: 142px;
          background: radial-gradient(circle at 48% 40%, #ffffff 0, #fff 62%, rgba(255, 255, 255, 0.8) 100%);
          box-shadow: 0 12px 40px rgba(84, 41, 101, 0.08);
        }

        .orbital-core {
          position: relative;
          z-index: 2;
          display: grid;
          justify-items: center;
          gap: 4px;
          width: 142px;
          text-align: center;
        }

        .orbital-core small {
          font-size: 11px;
          color: #7f7191;
        }

        .orbital-core strong {
          font-size: 54px;
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .orbital-core span {
          font-size: 13px;
          font-weight: 700;
          color: #0b8d58;
        }

        .floating-tag {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(74, 21, 75, 0.08);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          color: var(--ht-purple);
        }

        .floating-tag strong,
        .floating-tag span {
          display: block;
          line-height: 1.2;
        }

        .floating-tag strong {
          font-size: 12px;
          color: var(--ht-ink);
        }

        .floating-tag span {
          margin-top: 4px;
          font-size: 11px;
          color: var(--ht-muted);
        }

        .floating-tag-top {
          left: 14px;
          bottom: 58px;
        }

        .floating-tag-bottom {
          right: 116px;
          bottom: 26px;
        }

        .hero-analytics-panel {
          position: absolute;
          right: 6px;
          top: 18px;
          bottom: 18px;
          width: 340px;
          padding: 24px 22px;
          border-radius: 28px;
          background: linear-gradient(180deg, #2d1236, #1f0d2a);
          color: #fff;
          display: grid;
          align-content: start;
          gap: 18px;
          box-shadow: 0 20px 50px rgba(29, 11, 38, 0.14);
        }

        .hero-analytics-panel .focus-kicker {
          color: rgba(255, 255, 255, 0.54);
        }

        .hero-score-card {
          display: grid;
          gap: 10px;
        }

        .hero-score-head {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
        }

        .hero-score-chip {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.09);
          color: #d8c7ff;
        }

        .hero-score-copy strong,
        .hero-score-copy span {
          display: block;
        }

        .hero-score-copy strong {
          font-size: 14px;
          line-height: 1.25;
        }

        .hero-score-copy span {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .hero-score-head b {
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .hero-score-track {
          height: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .hero-score-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #ffd46b, #f1b83f);
        }

        .hero-report-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .ops-notice {
          margin: 0;
          padding: 12px 16px;
          border-radius: 18px;
          border: 1px solid rgba(74, 21, 75, 0.14);
          background: rgba(255, 255, 255, 0.76);
          color: var(--ht-muted);
          font-size: 14px;
        }

        .ops-notice-warning {
          color: #7a2835;
          border-color: rgba(161, 66, 83, 0.18);
          background: rgba(255, 244, 246, 0.92);
        }

        .ops-kpi-grid {
          display: none;
        }

        .ops-kpi-card {
          display: grid;
          gap: 10px;
          padding: 18px 20px;
          border-radius: 24px;
        }

        .ops-kpi-label {
          font-size: 12px;
          line-height: 1.2;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ht-muted);
        }

        .ops-kpi-card strong {
          font-size: 30px;
          line-height: 1;
          color: var(--ht-ink);
        }

        .ops-kpi-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--ht-muted);
        }

        .ops-section {
          padding: 22px;
          border-radius: 28px;
        }

        .ops-section-pipeline {
          padding-top: 20px;
        }

        .ops-section-compact {
          min-height: 100%;
        }

        .ops-grid-two {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
          gap: 20px;
        }

        .section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .section-heading h2 {
          margin: 8px 0 0;
          font-size: 22px;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }

        .section-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--ht-purple);
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .pipeline-shell {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .pipeline-step {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 14px;
          padding: 20px;
          border-radius: 22px;
          border: 1px solid var(--ht-line);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(247, 241, 249, 0.85));
        }

        .pipeline-step small,
        .candidate-meta span,
        .timeline-row span {
          display: block;
          font-size: 12px;
          line-height: 1.2;
          color: var(--ht-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pipeline-step strong {
          display: block;
          margin-top: 8px;
          font-size: 28px;
          line-height: 1;
          color: var(--ht-ink);
        }

        .pipeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          flex: none;
        }

        .pipeline-dot-pending {
          background: #b56ad9;
        }

        .pipeline-dot-shortlisted {
          background: #7b2cbf;
        }

        .pipeline-dot-interview {
          background: #5f1f88;
        }

        .pipeline-dot-accepted {
          background: #245837;
        }

        .pipeline-arrow {
          color: rgba(74, 21, 75, 0.34);
          font-size: 20px;
        }

        .candidate-strip,
        .timeline-table,
        .activity-feed,
        .action-offer-list {
          display: grid;
          gap: 12px;
        }

        .candidate-row,
        .timeline-row,
        .activity-item,
        .action-offer-row {
          display: grid;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-top: 1px solid var(--ht-line);
        }

        .candidate-row:first-child,
        .timeline-row:first-child,
        .activity-item:first-child,
        .action-offer-row:first-child {
          border-top: none;
          padding-top: 0;
        }

        .candidate-row {
          grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 0.9fr) auto;
        }

        .candidate-identity {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .candidate-avatar {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          flex: none;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(74, 21, 75, 0.92), rgba(123, 44, 191, 0.88));
          color: #fff;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .candidate-copy {
          min-width: 0;
        }

        .candidate-copy p,
        .activity-item p,
        .action-offer-copy p,
        .empty-inline p {
          margin: 4px 0 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--ht-muted);
        }

        .candidate-header-line {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .candidate-header-line h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.2;
        }

        .match-pill,
        .status-pill {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .match-pill {
          background: rgba(74, 21, 75, 0.08);
          color: var(--ht-purple);
        }

        .status-pill-pending,
        .status-pill-scheduled,
        .status-pill-rescheduled {
          background: rgba(123, 44, 191, 0.08);
          color: #69308b;
          border-color: rgba(123, 44, 191, 0.12);
        }

        .status-pill-shortlisted,
        .status-pill-confirmed,
        .status-pill-interview {
          background: rgba(74, 21, 75, 0.08);
          color: var(--ht-purple);
          border-color: rgba(74, 21, 75, 0.1);
        }

        .status-pill-accepted,
        .status-pill-completed {
          background: rgba(74, 133, 93, 0.1);
          color: #245837;
          border-color: rgba(74, 133, 93, 0.14);
        }

        .status-pill-rejected,
        .status-pill-cancelled {
          background: rgba(160, 70, 90, 0.1);
          color: #8a3040;
          border-color: rgba(160, 70, 90, 0.14);
        }

        .candidate-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .candidate-meta strong,
        .timeline-primary strong,
        .timeline-date strong,
        .timeline-type strong,
        .activity-item strong,
        .action-offer-copy strong,
        .empty-inline strong {
          display: block;
          margin-top: 6px;
          font-size: 14px;
          line-height: 1.45;
          color: var(--ht-ink);
        }

        .candidate-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .candidate-actions :global(.ui-button) {
          min-width: 126px;
        }

        .timeline-row {
          grid-template-columns: minmax(0, 1.2fr) auto auto auto;
        }

        .activity-item {
          grid-template-columns: auto minmax(0, 1fr) auto;
        }

        .activity-dot {
          width: 11px;
          height: 11px;
          margin-top: 2px;
          border-radius: 999px;
          box-shadow: 0 0 0 6px rgba(74, 21, 75, 0.05);
        }

        .activity-dot-candidate {
          background: #7b2cbf;
        }

        .activity-dot-interview {
          background: #4a154b;
        }

        .activity-dot-offer {
          background: #5b2d72;
        }

        .activity-dot-default {
          background: #9e85a9;
        }

        .activity-item time {
          font-size: 13px;
          color: var(--ht-muted);
          white-space: nowrap;
        }

        .action-offer-row {
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .action-offer-row-focus {
          padding-top: 16px;
        }

        .empty-inline {
          display: grid;
          gap: 8px;
          justify-items: start;
          padding: 8px 0 2px;
        }

        @media (max-width: 1180px) {
          .ops-kpi-grid,
          .ops-grid-two,
          .candidate-row {
            grid-template-columns: 1fr;
          }

          .ops-hero-grid {
            grid-template-columns: 1fr;
          }

          .ops-hero-visual {
            min-height: 640px;
          }

          .orbital-shell {
            inset: 14px 40px 220px 40px;
          }

          .hero-analytics-panel {
            position: absolute;
            left: 36px;
            right: 36px;
            bottom: 16px;
            top: auto;
            width: auto;
          }

          .candidate-actions {
            justify-content: flex-start;
          }

          .candidate-meta,
          .timeline-row,
          .pipeline-shell {
            grid-template-columns: 1fr 1fr;
          }

          .pipeline-step:nth-child(3) {
            border-left: none;
            border-top: 1px solid var(--ht-line);
          }

          .pipeline-step:nth-child(4) {
            border-top: 1px solid var(--ht-line);
          }
        }

        @media (max-width: 760px) {
          .enterprise-ops {
            gap: 16px;
            padding-bottom: 20px;
          }

          .ops-hero,
          .ops-section,
          .ops-kpi-card,
          .ops-priority-card {
            padding: 18px;
            border-radius: 24px;
          }

          .ops-hero-toolbar {
            justify-content: stretch;
            flex-wrap: wrap;
          }

          .ops-hero-search {
            min-width: 0;
            width: 100%;
          }

          .ops-hero-copy h1 {
            font-size: 40px;
          }

          .hero-discover {
            width: 100%;
            min-width: 0;
          }

          .ops-hero-visual {
            min-height: 540px;
          }

          .orbital-shell {
            inset: 8px 18px 210px;
          }

          .floating-tag-top {
            left: 0;
            bottom: 48px;
          }

          .floating-tag-bottom {
            right: 28px;
            bottom: 12px;
          }

          .hero-analytics-panel {
            left: 18px;
            right: 18px;
            padding: 18px;
          }

          .section-heading {
            align-items: start;
            flex-direction: column;
          }

          .candidate-meta,
          .timeline-row,
          .activity-item,
          .action-offer-row,
          .pipeline-shell {
            grid-template-columns: 1fr;
          }

          .pipeline-step + .pipeline-step {
            border-left: none;
            border-top: 1px solid var(--ht-line);
          }

          .pipeline-arrow {
            display: none;
          }

          .ops-header-actions,
          .candidate-actions {
            width: 100%;
          }

          .ops-header-actions :global(.ui-button),
          .candidate-actions :global(.ui-button) {
            width: 100%;
            justify-content: center;
          }

          .activity-item time {
            white-space: normal;
          }
        }
      `}</style>
    </section>
  );
}

