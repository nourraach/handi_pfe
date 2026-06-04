"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { Heading, Stat, Text } from "@/components/ui/typography";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { CalendarDays, CheckCircle2, Eye, FileText, Mail, Phone, ShieldCheck, X } from "lucide-react";

type StatusCandidature = "pending" | "shortlisted" | "interview_scheduled" | "rejected" | "accepted";

type CandidatureRecue = {
  id: string;
  statut: StatusCandidature;
  date_postulation: string;
  score_test?: number | null;
  lettre_motivation?: string | null;
  motif_refus?: string | null;
  cv_url?: string | null;
  candidat: {
    id?: string;
    id_utilisateur?: string;
    nom: string;
    email: string;
    telephone?: string;
    cv_url?: string | null;
    video_cv_url?: string | null;
    competences?: string[];
    experience?: string | null;
    handicap?: string | null;
  };
  offre: {
    id?: string;
    titre: string;
  };
};

type CandidatureDetail = {
  candidature: {
    id: string;
    statut: StatusCandidature;
    date_postulation: string;
    score_test?: number | null;
    lettre_motivation?: string | null;
    motif_refus?: string | null;
    cv_url?: string | null;
  };
  candidat: {
    nom: string;
    email: string;
    telephone?: string | null;
    competences?: string[];
    experience?: string | null;
    handicap?: string | null;
    cv_url?: string | null;
    video_cv_url?: string | null;
  };
  offre: {
    id?: string;
    titre: string;
    description?: string | null;
  };
  entreprise: {
    nom: string;
    contact_rh_nom?: string | null;
    contact_rh_email?: string | null;
    contact_rh_telephone?: string | null;
  };
};

type OffreOption = {
  id: string;
  titre: string;
};

type FormPlanification = {
  date_heure: string;
  type: "visio" | "presentiel" | "telephonique";
  lieu_visio: string;
  lieu: string;
  duree_prevue: string;
  contact_entreprise: string;
  notes: string;
};

type CandidatureRecueApiItem = {
  candidature?: Partial<
    Pick<
      CandidatureRecue,
      "id" | "statut" | "date_postulation" | "score_test" | "lettre_motivation" | "motif_refus" | "cv_url"
    >
  > & { created_at?: string };
  candidat?: Partial<CandidatureRecue["candidat"]>;
  offre?: Partial<CandidatureRecue["offre"]>;
};

type CandidatureRecuePayload = {
  message?: string;
  donnees?: CandidatureRecueApiItem[];
};

type CandidatureDetailApiItem = {
  candidature?: Partial<CandidatureDetail["candidature"]> & { created_at?: string };
  candidat?: Partial<CandidatureDetail["candidat"]>;
  offre?: Partial<CandidatureDetail["offre"]>;
  entreprise?: Partial<CandidatureDetail["entreprise"]>;
};

type CandidatureDetailPayload = {
  message?: string;
  donnees?: CandidatureDetailApiItem;
};

type OffreApiItem = {
  id?: string;
  id_offre?: string;
  titre?: string;
};

type OffresCompanyPayload = {
  message?: string;
  donnees?: {
    offres?: OffreApiItem[];
  } | OffreApiItem[];
};

type StatistiquesItem = {
  statut?: string | null;
  count?: number | string | null;
};

type StatistiquesPayload = {
  message?: string;
  donnees?: StatistiquesItem[];
};

type StatistiquesCandidatures = {
  total: number;
  pending: number;
  shortlisted: number;
  interview_scheduled: number;
  rejected: number;
  accepted: number;
};

type RejectionOuvert = {
  id: string;
  candidatNom: string;
  offreTitre: string;
} | null;

const PAGE_SIZE = 12;
const PAGE_FETCH_LIMIT = PAGE_SIZE + 1;
const STATS_BATCH_SIZE = 100;
const EXPORT_BATCH_SIZE = 100;

type PreviewKind = "image" | "pdf" | "video" | "unknown";
type MediaPreviewState = {
  open: boolean;
  title: string;
  kind: PreviewKind;
  url: string | null;
  loading: boolean;
  error: string | null;
};

const formulaireInitial: FormPlanification = {
  date_heure: "",
  type: "visio",
  lieu_visio: "",
  lieu: "",
  duree_prevue: "60 minutes",
  contact_entreprise: "",
  notes: "",
};

function normaliserStatus(statut?: string): StatusCandidature {
  switch (statut) {
    case "shortlisted":
    case "interview_scheduled":
    case "rejected":
    case "accepted":
      return statut;
    case "pending":
    default:
      return "pending";
  }
}

function normaliserCandidatures(payload: CandidatureRecuePayload): CandidatureRecue[] {
  const brut = Array.isArray(payload?.donnees) ? payload.donnees : [];

  return brut.map((item, index) => ({
    id: item?.candidature?.id ?? `candidature-${index}`,
    statut: normaliserStatus(item?.candidature?.statut),
    date_postulation: item?.candidature?.date_postulation ?? item?.candidature?.created_at ?? new Date().toISOString(),
    score_test: item?.candidature?.score_test ?? null,
    lettre_motivation: item?.candidature?.lettre_motivation ?? null,
    motif_refus: item?.candidature?.motif_refus ?? null,
    cv_url: item?.candidature?.cv_url ?? item?.candidat?.cv_url ?? null,
    candidat: {
      id: item?.candidat?.id,
      id_utilisateur: item?.candidat?.id_utilisateur,
      nom: item?.candidat?.nom ?? "Candidate",
      email: item?.candidat?.email ?? "",
      telephone: item?.candidat?.telephone ?? "",
      cv_url: item?.candidat?.cv_url ?? null,
      video_cv_url: item?.candidat?.video_cv_url ?? null,
      competences: Array.isArray(item?.candidat?.competences) ? item.candidat.competences : [],
      experience: item?.candidat?.experience ?? null,
      handicap: item?.candidat?.handicap ?? null,
    },
    offre: {
      id: item?.offre?.id,
      titre: item?.offre?.titre ?? "Role",
    },
  }));
}

function normaliserCandidatureDetail(payload: CandidatureDetailPayload): CandidatureDetail | null {
  const item = payload?.donnees;
  if (!item) {
    return null;
  }

  return {
    candidature: {
      id: item.candidature?.id ?? "candidature",
      statut: normaliserStatus(item.candidature?.statut),
      date_postulation: item.candidature?.date_postulation ?? item.candidature?.created_at ?? new Date().toISOString(),
      score_test: item.candidature?.score_test ?? null,
      lettre_motivation: item.candidature?.lettre_motivation ?? null,
      motif_refus: item.candidature?.motif_refus ?? null,
      cv_url: item.candidature?.cv_url ?? null,
    },
    candidat: {
      nom: item.candidat?.nom ?? "Candidate",
      email: item.candidat?.email ?? "",
      telephone: item.candidat?.telephone ?? null,
      competences: Array.isArray(item.candidat?.competences) ? item.candidat?.competences : [],
      experience: item.candidat?.experience ?? null,
      handicap: item.candidat?.handicap ?? null,
      cv_url: item.candidat?.cv_url ?? null,
      video_cv_url: item.candidat?.video_cv_url ?? null,
    },
    offre: {
      id: item.offre?.id,
      titre: item.offre?.titre ?? "Role",
      description: item.offre?.description ?? null,
    },
    entreprise: {
      nom: item.entreprise?.nom ?? "Company",
      contact_rh_nom: item.entreprise?.contact_rh_nom ?? null,
      contact_rh_email: item.entreprise?.contact_rh_email ?? null,
      contact_rh_telephone: item.entreprise?.contact_rh_telephone ?? null,
    },
  };
}

function normaliserOffres(payload: OffresCompanyPayload): OffreOption[] {
  const brut = Array.isArray(payload.donnees)
    ? payload.donnees
    : Array.isArray(payload.donnees?.offres)
      ? payload.donnees.offres
      : [];

  return brut
    .map((item) => ({
      id: item.id_offre ?? item.id ?? "",
      titre: item.titre ?? "Role",
    }))
    .filter((item) => item.id.length > 0);
}

function getStatusLabel(statut: StatusCandidature) {
  switch (statut) {
    case "shortlisted":
      return { label: "Preselection", className: "message-neutre" };
    case "interview_scheduled":
      return { label: "Interview scheduled", className: "message-info" };
    case "rejected":
      return { label: "Rejected", className: "message-erreur" };
    case "accepted":
      return { label: "Accepted", className: "message-info" };
    case "pending":
    default:
      return { label: "Pending", className: "message-neutre" };
  }
}

function formaterDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-US");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function shortText(value?: string | null, fallback = "Information non renseignee.") {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 260 ? `${trimmed.slice(0, 257).trim()}...` : trimmed;
}

function creerStatistiquesVides(): StatistiquesCandidatures {
  return {
    total: 0,
    pending: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    rejected: 0,
    accepted: 0,
  };
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  const normalized = text.replace(/\r?\n/g, " ").trim();
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function calculerStatistiquesDepuisCandidatures(candidatures: CandidatureRecue[]): StatistiquesCandidatures {
  const statistiques = creerStatistiquesVides();

  for (const candidature of candidatures) {
    statistiques.total += 1;
    statistiques[candidature.statut] += 1;
  }

  return statistiques;
}

function normaliserStatistiques(payload: StatistiquesPayload): StatistiquesCandidatures {
  const statistiques = creerStatistiquesVides();
  const brut = Array.isArray(payload?.donnees) ? payload.donnees : [];

  for (const item of brut) {
    const statut = normaliserStatus(typeof item?.statut === "string" ? item.statut : undefined);
    const count = Number(item?.count ?? 0);
    const valeur = Number.isFinite(count) ? count : 0;

    statistiques.total += valeur;
    statistiques[statut] += valeur;
  }

  return statistiques;
}

export default function CandidaturesCompanyPage() {
  const searchParams = useSearchParams();
  const [candidatures, setCandidatures] = useState<CandidatureRecue[]>([]);
  const [offresAvailables, setOffresAvailables] = useState<OffreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filtreStatus, setFiltreStatus] = useState("");
  const [filtreOffre, setFiltreOffre] = useState("");
  const [offreSelectionnee, setOffreSelectionnee] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [statistiques, setStatistiques] = useState<StatistiquesCandidatures>(creerStatistiquesVides);
  const [candidatureEnAction, setCandidatureEnAction] = useState<string | null>(null);
  const [candidatureEnPlanification, setCandidatureEnPlanification] = useState<string | null>(null);
  const [candidatureEnDetails, setCandidatureEnDetails] = useState<string | null>(null);
  const [detailsCandidature, setDetailsCandidature] = useState<CandidatureDetail | null>(null);
  const [candidatureEnRejection, setCandidatureEnRejection] = useState<RejectionOuvert>(null);
  const [motifRejection, setMotifRejection] = useState("");
  const [formulaire, setFormulaire] = useState<FormPlanification>(formulaireInitial);
  const [preview, setPreview] = useState<MediaPreviewState>({
    open: false,
    title: "",
    kind: "unknown",
    url: null,
    loading: false,
    error: null,
  });

  const closePreview = () => {
    setPreview((current) => {
      if (current.url) URL.revokeObjectURL(current.url);
      return { open: false, title: "", kind: "unknown", url: null, loading: false, error: null };
    });
  };

  const openPreview = async (opts: { title: string; path: string; kindHint?: PreviewKind }) => {
    const url = /^https?:\/\//i.test(opts.path) ? opts.path : construireUrlApi(opts.path.startsWith("/") ? opts.path : `/${opts.path}`);
    setPreview({ open: true, title: opts.title, kind: opts.kindHint || "unknown", url: null, loading: true, error: null });
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!response.ok) throw new Error("Impossible d'ouvrir le fichier.");
      const blob = await response.blob();
      const contentType = (blob.type || response.headers.get("content-type") || "").toLowerCase();
      const kind: PreviewKind =
        opts.kindHint ||
        (contentType.includes("pdf")
          ? "pdf"
          : contentType.startsWith("image/")
            ? "image"
            : contentType.startsWith("video/")
              ? "video"
              : "unknown");
      const objectUrl = URL.createObjectURL(blob);
      setPreview({ open: true, title: opts.title, kind, url: objectUrl, loading: false, error: null });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Impossible d'ouvrir le fichier.";
      setPreview((current) => ({ ...current, loading: false, error: message }));
    }
  };

  const exporterCandidaturesCsv = async () => {
    try {
      setInfo(null);
      setErreur(null);
      setLoading(true);

      const lignes: CandidatureRecue[] = [];
      let pageExport = 1;

      while (true) {
        const response = await authenticatedFetch(
          construireUrlApi(construireEndpointCandidatures(pageExport, EXPORT_BATCH_SIZE, filtreStatus || undefined)),
        );
        const data: CandidatureRecuePayload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Impossible d'exporter les candidatures.");
        }

        const lot = normaliserCandidatures(data);
        lignes.push(...lot);
        if (lot.length < EXPORT_BATCH_SIZE) break;
        pageExport += 1;
      }

      const headers = [
        "candidate_name",
        "candidate_email",
        "candidate_phone",
        "status",
        "application_date",
        "offer_title",
        "score_test",
        "experience",
        "handicap",
        "motif_refus",
      ];

      const rows = lignes.map((item) => [
        item.candidat.nom,
        item.candidat.email,
        item.candidat.telephone || "",
        item.statut,
        item.date_postulation,
        item.offre.titre,
        item.score_test ?? "",
        item.candidat.experience ?? "",
        item.candidat.handicap ?? "",
        item.motif_refus ?? "",
      ]);

      const csv = [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const suffixStatus = filtreStatus ? `-${filtreStatus}` : "";
      const suffixOffre = offreSelectionnee ? `-offre-${offreSelectionnee.slice(0, 8)}` : "";
      a.href = url;
      a.download = `candidatures${suffixStatus}${suffixOffre}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setInfo(`Export termine (${lignes.length} candidature(s)).`);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible d'exporter les candidatures.");
    } finally {
      setLoading(false);
    }
  };

  const chargerOffres = async () => {
    try {
      const response = await authenticatedFetch(construireUrlApi("/api/entreprise/offres"));
      const data: OffresCompanyPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      setOffresAvailables(normaliserOffres(data));
    } catch {}
  };

  const construireEndpointCandidatures = (pageCourante: number, limit: number, statut?: string) => {
    const params = new URLSearchParams({
      page: String(pageCourante),
      limit: String(limit),
    });

    if (statut) {
      params.set("statut", statut);
    }

    return offreSelectionnee
      ? `/api/candidatures/offre/${offreSelectionnee}?${params.toString()}`
      : `/api/candidatures/entreprise?${params.toString()}`;
  };

  const chargerStatistiques = async () => {
    try {
      if (!offreSelectionnee) {
        const response = await authenticatedFetch(construireUrlApi("/api/candidatures/statistiques"));
        const data: StatistiquesPayload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Impossible de charger les statistiques.");
        }

        setStatistiques(normaliserStatistiques(data));
        return;
      }

      const candidaturesToutesPages: CandidatureRecue[] = [];
      let pageStatistiques = 1;

      while (true) {
        const response = await authenticatedFetch(
          construireUrlApi(construireEndpointCandidatures(pageStatistiques, STATS_BATCH_SIZE)),
        );
        const data: CandidatureRecuePayload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Impossible de charger les statistiques.");
        }

        const lot = normaliserCandidatures(data);
        candidaturesToutesPages.push(...lot);

        if (lot.length < STATS_BATCH_SIZE) {
          break;
        }

        pageStatistiques += 1;
      }

      setStatistiques(calculerStatistiquesDepuisCandidatures(candidaturesToutesPages));
    } catch (error: unknown) {
      setStatistiques(creerStatistiquesVides());
      setErreur((courant) => courant ?? (error instanceof Error ? error.message : "Impossible de charger les statistiques."));
    }
  };

  const chargerCandidatures = async () => {
    try {
      setLoading(true);
      setErreur(null);

      const response = await authenticatedFetch(
        construireUrlApi(construireEndpointCandidatures(page, PAGE_FETCH_LIMIT, filtreStatus || undefined)),
      );
      const data: CandidatureRecuePayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les candidatures.");
      }

      const candidaturesNormalisees = normaliserCandidatures(data);

      if (page > 1 && candidaturesNormalisees.length === 0) {
        setPage((courant) => Math.max(1, courant - 1));
        return;
      }

      setHasNextPage(candidaturesNormalisees.length > PAGE_SIZE);
      setCandidatures(candidaturesNormalisees.slice(0, PAGE_SIZE));
    } catch (error: unknown) {
      setHasNextPage(false);
      setErreur(error instanceof Error ? error.message : "Impossible de charger les candidatures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void chargerOffres();
  }, []);

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    const allowed = new Set(["pending", "shortlisted", "interview_scheduled", "accepted", "rejected"]);
    const nextStatus = statusFromUrl && allowed.has(statusFromUrl) ? statusFromUrl : "";
    setFiltreStatus(nextStatus);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    void chargerCandidatures();
  }, [filtreStatus, offreSelectionnee, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void chargerStatistiques();
  }, [offreSelectionnee]); // eslint-disable-line react-hooks/exhaustive-deps

  const candidaturesFiltrees = useMemo(
    () =>
      candidatures.filter((candidature) => {
        if (!filtreOffre) {
          return true;
        }

        const recherche = filtreOffre.toLowerCase();
        const competences = candidature.candidat.competences?.join(" ").toLowerCase() || "";
        return (
          candidature.offre.titre.toLowerCase().includes(recherche) ||
          candidature.candidat.nom.toLowerCase().includes(recherche) ||
          candidature.candidat.email.toLowerCase().includes(recherche) ||
          competences.includes(recherche)
        );
      }),
    [candidatures, filtreOffre],
  );

  const offresPourFiltre = useMemo(() => {
    if (offresAvailables.length > 0) {
      return offresAvailables;
    }

    const map = new Map<string, OffreOption>();
    for (const candidature of candidatures) {
      if (candidature.offre.id) {
        map.set(candidature.offre.id, {
          id: candidature.offre.id,
          titre: candidature.offre.titre,
        });
      }
    }
    return Array.from(map.values());
  }, [candidatures, offresAvailables]);

  const offreSelectionneeLabel =
    offresPourFiltre.find((offre) => offre.id === offreSelectionnee)?.titre ?? "Offre sélectionnée";

  const lancerActionCandidature = async (
    id: string,
    endpoint: string,
    successMessage: string,
    body?: Record<string, unknown>,
  ): Promise<boolean> => {
    try {
      setCandidatureEnAction(id);
      setErreur(null);
      setInfo(null);

      const response = await authenticatedFetch(construireUrlApi(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Cette action n'a pas pu être terminée.");
      }

      setInfo(data.message || successMessage);
      await Promise.all([chargerCandidatures(), chargerStatistiques()]);
      return true;
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Cette action n'a pas pu être terminée.");
      return false;
    } finally {
      setCandidatureEnAction(null);
    }
  };

  const ouvrirRejection = (candidature: CandidatureRecue) => {
    setErreur(null);
    setInfo(null);
    setMotifRejection("");
    setCandidatureEnRejection({
      id: candidature.id,
      candidatNom: candidature.candidat.nom,
      offreTitre: candidature.offre.titre,
    });
  };

  const fermerRejection = () => {
    if (candidatureEnRejection && candidatureEnAction === candidatureEnRejection.id) {
      return;
    }

    setCandidatureEnRejection(null);
    setMotifRejection("");
  };

  const confirmerRejection = async () => {
    if (!candidatureEnRejection) {
      return;
    }

    const motif = motifRejection.trim();
    if (!motif) {
      setErreur("Le motif de refus est obligatoire.");
      return;
    }

    const succes = await lancerActionCandidature(
      candidatureEnRejection.id,
      `/api/candidatures/${candidatureEnRejection.id}/refuser`,
      "Candidature refusée.",
      { motif_refus: motif },
    );

    if (succes) {
      fermerRejection();
    }
  };

  const ouvrirPlanification = (candidature: CandidatureRecue) => {
    setCandidatureEnPlanification(candidature.id);
    setFormulaire({
      ...formulaireInitial,
      notes: candidature.lettre_motivation ? `Contexte de la candidature : ${candidature.lettre_motivation}` : "",
    });
    setErreur(null);
    setInfo(null);
  };

  const fermerPlanification = () => {
    setCandidatureEnPlanification(null);
    setFormulaire(formulaireInitial);
  };

  const ouvrirDetailsCandidature = async (id: string) => {
    try {
      setCandidatureEnDetails(id);
      setErreur(null);

      const response = await authenticatedFetch(construireUrlApi(`/api/candidatures/${id}/details`));
      const data: CandidatureDetailPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les détails de la candidature.");
      }

      const candidature = normaliserCandidatureDetail(data);
      if (!candidature) {
        throw new Error("Les détails de la candidature sont indisponibles.");
      }

      setDetailsCandidature(candidature);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger les détails de la candidature.");
    } finally {
      setCandidatureEnDetails(null);
    }
  };

  const fermerDetailsCandidature = () => {
    setDetailsCandidature(null);
  };

  const planifierEntretien = async (idCandidature: string) => {
    try {
      setCandidatureEnAction(idCandidature);
      setErreur(null);
      setInfo(null);

      if (!formulaire.date_heure) {
        throw new Error("La date et l'heure de l'entretien sont obligatoires.");
      }

      if (formulaire.type === "visio" && !formulaire.lieu_visio.trim()) {
        throw new Error("Un lien visio est obligatoire pour un entretien en visio.");
      }

      if (formulaire.type === "presentiel" && !formulaire.lieu.trim()) {
        throw new Error("Un lieu est obligatoire pour un entretien en présentiel.");
      }

      const response = await authenticatedFetch(construireUrlApi("/api/entretiens/planifier"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_candidature: idCandidature,
          date_heure: new Date(formulaire.date_heure).toISOString(),
          type: formulaire.type,
          lieu_visio: formulaire.type === "visio" ? formulaire.lieu_visio : undefined,
          lieu: formulaire.type === "presentiel" ? formulaire.lieu : undefined,
          duree_prevue: formulaire.duree_prevue || undefined,
          contact_entreprise: formulaire.contact_entreprise || undefined,
          notes: formulaire.notes || undefined,
        }),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de planifier l'entretien.");
      }

      setInfo(data.message || "Entretien planifié avec succès.");
      fermerPlanification();
      await Promise.all([chargerCandidatures(), chargerStatistiques()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de planifier l'entretien.");
    } finally {
      setCandidatureEnAction(null);
    }
  };

  const planificationValide =
    Boolean(formulaire.date_heure) &&
    (formulaire.type !== "visio" || Boolean(formulaire.lieu_visio.trim())) &&
    (formulaire.type !== "presentiel" || Boolean(formulaire.lieu.trim()));

  const candidatPlanification = useMemo(
    () => candidatures.find((item) => item.id === candidatureEnPlanification) ?? null,
    [candidatureEnPlanification, candidatures],
  );
  return (
    <div className="app-page applicants-dashboard" aria-busy={loading} aria-live="polite">
      <div className="applicants-header">
        <div>
          <Heading as="h1" variant="page">Gestion des candidatures</Heading>
        </div>
        <div className="applicants-header-actions">
          <ButtonLink href="/entreprise/entretiens" variant="secondary">
            Ouvrir les entretiens
          </ButtonLink>
          <Button
            onClick={() =>
              setInfo("Utilisez les profils candidats et la planification d'entretien pour ajouter des notes de recrutement.")
            }
          >
            Ajouter une note
          </Button>
        </div>
      </div>

      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}
      {info ? <div className="message message-info" aria-live="polite">{info}</div> : null}

      <section className="recruitment-insights" aria-label="Resume du pipeline">
        <Stat size="compact" value={statistiques.total} label="candidats" />
        <Stat size="compact" value={statistiques.interview_scheduled} label="entretiens" />
        <Stat size="compact" value={statistiques.accepted} label="acceptes" />
        <Stat size="compact" value={statistiques.shortlisted} label="shortlistes" />
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          {loading ? (
            <Card padding="lg">
              <LoadingState
                title="Chargement des candidatures"
                description="Preparation d'une vue complete du pipeline de recrutement."
              />
            </Card>
          ) : (
            <>
              <section className="admin-interviews-toolbar admin-applications-toolbar company-applications-toolbar">
                <button type="button" className="toolbar-primary" onClick={() => void exporterCandidaturesCsv()} disabled={loading}>
                  Exporter les candidatures
                </button>
                <input
                  className="ht-control"
                  id="filtre-offre"
                  type="search"
                  placeholder="Rechercher un candidat, une offre, un e-mail..."
                  value={filtreOffre}
                  onChange={(event) => setFiltreOffre(event.target.value)}
                  aria-label="Rechercher des candidatures"
                />
                <select
                  className="ht-filter-control"
                  id="filtre-statut"
                  value={filtreStatus}
                  onChange={(event) => {
                    setPage(1);
                    setFiltreStatus(event.target.value);
                  }}
                  aria-label="Filtrer par statut de candidature"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="shortlisted">Présélection</option>
                  <option value="interview_scheduled">Entretien</option>
                  <option value="accepted">Acceptée</option>
                  <option value="rejected">Refusée</option>
                </select>
                <select
                  className="ht-filter-control"
                  id="filtre-offre-id"
                  value={offreSelectionnee}
                  onChange={(event) => {
                    setPage(1);
                    setOffreSelectionnee(event.target.value);
                  }}
                  aria-label="Filtrer par offre"
                >
                  <option value="">Tous les postes</option>
                  {offresPourFiltre.map((offre) => (
                    <option key={offre.id} value={offre.id}>
                      {offre.titre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="toolbar-secondary"
                  onClick={() => {
                    setFiltreOffre("");
                    setFiltreStatus("");
                    setOffreSelectionnee("");
                    setPage(1);
                  }}
                >
                  Réinitialiser
                </button>
              </section>

              {candidaturesFiltrees.length === 0 ? (
                <Card padding="lg">
                  <div className="empty-core">
                    <h3>Aucune candidature a afficher</h3>
                    <p>
                      {offreSelectionnee
                        ? `Aucune candidature ne correspond a ${offreSelectionneeLabel}.`
                        : "Aucune candidature ne correspond a vos filtres actuels."}
                    </p>
                    <Button variant="secondary" onClick={() => void chargerCandidatures()}>
                      Actualiser
                    </Button>
                  </div>
                </Card>
              ) : (
                <section className="admin-interviews-table-wrap admin-applications-table-wrap company-applications-table-wrap">
                  <table className="admin-interviews-table admin-applications-table company-applications-table">
                    <thead>
                      <tr>
                        <th>Candidat</th>
                        <th>Offre</th>
                        <th>Statut</th>
                        <th>Candidature envoyée</th>
                        <th>Score</th>
                        <th>Compétences</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidaturesFiltrees.map((candidature) => {
                        const actionEnCours = candidatureEnAction === candidature.id;
                        const detailsEnCours = candidatureEnDetails === candidature.id;
                        const status = getStatusLabel(candidature.statut);
                        const skills = candidature.candidat.competences?.filter(Boolean).slice(0, 3) ?? [];
                        return (
                          <tr key={candidature.id}>
                            <td>
                              <strong>{candidature.candidat.nom}</strong>
                              <span>{candidature.candidat.email || candidature.candidat.telephone || "-"}</span>
                            </td>
                            <td>
                              <strong>{candidature.offre.titre}</strong>
                              <span>{candidature.candidat.experience || "Expérience non renseignée"}</span>
                            </td>
                            <td>
                              <span className={`admin-interviews-status admin-applications-status admin-applications-status--${candidature.statut}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <strong>{formaterDate(candidature.date_postulation)}</strong>
                              <span>{candidature.candidat.handicap ? "Accessibilité renseignée" : "Accessibilité non renseignée"}</span>
                            </td>
                            <td>{typeof candidature.score_test === "number" ? `${candidature.score_test}%` : "-"}</td>
                            <td>
                              <div className="table-skill-list">
                                {skills.length > 0 ? skills.map((skill) => <span key={skill}>{skill}</span>) : <span>-</span>}
                              </div>
                            </td>
                            <td>
                              <div className="company-table-actions">
                                <button
                                  type="button"
                                  onClick={() => void ouvrirDetailsCandidature(candidature.id)}
                                  disabled={detailsEnCours}
                                >
                                  {detailsEnCours ? "..." : "Profil"}
                                </button>
                                {candidature.statut === "pending" ? (
                                  <button
                                    type="button"
                                    className="action-primary"
                                    onClick={() =>
                                      lancerActionCandidature(
                                        candidature.id,
                                        `/api/candidatures/${candidature.id}/shortlist`,
                                        "Candidate shortlisted.",
                                      )
                                    }
                                    disabled={actionEnCours}
                                  >
                                    Shortlist
                                  </button>
                                ) : null}
                                {candidature.statut === "shortlisted" ? (
                                  <button
                                    type="button"
                                    className="action-secondary"
                                    onClick={() => ouvrirPlanification(candidature)}
                                    disabled={actionEnCours}
                                  >
                                    Interview
                                  </button>
                                ) : null}
                                {candidature.statut !== "accepted" && candidature.statut !== "rejected" ? (
                                  <button
                                    type="button"
                                    className="action-danger"
                                    onClick={() => ouvrirRejection(candidature)}
                                    disabled={actionEnCours}
                                  >
                                    Reject
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}

          <footer className="admin-interviews-pagination company-applications-pagination">
            <span>
              Page {page} - {candidaturesFiltrees.length} result(s)
            </span>
            <div>
              <button type="button" onClick={() => setPage((courant) => Math.max(1, courant - 1))} disabled={page === 1}>
                Precedent
              </button>
              <button type="button" onClick={() => setPage((courant) => courant + 1)} disabled={!hasNextPage}>
                Suivant
              </button>
            </div>
          </footer>

          {candidatPlanification ? (
            <Card tone="accent" padding="lg">
              <div className="form-section">
                <div>
                  <strong className="planning-title">
                    Schedule interview - {candidatPlanification.candidat.nom}
                  </strong>
                  <p className="texte-secondaire planning-subtitle">
                    This action creates the interview and notifies the candidate.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="groupe-champ">
                    <label htmlFor="date-planification">Date and time</label>
                    <input
                      id="date-planification"
                      className="champ"
                      type="datetime-local"
                      value={formulaire.date_heure}
                      onChange={(event) =>
                        setFormulaire((courant) => ({ ...courant, date_heure: event.target.value }))
                      }
                    />
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="type-planification">Type</label>
                    <select
                      id="type-planification"
                      className="champ-select"
                      value={formulaire.type}
                      onChange={(event) =>
                        setFormulaire((courant) => ({
                          ...courant,
                          type: event.target.value as FormPlanification["type"],
                        }))
                      }
                    >
                      <option value="visio">Video</option>
                      <option value="presentiel">In person</option>
                      <option value="telephonique">Phone</option>
                    </select>
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="duree-planification">Planned duration</label>
                    <input
                      id="duree-planification"
                      className="champ"
                      placeholder="e.g. 60 minutes"
                      value={formulaire.duree_prevue}
                      onChange={(event) =>
                        setFormulaire((courant) => ({ ...courant, duree_prevue: event.target.value }))
                      }
                    />
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="contact-planification">Company contact</label>
                    <input
                      id="contact-planification"
                      className="champ"
                      placeholder="HR email or phone number"
                      value={formulaire.contact_entreprise}
                      onChange={(event) =>
                        setFormulaire((courant) => ({ ...courant, contact_entreprise: event.target.value }))
                      }
                    />
                  </div>
                </div>

                {formulaire.type === "visio" ? (
                  <div className="groupe-champ">
                    <label htmlFor="visio-planification">Video link</label>
                    <input
                      id="visio-planification"
                      className="champ"
                      placeholder="https://meet.google.com/..."
                      value={formulaire.lieu_visio}
                      onChange={(event) =>
                        setFormulaire((courant) => ({ ...courant, lieu_visio: event.target.value }))
                      }
                    />
                  </div>
                ) : null}

                {formulaire.type === "presentiel" ? (
                  <div className="groupe-champ">
                    <label htmlFor="lieu-planification">Location</label>
                    <input
                      id="lieu-planification"
                      className="champ"
                      placeholder="Full address"
                      value={formulaire.lieu}
                      onChange={(event) =>
                        setFormulaire((courant) => ({ ...courant, lieu: event.target.value }))
                      }
                    />
                  </div>
                ) : null}

                <div className="groupe-champ">
                  <label htmlFor="notes-planification">Preparation notes</label>
                  <textarea
                    id="notes-planification"
                    className="champ-zone"
                    value={formulaire.notes}
                    onChange={(event) => setFormulaire((courant) => ({ ...courant, notes: event.target.value }))}
                  />
                </div>

                <div className="page-header-actions">
                  <Button
                    onClick={() => void planifierEntretien(candidatPlanification.id)}
                    disabled={candidatureEnAction === candidatPlanification.id || !planificationValide}
                  >
                    Confirm schedule
                  </Button>
                  <Button variant="ghost" onClick={fermerPlanification} disabled={candidatureEnAction === candidatPlanification.id} aria-label="Close">
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

      </div>

      {candidatureEnRejection ? (
        <div
          aria-labelledby="refus-candidature-title"
          aria-modal="true"
          role="dialog"
          className="applicants-modal-overlay"
          onClick={fermerRejection}
        >
          <Card
            padding="lg"
            className="applicants-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-lg">
              <div className="page-header-actions applicants-modal-header">
                <div>
                  <p className="badge applicants-modal-eyebrow">
                    Refus
                  </p>
                  <h2 id="refus-candidature-title" className="applicants-modal-title">
                    Refuser la candidature de {candidatureEnRejection.candidatNom}
                  </h2>
                  <p className="texte-secondaire applicants-modal-subtitle">
                    Le motif sera enregistre pour {candidatureEnRejection.offreTitre} et restera visible dans le detail.
                  </p>
                </div>
                <Button variant="ghost" onClick={fermerRejection} disabled={candidatureEnAction === candidatureEnRejection.id} aria-label="Close">
                  ✕
                </Button>
              </div>

              <div className="groupe-champ">
                <label htmlFor="motif-refus">Motif de refus</label>
                <textarea
                  id="motif-refus"
                  className="champ-zone"
                  value={motifRejection}
                  onChange={(event) => setMotifRejection(event.target.value)}
                  placeholder="Ajoutez un contexte utile pour l'equipe et le suivi."
                  rows={6}
                  maxLength={1000}
                  required
                  aria-required="true"
                  disabled={candidatureEnAction === candidatureEnRejection.id}
                />
                <p className="texte-secondaire applicants-modal-subtitle">
                  Obligatoire. {motifRejection.length}/1000 caracteres.
                </p>
              </div>

              <div className="page-header-actions applicants-modal-actions">
                <Button variant="secondary" onClick={fermerRejection} disabled={candidatureEnAction === candidatureEnRejection.id}>
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void confirmerRejection()}
                  disabled={candidatureEnAction === candidatureEnRejection.id || !motifRejection.trim()}
                >
                  {candidatureEnAction === candidatureEnRejection.id ? "Envoi..." : "Confirmer le refus"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {detailsCandidature ? (() => {
        const status = getStatusLabel(detailsCandidature.candidature.statut);
        const skills = detailsCandidature.candidat.competences?.filter(Boolean).slice(0, 10) ?? [];
        const score = typeof detailsCandidature.candidature.score_test === "number"
          ? detailsCandidature.candidature.score_test
          : null;
        const hasCv = Boolean(detailsCandidature.candidature.cv_url || detailsCandidature.candidat.cv_url);
        const hasContact = Boolean(detailsCandidature.candidat.email || detailsCandidature.candidat.telephone);
        const hasCompanyContact = Boolean(
          detailsCandidature.entreprise.nom ||
          detailsCandidature.entreprise.contact_rh_nom ||
          detailsCandidature.entreprise.contact_rh_email ||
          detailsCandidature.entreprise.contact_rh_telephone,
        );
        const aboutText = detailsCandidature.candidature.lettre_motivation || detailsCandidature.candidat.experience || null;

        return (
        <div
          aria-labelledby="detail-candidature-title"
          aria-modal="true"
          role="dialog"
          className="applicants-modal-overlay"
          onClick={fermerDetailsCandidature}
        >
          <Card
            padding="lg"
            className="applicants-modal-card applicants-modal-card-lg talent-profile-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="talent-profile">
              <button className="talent-profile-close" type="button" onClick={fermerDetailsCandidature} aria-label="Fermer">
                <X size={18} aria-hidden="true" />
              </button>

              <aside className="talent-profile-left">
                <div className="talent-profile-avatar" aria-hidden="true">{initials(detailsCandidature.candidat.nom)}</div>
                <div className="talent-profile-heading">
                  <p className="badge applicants-modal-eyebrow">Profil candidat</p>
                  <h2 id="detail-candidature-title">{detailsCandidature.candidat.nom}</h2>
                  <p>{detailsCandidature.offre.titre}</p>
                </div>

                <div className="talent-profile-facts">
                  <span><CheckCircle2 size={14} /> {status.label}</span>
                  <span><CalendarDays size={14} /> {formaterDate(detailsCandidature.candidature.date_postulation)}</span>
                  {score !== null ? <span><CheckCircle2 size={14} /> Score test {score}/100</span> : null}
                  <span><FileText size={14} /> CV {hasCv ? "disponible" : "non fourni"}</span>
                </div>

                {skills.length > 0 ? (
                  <section className="talent-profile-side-section">
                    <h3>Competences</h3>
                    <div className="talent-skill-cloud">
                      {skills.map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                  </section>
                ) : null}

                {aboutText ? (
                  <section className="talent-profile-side-section">
                    <h3>A propos</h3>
                    <p>{shortText(aboutText)}</p>
                  </section>
                ) : null}

                {hasContact ? (
                  <section className="talent-profile-side-section">
                    <h3>Contact</h3>
                    <div className="talent-contact-list">
                      {detailsCandidature.candidat.email ? <span><Mail size={15} /> {detailsCandidature.candidat.email}</span> : null}
                      {detailsCandidature.candidat.telephone ? <span><Phone size={15} /> {detailsCandidature.candidat.telephone}</span> : null}
                    </div>
                  </section>
                ) : null}
              </aside>

              <main className="talent-profile-content">
                <nav className="talent-profile-tabs" aria-label="Sections du profil">
                  <span className="is-active">Overview</span>
                  {detailsCandidature.candidat.experience ? <span>Experience</span> : null}
                  {hasCv ? <span>Documents</span> : null}
                </nav>

                <section className="talent-summary-strip" aria-label="Resume de candidature">
                  <span><b>Statut</b>{status.label}</span>
                  <span><b>Candidature</b>{formaterDate(detailsCandidature.candidature.date_postulation)}</span>
                  {score !== null ? <span><b>Score</b>{score}/100</span> : null}
                  <span><b>CV</b>{hasCv ? "Disponible" : "Non fourni"}</span>
                </section>

                <section className="talent-profile-flow">
                  {detailsCandidature.candidat.experience ? (
                    <article className="talent-panel">
                      <h3>Experience</h3>
                      <div className="talent-timeline">
                        <div>
                          <span aria-hidden="true" />
                          <div>
                            <strong>Experience declaree</strong>
                            <small>{detailsCandidature.candidat.nom}</small>
                            <p>{detailsCandidature.candidat.experience}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ) : null}

                  {detailsCandidature.candidat.handicap ? (
                    <article className="talent-panel talent-note-panel">
                      <h3>Besoins d&apos;accessibilite</h3>
                      <p><ShieldCheck size={15} /> {detailsCandidature.candidat.handicap}</p>
                    </article>
                  ) : null}

                  {detailsCandidature.candidature.lettre_motivation ? (
                    <article className="talent-panel talent-quote-panel">
                      <h3>Lettre de motivation</h3>
                      <blockquote>{shortText(detailsCandidature.candidature.lettre_motivation)}</blockquote>
                    </article>
                  ) : null}

                  {detailsCandidature.offre.description ? (
                    <article className="talent-panel">
                      <h3>Description du role</h3>
                      <p>{detailsCandidature.offre.description}</p>
                    </article>
                  ) : null}

                  {hasCompanyContact ? (
                    <article className="talent-panel talent-recruiter-card">
                      <h3>Recruiter contact</h3>
                      <div>
                        <span className="talent-recruiter-avatar" aria-hidden="true">
                          {initials(detailsCandidature.entreprise.contact_rh_nom || detailsCandidature.entreprise.nom || "RH")}
                        </span>
                        <div className="talent-contact-list">
                          {detailsCandidature.entreprise.nom ? <strong>{detailsCandidature.entreprise.nom}</strong> : null}
                          {detailsCandidature.entreprise.contact_rh_nom ? <span>{detailsCandidature.entreprise.contact_rh_nom}</span> : null}
                          {detailsCandidature.entreprise.contact_rh_email ? <span><Mail size={15} /> {detailsCandidature.entreprise.contact_rh_email}</span> : null}
                          {detailsCandidature.entreprise.contact_rh_telephone ? <span><Phone size={15} /> {detailsCandidature.entreprise.contact_rh_telephone}</span> : null}
                        </div>
                      </div>
                    </article>
                  ) : null}

                  {detailsCandidature.candidature.motif_refus ? (
                    <article className="talent-panel">
                      <h3>Note de suivi</h3>
                      <p>{detailsCandidature.candidature.motif_refus}</p>
                    </article>
                  ) : null}
                </section>
              </main>

              <footer className="talent-profile-actions">
                {detailsCandidature.candidature.cv_url || detailsCandidature.candidat.cv_url ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void openPreview({
                        title: `CV - ${detailsCandidature.candidat.nom}`,
                        path: detailsCandidature.candidature.cv_url || detailsCandidature.candidat.cv_url || "",
                        kindHint: "pdf",
                      })
                    }
                  >
                    <Eye size={16} /> Open CV
                  </Button>
                ) : null}

                <Button variant="ghost" onClick={fermerDetailsCandidature}>
                  Fermer
                </Button>
              </footer>
            </div>
          </Card>
        </div>
        );
      })() : null}

      {preview.open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          className="applicants-modal-overlay"
          onClick={closePreview}
        >
          <Card
            padding="lg"
            className="applicants-modal-card applicants-modal-card-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-lg" onContextMenu={(event) => event.preventDefault()}>
              <div className="notification-meta applicants-modal-header">
                <div>
                  <p className="badge applicants-modal-eyebrow">Preview</p>
                  <h3 className="applicants-modal-title" style={{ fontSize: "1.25rem" }}>
                    {preview.title}
                  </h3>
                </div>
                <Button variant="ghost" onClick={closePreview} aria-label="Close preview">
                  <X size={18} />
                </Button>
              </div>

              {preview.loading ? <p>Chargement...</p> : null}
              {preview.error ? <p style={{ color: "#b42318" }}>{preview.error}</p> : null}
              {!preview.loading && !preview.error && preview.url ? (
                preview.kind === "video" ? (
                  <video
                    src={preview.url}
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    playsInline
                    style={{ width: "100%", borderRadius: 14 }}
                  />
                ) : preview.kind === "pdf" ? (
                  <iframe title={preview.title} src={preview.url} style={{ width: "100%", height: "70vh", border: 0, borderRadius: 14 }} />
                ) : (
                  <img src={preview.url} alt={preview.title} style={{ width: "100%", borderRadius: 14 }} />
                )
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      <style jsx>{`
        .applicants-dashboard {
          background: #faf9fc;
          padding: 6px;
          border-radius: 20px;
        }
        .applicants-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .applicants-header h1 {
          margin: 0;
          color: #1c1636;
          font-size: 1.85rem;
          font-weight: 750;
        }
        .applicants-header p {
          margin: 6px 0 0;
          color: #6a6480;
        }
        .applicants-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .recruitment-insights {
          height: 42px;
          max-height: 48px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
          margin-bottom: 10px;
          padding: 8px 12px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.82);
          color: #6d647d;
          box-shadow: 0 10px 22px rgba(31, 18, 49, 0.04);
          overflow-x: auto;
        }
        .recruitment-insights span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.82rem;
          line-height: 1;
          white-space: nowrap;
        }
        .recruitment-insights span + span::before {
          content: "";
          width: 4px;
          height: 4px;
          margin-right: 3px;
          border-radius: 50%;
          background: rgba(var(--app-primary-rgb), 0.34);
        }
        .recruitment-insights b {
          color: #211735;
          font-weight: 850;
        }
        .dashboard-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
        }
        .dashboard-main {
          display: grid;
          gap: 10px;
        }
        .filters-card {
          background: #fff;
          border: 1px solid #efe8fb;
          border-radius: 16px;
          padding: 10px;
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(140px, 1fr) minmax(140px, 1fr) minmax(240px, 2fr) auto;
          align-items: end;
          box-shadow: 0 8px 18px rgba(53, 6, 62, 0.04);
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .filters-card .groupe-champ {
          margin: 0;
        }
        .filters-card label {
          font-size: 0.72rem;
          color: #6f6987;
          margin-bottom: 4px;
        }
        .filters-card :global(.champ),
        .filters-card :global(.champ-select) {
          min-height: 38px;
          border-radius: 12px;
          font-size: 0.84rem;
        }
        .search-field .champ {
          min-height: 38px;
        }
        .filter-action {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
        }
        .company-applications-toolbar {
          grid-template-columns: auto minmax(240px, 1fr) minmax(150px, 180px) minmax(170px, 240px) auto;
        }
        .company-applications-toolbar .toolbar-primary {
          background: #4a154b;
          color: #ffffff;
          border: 1px solid transparent;
          box-shadow: 0 10px 24px rgba(74, 21, 75, 0.16);
        }
        .company-applications-toolbar .toolbar-primary:hover:not(:disabled) {
          background: #5b1a5e;
        }
        .company-applications-toolbar .toolbar-primary:active:not(:disabled) {
          background: #3a103a;
        }
        .company-applications-toolbar .toolbar-secondary {
          background: #ffffff;
          color: #2a1d3d;
          border: 1px solid #e5ddf0;
        }
        .company-applications-table-wrap {
          max-height: 560px;
        }
        .company-applications-table {
          min-width: 1120px;
        }
        .table-skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          min-width: 150px;
        }
        .table-skill-list span {
          display: inline-flex !important;
          width: fit-content;
          margin-top: 0 !important;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(var(--app-primary-rgb), 0.07);
          color: var(--app-primary) !important;
          font-size: 0.7rem !important;
          font-weight: 800;
        }
        .company-table-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          min-width: 220px;
        }
        .company-table-actions button {
          min-height: 30px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.12);
          border-radius: 10px;
          padding: 0 9px;
          background: #f6f1ff;
          color: var(--app-primary);
          font-size: 0.72rem;
          font-weight: 850;
          cursor: pointer;
        }
        .company-table-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .company-table-actions .action-primary {
          background: #4a154b;
          color: #ffffff;
          border-color: transparent;
        }
        .company-table-actions .action-secondary {
          background: #ffffff;
          color: #2a1d3d;
          border-color: #e5ddf0;
        }
        .company-table-actions .action-danger {
          background: #fff5f5;
          color: #dc2626;
          border-color: #fecaca;
        }
        .pipeline-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          min-height: min(72vh, 760px);
        }
        .pipeline-card {
          background: #fff;
          border: 1px solid rgba(var(--app-primary-rgb), 0.09);
          border-radius: 16px;
          padding: 10px;
          min-height: min(72vh, 760px);
          box-shadow: 0 12px 28px rgba(31, 18, 49, 0.05);
          display: flex;
          flex-direction: column;
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .pipeline-card header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
        }
        .pipeline-card header > div {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .pipeline-card h4 {
          margin: 0;
          color: #2a1843;
          font-size: 0.9rem;
        }
        .pipeline-card header strong {
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: #efe8fb;
          color: #5f2ac8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .pipeline-items {
          display: grid;
          gap: 9px;
          align-content: start;
          flex: 1;
          overflow-y: auto;
          padding-right: 2px;
        }
        .pipeline-empty {
          border: 1px dashed #e3d8f6;
          border-radius: 12px;
          min-height: 96px;
          display: grid;
          place-items: center;
          color: #6f6987;
          font-size: 0.82rem;
          text-align: center;
          padding: 12px;
        }
        .candidate-card {
          display: grid;
          gap: 9px;
          padding: 10px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.09);
          border-radius: 14px;
          background: linear-gradient(180deg, #fff, #fdfbff);
          box-shadow: 0 10px 22px rgba(31, 18, 49, 0.04);
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .candidate-card:hover {
          transform: translateY(-1px);
          border-color: rgba(var(--app-primary-rgb), 0.18);
          box-shadow: 0 14px 28px rgba(31, 18, 49, 0.07);
        }
        .candidate-card-top {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 8px;
          align-items: start;
        }
        .candidate-card-top strong {
          display: block;
          color: #241735;
          font-size: 0.88rem;
          line-height: 1.2;
        }
        .candidate-card-top small {
          display: block;
          margin-top: 3px;
          color: #746d86;
          font-size: 0.74rem;
          line-height: 1.25;
        }
        .candidate-card-top button {
          min-height: 28px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.12);
          border-radius: 999px;
          padding: 0 9px;
          background: rgba(var(--app-primary-rgb), 0.06);
          color: var(--app-primary);
          font-size: 0.72rem;
          font-weight: 850;
          cursor: pointer;
        }
        .candidate-card-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .candidate-card-skills span,
        .accessibility-badge {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(var(--app-primary-rgb), 0.08);
          color: var(--app-primary);
          font-size: 0.68rem;
          font-weight: 800;
        }
        .candidate-card-meta {
          display: grid;
          gap: 5px;
          color: #746d86;
          font-size: 0.72rem;
        }
        .candidate-card-meta span {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .candidate-card-meta b {
          color: #241735;
        }
        .candidate-card-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .pipeline-card footer {
          color: #6a55aa;
          font-weight: 600;
          font-size: 0.78rem;
          margin-top: 8px;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #35063e, #773ea5);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .avatar.small {
          width: 30px;
          height: 30px;
          font-size: 0.66rem;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
        }
        .dot-pending {
          background: #f59f0a;
        }
        .dot-shortlisted {
          background: #5f2ac8;
        }
        .dot-interview {
          background: #2666d7;
        }
        .dot-accepted {
          background: #27a95d;
        }
        .dot-rejected {
          background: #dc3545;
        }
        .applicant-action-btn {
          justify-content: center;
          min-height: 30px;
          border-radius: 999px;
          padding-inline: 10px;
          font-size: 0.72rem;
          font-weight: 800;
          box-shadow: none;
        }
        .candidate-card-actions :global(.action-primary) {
          background: #4a154b;
          color: #ffffff;
          border: 1px solid transparent;
        }
        .candidate-card-actions :global(.action-secondary) {
          background: #ffffff;
          color: #2a1d3d;
          border: 1px solid #e5ddf0;
        }
        .candidate-card-actions :global(.action-danger) {
          background: #fff5f5;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .candidate-card-actions :global(.ui-button:disabled),
        .candidate-card-actions :global(.ui-button[aria-disabled="true"]) {
          opacity: 0.55;
        }
        .empty-core {
          text-align: center;
          padding: 26px 10px;
        }
        .empty-core h3 {
          margin: 0 0 8px;
          color: #2a1843;
        }
        .empty-core p {
          margin: 0 0 14px;
          color: #736d8b;
        }

        .planning-title {
          font-size: 1.1rem;
          color: #2a1843;
        }

        .planning-subtitle {
          margin: 10px 0 0;
        }

        .applicants-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2140;
          min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
          background: rgba(15, 12, 24, 0.58);
          backdrop-filter: blur(8px);
        }

        .applicants-modal-card {
          width: min(100%, 720px);
          max-height: calc(100dvh - 32px);
          overflow-y: auto;
        }

        .applicants-modal-card-lg {
          width: min(100%, 900px);
        }

        .talent-profile-modal {
          width: min(940px, calc(100vw - 32px));
          max-height: 85dvh;
          padding: 0 !important;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
        }

        .talent-profile {
          position: relative;
          display: grid;
          grid-template-columns: 282px minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr) auto;
          min-height: 0;
          max-height: 85dvh;
          background: #fff;
        }

        .talent-profile-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 3;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(53, 6, 62, 0.12);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          color: var(--app-primary);
          box-shadow: 0 12px 28px rgba(31, 18, 49, 0.12);
          cursor: pointer;
        }

        .talent-profile-left {
          grid-row: 1 / span 2;
          display: grid;
          align-content: start;
          gap: 14px;
          padding: 22px 18px;
          overflow-y: auto;
          border-right: 1px solid rgba(var(--app-primary-rgb), 0.1);
          background:
            radial-gradient(circle at 72% 0%, rgba(216, 106, 141, 0.18), transparent 30%),
            linear-gradient(180deg, rgba(var(--app-primary-rgb), 0.08), rgba(255, 255, 255, 0.98) 44%);
        }

        .talent-profile-avatar {
          width: 74px;
          height: 74px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--app-primary), #d86a8d);
          color: #fff;
          font-size: 1.28rem;
          font-weight: 900;
          box-shadow: 0 18px 34px rgba(var(--app-primary-rgb), 0.18);
        }

        .talent-profile-heading h2 {
          margin: 0;
          color: #1d1430;
          font-size: 1.42rem;
          line-height: 1.1;
        }

        .talent-profile-heading > p:not(.badge) {
          margin: 5px 0 0;
          color: var(--app-primary);
          font-size: 0.88rem;
          font-weight: 800;
        }

        .talent-profile-facts,
        .talent-contact-list {
          display: grid;
          gap: 7px;
        }

        .talent-profile-facts span,
        .talent-contact-list span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #4b415f;
          font-size: 0.8rem;
        }

        .talent-profile-facts {
          padding: 11px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(var(--app-primary-rgb), 0.09);
        }

        .talent-profile-side-section {
          display: grid;
          gap: 8px;
        }

        .talent-profile-side-section h3,
        .talent-panel h3 {
          margin: 0;
          color: #1d1430;
          font-size: 0.9rem;
        }

        .talent-profile-side-section p,
        .talent-panel p,
        .talent-quote-panel blockquote {
          margin: 0;
          color: #625773;
          font-size: 0.84rem;
          line-height: 1.55;
        }

        .talent-skill-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .talent-skill-cloud span {
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(var(--app-primary-rgb), 0.08);
          color: var(--app-primary);
          font-size: 0.74rem;
          font-weight: 800;
        }

        .talent-profile-content {
          grid-column: 2;
          min-width: 0;
          padding: 18px 20px 12px;
          overflow-y: auto;
          background: #fff;
        }

        .talent-profile-tabs {
          display: flex;
          gap: 20px;
          align-items: center;
          padding: 0 42px 10px 0;
          border-bottom: 1px solid rgba(var(--app-primary-rgb), 0.1);
          color: #756b84;
          font-size: 0.82rem;
          font-weight: 850;
        }

        .talent-profile-tabs span {
          position: relative;
        }

        .talent-profile-tabs .is-active {
          color: var(--app-primary);
        }

        .talent-profile-tabs .is-active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -11px;
          height: 2px;
          border-radius: 999px;
          background: var(--app-primary);
        }

        .talent-summary-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 14px 0;
        }

        .talent-summary-strip span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(var(--app-primary-rgb), 0.06);
          color: #625773;
          font-size: 0.78rem;
        }

        .talent-summary-strip b {
          color: #1d1430;
        }

        .talent-profile-flow {
          display: grid;
          gap: 12px;
        }

        .talent-panel {
          display: grid;
          gap: 9px;
          padding: 15px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: 15px;
          background: linear-gradient(180deg, #fff, #fcfafd);
          box-shadow: 0 14px 34px rgba(31, 18, 49, 0.05);
        }

        .talent-note-panel p {
          display: inline-flex;
          align-items: flex-start;
          gap: 8px;
        }

        .talent-quote-panel blockquote {
          padding-left: 14px;
          border-left: 3px solid #d86a8d;
          font-style: italic;
        }

        .talent-timeline > div {
          position: relative;
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr);
          gap: 14px;
        }

        .talent-timeline > div::before {
          content: "";
          position: absolute;
          left: 6px;
          top: 18px;
          bottom: -20px;
          width: 1px;
          background: rgba(var(--app-primary-rgb), 0.16);
        }

        .talent-timeline > div:last-child::before {
          display: none;
        }

        .talent-timeline > div > span {
          width: 13px;
          height: 13px;
          margin-top: 4px;
          border-radius: 50%;
          background: #d86a8d;
          box-shadow: 0 0 0 5px rgba(216, 106, 141, 0.12);
        }

        .talent-timeline strong {
          color: #1d1430;
        }

        .talent-timeline p,
        .talent-timeline small,
        .talent-timeline em {
          display: block;
          margin: 6px 0 0;
        }

        .talent-timeline small {
          color: #7a6d8d;
          font-size: 0.82rem;
        }

        .talent-timeline em {
          font-style: normal;
          font-size: 0.88rem;
        }

        .talent-recruiter-card > div {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          align-items: start;
          gap: 10px;
        }

        .talent-recruiter-avatar {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(135deg, var(--app-primary), #d86a8d);
          color: #fff;
          font-size: 0.78rem;
          font-weight: 900;
        }

        .talent-contact-list strong {
          color: #1d1430;
          font-size: 0.9rem;
        }

        .talent-profile-actions {
          grid-column: 2;
          position: sticky;
          bottom: 0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 12px;
          padding: 12px 18px;
          border-top: 1px solid rgba(var(--app-primary-rgb), 0.1);
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(10px);
        }

        .applicants-modal-header {
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
        }

        .applicants-modal-eyebrow {
          margin-bottom: 12px;
        }

        .applicants-modal-title {
          margin: 0;
          font-size: 1.45rem;
          font-family: var(--app-heading);
          color: #2a1843;
        }

        .applicants-modal-subtitle {
          margin: 10px 0 0;
        }

        .applicants-modal-actions {
          justify-content: flex-end;
        }

        .filters-card:hover,
        .pipeline-card:hover {
          transform: translateY(-1px);
          border-color: rgba(53, 6, 62, 0.2);
          box-shadow: var(--shadow-2);
        }

        .candidate-card-actions :global(.ui-button:active),
        .filter-action :global(.ui-button:active),
        .applicants-header-actions :global(.ui-button:active) {
          transform: scale(0.98);
        }

        .candidate-card-actions :global(.ui-button:focus-visible),
        .filter-action :global(.ui-button:focus-visible),
        .applicants-header-actions :global(.ui-button:focus-visible) {
          box-shadow: var(--ring-focus);
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
        @media (max-width: 1360px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1100px) {
          .pipeline-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            min-height: auto;
          }
          .pipeline-card {
            min-height: 520px;
          }
          .filters-card {
            grid-template-columns: 1fr 1fr;
          }
          .search-field {
            grid-column: span 2;
          }
          .filter-action {
            grid-column: span 2;
            justify-content: flex-start;
          }

          .talent-profile {
            grid-template-columns: 260px minmax(0, 1fr);
          }
        }
        @media (max-width: 720px) {
          .applicants-header {
            flex-direction: column;
          }
          .pipeline-grid,
          .filters-card {
            grid-template-columns: 1fr;
          }
          .pipeline-card {
            min-height: 420px;
          }
          .search-field,
          .filter-action {
            grid-column: auto;
          }
          .applicants-modal-overlay {
            align-items: end;
            padding: 0;
          }

          .applicants-modal-card,
          .applicants-modal-card-lg {
            width: 100%;
            max-width: none;
            max-height: 92vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
          }

          .talent-profile-modal {
            width: 100%;
            max-height: 92dvh;
          }

          .talent-profile {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr) auto;
            max-height: 92dvh;
          }

          .talent-profile-left {
            grid-row: auto;
            border-right: 0;
            border-bottom: 1px solid rgba(var(--app-primary-rgb), 0.1);
            max-height: 38dvh;
          }

          .talent-profile-content {
            grid-column: 1;
            padding: 16px;
          }

          .talent-profile-actions {
            grid-column: 1;
            flex-direction: column;
            align-items: stretch;
            padding: 14px 16px;
          }
        }
      `}</style>
    </div>
  );
}
