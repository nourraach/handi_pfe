"use client";

import { useEffect, useEffectEvent, useMemo, useState, type SVGProps } from "react";
import { useI18n } from "@/components/i18n-provider";
import { RouteProtegee } from "@/components/route-protegee";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type CandidatureStatut = "pending" | "shortlisted" | "interview_scheduled" | "rejected" | "accepted";
type CandidatureUiStatut = "in_progress" | "shortlist" | "accepted" | "rejected";
type FiltreStatut = "all" | CandidatureUiStatut;

type Candidature = {
  id: string;
  offre: {
    id?: string;
    titre: string;
    localisation: string;
    type_poste: string;
  };
  entreprise: {
    nom: string;
  };
  date_postulation: string;
  statut: CandidatureStatut;
  uiStatut: CandidatureUiStatut;
  motif_refus?: string | null;
  score_test?: number | null;
};

type CandidatureApiSource = {
  id?: string;
  date_postulation?: string;
  statut?: string;
  motif_refus?: string | null;
  score_test?: number | null;
};

type CandidatureApiItem = CandidatureApiSource & {
  candidature?: CandidatureApiSource;
  offre?: {
    id?: string;
    titre?: string;
    localisation?: string;
    type_poste?: string;
  };
  entreprise?: {
    nom?: string;
  };
};

type CandidaturesPayload = {
  message?: string;
  donnees?: CandidatureApiItem[];
};

type PageCopy = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  allStatuses: string;
  tabs: Record<FiltreStatut, string>;
  appliedOn: string;
  viewDetails: string;
  timeline: {
    candidature: string;
    revue: string;
    entretien: string;
    decision: string;
  };
  emptyTitle: string;
  emptyText: string;
  resetFilters: string;
  loadingTitle: string;
  loadingText: string;
  errorFallback: string;
  previousPage: string;
  nextPage: string;
  rejectionReason: string;
  aiScore: string;
};

const PAGE_SIZE = 12;
const PRIMARY = "#35063E";

const STATUS_COLORS: Record<CandidatureUiStatut, { fill: string; soft: string; text: string }> = {
  in_progress: {
    fill: "#f5a302",
    soft: "#fff3db",
    text: "#8a4f00",
  },
  shortlist: {
    fill: "#7c3aed",
    soft: "#f1eafe",
    text: "#4c1d95",
  },
  accepted: {
    fill: "#15803d",
    soft: "#dcfce7",
    text: "#166534",
  },
  rejected: {
    fill: "#dc2626",
    soft: "#fee2e2",
    text: "#991b1b",
  },
};

const COPY: Record<"fr" | "en" | "ar", PageCopy> = {
  fr: {
    title: "Mes candidatures",
    subtitle: "Suivez l'etat de toutes vos candidatures en un coup d'oeil.",
    searchPlaceholder: "Rechercher par poste ou entreprise...",
    allStatuses: "Tous les statuts",
    tabs: {
      all: "Tous",
      in_progress: "En cours",
      shortlist: "Shortlist",
      accepted: "Acceptees",
      rejected: "Refusees",
    },
    appliedOn: "Candidature envoyee le",
    viewDetails: "Voir details",
    timeline: {
      candidature: "Candidature",
      revue: "Revue",
      entretien: "Entretien",
      decision: "Decision",
    },
    emptyTitle: "Vous n'avez pas encore postule",
    emptyText: "Explorez les offres et envoyez votre premiere candidature.",
    resetFilters: "Reinitialiser",
    loadingTitle: "Chargement de vos candidatures",
    loadingText: "Nous preparons votre liste.",
    errorFallback: "Impossible de charger vos candidatures.",
    previousPage: "Precedent",
    nextPage: "Suivant",
    rejectionReason: "Motif automatique",
    aiScore: "Score IA",
  },
  en: {
    title: "My applications",
    subtitle: "Track all your applications at a glance.",
    searchPlaceholder: "Search by role or company...",
    allStatuses: "All statuses",
    tabs: {
      all: "All",
      in_progress: "In progress",
      shortlist: "Shortlist",
      accepted: "Accepted",
      rejected: "Rejected",
    },
    appliedOn: "Applied on",
    viewDetails: "View details",
    timeline: {
      candidature: "Application",
      revue: "Review",
      entretien: "Interview",
      decision: "Decision",
    },
    emptyTitle: "You have not applied yet",
    emptyText: "Start by exploring roles and sending your first application.",
    resetFilters: "Reset",
    loadingTitle: "Loading your applications",
    loadingText: "Preparing your list.",
    errorFallback: "Unable to load your applications.",
    previousPage: "Previous",
    nextPage: "Next",
    rejectionReason: "Automatic reason",
    aiScore: "AI score",
  },
  ar: {
    title: "Tarashohati",
    subtitle: "Tabee halat kol tarashoh besor3a.",
    searchPlaceholder: "Ib7ath 3an mansib aw charika...",
    allStatuses: "Kol al halat",
    tabs: {
      all: "Kol",
      in_progress: "Qayd al moraaja3a",
      shortlist: "Shortlist",
      accepted: "Maqboul",
      rejected: "Marfoud",
    },
    appliedOn: "Tam al tarashoh fi",
    viewDetails: "3ard tafasil",
    timeline: {
      candidature: "Tarashoh",
      revue: "Moraaja3a",
      entretien: "Moqabala",
      decision: "Qarar",
    },
    emptyTitle: "Mazelt ma qadamtch",
    emptyText: "Ibda b talfi9 foras jdod w qadem awel tarashoh.",
    resetFilters: "I3adat dabt",
    loadingTitle: "Jari tahmil tarashohatik",
    loadingText: "Nohader al qaeima.",
    errorFallback: "Ta3athar tahmil tarashohatik.",
    previousPage: "Sabeq",
    nextPage: "Tali",
    rejectionReason: "Sabab arrafd",
    aiScore: "Darejat al dhaka",
  },
} as const;

const applicationsPageStyles = `
  .applications-hub-shell {
    display: grid;
    gap: 20px;
    padding: 24px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #ece8f4;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .applications-hub-titleblock {
    display: grid;
    gap: 8px;
  }

  .applications-hub-title {
    margin: 0;
    color: ${PRIMARY};
    font-size: clamp(2rem, 3vw, 3rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    font-family: var(--app-heading);
  }

  .applications-hub-subtitle {
    margin: 0;
    color: #504168;
    font-size: 1rem;
  }

  .applications-hub-controls {
    display: grid;
    gap: 14px;
    padding: 16px !important;
    border-radius: 16px;
    border: 1px solid #ece8f4;
  }

  .applications-hub-searchbox {
    position: relative;
  }

  .applications-hub-searchicon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: #6f5a90;
    pointer-events: none;
  }

  .applications-hub-searchinput {
    width: 100%;
    min-height: 52px;
    border-radius: 14px;
    border: 1px solid #ddd4ee;
    padding: 0 14px 0 44px;
    color: #1f1231;
    background: #ffffff;
    font: inherit;
    font-size: 1rem;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .applications-hub-searchinput:focus-visible {
    outline: none;
    border-color: #d8caf6;
    box-shadow: var(--ring-focus, 0 0 0 3px #d8caf6);
  }

  .applications-hub-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .applications-hub-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid #ddd4ee;
    border-radius: 12px;
    background: #ffffff;
    color: #3a2955;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
  }

  .applications-hub-tabdot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    margin-right: 8px;
    background: #cfc5e4;
  }

  .applications-hub-tabdot-inprogress {
    background: #f5a302;
  }

  .applications-hub-tabdot-shortlist {
    background: #7c3aed;
  }

  .applications-hub-tabdot-accepted {
    background: #16a34a;
  }

  .applications-hub-tabdot-rejected {
    background: #ef4444;
  }

  .applications-hub-tab:focus-visible {
    outline: none;
    box-shadow: var(--ring-focus, 0 0 0 3px #d8caf6);
  }

  .applications-hub-tab-active {
    background: ${PRIMARY};
    color: #ffffff;
    border-color: ${PRIMARY};
  }

  .applications-hub-tabcount {
    margin-left: 6px;
    opacity: 0.9;
  }

  .applications-hub-feedback {
    margin: 0;
  }

  .applications-hub-list {
    display: grid;
    gap: 14px;
  }

  .applications-hub-card {
    display: grid;
    grid-template-columns: minmax(240px, 1.1fr) minmax(260px, 1fr) auto;
    gap: 14px 20px;
    align-items: start;
    padding: 20px !important;
    border-radius: 16px;
    border: 1px solid #ece8f4;
    box-shadow: 0 1px 3px rgba(20, 17, 26, 0.06), 0 1px 2px rgba(20, 17, 26, 0.04);
    transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
  }

  .applications-hub-card:hover {
    transform: translateY(-2px);
    border-color: #d8caf6;
    box-shadow: 0 4px 12px rgba(20, 17, 26, 0.08), 0 2px 4px rgba(20, 17, 26, 0.06);
  }

  .applications-hub-cardbody {
    display: grid;
    gap: 7px;
    min-width: 0;
  }

  .applications-hub-cardtitle {
    margin: 0;
    color: #201338;
    font-size: 2rem;
    line-height: 1.08;
    font-family: var(--app-heading);
  }

  .applications-hub-cardmeta,
  .applications-hub-carddate {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    color: #504168;
    font-size: 0.98rem;
  }

  .applications-hub-rejection {
    margin-top: 6px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #fff3f3;
    color: #7f1d1d;
    border: 1px solid #f3d0d0;
    font-size: 0.88rem;
    line-height: 1.35;
  }

  .applications-hub-rejection strong {
    display: block;
    margin-bottom: 4px;
  }

  .applications-hub-cardmeta span,
  .applications-hub-carddate span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .applications-hub-cardmeta svg,
  .applications-hub-carddate svg {
    width: 16px;
    height: 16px;
    color: #5e4a80;
    flex-shrink: 0;
  }

  .applications-hub-cardactions {
    display: grid;
    justify-items: end;
    align-content: start;
    gap: 12px;
  }

  .applications-hub-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 0.92rem;
    font-weight: 800;
    white-space: nowrap;
    animation: fadeIn 220ms ease;
  }

  .applications-hub-status-inprogress {
    background: #fff3db;
    color: #8a4f00;
  }

  .applications-hub-status-shortlist {
    background: #f1eafe;
    color: #4c1d95;
  }

  .applications-hub-status-accepted {
    background: #dcfce7;
    color: #166534;
  }

  .applications-hub-status-rejected {
    background: #fee2e2;
    color: #991b1b;
  }

  .applications-hub-detailsbutton {
    min-width: 150px;
    min-height: 44px;
    border-radius: 10px;
    background: ${PRIMARY} !important;
    border-color: ${PRIMARY} !important;
    color: #ffffff !important;
    font-weight: 700;
    transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
  }

  .applications-hub-timeline {
    grid-column: 2 / 3;
    display: grid;
    gap: 7px;
    margin-top: 3px;
  }

  .applications-hub-timelinebar {
    position: relative;
    height: 2px;
    border-radius: 999px;
    background: #e8e2f3;
    overflow: hidden;
    margin: 0 12px;
  }

  .applications-hub-timelinebar span {
    display: block;
    height: 100%;
    border-radius: inherit;
  }

  .applications-hub-timelinesteps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .applications-hub-step {
    display: grid;
    gap: 6px;
    justify-items: center;
    text-align: center;
  }

  .applications-hub-stepdot {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    border: 2px solid #d9cfe9;
    background: #ffffff;
    margin-top: -12px;
  }

  .applications-hub-stepdone .applications-hub-stepdot {
    border-color: transparent;
  }

  .applications-hub-steplabel {
    font-size: 0.86rem;
    color: #5a4a76;
    line-height: 1.25;
  }

  .applications-hub-stepdone .applications-hub-steplabel {
    color: #2d1f46;
    font-weight: 700;
  }

  .applications-hub-empty {
    display: grid;
    place-items: center;
    gap: 10px;
    padding: 28px 18px !important;
    text-align: center;
  }

  .applications-hub-emptyillustration {
    width: 160px;
    height: 120px;
  }

  .applications-hub-emptytitle {
    margin: 0;
    color: #2d1f46;
    font-size: 1.25rem;
    font-family: var(--app-heading);
  }

  .applications-hub-emptytext {
    margin: 0;
    color: #5a4a76;
  }

  .applications-hub-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .applications-hub-pagebutton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 42px;
    height: 42px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid #ddd4ee;
    background: #ffffff;
    color: #3f2e5a;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
  }

  .applications-hub-pagebutton:focus-visible {
    outline: none;
    box-shadow: var(--ring-focus, 0 0 0 3px #d8caf6);
  }

  .applications-hub-pagebutton:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .applications-hub-pagebutton-active {
    background: ${PRIMARY};
    color: #ffffff;
    border-color: ${PRIMARY};
  }

  .applications-hub-tab:active,
  .applications-hub-pagebutton:active,
  .applications-hub-detailsbutton:active {
    transform: scale(0.98);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 980px) {
    .applications-hub-card {
      grid-template-columns: minmax(0, 1fr);
    }

    .applications-hub-cardactions {
      justify-items: start;
    }

    .applications-hub-timeline {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 640px) {
    .applications-hub-shell {
      padding: 18px;
      border-radius: 16px;
    }

    .applications-hub-title {
      font-size: 2rem;
    }

    .applications-hub-cardtitle {
      font-size: 1.45rem;
    }

    .applications-hub-tab {
      width: 100%;
      justify-content: flex-start;
      min-height: 48px;
    }

    .applications-hub-pagebutton,
    .applications-hub-detailsbutton {
      min-height: 48px;
    }
  }
`;

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M8 3.75v3.5" />
      <path d="M16 3.75v3.5" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 20V8.5A1.5 1.5 0 0 1 5.5 7H10v13" />
      <path d="M10 20V4.5A1.5 1.5 0 0 1 11.5 3h7A1.5 1.5 0 0 1 20 4.5V20" />
      <path d="M7 11h.01" />
      <path d="M7 15h.01" />
      <path d="M13 7h.01" />
      <path d="M13 11h.01" />
      <path d="M17 7h.01" />
      <path d="M17 11h.01" />
      <path d="M14 20v-4h2v4" />
    </svg>
  );
}

function mapStatutVersUi(statut: CandidatureStatut): CandidatureUiStatut {
  switch (statut) {
    case "accepted":
      return "accepted";
    case "rejected":
      return "rejected";
    case "shortlisted":
    case "interview_scheduled":
      return "shortlist";
    default:
      return "in_progress";
  }
}

function normaliserStatut(statut?: string): CandidatureStatut {
  switch (statut) {
    case "shortlisted":
    case "interview_scheduled":
    case "rejected":
    case "accepted":
      return statut;
    default:
      return "pending";
  }
}

function normaliserCandidature(item: CandidatureApiItem, index: number): Candidature {
  const candidature = item.candidature ?? item;
  const statut = normaliserStatut(candidature.statut);

  return {
    id: candidature.id ?? `candidature-${index}`,
    offre: {
      id: item.offre?.id,
      titre: item.offre?.titre ?? "Poste",
      localisation: item.offre?.localisation ?? "Localisation indisponible",
      type_poste: item.offre?.type_poste ?? "-",
    },
    entreprise: {
      nom: item.entreprise?.nom ?? "Entreprise",
    },
    date_postulation: candidature.date_postulation ?? new Date().toISOString(),
    statut,
    uiStatut: mapStatutVersUi(statut),
    motif_refus: candidature.motif_refus ?? null,
    score_test: typeof candidature.score_test === "number" ? candidature.score_test : null,
  };
}

function localeTag(locale: "fr" | "en" | "ar") {
  switch (locale) {
    case "en":
      return "en-US";
    case "ar":
      return "ar-TN";
    default:
      return "fr-FR";
  }
}

function formaterDate(dateString: string, locale: "fr" | "en" | "ar") {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function progressionEtape(statut: CandidatureStatut) {
  switch (statut) {
    case "shortlisted":
      return 1;
    case "interview_scheduled":
      return 2;
    case "accepted":
    case "rejected":
      return 3;
    default:
      return 0;
  }
}

function MesCandidaturesPage() {
  const { locale } = useI18n();
  const copy = COPY[locale];
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("all");
  const [pageActuelle, setPageActuelle] = useState(1);

  const chargerContenu = useEffectEvent(async () => {
    try {
      setLoading(true);
      setErreur(null);

      const response = await authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures"));
      const payload: CandidaturesPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || copy.errorFallback);
      }

      const items = Array.isArray(payload.donnees) ? payload.donnees : [];
      setCandidatures(items.map(normaliserCandidature));
    } catch (error) {
      setCandidatures([]);
      setErreur(error instanceof Error ? error.message : copy.errorFallback);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void chargerContenu();
  }, [locale]);

  useEffect(() => {
    setPageActuelle(1);
  }, [searchTerm, filtreStatut]);

  const counts = useMemo(() => {
    return candidatures.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.byStatus[item.uiStatut] += 1;
        return acc;
      },
      {
        total: 0,
        byStatus: {
          in_progress: 0,
          shortlist: 0,
          accepted: 0,
          rejected: 0,
        } as Record<CandidatureUiStatut, number>,
      },
    );
  }, [candidatures]);

  const candidaturesFiltrees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...candidatures]
      .filter((item) => (filtreStatut === "all" ? true : item.uiStatut === filtreStatut))
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return [item.offre.titre, item.entreprise.nom, item.offre.localisation]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => new Date(b.date_postulation).getTime() - new Date(a.date_postulation).getTime());
  }, [candidatures, filtreStatut, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(candidaturesFiltrees.length / PAGE_SIZE));
  const candidaturesVisibles = candidaturesFiltrees.slice((pageActuelle - 1) * PAGE_SIZE, pageActuelle * PAGE_SIZE);

  useEffect(() => {
    if (pageActuelle > totalPages) {
      setPageActuelle(totalPages);
    }
  }, [pageActuelle, totalPages]);

  const statusTabs = [
    { key: "all" as const, label: copy.tabs.all, count: counts.total },
    { key: "in_progress" as const, label: copy.tabs.in_progress, count: counts.byStatus.in_progress },
    { key: "shortlist" as const, label: copy.tabs.shortlist, count: counts.byStatus.shortlist },
    { key: "accepted" as const, label: copy.tabs.accepted, count: counts.byStatus.accepted },
    { key: "rejected" as const, label: copy.tabs.rejected, count: counts.byStatus.rejected },
  ];

  const timelineLabels = [copy.timeline.candidature, copy.timeline.revue, copy.timeline.entretien, copy.timeline.decision];

  return (
    <>
      <div className="app-page">
        <section className="applications-hub-shell" aria-live="polite">
          <header className="applications-hub-titleblock">
            <h1 className="applications-hub-title">{copy.title}</h1>
            <p className="applications-hub-subtitle">{copy.subtitle}</p>
          </header>

          <Card padding="md" className="applications-hub-controls">
            <div className="applications-hub-searchbox">
              <SearchIcon className="applications-hub-searchicon" />
              <input
                className="applications-hub-searchinput"
                placeholder={copy.searchPlaceholder}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="applications-hub-tabs" role="tablist" aria-label={copy.allStatuses}>
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={classes("applications-hub-tab", filtreStatut === tab.key && "applications-hub-tab-active")}
                  onClick={() => setFiltreStatut(tab.key)}
                >
                  {tab.key !== "all" ? (
                    <span
                      className={classes(
                        "applications-hub-tabdot",
                        tab.key === "in_progress" && "applications-hub-tabdot-inprogress",
                        tab.key === "shortlist" && "applications-hub-tabdot-shortlist",
                        tab.key === "accepted" && "applications-hub-tabdot-accepted",
                        tab.key === "rejected" && "applications-hub-tabdot-rejected",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>{tab.label}</span>
                  <span className="applications-hub-tabcount">({tab.count})</span>
                </button>
              ))}
            </div>
          </Card>

          {erreur ? <p className="message message-erreur applications-hub-feedback" role="alert">{erreur}</p> : null}

          {loading ? (
            <Card padding="lg">
              <LoadingState title={copy.loadingTitle} description={copy.loadingText} />
            </Card>
          ) : candidaturesFiltrees.length === 0 ? (
            <Card padding="lg" className="applications-hub-empty">
              <svg viewBox="0 0 160 120" className="applications-hub-emptyillustration" aria-hidden="true">
                <rect x="22" y="24" width="116" height="70" rx="14" fill="#F6F5F8" stroke="#D9D5DF" />
                <rect x="38" y="40" width="50" height="10" rx="5" fill="#D8CAF6" />
                <rect x="38" y="58" width="72" height="8" rx="4" fill="#ECEAF0" />
                <circle cx="120" cy="72" r="12" fill="#35063E" />
                <path d="M114 72h12M120 66v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h2 className="applications-hub-emptytitle">{copy.emptyTitle}</h2>
              <p className="applications-hub-emptytext">{copy.emptyText}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm("");
                  setFiltreStatut("all");
                }}
              >
                {copy.resetFilters}
              </Button>
            </Card>
          ) : (
            <>
              <div className="applications-hub-list">
                {candidaturesVisibles.map((candidature) => {
                  const stepIndex = progressionEtape(candidature.statut);
                  const color = STATUS_COLORS[candidature.uiStatut].fill;
                  const progressWidth = `${(stepIndex / 3) * 100}%`;

                  return (
                    <Card key={candidature.id} padding="md" className="applications-hub-card">
                      <div className="applications-hub-cardbody">
                        <h2 className="applications-hub-cardtitle">{candidature.offre.titre}</h2>
                        <div className="applications-hub-cardmeta">
                          <span>
                            <BuildingIcon />
                            {candidature.entreprise.nom}
                          </span>
                          <span>
                            <LocationIcon />
                            {candidature.offre.localisation}
                          </span>
                        </div>
                        <div className="applications-hub-carddate">
                          <span>
                            <CalendarIcon />
                            {copy.appliedOn} {formaterDate(candidature.date_postulation, locale)}
                          </span>
                          {typeof candidature.score_test === "number" ? (
                            <span>
                              {copy.aiScore}: {candidature.score_test}/100
                            </span>
                          ) : null}
                        </div>

                        {candidature.statut === "rejected" && candidature.motif_refus ? (
                          <div className="applications-hub-rejection" role="note">
                            <strong>{copy.rejectionReason}</strong>
                            <span>{candidature.motif_refus}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="applications-hub-timeline" aria-label={`${copy.allStatuses}: ${copy.tabs[candidature.uiStatut]}`}>
                        <span
                          className={classes(
                            "applications-hub-status",
                            candidature.uiStatut === "in_progress" && "applications-hub-status-inprogress",
                            candidature.uiStatut === "shortlist" && "applications-hub-status-shortlist",
                            candidature.uiStatut === "accepted" && "applications-hub-status-accepted",
                            candidature.uiStatut === "rejected" && "applications-hub-status-rejected",
                          )}
                        >
                          {copy.tabs[candidature.uiStatut]}
                        </span>

                        <div className="applications-hub-timelinebar">
                          <span style={{ width: progressWidth, background: color }} />
                        </div>
                        <div className="applications-hub-timelinesteps">
                          {timelineLabels.map((label, index) => (
                            <div key={label} className={classes("applications-hub-step", index <= stepIndex && "applications-hub-stepdone")}>
                              <span className="applications-hub-stepdot" style={index <= stepIndex ? { background: color } : undefined} />
                              <span className="applications-hub-steplabel">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="applications-hub-cardactions">
                        <Button className="applications-hub-detailsbutton">{copy.viewDetails}</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 ? (
                <div className="applications-hub-pagination">
                  <button
                    type="button"
                    className="applications-hub-pagebutton"
                    onClick={() => setPageActuelle((current) => Math.max(1, current - 1))}
                    disabled={pageActuelle === 1}
                    aria-label={copy.previousPage}
                  >
                    &#8249;
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={classes("applications-hub-pagebutton", pageActuelle === page && "applications-hub-pagebutton-active")}
                      onClick={() => setPageActuelle(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="applications-hub-pagebutton"
                    onClick={() => setPageActuelle((current) => Math.min(totalPages, current + 1))}
                    disabled={pageActuelle === totalPages}
                    aria-label={copy.nextPage}
                  >
                    &#8250;
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <style jsx global>{applicationsPageStyles}</style>
    </>
  );
}

export default function MesCandidaturesPageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <MesCandidaturesPage />
    </RouteProtegee>
  );
}
