"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

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

function resolveBackendFileUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return construireUrlApi(url.startsWith("/") ? url : `/${url}`);
}

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
      return { label: "Shortlisted", className: "message-neutre" };
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

function statusDotClass(status: StatusCandidature) {
  switch (status) {
    case "shortlisted":
      return "dot-shortlisted";
    case "interview_scheduled":
      return "dot-interview";
    case "accepted":
      return "dot-accepted";
    case "rejected":
      return "dot-rejected";
    case "pending":
    default:
      return "dot-pending";
  }
}

function statusPillClass(status: StatusCandidature) {
  switch (status) {
    case "shortlisted":
      return "pill-shortlisted";
    case "interview_scheduled":
      return "pill-interview";
    case "accepted":
      return "pill-accepted";
    case "rejected":
      return "pill-rejected";
    case "pending":
    default:
      return "pill-pending";
  }
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
          throw new Error(data.message || "Unable to load statistics.");
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
          throw new Error(data.message || "Unable to load statistics.");
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
      setErreur((courant) => courant ?? (error instanceof Error ? error.message : "Unable to load statistics."));
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
        throw new Error(data.message || "Unable to load applications.");
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
      setErreur(error instanceof Error ? error.message : "Unable to load applications.");
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
  }, [filtreStatus, offreSelectionnee, page]);

  useEffect(() => {
    void chargerStatistiques();
  }, [offreSelectionnee]);

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
    offresPourFiltre.find((offre) => offre.id === offreSelectionnee)?.titre ?? "Selected role";

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
        throw new Error(data.message || "This action could not be completed.");
      }

      setInfo(data.message || successMessage);
      await Promise.all([chargerCandidatures(), chargerStatistiques()]);
      return true;
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "This action could not be completed.");
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

    const succes = await lancerActionCandidature(
      candidatureEnRejection.id,
      `/api/candidatures/${candidatureEnRejection.id}/refuser`,
      "Application rejected.",
      motifRejection.trim() ? { motif_refus: motifRejection.trim() } : undefined,
    );

    if (succes) {
      fermerRejection();
    }
  };

  const ouvrirPlanification = (candidature: CandidatureRecue) => {
    setCandidatureEnPlanification(candidature.id);
    setFormulaire({
      ...formulaireInitial,
      notes: candidature.lettre_motivation ? `Application context: ${candidature.lettre_motivation}` : "",
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
        throw new Error(data.message || "Unable to load application details.");
      }

      const candidature = normaliserCandidatureDetail(data);
      if (!candidature) {
        throw new Error("Application details are unavailable.");
      }

      setDetailsCandidature(candidature);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load application details.");
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
        throw new Error("The interview date and time are required.");
      }

      if (formulaire.type === "visio" && !formulaire.lieu_visio.trim()) {
        throw new Error("A video link is required for a video interview.");
      }

      if (formulaire.type === "presentiel" && !formulaire.lieu.trim()) {
        throw new Error("A location is required for an in-person interview.");
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
        throw new Error(data.message || "Unable to schedule the interview.");
      }

      setInfo(data.message || "Interview scheduled avec succes.");
      fermerPlanification();
      await Promise.all([chargerCandidatures(), chargerStatistiques()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to schedule the interview.");
    } finally {
      setCandidatureEnAction(null);
    }
  };

  const planificationValide =
    Boolean(formulaire.date_heure) &&
    (formulaire.type !== "visio" || Boolean(formulaire.lieu_visio.trim())) &&
    (formulaire.type !== "presentiel" || Boolean(formulaire.lieu.trim()));

  const pipelineColonnes: Array<{ key: StatusCandidature; label: string }> = [
    { key: "pending", label: "Pending" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "interview_scheduled", label: "Interview" },
    { key: "accepted", label: "Accepted" },
  ];

  const candidaturesParStatut = useMemo(() => {
    const resultat: Record<StatusCandidature, CandidatureRecue[]> = {
      pending: [],
      shortlisted: [],
      interview_scheduled: [],
      accepted: [],
      rejected: [],
    };

    for (const candidature of candidaturesFiltrees) {
      resultat[candidature.statut].push(candidature);
    }

    return resultat;
  }, [candidaturesFiltrees]);

  const candidatPlanification = useMemo(
    () => candidatures.find((item) => item.id === candidatureEnPlanification) ?? null,
    [candidatureEnPlanification, candidatures],
  );
  const afficherPipeline = filtreStatus !== "interview_scheduled";

  return (
    <div className="app-page applicants-dashboard" aria-busy={loading} aria-live="polite">
      <div className="applicants-header">
        <div>
          <h1>Gestion des candidatures</h1>
          <p>Filtrez, comparez et pilotez chaque candidature avec une vue claire du pipeline.</p>
          <p className="applicants-header-meta">
            Total: {statistiques.total} | En attente: {statistiques.pending} | Preselection: {statistiques.shortlisted}
          </p>
        </div>
        <div className="applicants-header-actions">
          <ButtonLink href="/entreprise/entretiens" variant="secondary">
            Open interviews
          </ButtonLink>
          <Button
            onClick={() =>
              setInfo("Use candidate cards or table actions to add hiring notes in details and interview scheduling.")
            }
          >
            Add note
          </Button>
        </div>
      </div>

      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}
      {info ? <div className="message message-info" aria-live="polite">{info}</div> : null}

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
              {afficherPipeline ? (
                <section className="pipeline-grid">
                  {pipelineColonnes.map((colonne) => {
                    const items = candidaturesParStatut[colonne.key] || [];
                    return (
                      <article key={colonne.key} className="pipeline-card">
                        <header>
                          <h4>{colonne.label}</h4>
                          <span>{items.length}</span>
                        </header>
                        <div className="pipeline-items">
                          {items.length === 0 ? (
                            <div className="pipeline-empty">
                              <p>Aucun candidat pour cette etape pour l&apos;instant.</p>
                            </div>
                          ) : (
                            items.slice(0, 3).map((candidature) => (
                              <button
                                key={candidature.id}
                                type="button"
                                className="candidate-chip"
                                onClick={() => void ouvrirDetailsCandidature(candidature.id)}
                              >
                                <span className="avatar">{initials(candidature.candidat.nom)}</span>
                                <span className="candidate-copy">
                                  <strong>{candidature.candidat.nom}</strong>
                                  <small>{candidature.offre.titre}</small>
                                  <small>Postule le {formaterDate(candidature.date_postulation)}</small>
                                </span>
                                <span className={`status-dot ${statusDotClass(candidature.statut)}`} />
                              </button>
                            ))
                          )}
                        </div>
                        <footer>Voir tout ({items.length})</footer>
                      </article>
                    );
                  })}
                </section>
              ) : null}

              <section className="filters-card">
                <div className="groupe-champ">
                  <label htmlFor="filtre-offre-id">Role</label>
                  <select
                    id="filtre-offre-id"
                    className="champ-select"
                    value={offreSelectionnee}
                    onChange={(event) => {
                      setPage(1);
                      setOffreSelectionnee(event.target.value);
                    }}
                  >
                    <option value="">Tous les postes</option>
                    {offresPourFiltre.map((offre) => (
                      <option key={offre.id} value={offre.id}>
                        {offre.titre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="groupe-champ">
                  <label htmlFor="filtre-statut">Status</label>
                  <select
                    id="filtre-statut"
                    className="champ-select"
                    value={filtreStatus}
                    onChange={(event) => {
                      setPage(1);
                      setFiltreStatus(event.target.value);
                    }}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="shortlisted">Preselection</option>
                    <option value="interview_scheduled">Entretien</option>
                    <option value="accepted">Acceptee</option>
                    <option value="rejected">Refusee</option>
                  </select>
                </div>

                <div className="groupe-champ search-field">
                  <label htmlFor="filtre-offre">Search</label>
                  <input
                    id="filtre-offre"
                    className="champ"
                    placeholder="Rechercher par nom, email ou competences..."
                    value={filtreOffre}
                    onChange={(event) => setFiltreOffre(event.target.value)}
                  />
                </div>

                <div className="filter-action">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFiltreOffre("");
                      setFiltreStatus("");
                      setOffreSelectionnee("");
                      setPage(1);
                    }}
                  >
                    Reinitialiser les filtres
                  </Button>
                </div>
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
                <section className="table-card">
                  <div className="table-head">
                    <h3>All applicants ({candidaturesFiltrees.length})</h3>
                    <div className="sort-inline">
                      <span>Sort by</span>
                      <strong>Newest first</strong>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Role</th>
                          <th>Experience</th>
                          <th>Applied date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidaturesFiltrees.map((candidature) => {
                          const badge = getStatusLabel(candidature.statut);
                          const actionEnCours = candidatureEnAction === candidature.id;
                          const detailsEnCours = candidatureEnDetails === candidature.id;
                          return (
                            <tr key={candidature.id}>
                              <td data-label="Candidat">
                                <div className="candidate-table">
                                  <span className="avatar small">{initials(candidature.candidat.nom)}</span>
                                  <div>
                                    <strong title={candidature.candidat.nom}>{candidature.candidat.nom}</strong>
                                    <small title={candidature.candidat.email || ""}>{candidature.candidat.email || "\u2014"}</small>
                                  </div>
                                </div>
                              </td>
                              <td data-label="Poste" title={candidature.offre.titre}>{candidature.offre.titre}</td>
                              <td data-label="Experience">{candidature.candidat.experience || "\u2014"}</td>
                              <td data-label="Date de candidature">{formaterDate(candidature.date_postulation)}</td>
                              <td data-label="Statut">
                                <span className={`status-pill ${statusPillClass(candidature.statut)}`}>{badge.label}</span>
                              </td>
                              <td data-label="Actions">
                                <div className="table-actions">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="applicant-action-btn action-neutral"
                                    onClick={() => void ouvrirDetailsCandidature(candidature.id)}
                                    disabled={detailsEnCours}
                                  >
                                    {detailsEnCours ? "..." : "View profile"}
                                  </Button>
                                  {resolveBackendFileUrl(candidature.cv_url) ? (
                                    <a
                                      className="ui-button ui-button-sm applicant-action-btn action-neutral"
                                      href={resolveBackendFileUrl(candidature.cv_url) || "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View CV
                                    </a>
                                  ) : null}
                                  {candidature.statut === "pending" ? (
                                    <Button
                                      size="sm"
                                      className="applicant-action-btn action-primary"
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
                                    </Button>
                                  ) : null}
                                  {candidature.statut === "shortlisted" ? (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="applicant-action-btn action-secondary"
                                      onClick={() => ouvrirPlanification(candidature)}
                                      disabled={actionEnCours}
                                    >
                                      Interview
                                    </Button>
                                  ) : null}
                                  {candidature.statut !== "accepted" && candidature.statut !== "rejected" ? (
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      className="applicant-action-btn action-danger"
                                      onClick={() => ouvrirRejection(candidature)}
                                      disabled={actionEnCours}
                                    >
                                      Reject
                                    </Button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          <section className="pager-row">
            <p>
              Page {page} - {candidaturesFiltrees.length} result(s)
            </p>
            <div>
              <Button variant="ghost" onClick={() => setPage((courant) => Math.max(1, courant - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="secondary" onClick={() => setPage((courant) => courant + 1)} disabled={!hasNextPage}>
                Next
              </Button>
            </div>
          </section>

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
                  <Button variant="ghost" onClick={fermerPlanification} disabled={candidatureEnAction === candidatPlanification.id}>
                    Close
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
                <Button variant="ghost" onClick={fermerRejection} disabled={candidatureEnAction === candidatureEnRejection.id}>
                  Fermer
                </Button>
              </div>

              <div className="groupe-champ">
                <label htmlFor="motif-refus">Reason for rejection</label>
                <textarea
                  id="motif-refus"
                  className="champ-zone"
                  value={motifRejection}
                  onChange={(event) => setMotifRejection(event.target.value)}
                  placeholder="Ajoutez un contexte utile pour l'equipe et le suivi."
                  rows={6}
                  maxLength={1000}
                  disabled={candidatureEnAction === candidatureEnRejection.id}
                />
                <p className="texte-secondaire applicants-modal-subtitle">
                  Optionnel. {motifRejection.length}/1000 caracteres.
                </p>
              </div>

              <div className="page-header-actions applicants-modal-actions">
                <Button variant="secondary" onClick={fermerRejection} disabled={candidatureEnAction === candidatureEnRejection.id}>
                  Annuler
                </Button>
                <Button variant="danger" onClick={() => void confirmerRejection()} disabled={candidatureEnAction === candidatureEnRejection.id}>
                  {candidatureEnAction === candidatureEnRejection.id ? "Envoi..." : "Confirmer le refus"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {detailsCandidature ? (
        <div
          aria-labelledby="detail-candidature-title"
          aria-modal="true"
          role="dialog"
          className="applicants-modal-overlay"
          onClick={fermerDetailsCandidature}
        >
          <Card
            padding="lg"
            className="applicants-modal-card applicants-modal-card-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-lg">
              <div className="notification-meta">
                <div>
                  <p className="badge applicants-modal-eyebrow">
                    Candidature detaillee
                  </p>
                  <h2 id="detail-candidature-title" className="applicants-modal-title">
                    {detailsCandidature.candidat.nom} - {detailsCandidature.offre.titre}
                  </h2>
                  <p className="texte-secondaire applicants-modal-subtitle">
                    Details charges depuis l&apos;endpoint de candidature.
                  </p>
                </div>
                <Button variant="ghost" onClick={fermerDetailsCandidature}>
                  Fermer
                </Button>
              </div>

              <div className="details-grid">
                <div className="detail-box">
                  <strong>Status</strong>
                  <p>{getStatusLabel(detailsCandidature.candidature.statut).label}</p>
                </div>
                <div className="detail-box">
                  <strong>Application date</strong>
                  <p>{formaterDate(detailsCandidature.candidature.date_postulation)}</p>
                </div>
                <div className="detail-box">
                  <strong>Assessment score</strong>
                  <p>
                    {typeof detailsCandidature.candidature.score_test === "number"
                      ? `${detailsCandidature.candidature.score_test}/100`
                      : "Not available"}
                  </p>
                </div>
                <div className="detail-box">
                  <strong>CV</strong>
                  <p>{detailsCandidature.candidature.cv_url || detailsCandidature.candidat.cv_url ? "Available" : "Not provided"}</p>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-box">
                  <strong>Email</strong>
                  <p>{detailsCandidature.candidat.email || "-"}</p>
                </div>
                <div className="detail-box">
                  <strong>Phone</strong>
                  <p>{detailsCandidature.candidat.telephone || "-"}</p>
                </div>
                <div className="detail-box">
                  <strong>Experience</strong>
                  <p>{detailsCandidature.candidat.experience || "-"}</p>
                </div>
                <div className="detail-box">
                  <strong>Handicap</strong>
                  <p>{detailsCandidature.candidat.handicap || "-"}</p>
                </div>
              </div>

              <div className="detail-box">
                <strong>Skills</strong>
                <p>
                  {detailsCandidature.candidat.competences?.length
                    ? detailsCandidature.candidat.competences.join(", ")
                    : "-"}
                </p>
              </div>

              {detailsCandidature.offre.description ? (
                <div className="detail-box">
                  <strong>Role description</strong>
                  <p>{detailsCandidature.offre.description}</p>
                </div>
              ) : null}

              {detailsCandidature.candidature.lettre_motivation ? (
                <div className="detail-box">
                  <strong>Motivation letter</strong>
                  <p>{detailsCandidature.candidature.lettre_motivation}</p>
                </div>
              ) : null}

              {detailsCandidature.candidature.motif_refus ? (
                <div className="detail-box">
                  <strong>Reason for rejection</strong>
                  <p>{detailsCandidature.candidature.motif_refus}</p>
                </div>
              ) : null}

              <div className="details-grid">
                <div className="detail-box">
                  <strong>Company</strong>
                  <p>{detailsCandidature.entreprise.nom}</p>
                </div>
                <div className="detail-box">
                  <strong>HR contact</strong>
                  <p>{detailsCandidature.entreprise.contact_rh_nom || "-"}</p>
                </div>
                <div className="detail-box">
                  <strong>HR email</strong>
                  <p>{detailsCandidature.entreprise.contact_rh_email || "-"}</p>
                </div>
                <div className="detail-box">
                  <strong>HR phone</strong>
                  <p>{detailsCandidature.entreprise.contact_rh_telephone || "-"}</p>
                </div>
              </div>

              <div className="page-header-actions">
                {resolveBackendFileUrl(detailsCandidature.candidature.cv_url || detailsCandidature.candidat.cv_url) ? (
                  <a
                    className="ui-button ui-button-secondary"
                    href={resolveBackendFileUrl(detailsCandidature.candidature.cv_url || detailsCandidature.candidat.cv_url) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open CV
                  </a>
                ) : null}
                <Button variant="ghost" onClick={fermerDetailsCandidature}>
                  Fermer le detail
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <style jsx>{`
        .applicants-dashboard {
          background: var(--app-bg);
          padding: 8px;
          border-radius: 24px;
        }
        .applicants-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 18px;
        }
        .applicants-header h1 {
          margin: 0;
          color: #1c1636;
          font-size: 2rem;
          font-weight: 800;
        }
        .applicants-header p {
          margin: 6px 0 0;
          color: #6a6480;
        }
        .applicants-header-meta {
          margin: 8px 0 0;
          color: #6f6987;
          font-size: 0.83rem;
          line-height: 1.5;
        }
        .applicants-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .dashboard-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
        }
        .dashboard-main {
          display: grid;
          gap: 14px;
        }
        .filters-card {
          background: #fff;
          border: 1px solid #efe8fb;
          border-radius: 20px;
          padding: 14px;
          display: grid;
          gap: 12px;
          grid-template-columns: minmax(140px, 1fr) minmax(140px, 1fr) minmax(240px, 2fr) auto;
          align-items: end;
          box-shadow: 0 10px 20px rgba(53, 6, 62, 0.05);
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .filters-card .groupe-champ {
          margin: 0;
        }
        .filters-card label {
          font-size: 0.78rem;
          color: #6f6987;
          margin-bottom: 6px;
        }
        .search-field .champ {
          min-height: 44px;
        }
        .filter-action {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
        }
        .pipeline-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .pipeline-card {
          background: #fff;
          border: 1px solid #efe8fb;
          border-radius: 18px;
          padding: 12px;
          min-height: 220px;
          box-shadow: 0 10px 20px rgba(53, 6, 62, 0.05);
          display: flex;
          flex-direction: column;
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .pipeline-card header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .pipeline-card h4 {
          margin: 0;
          color: #2a1843;
          font-size: 0.95rem;
        }
        .pipeline-card header span {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #efe8fb;
          color: #5f2ac8;
          display: grid;
          place-items: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .pipeline-items {
          display: grid;
          gap: 8px;
          flex: 1;
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
        .candidate-chip {
          border: 1px solid #efe8fb;
          background: #fcfbff;
          border-radius: 12px;
          padding: 8px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: center;
          text-align: left;
          cursor: pointer;
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease, background-color 150ms ease;
        }
        .candidate-copy {
          display: grid;
          gap: 2px;
        }
        .candidate-copy strong {
          color: #2a1843;
          font-size: 0.83rem;
        }
        .candidate-copy small {
          color: #867f9e;
          font-size: 0.72rem;
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
        .table-card {
          background: #fff;
          border: 1px solid #efe8fb;
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 10px 20px rgba(53, 6, 62, 0.05);
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .table-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .table-head h3 {
          margin: 0;
          color: #2a1843;
        }
        .sort-inline {
          display: flex;
          gap: 8px;
          color: #7d7894;
          font-size: 0.85rem;
        }
        .sort-inline strong {
          color: #2a1843;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 820px;
        }
        th,
        td {
          text-align: left;
          padding: 14px 10px;
          border-bottom: 1px solid #f1ecfa;
          font-size: 0.88rem;
          vertical-align: top;
        }
        th {
          color: #746d8f;
          font-weight: 700;
          font-size: 0.83rem;
        }
        td {
          color: #281f3e;
        }
        tbody tr:hover {
          background: #faf8ff;
        }
        .candidate-table {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .candidate-table strong {
          display: block;
          margin-bottom: 2px;
          font-size: 0.88rem;
        }
        .candidate-table small {
          color: #857f9b;
        }
        .status-pill {
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 116px;
          white-space: nowrap;
          line-height: 1.1;
          border: 1px solid transparent;
          animation: fade-in-status 200ms ease both;
        }
        .pill-pending {
          color: #8a6a2b;
          background: #f7f0de;
          border-color: #eadfbe;
        }
        .pill-shortlisted {
          color: #5c4588;
          background: #f0ebfa;
          border-color: #dfd4f5;
        }
        .pill-interview {
          color: #3f5e97;
          background: #ebf0f9;
          border-color: #d8e2f4;
        }
        .pill-accepted {
          color: #2f7d57;
          background: #eaf7f0;
          border-color: #d4ecde;
        }
        .pill-rejected {
          color: #9c4a55;
          background: #f9ecee;
          border-color: #efd6da;
        }
        .table-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(120px, 1fr));
          gap: 8px;
          align-items: start;
        }
        .applicant-action-btn {
          justify-content: center;
          width: 100%;
          min-height: 36px;
          border-radius: 12px;
          font-weight: 700;
          box-shadow: none;
        }
        .table-actions :global(.action-neutral) {
          background: #f6f4fb;
          color: #3a2b56;
          border: 1px solid #ddd5ec;
        }
        .table-actions :global(.action-primary) {
          background: #3d0d53;
          color: #fff;
          border: 1px solid #3d0d53;
        }
        .table-actions :global(.action-secondary) {
          background: #ece6f8;
          color: #4a3672;
          border: 1px solid #d7caee;
        }
        .table-actions :global(.action-danger) {
          background: #f7eeef;
          color: #9f4a57;
          border: 1px solid #e8d1d5;
        }
        .table-actions :global(.ui-button:disabled),
        .table-actions :global(.ui-button[aria-disabled="true"]) {
          opacity: 0.55;
        }
        @media (max-width: 940px) {
          .table-actions {
            grid-template-columns: 1fr;
          }
        }
        .pager-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          border: 1px solid #efe8fb;
          border-radius: 16px;
          padding: 10px 12px;
        }
        .pager-row p {
          margin: 0;
          color: #6f6987;
          font-size: 0.85rem;
        }
        .pager-row div {
          display: flex;
          gap: 8px;
        }
        .dashboard-side {
          display: grid;
          gap: 12px;
          align-content: start;
        }
        .side-card {
          background: #fff;
          border: 1px solid #efe8fb;
          border-radius: 20px;
          padding: 14px;
          box-shadow: 0 10px 20px rgba(53, 6, 62, 0.05);
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .side-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .side-card-head h3 {
          margin: 0;
          color: #2a1843;
          font-size: 1rem;
        }
        .activity-list {
          display: grid;
          gap: 10px;
        }
        .activity-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: start;
        }
        .activity-item strong {
          font-size: 0.84rem;
          color: #2a1843;
        }
        .activity-item p {
          margin: 3px 0 0;
          font-size: 0.79rem;
          color: #7d7894;
        }
        .activity-item small {
          color: #9b95af;
          font-size: 0.74rem;
          white-space: nowrap;
          padding-top: 2px;
        }
        .side-empty {
          margin: 0;
          color: #8f89a5;
          font-size: 0.85rem;
        }
        .role-summary {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 10px;
          align-items: center;
        }
        .summary-ring {
          width: 92px;
          height: 92px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          position: relative;
        }
        .summary-ring::before {
          content: "";
          position: absolute;
          inset: 13px;
          background: #fff;
          border-radius: 50%;
        }
        .summary-ring span {
          position: relative;
          z-index: 1;
          color: #2a1843;
          font-weight: 800;
        }
        .summary-list {
          display: grid;
          gap: 8px;
        }
        .summary-list p {
          margin: 0;
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 0.8rem;
        }
        .summary-list span {
          color: #6f6987;
        }
        .summary-list strong {
          color: #2a1843;
        }
        .tip-card {
          background: #f7f3fe;
        }
        .tip-card h3 {
          margin: 0;
          color: #2a1843;
        }
        .tip-card p {
          color: #6c6785;
          margin: 8px 0 14px;
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
          z-index: 50;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.52);
          backdrop-filter: blur(6px);
        }

        .applicants-modal-card {
          width: min(100%, 720px);
          max-height: min(90vh, 860px);
          overflow-y: auto;
        }

        .applicants-modal-card-lg {
          width: min(100%, 900px);
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
        .pipeline-card:hover,
        .table-card:hover,
        .side-card:hover {
          transform: translateY(-1px);
          border-color: rgba(53, 6, 62, 0.2);
          box-shadow: var(--shadow-2);
        }

        .candidate-chip:hover {
          transform: translateY(-1px);
          border-color: rgba(53, 6, 62, 0.2);
          box-shadow: var(--shadow-1);
          background: #ffffff;
        }

        .candidate-chip:focus-visible {
          outline: none;
          box-shadow: var(--ring-focus);
        }

        .table-actions :global(.ui-button:active),
        .filter-action :global(.ui-button:active),
        .applicants-header-actions :global(.ui-button:active) {
          transform: scale(0.98);
        }

        .table-actions :global(.ui-button:focus-visible),
        .filter-action :global(.ui-button:focus-visible),
        .applicants-header-actions :global(.ui-button:focus-visible),
        .pager-row :global(.ui-button:focus-visible) {
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
          .dashboard-side {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 1100px) {
          .pipeline-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
          .dashboard-side {
            grid-template-columns: 1fr;
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
          .search-field,
          .filter-action {
            grid-column: auto;
          }
          .pager-row {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          table,
          thead,
          tbody,
          th,
          td,
          tr {
            display: block;
            min-width: 0;
          }

          thead {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0 0 0 0);
          }

          tbody tr {
            border: 1px solid #efe8fb;
            border-radius: 14px;
            padding: 10px;
            margin-bottom: 10px;
            background: #fff;
          }

          td {
            border: none;
            padding: 8px 0;
          }

          td::before {
            content: attr(data-label);
            display: block;
            margin-bottom: 4px;
            color: #746d8f;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .table-actions {
            grid-template-columns: 1fr;
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
        }
      `}</style>
    </div>
  );
}
