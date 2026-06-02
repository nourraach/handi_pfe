"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RouteProtegee } from "@/components/route-protegee";
import { Button, ButtonLink } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch, getUtilisateurConnecte, isAuthenticated, requireAuth } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

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
  created_at: string;
  candidatures_count: number;
  vues_count: number;
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

function MesOffresPage() {
  const searchParams = useSearchParams();
  const [offres, setOffres] = useState<OffreEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtreRecherche, setFiltreRecherche] = useState("");
  const [filtreStatus, setFiltreStatus] = useState("");
  const [filtreTypeContrat, setFiltreTypeContrat] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!requireAuth("entreprise")) {
      setErreur("Unauthorized access. Sign in with a company account.");
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
        setErreur("Your session has expired. Please sign in again.");
        return;
      }

      const response = await authenticatedFetch(construireUrlApi("/api/entreprise/offres"));

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const items = data?.donnees?.offres || [];
        setOffres(Array.isArray(items) ? items : []);
        return;
      }

      if (response.status === 404) {
        setErreur("The backend API is not available yet. Showing local test data.");
        const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
        if (offresTest.length === 0) {
          const seedData: OffreEntreprise[] = [
            {
              id_offre: "1",
              titre: "Developpeur Full Stack",
              description: "Develop web features and APIs in a collaborative product team.",
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
          setOffres(seedData);
        } else {
          setOffres(offresTest);
        }
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Unknown error." }));
      setErreur(`Unable to load roles: ${errorData.message || "Unknown error."}`);
      setOffres([]);
    } catch (error: unknown) {
      const fallback = error instanceof Error ? error.message : "Unknown error.";
      setErreur(`The backend is unavailable. Offline mode is active. (${fallback})`);
      const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
      setOffres(offresTest);
    } finally {
      setLoading(false);
    }
  };

  const creerNouvelleOffre = async (nouvelleOffre: OffreFormulaire) => {
    try {
      setErreur(null);

      if (nouvelleOffre.date_limite && nouvelleOffre.date_limite < getTodayDateInputValue()) {
        setErreur("The application deadline cannot be in the past.");
        return;
      }

      if (!isAuthenticated()) {
        setErreur("Your session has expired. Please sign in again.");
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

      const payload = { ...nouvelleOffre, type_poste: typePosteNormalise };

      const response = await authenticatedFetch(construireUrlApi("/api/entreprise/offres"), {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setMessage("Offer submitted for admin validation.");
        void chargerOffres();
        return;
      }

      const errorData = await response.json().catch(() => ({ message: "Unknown error." }));
      setErreur(`Unable to create the offer: ${errorData.message || "Unknown error."}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error.";
      setErreur(`Unable to create the offer: ${detail}`);
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
      setErreur(`Unable to change the role status: ${errorData.message}`);
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
      setErreur(`Unable to delete the role: ${errorData.message}`);
    } catch {
      const offresTest = JSON.parse(localStorage.getItem("offres_test") || "[]") as OffreEntreprise[];
      const offresFiltered = offresTest.filter((offre) => offre.id_offre !== id);
      localStorage.setItem("offres_test", JSON.stringify(offresFiltered));
      setMessage("Role deleted successfully. (Offline mode)");
      void chargerOffres();
    }
  };

  const stats = useMemo(() => {
    const totalRoles = offres.length;
    const activeRoles = offres.filter((item) => item.statut === "active").length;
    const applications = offres.reduce((acc, item) => acc + (item.candidatures_count || 0), 0);
    const views = offres.reduce((acc, item) => acc + (item.vues_count || 0), 0);

    return { totalRoles, activeRoles, applications, views };
  }, [offres]);

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
        <div>
          <h1>My job listings</h1>
          <p>Manage your roles and track their performance</p>
        </div>
        <div className="header-actions">
          <Button onClick={() => setShowCreateModal(true)}>Create a role</Button>
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

      <section className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-icon">TR</span>
          <div>
            <strong>{stats.totalRoles}</strong>
            <p>Total roles</p>
            <small>All published roles</small>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-green">AR</span>
          <div>
            <strong>{stats.activeRoles}</strong>
            <p>Active roles</p>
            <small>Currently active</small>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-blue">AP</span>
          <div>
            <strong>{stats.applications}</strong>
            <p>Applications received</p>
            <small>Across all roles</small>
          </div>
        </article>
        <article className="kpi-card">
          <span className="kpi-icon kpi-orange">VW</span>
          <div>
            <strong>{stats.views}</strong>
            <p>Total views</p>
            <small>Across all roles</small>
          </div>
        </article>
      </section>

      <section className="filter-bar">
        <input
          value={filtreRecherche}
          onChange={(event) => setFiltreRecherche(event.target.value)}
          className="filter-input"
          placeholder="Search by role title or location..."
        />
        <select value={filtreStatus} onChange={(event) => setFiltreStatus(event.target.value)} className="filter-select">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Draft</option>
          <option value="expiree">Expired</option>
          <option value="pourvue">Filled</option>
        </select>
        <select value={filtreTypeContrat} onChange={(event) => setFiltreTypeContrat(event.target.value)} className="filter-select">
          <option value="">All types</option>
          {typesDisponibles.map((type) => (
            <option key={type} value={type}>
              {contractTypeLabel(type)}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={() => {
            setFiltreRecherche("");
            setFiltreStatus("");
            setFiltreTypeContrat("");
            setPage(1);
          }}
        >
          Filters
        </Button>
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
        <section className="roles-list">
          {offresPage.map((offre) => {
            const status = getStatusBadgeConfig(offre.statut);
            const isActive = offre.statut === "active";
            return (
              <article className="role-card" key={offre.id_offre}>
                <div className="role-left">
                  <div className="role-avatar">{contractIcon(offre.type_poste)}</div>
                  <div className="role-badges">
                    <span className="contract-badge">{contractTypeLabel(offre.type_poste)}</span>
                    <span className={`status-badge ${status.className}`}>{status.label}</span>
                  </div>
                </div>

                <div className="role-main">
                  <h3>{offre.titre}</h3>
                  <p className="role-location">{offre.localisation || "\u2014"}</p>
                  <p className="role-salary">
                    {formatSalaryTnd(offre.salaire_min)} - {formatSalaryTnd(offre.salaire_max)} TND
                  </p>
                </div>

                <div className="role-stats">
                  <div>
                    <strong>{offre.candidatures_count || 0}</strong>
                    <span>Applications</span>
                  </div>
                  <div>
                    <strong>{offre.vues_count || 0}</strong>
                    <span>Views</span>
                  </div>
                </div>

                <div className="role-dates">
                  <p>
                    <span>Created on</span>
                    <strong>{formatDate(offre.created_at)}</strong>
                  </p>
                  <p>
                    <span>Expires on</span>
                    <strong className="expiry">{formatDate(offre.date_limite)}</strong>
                  </p>
                </div>

                <div className="role-actions">
                  <button className="dots-btn" type="button" aria-label="More options">
                    ...
                  </button>
                  <div className="actions-row">
                    <ButtonLink href="/entreprise/candidatures" variant="secondary" size="sm">
                      View applicants
                    </ButtonLink>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMessage("Edit workflow will be connected in the next iteration.")}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => changerStatut(offre.id_offre, isActive ? "inactive" : "active")}
                    >
                      {isActive ? "Pause" : "Activate"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => supprimerOffre(offre.id_offre)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <footer className="pagination-bar">
        <p>
          Showing {offresFiltrees.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, offresFiltrees.length)} of{" "}
          {offresFiltrees.length} roles
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

      {showCreateModal ? (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h2>Create a new role</h2>
              <button onClick={() => setShowCreateModal(false)} type="button">x</button>
            </div>

            <ModalCreationOffre onSubmit={creerNouvelleOffre} onCancel={() => setShowCreateModal(false)} />
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
        @media (max-width: 720px) {
          .listings-dashboard {
            padding: 16px;
          }
          .listings-header {
            flex-direction: column;
          }
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .filter-bar {
            grid-template-columns: 1fr;
          }
          .filter-input {
            grid-column: auto;
          }
          .role-card {
            grid-template-columns: 1fr;
          }
          .role-dates,
          .role-actions {
            grid-column: auto;
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

function ModalCreationOffre({ onSubmit, onCancel }: { onSubmit: (offre: OffreFormulaire) => void; onCancel: () => void }) {
  const minimumDeadlineDate = useMemo(() => getTodayDateInputValue(), []);
  const [skillInput, setSkillInput] = useState("");
  const [formData, setFormData] = useState<OffreFormulaire>({
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
  });

  const skills = useMemo(
    () =>
      formData.competences_requises
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [formData.competences_requises],
  );

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

    if (formData.salaire_min && formData.salaire_max && Number(formData.salaire_min) > Number(formData.salaire_max)) {
      erreurs.push("The minimum salary cannot be higher than the maximum salary.");
    }

    if (!formData.date_limite || formData.date_limite < minimumDeadlineDate) {
      erreurs.push("The application deadline cannot be in the past.");
    }

    if (!formData.experience_requise) {
      erreurs.push("Required experience is required.");
    }

    if (!formData.niveau_etude) {
      erreurs.push("Education level is required.");
    }

    if (erreurs.length > 0) {
      alert(`Validation errors:\n\n${erreurs.join("\n")}`);
      return;
    }

    onSubmit({ ...formData, competences_requises: normalizedSkills.join(", ") });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submitDisabled =
    !formData.titre ||
    formData.titre.length < 3 ||
    !formData.description ||
    formData.description.length < 50 ||
    !formData.localisation ||
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
            Role title *
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
            placeholder="Example: Full-Stack Developer"
            required
          />
          {formData.titre.length > 0 && formData.titre.length < 3 ? (
            <p className="text-xs text-red-600 mt-1">The title must be at least 3 characters long.</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass}>Location *</label>
          <input
            type="text"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            className={fieldBaseClass}
            placeholder="Example: Tunis, Sfax, Remote"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Role type</label>
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
          <label className={labelClass}>Minimum salary (TND)</label>
          <input
            type="number"
            min="0"
            name="salaire_min"
            value={formData.salaire_min}
            onChange={handleChange}
            className={fieldBaseClass}
            placeholder="800"
          />
        </div>

        <div>
          <label className={labelClass}>Maximum salary (TND)</label>
          <input
            type="number"
            min="0"
            name="salaire_max"
            value={formData.salaire_max}
            onChange={handleChange}
            className={fieldBaseClass}
            placeholder="1200"
          />
        </div>

        <div>
          <label className={labelClass}>Application deadline *</label>
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
            Role description *
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
            placeholder="Describe the role, responsibilities, and work environment..."
            required
          />
          {formData.description.length > 0 && formData.description.length < 50 ? (
            <p className="text-xs text-red-600 mt-1">{50 - formData.description.length} more character(s) required</p>
          ) : null}
          {formData.description.length >= 50 ? (
            <p className="text-xs text-green-600 mt-1">Description looks detailed enough.</p>
          ) : null}
        </div>

        <div className="md:col-span-2 lg:col-span-1">
          <label className={labelClass}>Required skills</label>
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
              Add
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
          <label className={labelClass}>Required experience *</label>
          <select
            name="experience_requise"
            value={formData.experience_requise}
            onChange={handleChange}
            className={fieldBaseClass}
            required
          >
            <option value="" disabled>
              Choose experience
            </option>
            {experienceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Education level *</label>
          <select
            name="niveau_etude"
            value={formData.niveau_etude}
            onChange={handleChange}
            className={fieldBaseClass}
            required
          >
            <option value="" disabled>
              Choose education level
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
          Create role
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
