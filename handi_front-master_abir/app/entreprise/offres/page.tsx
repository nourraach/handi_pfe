"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RouteProtegee } from "@/components/route-protegee";
import { Button, ButtonLink } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/layout";
import { Heading, Stat, Text } from "@/components/ui/typography";
import { authenticatedFetch, getUtilisateurConnecte, isAuthenticated, requireAuth } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { BriefcaseBusiness, MapPin, MoreHorizontal, PauseCircle, PlayCircle, Search, Sparkles, Trash2, Users } from "lucide-react";

type OffreEntreprise = {
  id_offre: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  salaire_min?: string;
  salaire_max?: string;
  statut: "active" | "inactive" | "pourvue" | "expiree";
  date_limite?: string;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  created_at: string;
  candidatures_count: number;
  vues_count: number;
};

type OffreEntrepriseBrute = Partial<OffreEntreprise> & {
  id?: string | number | null;
};

type OffreFormulaire = {
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  salaire_min: string;
  salaire_max: string;
  date_limite: string;
  competences_requises: string;
  experience_requise: string;
  niveau_etude: string;
};

const PAGE_SIZE = 12;

function normaliserOffresEntreprise(items: unknown): OffreEntreprise[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const offre = item as OffreEntrepriseBrute;
    const identifiant = offre.id_offre ?? offre.id;

    if (identifiant === undefined || identifiant === null || identifiant === "") {
      return [];
    }

    return [
      {
        ...offre,
        id_offre: String(identifiant),
      } as OffreEntreprise,
    ];
  });
}

const experienceOptions = [
  "Aucune experience requise",
  "0-1 an",
  "1-2 ans",
  "2-3 ans",
  "3-5 ans",
  "5 ans et plus",
];

const educationOptions = [
  "Aucun diplome specifique",
  "Bac",
  "Bac+2",
  "Licence",
  "Master",
  "Diplome d'ingenieur",
  "Doctorat",
];

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const tndNumberFormatter = new Intl.NumberFormat("fr-TN", {
  maximumFractionDigits: 0,
});

const formatSalaryTnd = (value?: string | number | null) => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return "\u2014";
  }

  return tndNumberFormatter.format(numericValue);
};

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "\u2014";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString("en-GB");
}

function getStatusBadgeConfig(statut: OffreEntreprise["statut"]) {
  switch (statut) {
    case "active":
      return { label: "Active", className: "status-active" };
    case "expiree":
      return { label: "Expired", className: "status-expired" };
    case "pourvue":
      return { label: "Filled", className: "status-filled" };
    case "inactive":
    default:
      return { label: "Draft", className: "status-draft" };
  }
}

function contractTypeLabel(typePoste?: string) {
  if (!typePoste) return "N/A";
  return typePoste.toUpperCase();
}

function contractIcon(typePoste?: string) {
  const value = String(typePoste || "").toLowerCase();
  if (value.includes("cdi")) return "CDI";
  if (value.includes("cdd")) return "CDD";
  if (value.includes("stage")) return "ST";
  if (value.includes("alternance")) return "ALT";
  return "JOB";
}

function formatSalaryRange(offre: OffreEntreprise) {
  const min = formatSalaryTnd(offre.salaire_min);
  const max = formatSalaryTnd(offre.salaire_max);

  if (min === "\u2014" && max === "\u2014") {
    return "Salary not shared";
  }

  if (min !== "\u2014" && max !== "\u2014") {
    return `${min} - ${max} TND`;
  }

  return `${min !== "\u2014" ? min : max} TND`;
}

function parseNonNegativeSalary(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.max(0, numericValue);
}

function workModeLabel(localisation?: string) {
  const value = String(localisation || "").toLowerCase();
  if (value.includes("remote") || value.includes("distance") || value.includes("distanciel")) return "Remote";
  if (value.includes("hybride") || value.includes("hybrid")) return "Hybrid";
  return "On-site";
}

function mapOffreToFormulaire(offre: OffreEntreprise): OffreFormulaire {
  return {
    titre: offre.titre || "",
    description: offre.description || "",
    localisation: offre.localisation || "",
    type_poste: offre.type_poste || "CDI",
    salaire_min: offre.salaire_min || "",
    salaire_max: offre.salaire_max || "",
    date_limite: offre.date_limite || "",
    competences_requises: offre.competences_requises || "",
    experience_requise: offre.experience_requise || "",
    niveau_etude: offre.niveau_etude || "",
  };
}

function MesOffresPage() {
  const searchParams = useSearchParams();
  const [offres, setOffres] = useState<OffreEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offreEnEdition, setOffreEnEdition] = useState<OffreEntreprise | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtreRecherche, setFiltreRecherche] = useState("");
  const [filtreStatus, setFiltreStatus] = useState("");
  const [filtreTypeContrat, setFiltreTypeContrat] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!requireAuth("entreprise")) {
      setErreur("Accès non autorisé. Connectez-vous avec un compte entreprise.");
      setLoading(false);
      return;
    }
    void chargerOffres();
  }, []);

  useEffect(() => {
    const preset = searchParams.get("listing");
    if (preset === "drafts") {
      setFiltreStatus("inactive");
      setPage(1);
      return;
    }
    if (preset === "expired") {
      setFiltreStatus("expiree");
      setPage(1);
      return;
    }
    setFiltreStatus("");
    setPage(1);
  }, [searchParams]);

  const chargerOffres = async () => {
    try {
      setErreur(null);
      setLoading(true);

      if (!isAuthenticated()) {
        setErreur("Votre session a expiré. Veuillez vous reconnecter.");
        return;
      }

      const response = await authenticatedFetch(construireUrlApi("/api/entreprise/offres"));

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const items = data?.donnees?.offres || [];
        setOffres(normaliserOffresEntreprise(items));
        return;
      }

      if (response.status === 404) {
        setErreur("L'API backend n'est pas encore disponible. Affichage des données locales de test.");
        const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
        if (offresTest.length === 0) {
          const seedData: OffreEntreprise[] = [
            {
              id_offre: "1",
              titre: "Developpeur Full Stack",
              description: "Développer des fonctionnalités web et des API au sein d'une équipe produit collaborative.",
              localisation: "Tunis",
              type_poste: "CDI",
              salaire_min: "2200",
              salaire_max: "3000",
              statut: "active",
              date_limite: "2026-12-17",
              created_at: "2026-03-31",
              candidatures_count: 0,
              vues_count: 0,
            },
          ];
          localStorage.setItem("offres_test", JSON.stringify(seedData));
          setOffres(normaliserOffresEntreprise(seedData));
        } else {
          setOffres(normaliserOffresEntreprise(offresTest));
        }
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Erreur inconnue." }));
      setErreur(`Impossible de charger les offres : ${errorData.message || "Erreur inconnue."}`);
      setOffres([]);
    } catch (error: unknown) {
      const fallback = error instanceof Error ? error.message : "Erreur inconnue.";
      setErreur(`Le backend est indisponible. Le mode hors ligne est activé. (${fallback})`);
      const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
      setOffres(normaliserOffresEntreprise(offresTest));
    } finally {
      setLoading(false);
    }
  };

  const creerNouvelleOffre = async (nouvelleOffre: OffreFormulaire) => {
    try {
      setErreur(null);
      const salaireMin = parseNonNegativeSalary(nouvelleOffre.salaire_min);
      const salaireMax = parseNonNegativeSalary(nouvelleOffre.salaire_max);

      if (salaireMin !== null && salaireMax !== null && salaireMax < salaireMin) {
        setErreur("Le salaire maximum doit etre superieur ou egal au salaire minimum.");
        return;
      }

      if (nouvelleOffre.date_limite && nouvelleOffre.date_limite < getTodayDateInputValue()) {
        setErreur("La date limite de candidature ne peut pas être dans le passé.");
        return;
      }

      if (!isAuthenticated()) {
        setErreur("Votre session a expiré. Veuillez vous reconnecter.");
        return;
      }

      const typePosteNormalise =
        {
          cdi: "cdi",
          cdd: "cdd",
          stage: "stage",
          freelance: "freelance",
          alternance: "alternance",
        }[String(nouvelleOffre.type_poste || "").toLowerCase()] || String(nouvelleOffre.type_poste || "").toLowerCase();

      const payload = {
        ...nouvelleOffre,
        type_poste: typePosteNormalise,
        salaire_min: salaireMin === null ? "" : String(salaireMin),
        salaire_max: salaireMax === null ? "" : String(salaireMax),
      };

      const response = await authenticatedFetch(construireUrlApi("/api/entreprise/offres"), {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setMessage("Offre envoyée pour validation administrateur.");
        void chargerOffres();
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Erreur inconnue." }));
      setErreur(`Impossible de créer l'offre : ${errorData.message || "Erreur inconnue."}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue.";
      setErreur(`Impossible de créer l'offre : ${detail}`);
    }
  };

  const modifierOffre = async (id: string, offreMiseAJour: OffreFormulaire) => {
    try {
      setErreur(null);
      const salaireMin = parseNonNegativeSalary(offreMiseAJour.salaire_min);
      const salaireMax = parseNonNegativeSalary(offreMiseAJour.salaire_max);

      if (salaireMin !== null && salaireMax !== null && salaireMax < salaireMin) {
        setErreur("Le salaire maximum doit etre superieur ou egal au salaire minimum.");
        return;
      }

      if (offreMiseAJour.date_limite && offreMiseAJour.date_limite < getTodayDateInputValue()) {
        setErreur("La date limite de candidature ne peut pas être dans le passé.");
        return;
      }

      if (!isAuthenticated()) {
        setErreur("Votre session a expiré. Veuillez vous reconnecter.");
        return;
      }

      const typePosteNormalise =
        {
          cdi: "cdi",
          cdd: "cdd",
          stage: "stage",
          freelance: "freelance",
          alternance: "alternance",
        }[String(offreMiseAJour.type_poste || "").toLowerCase()] || String(offreMiseAJour.type_poste || "").toLowerCase();

      const payload = {
        ...offreMiseAJour,
        type_poste: typePosteNormalise,
        salaire_min: salaireMin === null ? "" : String(salaireMin),
        salaire_max: salaireMax === null ? "" : String(salaireMax),
      };
      const response = await authenticatedFetch(construireUrlApi(`/api/entreprise/offres/${id}`), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setOffreEnEdition(null);
        setMessage("Offer updated successfully.");
        void chargerOffres();
        return;
      }

      if (response.status === 404) {
        const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
        const offresModifiees = offresTest.map((offre) =>
          offre.id_offre === id
            ? {
                ...offre,
                ...payload,
              }
            : offre,
        );
        localStorage.setItem("offres_test", JSON.stringify(offresModifiees));
        setOffreEnEdition(null);
        setMessage("Offer updated successfully. (Local mode)");
        void chargerOffres();
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Unknown error." }));
      setErreur(`Impossible de mettre a jour l'offre : ${errorData.message || "Erreur inconnue."}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue.";
      const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
      const offresModifiees = offresTest.map((offre) =>
        offre.id_offre === id
          ? {
              ...offre,
              ...offreMiseAJour,
            }
          : offre,
      );
      localStorage.setItem("offres_test", JSON.stringify(offresModifiees));
      setOffreEnEdition(null);
      setMessage(`Offre mise a jour avec succes. (Mode hors ligne : ${detail})`);
      void chargerOffres();
    }
  };

  const changerStatut = async (id: string, nouveauStatut: OffreEntreprise["statut"]) => {
    try {
      setErreur(null);
      const token = localStorage.getItem("token_auth");

      const response = await fetch(`http://localhost:4000/api/entreprise/offres/${id}/statut`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      });

      if (response.ok) {
        setMessage(`Role ${nouveauStatut === "active" ? "activated" : "paused"} successfully.`);
        void chargerOffres();
        return;
      }

      if (response.status === 404) {
        const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
        const offresModifiees = offresTest.map((offre) => (offre.id_offre === id ? { ...offre, statut: nouveauStatut } : offre));
        localStorage.setItem("offres_test", JSON.stringify(offresModifiees));
        setMessage(`Role ${nouveauStatut === "active" ? "activated" : "paused"} successfully. (Local mode)`);
        void chargerOffres();
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Unknown error." }));
      setErreur(`Impossible de modifier le statut de l'offre : ${errorData.message}`);
    } catch {
      const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
      const offresModifiees = offresTest.map((offre) => (offre.id_offre === id ? { ...offre, statut: nouveauStatut } : offre));
      localStorage.setItem("offres_test", JSON.stringify(offresModifiees));
      setMessage(`Role ${nouveauStatut === "active" ? "activated" : "paused"} successfully. (Offline mode)`);
      void chargerOffres();
    }
  };

  const supprimerOffre = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      setErreur(null);
      const token = localStorage.getItem("token_auth");

      const response = await fetch(`http://localhost:4000/api/entreprise/offres/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setMessage("Role deleted successfully.");
        void chargerOffres();
        return;
      }

      if (response.status === 404) {
        const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
        const offresFiltered = offresTest.filter((offre) => offre.id_offre !== id);
        localStorage.setItem("offres_test", JSON.stringify(offresFiltered));
        setMessage("Role deleted successfully. (Local mode)");
        void chargerOffres();
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Unknown error." }));
      setErreur(`Impossible de supprimer l'offre : ${errorData.message}`);
    } catch {
      const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
      const offresFiltered = offresTest.filter((offre) => offre.id_offre !== id);
      localStorage.setItem("offres_test", JSON.stringify(offresFiltered));
      setMessage("Role deleted successfully. (Offline mode)");
      void chargerOffres();
    }
  };

  const offresFiltrees = useMemo(() => {
    const recherche = filtreRecherche.trim().toLowerCase();
    return offres
      .filter((item) => {
        if (!recherche) return true;
        return item.titre.toLowerCase().includes(recherche) || item.localisation.toLowerCase().includes(recherche);
      })
      .filter((item) => (filtreStatus ? item.statut === filtreStatus : true))
      .filter((item) => (filtreTypeContrat ? item.type_poste.toLowerCase() === filtreTypeContrat.toLowerCase() : true))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [offres, filtreRecherche, filtreStatus, filtreTypeContrat]);

  const totalPages = Math.max(1, Math.ceil(offresFiltrees.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const startIndex = (pageSafe - 1) * PAGE_SIZE;
  const offresPage = offresFiltrees.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filtreRecherche, filtreStatus, filtreTypeContrat]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const typesDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const offre of offres) {
      if (offre.type_poste) set.add(offre.type_poste);
    }
    return Array.from(set.values());
  }, [offres]);

  const utilisateur = getUtilisateurConnecte();
  const entrepriseNom = utilisateur?.nom || "entreprise";
  const hasActiveFilters = Boolean(filtreRecherche.trim() || filtreStatus || filtreTypeContrat);

  if (loading) {
    return (
      <div className="listings-dashboard listings-loading-shell">
        <LoadingState title="Chargement des offres" description="Nous preparons votre espace de pilotage." />
      </div>
    );
  }

  return (
    <div className="listings-dashboard" aria-live="polite">
      <div className="listings-header">
        <div className="header-actions">
          <Button onClick={() => setShowCreateModal(true)}>Creer une offre</Button>
        </div>
      </div>

      {message ? (
        <div className="alert alert-success" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} type="button">x</button>
        </div>
      ) : null}
      {erreur ? (
        <div className="alert alert-error" role="alert">
          <span>{erreur}</span>
          <button onClick={() => setErreur(null)} type="button">x</button>
        </div>
      ) : null}

      <section className="filter-bar" aria-label="Filtrer les offres">
        <label className="filter-search ht-search-control">
          <Search size={16} aria-hidden="true" />
          <input
            value={filtreRecherche}
            onChange={(event) => setFiltreRecherche(event.target.value)}
            placeholder="Rechercher une offre..."
            aria-label="Rechercher par titre ou localisation"
          />
        </label>
        <select className="ht-filter-control" value={filtreStatus} onChange={(event) => setFiltreStatus(event.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="active">Active</option>
          <option value="inactive">Draft</option>
          <option value="expiree">Expired</option>
          <option value="pourvue">Filled</option>
        </select>
        <select className="ht-filter-control" value={filtreTypeContrat} onChange={(event) => setFiltreTypeContrat(event.target.value)} aria-label="Filtrer par type de contrat">
          <option value="">Tous les contrats</option>
          {typesDisponibles.map((type) => (
            <option key={type} value={type}>
              {contractTypeLabel(type)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="filter-reset"
          onClick={() => {
            setFiltreRecherche("");
            setFiltreStatus("");
            setFiltreTypeContrat("");
            setPage(1);
          }}
        >
          Reinitialiser
        </button>
      </section>

      {offresFiltrees.length === 0 ? (
        <section className="empty-state">
          <svg viewBox="0 0 160 120" className="empty-illustration" aria-hidden="true">
            <rect x="20" y="26" width="120" height="68" rx="14" fill="#F6F5F8" stroke="#D9D5DF" />
            <rect x="36" y="44" width="54" height="10" rx="5" fill="#D8CAF6" />
            <rect x="36" y="62" width="82" height="8" rx="4" fill="#ECEAF0" />
            <circle cx="123" cy="42" r="11" fill="#35063E" />
            <path d="M123 36v12M117 42h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3>{hasActiveFilters ? "Aucune offre ne correspond a vos criteres" : "Aucune offre publiee pour le moment"}</h3>
          <p>
            {hasActiveFilters
              ? "Elargissez la recherche ou reinitialisez vos filtres pour afficher plus de resultats."
              : `${entrepriseNom}, publiez votre premiere offre pour lancer le recrutement.`}
          </p>
          {hasActiveFilters ? (
            <Button
              variant="secondary"
              onClick={() => {
                setFiltreRecherche("");
                setFiltreStatus("");
                setFiltreTypeContrat("");
                setPage(1);
              }}
            >
              Reinitialiser les filtres
            </Button>
          ) : (
            <Button onClick={() => setShowCreateModal(true)}>Creer ma premiere offre</Button>
          )}
        </section>
      ) : (
        <section className="roles-grid">
          {offresPage.map((offre) => {
            const status = getStatusBadgeConfig(offre.statut);
            const isActive = offre.statut === "active";
            return (
              <article className="role-card" key={offre.id_offre}>
                <div className="role-card-top">
                  <span className={`status-badge ${status.className}`}>
                    <i aria-hidden="true" />
                    {status.label}
                  </span>
                  <details className="role-menu">
                    <summary aria-label={`More actions for ${offre.titre}`}>
                      <MoreHorizontal size={17} />
                    </summary>
                    <div>
                      <button type="button" onClick={() => setOffreEnEdition(offre)}>
                        <BriefcaseBusiness size={14} /> Modifier
                      </button>
                      <button type="button" onClick={() => changerStatut(offre.id_offre, isActive ? "inactive" : "active")}>
                        {isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                        {isActive ? "Mettre en pause" : "Activer"}
                      </button>
                      <button type="button" className="danger-item" onClick={() => supprimerOffre(offre.id_offre)}>
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </details>
                </div>

                <div className="role-card-main">
                  <div className="role-icon">{contractIcon(offre.type_poste)}</div>
                  <div>
                    <Heading as="h3" variant="card">{offre.titre}</Heading>
                    <Text as="p" variant="small" className="role-card-meta">
                      <MapPin size={13} />
                      {offre.localisation || "Localisation non renseignee"} <span aria-hidden="true">•</span> {contractTypeLabel(offre.type_poste)}{" "}
                      <span aria-hidden="true">•</span> {workModeLabel(offre.localisation)}
                    </Text>
                  </div>
                </div>

                <p className="role-salary">{formatSalaryRange(offre)}</p>

                <div className="role-metrics" aria-label={`Metrics for ${offre.titre}`}>
                  <span className="metric-primary">
                    <Users size={14} />
                    <Stat size="compact" value={offre.candidatures_count || 0} label="Candidatures" />
                  </span>
                  <span>
                    <Sparkles size={14} />
                    <Stat size="compact" value="-" label="Analyse IA" />
                  </span>
                </div>

                <div className="role-card-foot">
                  <span>Date limite {formatDate(offre.date_limite)}</span>
                  <ButtonLink href="/entreprise/candidatures" size="sm" className="role-card-cta">
                    Voir les candidatures
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 ? (
        <footer className="pagination-bar">
          <p>
            {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, offresFiltrees.length)} of {offresFiltrees.length} roles
          </p>
          <div>
            <button type="button" disabled={pageSafe <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {"<"}
            </button>
            <span>{pageSafe}</span>
            <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              {">"}
            </button>
          </div>
        </footer>
      ) : null}

      {showCreateModal || offreEnEdition ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h2>{offreEnEdition ? "Edit role" : "Create a new role"}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setOffreEnEdition(null);
                }}
                type="button"
              >
                x
              </button>
            </div>

            <ModalCreationOffre
              key={offreEnEdition ? `edit-${offreEnEdition.id_offre}` : "create-offer"}
              initialValues={offreEnEdition ? mapOffreToFormulaire(offreEnEdition) : undefined}
              submitLabel={offreEnEdition ? "Save changes" : "Create role"}
              onSubmit={(offre) => {
                if (offreEnEdition) {
                  void modifierOffre(offreEnEdition.id_offre, offre);
                  return;
                }
                void creerNouvelleOffre(offre);
              }}
              onCancel={() => {
                setShowCreateModal(false);
                setOffreEnEdition(null);
              }}
            />
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .listings-dashboard {
          background: var(--color-bg, #fbfafc);
          border-radius: 24px;
          padding: 16px;
          min-height: calc(100vh - 120px);
        }
        .listings-loading-shell {
          display: grid;
          align-items: center;
        }
        .listings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }
        .listings-header h1 {
          margin: 0;
          font-size: clamp(2rem, 3.2vw, 2.5rem);
          color: #14111a;
          line-height: 1.1;
        }
        .listings-header p {
          margin: 4px 0 0;
          color: #6b6478;
        }
        .header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 10px;
          font-size: 0.9rem;
          animation: fadeIn 180ms ease;
        }
        .alert button {
          border: none;
          background: transparent;
          font-size: 1rem;
          cursor: pointer;
        }
        .alert-success {
          background: #ebf8ee;
          color: #215f3d;
          border: 1px solid #b7e4c8;
        }
        .alert-error {
          background: #fdecef;
          color: #8f2233;
          border: 1px solid #f4b6c2;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        .kpi-card {
          background: #fff;
          border: 1px solid #ece5f8;
          border-radius: 18px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 22px rgba(53, 6, 62, 0.05);
          transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          border-color: #d8caf6;
          box-shadow: 0 14px 28px rgba(20, 17, 26, 0.12);
        }
        .kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 0.7rem;
          color: #5f2ac8;
          background: #efe5ff;
        }
        .kpi-green {
          color: #279658;
          background: #e7f6ec;
        }
        .kpi-blue {
          color: #2b6bd2;
          background: #e6f1ff;
        }
        .kpi-orange {
          color: #dd850f;
          background: #fff2df;
        }
        .kpi-card strong {
          display: block;
          color: #251742;
          font-size: 2rem;
          line-height: 1;
        }
        .kpi-card p {
          margin: 4px 0 1px;
          color: #3f325a;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .kpi-card small {
          color: #8f88a7;
          font-size: 0.75rem;
        }
        .filter-bar {
          background: #fff;
          border: 1px solid #ece5f8;
          border-radius: 18px;
          padding: 12px;
          display: grid;
          grid-template-columns: minmax(240px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr) auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }
        .filter-input,
        .filter-select {
          border: 1px solid #ddd3f2;
          border-radius: 12px;
          min-height: 42px;
          padding: 0 12px;
          color: #2e214b;
          background: #fff;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .filter-input:focus-visible,
        .filter-select:focus-visible {
          outline: none;
          border-color: #d8caf6;
          box-shadow: var(--ring-focus, 0 0 0 3px #d8caf6);
        }
        .roles-list {
          display: grid;
          gap: 10px;
        }
        .role-card {
          background: #fff;
          border: 1px solid #ece5f8;
          border-radius: 20px;
          padding: 12px;
          display: grid;
          grid-template-columns: 70px minmax(180px, 1.25fr) minmax(160px, 0.9fr) minmax(180px, 0.8fr) minmax(360px, 1.5fr);
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(20, 17, 26, 0.06), 0 1px 2px rgba(20, 17, 26, 0.04);
          transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
        }
        .role-card:hover {
          transform: translateY(-2px);
          border-color: #d8caf6;
          box-shadow: 0 4px 12px rgba(20, 17, 26, 0.08), 0 2px 4px rgba(20, 17, 26, 0.06);
        }
        .role-left {
          display: grid;
          gap: 8px;
        }
        .role-avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #6a34ca;
          background: #f2e8ff;
          font-weight: 800;
        }
        .role-badges {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .contract-badge,
        .status-badge {
          border-radius: 999px;
          padding: 3px 9px;
          font-size: 0.7rem;
          font-weight: 700;
          width: fit-content;
          animation: fadeIn 220ms ease;
        }
        .contract-badge {
          background: #efe8fb;
          color: #6337b6;
        }
        .status-active {
          background: #dff7e8;
          color: #1f8a49;
        }
        .status-draft {
          background: #f0edf8;
          color: #625a79;
        }
        .status-expired {
          background: #ffe8ed;
          color: #b63245;
        }
        .status-filled {
          background: #e8f0ff;
          color: #2e60bf;
        }
        .role-main h3 {
          margin: 0;
          font-size: 1.35rem;
          color: #241741;
        }
        .role-location {
          margin: 4px 0;
          color: #7c7496;
          font-size: 0.85rem;
        }
        .role-salary {
          margin: 0;
          color: #5f2ac8;
          font-weight: 800;
          font-size: 1.45rem;
          line-height: 1.1;
        }
        .role-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .role-stats div {
          text-align: center;
          padding: 8px 6px;
          border-left: 1px solid #ede5f9;
        }
        .role-stats strong {
          display: block;
          color: #251842;
          font-size: 2.1rem;
          line-height: 1;
        }
        .role-stats span {
          color: #7c7597;
          font-size: 0.75rem;
        }
        .role-dates {
          display: grid;
          gap: 8px;
        }
        .role-dates p {
          margin: 0;
          display: grid;
          gap: 1px;
        }
        .role-dates span {
          color: #7a7294;
          font-size: 0.76rem;
        }
        .role-dates strong {
          color: #2c1d49;
          font-size: 0.85rem;
        }
        .role-dates .expiry {
          color: #d2374c;
        }
        .role-actions {
          display: grid;
          justify-items: end;
          gap: 10px;
        }
        .dots-btn {
          border: 1px solid #e7def4;
          background: #fff;
          border-radius: 10px;
          min-width: 34px;
          min-height: 34px;
          color: #8f87aa;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, transform 150ms ease, background-color 150ms ease;
        }
        .dots-btn:hover {
          color: #35063e;
          border-color: #d8caf6;
          background: #f6f5f8;
        }
        .actions-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .pagination-bar {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #655d7f;
          font-size: 0.86rem;
        }
        .pagination-bar div {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pagination-bar button {
          border: 1px solid #e0d6f3;
          background: #fff;
          color: #5527b6;
          border-radius: 10px;
          width: 30px;
          height: 30px;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease, transform 150ms ease, background-color 150ms ease;
        }
        .pagination-bar button:hover:not(:disabled) {
          border-color: #d8caf6;
          color: #35063e;
          background: #f6f5f8;
        }
        .pagination-bar button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pagination-bar span {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #5f2ac8;
          color: #fff;
          font-weight: 700;
        }
        .empty-state {
          background: #fff;
          border: 1px solid #ece5f8;
          border-radius: 20px;
          padding: 36px 14px;
          text-align: center;
          margin-top: 10px;
          display: grid;
          gap: 14px;
          justify-items: center;
        }
        .empty-illustration {
          width: 160px;
          height: 120px;
        }
        .empty-state h3 {
          margin: 0;
          color: #271942;
          font-size: 1.35rem;
        }
        .empty-state p {
          margin: 0;
          color: #7a7295;
          max-width: 540px;
        }
        .offres-loading {
          min-height: 50vh;
          display: grid;
          place-items: center;
          color: #605a7a;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e6dbf5;
          border-top-color: #5f2ac8;
          border-radius: 999px;
          animation: spin 1s linear infinite;
          margin: 0 auto 8px;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(14, 14, 24, 0.48);
          backdrop-filter: blur(3px);
          display: grid;
          place-items: center;
          z-index: 50;
          padding: 16px;
        }
        .modal-card {
          width: min(820px, 100%);
          max-height: calc(100vh - 32px);
          overflow: auto;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #ebe2f8;
          box-shadow: 0 24px 44px rgba(53, 6, 62, 0.2);
          padding: 18px;
        }
        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .modal-head h2 {
          margin: 0;
          color: #21173a;
        }
        .modal-head button {
          border: none;
          background: #f4f0fb;
          color: #6f678a;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          cursor: pointer;
        }
        .listings-dashboard :global(button),
        .listings-dashboard :global(a) {
          transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
        }
        .listings-dashboard :global(button):active,
        .listings-dashboard :global(a):active {
          transform: scale(0.98);
        }
        .listings-dashboard :global(button):focus-visible,
        .listings-dashboard :global(a):focus-visible,
        .dots-btn:focus-visible,
        .pagination-bar button:focus-visible {
          outline: none;
          box-shadow: var(--ring-focus, 0 0 0 3px #d8caf6);
        }
        .actions-row :global(a),
        .actions-row :global(button) {
          min-height: 40px;
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
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 1400px) {
          .role-card {
            grid-template-columns: 68px 1fr 1fr;
            gap: 10px;
          }
          .role-dates,
          .role-actions {
            grid-column: span 3;
          }
          .role-actions {
            justify-items: start;
          }
          .actions-row {
            justify-content: flex-start;
          }
        }
        @media (max-width: 1080px) {
          .listings-dashboard {
            padding: 24px;
          }
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .filter-bar {
            grid-template-columns: 1fr 1fr;
          }
          .filter-input {
            grid-column: span 2;
          }
        }
        .listings-dashboard {
          position: relative;
          min-height: calc(100vh - 120px);
          padding: 22px;
          border-radius: 24px;
          background:
            radial-gradient(circle at 84% 0%, rgba(109, 40, 217, 0.1), transparent 30%),
            linear-gradient(180deg, #fbfaff 0%, #f7f4fb 100%);
        }

        .listings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 14px;
        }

        .listings-header h1 {
          margin: 0;
          color: #16051f;
          font-size: clamp(2rem, 3vw, 2.6rem);
          line-height: 1;
          letter-spacing: 0;
        }

        .listings-header p {
          margin: 7px 0 0;
          color: #6c617a;
          font-size: 0.95rem;
        }

        .header-actions :global(.ui-button) {
          min-height: 42px;
          border-radius: 12px;
          background: var(--app-primary);
          border-color: var(--app-primary);
          box-shadow: 0 16px 32px rgba(var(--app-primary-rgb), 0.22);
        }

        .header-actions :global(.ui-button:hover) {
          background: var(--app-primary-hover);
          border-color: var(--app-primary-hover);
        }

        .filter-bar {
          min-height: 62px;
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 170px 180px auto;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          padding: 10px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 14px 34px rgba(var(--app-primary-rgb), 0.08);
          backdrop-filter: blur(16px);
        }

        .filter-search {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          min-height: 42px;
          padding: 0 12px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.13);
          border-radius: 12px;
          background: #fff;
          color: var(--app-primary);
        }

        .filter-search input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #201337;
          font-size: 0.86rem;
        }

        .filter-search input::placeholder {
          color: #8b8196;
        }

        .filter-bar select {
          min-height: 42px;
          width: 100%;
          border: 1px solid rgba(var(--app-primary-rgb), 0.13);
          border-radius: 12px;
          background: #fff;
          color: #2a173d;
          padding: 0 12px;
          font-size: 0.86rem;
          outline: 0;
        }

        .filter-search:focus-within,
        .filter-bar select:focus-visible {
          border-color: rgba(var(--app-primary-rgb), 0.32);
          box-shadow: 0 0 0 4px rgba(var(--app-primary-rgb), 0.1);
        }

        .filter-reset {
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.16);
          border-radius: 12px;
          background: rgba(var(--app-primary-rgb), 0.06);
          color: var(--app-primary);
          font-size: 0.84rem;
          font-weight: 850;
          cursor: pointer;
        }

        .filter-reset:hover {
          background: var(--app-primary);
          border-color: var(--app-primary);
          color: #fff;
        }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(280px, 1fr));
          gap: 14px;
        }

        .role-card {
          position: relative;
          min-height: 278px;
          max-height: 320px;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto auto 1fr auto;
          gap: 12px;
          padding: 16px;
          overflow: visible;
          border: 1px solid rgba(76, 29, 149, 0.11);
          border-radius: 20px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(253, 251, 255, 0.94)),
            radial-gradient(circle at 90% 0%, rgba(109, 40, 217, 0.12), transparent 32%);
          box-shadow: 0 18px 44px rgba(42, 8, 69, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9) inset;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .role-card:hover {
          transform: translateY(-3px);
          border-color: rgba(109, 40, 217, 0.28);
          box-shadow: 0 24px 60px rgba(42, 8, 69, 0.13);
        }

        .role-card-top,
        .role-card-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 850;
          letter-spacing: 0;
        }

        .status-badge i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 14%, transparent);
        }

        .status-active {
          color: #4c1d95;
          background: rgba(109, 40, 217, 0.1);
        }

        .status-draft {
          color: #5c526c;
          background: rgba(42, 8, 69, 0.07);
        }

        .status-expired {
          color: #7f3154;
          background: rgba(127, 49, 84, 0.1);
        }

        .status-filled {
          color: #2a0845;
          background: rgba(42, 8, 69, 0.12);
        }

        .role-menu {
          position: relative;
          z-index: 5;
        }

        .role-menu summary {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(76, 29, 149, 0.13);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.82);
          color: #4c1d95;
          cursor: pointer;
          list-style: none;
        }

        .role-menu summary::-webkit-details-marker {
          display: none;
        }

        .role-menu[open] summary {
          background: #f2edff;
          border-color: rgba(109, 40, 217, 0.28);
        }

        .role-menu div {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 174px;
          display: grid;
          gap: 3px;
          padding: 7px;
          border: 1px solid rgba(76, 29, 149, 0.12);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 22px 46px rgba(42, 8, 69, 0.18);
          backdrop-filter: blur(14px);
        }

        .role-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          min-height: 34px;
          padding: 0 9px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #2a173d;
          font-size: 0.82rem;
          font-weight: 760;
          cursor: pointer;
          text-align: left;
        }

        .role-menu button:hover {
          background: rgba(109, 40, 217, 0.08);
          color: #4c1d95;
        }

        .role-menu .danger-item {
          color: #9f2f4a;
        }

        .role-menu .danger-item:hover {
          background: rgba(159, 47, 74, 0.08);
          color: #8d2039;
        }

        .role-card-main {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
        }

        .role-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #2a0845, #5b21b6);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 900;
          box-shadow: 0 14px 26px rgba(76, 29, 149, 0.22);
        }

        .role-card-main h3 {
          margin: 0;
          overflow: hidden;
          color: #16051f;
          font-size: 1.15rem;
          line-height: 1.16;
          letter-spacing: 0;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .role-card-main p,
        .role-card-main :global(.role-card-meta) {
          margin: 6px 0 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 5px;
          color: #6c617a;
          font-size: 0.78rem;
          line-height: 1.3;
        }

        .role-salary {
          margin: 0;
          color: #4c1d95;
          font-size: 1.02rem;
          font-weight: 900;
          line-height: 1.15;
        }

        .role-metrics {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 8px;
          align-items: stretch;
        }

        .role-metrics span {
          min-width: 0;
          display: grid;
          grid-template-columns: auto 1fr;
          align-content: center;
          gap: 2px 6px;
          min-height: 54px;
          padding: 9px;
          border: 1px solid rgba(76, 29, 149, 0.08);
          border-radius: 14px;
          background: rgba(76, 29, 149, 0.04);
          color: #746a81;
          font-size: 0.68rem;
          font-weight: 750;
        }

        .role-metrics svg {
          grid-row: span 2;
          align-self: center;
          color: #5b21b6;
        }

        .role-metrics strong {
          color: #1b0628;
          font-size: 1.04rem;
          line-height: 1;
        }

        .role-metrics .metric-primary {
          background: linear-gradient(135deg, rgba(76, 29, 149, 0.1), rgba(109, 40, 217, 0.06));
          border-color: rgba(76, 29, 149, 0.15);
        }

        .role-card-foot {
          padding-top: 2px;
        }

        .role-card-foot > span {
          color: #85798f;
          font-size: 0.75rem;
          font-weight: 740;
        }

        .role-card-foot :global(.ui-button) {
          inline-size: min(100%, 156px);
          min-height: 36px;
          padding: 6px 12px;
          border-radius: 11px;
          background: var(--app-primary);
          border-color: var(--app-primary);
          box-shadow: 0 12px 24px rgba(var(--app-primary-rgb), 0.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: normal;
          line-height: 1.12;
          overflow-wrap: anywhere;
        }

        .role-card-foot :global(.ui-button:hover) {
          background: var(--app-primary-hover);
          border-color: var(--app-primary-hover);
        }

        .pagination-bar {
          margin-top: 14px;
          padding: 0 4px;
        }

        .empty-state {
          border: 1px solid rgba(76, 29, 149, 0.12);
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 18px 46px rgba(42, 8, 69, 0.08);
          backdrop-filter: blur(14px);
        }

        @media (max-width: 1320px) {
          .roles-grid {
            grid-template-columns: repeat(2, minmax(280px, 1fr));
          }
        }

        @media (max-width: 920px) {
          .filter-bar {
            grid-template-columns: 1fr 1fr;
          }

          .filter-search {
            grid-column: 1 / -1;
          }

          .roles-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .listings-dashboard {
            padding: 16px;
          }
          .listings-header {
            flex-direction: column;
          }

          .filter-bar {
            grid-template-columns: 1fr;
          }

          .role-card {
            grid-template-columns: 1fr;
            min-height: 286px;
          }

          .role-metrics {
            grid-template-columns: 1fr;
          }

          .pagination-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .modal-overlay {
            align-items: end;
            padding: 0;
          }
          .modal-card {
            width: 100%;
            max-height: 92vh;
            border-radius: 20px 20px 0 0;
            padding: 18px;
          }
          .actions-row :global(a),
          .actions-row :global(button),
          .header-actions :global(a),
          .header-actions :global(button) {
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
}

function ModalCreationOffre({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: OffreFormulaire;
  submitLabel?: string;
  onSubmit: (offre: OffreFormulaire) => void;
  onCancel: () => void;
}) {
  const minimumDeadlineDate = useMemo(() => {
    const today = getTodayDateInputValue();
    if (initialValues?.date_limite && initialValues.date_limite < today) {
      return initialValues.date_limite;
    }
    return today;
  }, [initialValues?.date_limite]);
  const [skillInput, setSkillInput] = useState("");
  const [formData, setFormData] = useState<OffreFormulaire>(
    initialValues || {
      titre: "",
      description: "",
      localisation: "",
      type_poste: "CDI",
      salaire_min: "",
      salaire_max: "",
      date_limite: "",
      competences_requises: "",
      experience_requise: "",
      niveau_etude: "",
    },
  );

  const skills = useMemo(
    () =>
      formData.competences_requises
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [formData.competences_requises],
  );
  const salaireMinValue = parseNonNegativeSalary(formData.salaire_min);
  const salaireMaxValue = parseNonNegativeSalary(formData.salaire_max);
  const salaireMinInvalide = formData.salaire_min.trim() !== "" && salaireMinValue === null;
  const salaireMaxInvalide = formData.salaire_max.trim() !== "" && salaireMaxValue === null;
  const salaireRangeInvalide =
    salaireMinValue !== null && salaireMaxValue !== null && salaireMaxValue < salaireMinValue;

  const updateSkills = (nextSkills: string[]) => {
    setFormData((current) => ({
      ...current,
      competences_requises: nextSkills.join(", "),
    }));
  };

  const addSkill = () => {
    const nextSkill = skillInput.trim();
    if (!nextSkill || skills.some((skill) => skill.toLowerCase() === nextSkill.toLowerCase())) {
      setSkillInput("");
      return;
    }
    updateSkills([...skills, nextSkill]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    updateSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const erreurs = [];
    const pendingSkill = skillInput.trim();
    const normalizedSkills =
      pendingSkill && !skills.some((skill) => skill.toLowerCase() === pendingSkill.toLowerCase()) ? [...skills, pendingSkill] : skills;

    if (!formData.titre || formData.titre.length < 3) {
      erreurs.push("The title must be at least 3 characters long.");
    }

    if (!formData.description || formData.description.length < 50) {
      erreurs.push(`The description must be at least 50 characters long (currently: ${formData.description.length}).`);
    }

    if (!formData.localisation) {
      erreurs.push("Location is required.");
    }

    if (salaireMinInvalide || salaireMaxInvalide) {
      erreurs.push("Les salaires doivent etre des nombres valides et non negatifs.");
    }

    if (salaireRangeInvalide) {
      erreurs.push("La valeur du salaire maximum doit etre superieure ou egale a la valeur du salaire minimum.");
    }

    if (!formData.date_limite || formData.date_limite < minimumDeadlineDate) {
      erreurs.push("The application deadline cannot be in the past.");
    }

    if (!formData.experience_requise) {
      erreurs.push("L'experience requise est obligatoire.");
    }

    if (!formData.niveau_etude) {
      erreurs.push("Le niveau d'etudes est obligatoire.");
    }

    if (erreurs.length > 0) {
      alert(`Validation errors:\n\n${erreurs.join("\n")}`);
      return;
    }

    onSubmit({ ...formData, competences_requises: normalizedSkills.join(", ") });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    if (name === "salaire_min" || name === "salaire_max") {
      if (value === "") {
        setFormData((current) => ({
          ...current,
          [name]: "",
        }));
        return;
      }

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        return;
      }

      setFormData((current) => ({
        ...current,
        [name]: String(Math.max(0, numericValue)),
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitDisabled =
    !formData.titre ||
    formData.titre.length < 3 ||
    !formData.description ||
    formData.description.length < 50 ||
    !formData.localisation ||
    salaireMinInvalide ||
    salaireMaxInvalide ||
    salaireRangeInvalide ||
    !formData.date_limite ||
    formData.date_limite < minimumDeadlineDate ||
    !formData.experience_requise ||
    !formData.niveau_etude;

  const fieldBaseClass =
    "h-11 w-full rounded-xl border border-[#ded4eb] bg-white px-3 text-sm text-[#201337] outline-none transition focus:border-[#35063e] focus:ring-2 focus:ring-[#35063e]/20";
  const labelClass = "mb-1 block text-xs font-bold text-[#241436]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className={labelClass}>
            Titre de l&apos;offre *
            <span className="ml-2 font-medium text-[#7c748f]">(min 3)</span>
          </label>
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            className={`${fieldBaseClass} ${
              formData.titre.length > 0 && formData.titre.length < 3
                ? "!border-red-300 bg-red-50"
                : formData.titre.length >= 3
                  ? "!border-green-300 bg-green-50"
                  : ""
            }`}
            placeholder="Exemple : Developpeur full-stack"
            required
          />
          {formData.titre.length > 0 && formData.titre.length < 3 ? (
            <p className="text-xs text-red-600 mt-1">Le titre doit contenir au moins 3 caracteres.</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass}>Localisation *</label>
          <input
            type="text"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            className={fieldBaseClass}
            placeholder="Exemple : Tunis, Sfax, teletravail"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Type de contrat</label>
          <select
            name="type_poste"
            value={formData.type_poste}
            onChange={handleChange}
            className={fieldBaseClass}
          >
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Stage">Stage</option>
            <option value="Freelance">Freelance</option>
            <option value="Alternance">Alternance</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Salaire minimum (TND)</label>
          <input
            type="number"
            min="0"
            step="1"
            name="salaire_min"
            value={formData.salaire_min}
            onChange={handleChange}
            className={`${fieldBaseClass} ${salaireMinInvalide || salaireRangeInvalide ? "!border-red-300 bg-red-50" : formData.salaire_min ? "!border-green-300 bg-green-50" : ""}`}
            placeholder="800"
          />
          {salaireMinInvalide ? <p className="mt-1 text-xs text-red-600">Le salaire minimum doit etre une valeur positive ou nulle.</p> : null}
        </div>

        <div>
          <label className={labelClass}>Salaire maximum (TND)</label>
          <input
            type="number"
            min="0"
            step="1"
            name="salaire_max"
            value={formData.salaire_max}
            onChange={handleChange}
            className={`${fieldBaseClass} ${salaireMaxInvalide || salaireRangeInvalide ? "!border-red-300 bg-red-50" : formData.salaire_max ? "!border-green-300 bg-green-50" : ""}`}
            placeholder="1200"
          />
          {salaireMaxInvalide ? <p className="mt-1 text-xs text-red-600">Le salaire maximum doit etre une valeur positive ou nulle.</p> : null}
          {!salaireMaxInvalide && salaireRangeInvalide ? (
            <p className="mt-1 text-xs text-red-600">La valeur du salaire maximum doit etre superieure ou egale a la valeur du salaire minimum.</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass}>Date limite de candidature *</label>
          <input
            type="date"
            name="date_limite"
            value={formData.date_limite}
            onChange={handleChange}
            min={minimumDeadlineDate}
            aria-describedby="deadline-error"
            className={`${fieldBaseClass} ${
              formData.date_limite && formData.date_limite < minimumDeadlineDate
                ? "!border-red-300 bg-red-50"
                : formData.date_limite
                  ? "!border-green-300 bg-green-50"
                  : ""
            }`}
            required
          />
          {formData.date_limite && formData.date_limite < minimumDeadlineDate ? (
            <p id="deadline-error" className="mt-1 text-xs text-red-600">
              The application deadline cannot be in the past.
            </p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>
            Description de l&apos;offre *
            <span className="ml-2 font-medium text-[#7c748f]">(min 50 - {formData.description.length})</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full rounded-xl border border-[#ded4eb] bg-white px-3 py-2 text-sm text-[#201337] outline-none transition focus:border-[#35063e] focus:ring-2 focus:ring-[#35063e]/20 ${
              formData.description.length > 0 && formData.description.length < 50
                ? "!border-red-300 bg-red-50"
                : formData.description.length >= 50
                  ? "!border-green-300 bg-green-50"
                  : ""
            }`}
            placeholder="Decrivez le poste, les responsabilites et l'environnement de travail..."
            required
          />
          {formData.description.length > 0 && formData.description.length < 50 ? (
            <p className="text-xs text-red-600 mt-1">Il manque encore {50 - formData.description.length} caractere(s).</p>
          ) : null}
          {formData.description.length >= 50 ? (
            <p className="text-xs text-green-600 mt-1">La description est suffisamment detaillee.</p>
          ) : null}
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <label className={labelClass}>Competences requises</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              className={fieldBaseClass}
              placeholder="React, Node.js..."
            />
            <button
              type="button"
              onClick={addSkill}
              className="h-11 rounded-xl bg-[#35063e] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#4a0a58]"
            >
              Ajouter
            </button>
          </div>
          {skills.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full border border-[#dccff0] bg-[#f8f4ff] px-3 py-1 text-xs font-bold text-[#35063e]"
                  aria-label={`Remove ${skill}`}
                >
                  {skill} x
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <label className={labelClass}>Experience requise *</label>
          <select
            name="experience_requise"
            value={formData.experience_requise}
            onChange={handleChange}
            className={fieldBaseClass}
            required
          >
            <option value="" disabled>
              Choisir une experience
            </option>
            {experienceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Niveau d&apos;etudes *</label>
          <select
            name="niveau_etude"
            value={formData.niveau_etude}
            onChange={handleChange}
            className={fieldBaseClass}
            required
          >
            <option value="" disabled>
              Choisir un niveau d&apos;etudes
            </option>
            {educationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-[#eadff4] pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-[#d8cfe8] px-5 text-sm font-bold text-[#241436] transition-colors hover:bg-[#f7f3fb]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitDisabled}
          className={`h-10 rounded-xl px-5 text-sm font-bold transition-colors ${
            submitDisabled ? "cursor-not-allowed bg-gray-200 text-gray-500" : "bg-[#35063e] text-white shadow-lg shadow-[#35063e]/20 hover:bg-[#4a0a58]"
          }`}
        >
          {submitLabel || "Create role"}
        </button>
      </div>
    </form>
  );
}

export default function MesOffresPageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <MesOffresPage />
    </RouteProtegee>
  );
}
