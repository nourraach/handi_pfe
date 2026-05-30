"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Eye, Pencil, Plus, RefreshCw, Search, Trash2, CirclePause } from "lucide-react";
import { RouteProtegee } from "@/components/route-protegee";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type EmployerStatus = "actif" | "en_attente" | "suspendu" | "inactif";

type EmployerAccount = {
  id_utilisateur: string;
  nom: string;
  nom_entreprise?: string | null;
  email: string;
  statut: EmployerStatus | string;
  telephone?: string | null;
  addresse?: string | null;
  region?: string | null;
  gouvernorat?: string | null;
  delegation?: string | null;
  created_at: string;
  updated_at: string;
};

type CompanyProfile = EmployerAccount & {
  nom_entreprise?: string | null;
  patente?: string | null;
  rne?: string | null;
  statut_validation?: string | null;
  profil_publique?: boolean | null;
  date_fondation?: string | null;
  description?: string | null;
  nbr_employe?: number | null;
  nbr_employe_handicape?: number | null;
  secteur_activite?: string | null;
  taille_entreprise?: string | null;
  siret?: string | null;
  site_web?: string | null;
  url_site?: string | null;
  politique_handicap?: string | null;
  contact_rh_nom?: string | null;
  contact_rh_email?: string | null;
  contact_rh_telephone?: string | null;
  logo_url?: string | null;
  subscription_pack?: string | null;
  subscription_status?: string | null;
  subscription_price_tnd?: number | null;
  subscription_cycle?: string | null;
  subscribed_at?: string | null;
};

type EmployersPayload = {
  message?: string;
  donnees?: {
    utilisateurs?: EmployerAccount[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  };
};

type CompanyPayload = {
  message?: string;
  donnees?: CompanyProfile | {
    utilisateur?: EmployerAccount;
    entreprise?: CompanyProfile;
  };
};

type CompanyFormState = {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  nom_entreprise: string;
  patente: string;
  rne: string;
  date_fondation: string;
  description: string;
  nbr_employe: string;
  nbr_employe_handicape: string;
  secteur_activite: string;
  taille_entreprise: string;
  siret: string;
  site_web: string;
  politique_handicap: string;
  contact_rh_nom: string;
  contact_rh_email: string;
  contact_rh_telephone: string;
  profil_publique: boolean;
};

type ModalMode = "create" | "edit" | "view" | null;

const STATUS_LABELS: Record<string, string> = {
  actif: "Active",
  en_attente: "Pending",
  suspendu: "Suspended",
  inactif: "Inactive",
};

const ITEMS_PER_PAGE = 50;

const EMPTY_FORM: CompanyFormState = {
  nom: "",
  email: "",
  telephone: "",
  addresse: "",
  nom_entreprise: "",
  patente: "",
  rne: "",
  date_fondation: "",
  description: "",
  nbr_employe: "1",
  nbr_employe_handicape: "0",
  secteur_activite: "",
  taille_entreprise: "",
  siret: "",
  site_web: "",
  politique_handicap: "",
  contact_rh_nom: "",
  contact_rh_email: "",
  contact_rh_telephone: "",
  profil_publique: false,
};

const styles = `
  .companies-page {
    display: grid;
    gap: 18px;
  }

  .companies-kicker {
    margin: 0;
    color: #6b5b86;
    font-size: 0.86rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .companies-panel {
    display: grid;
    gap: 20px;
    padding: 22px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #eee8ff;
    box-shadow: 0 22px 52px rgba(76, 48, 139, 0.08);
  }

  .companies-toolbar {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(190px, 0.42fr) auto auto;
    gap: 16px;
    align-items: center;
  }

  .companies-search,
  .companies-select-wrap {
    position: relative;
    min-width: 0;
  }

  .companies-search svg,
  .companies-select-wrap svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #6c42ef;
    pointer-events: none;
  }

  .companies-search svg {
    left: 20px;
  }

  .companies-select-wrap svg {
    right: 18px;
  }

  .companies-toolbar input,
  .companies-toolbar select {
    width: 100%;
    min-height: 54px;
    border-radius: 18px;
    border: 1px solid #e5ddfb;
    background: #ffffff;
    color: #22164f;
    outline: none;
    box-shadow: 0 10px 24px rgba(77, 55, 135, 0.04);
  }

  .companies-toolbar input {
    padding: 0 18px 0 54px;
    font-weight: 700;
  }

  .companies-toolbar select {
    appearance: none;
    padding: 0 48px 0 20px;
    font-weight: 800;
  }

  .company-form input,
  .company-form textarea,
  .company-form select {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #ddd5ea;
    background: #fff;
    padding: 11px 14px;
    color: #201338;
    outline: none;
  }

  .companies-toolbar input:focus,
  .companies-toolbar select:focus,
  .company-form input:focus,
  .company-form textarea:focus,
  .company-form select:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }

  .companies-toolbar-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;
  }

  .companies-toolbar-btn {
    min-height: 54px;
    border-radius: 18px;
    border: 1px solid #e7defb;
    padding: 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #ffffff;
    color: #4f28df;
    font-weight: 900;
    box-shadow: 0 10px 24px rgba(77, 55, 135, 0.06);
    white-space: nowrap;
  }

  .companies-toolbar-btn--primary {
    border-color: #6d31f5;
    color: #ffffff;
    background: linear-gradient(135deg, #7339ff, #5a1be0);
    box-shadow: 0 14px 28px rgba(93, 37, 221, 0.28);
  }

  .companies-toolbar-btn svg,
  .companies-action-btn svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.4;
  }

  .companies-table-wrap {
    overflow: auto;
    border: 1px solid #ebe5fa;
    border-radius: 16px;
    background: #ffffff;
  }

  .companies-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1060px;
    background: #fff;
  }

  .companies-table thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    height: 56px;
    background: #f7f3ff;
    color: #14103e;
    text-align: left;
    font-size: 0.76rem;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    border-bottom: 1px solid #ede7fa;
    padding: 16px 22px;
  }

  .companies-table tbody td {
    padding: 24px 22px;
    vertical-align: middle;
    border-bottom: 1px solid #ece7f6;
    color: #191342;
    font-size: 0.95rem;
    font-weight: 750;
  }

  .companies-table tbody tr {
    min-height: 116px;
  }

  .companies-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .companies-table td strong,
  .companies-table td span {
    display: block;
  }

  .companies-table td span {
    color: #71689b;
    font-size: 0.82rem;
    margin-top: 6px;
    font-weight: 700;
    line-height: 1.45;
  }

  .company-cell {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .company-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f3edff;
    color: #6229e8;
  }

  .company-icon svg {
    width: 21px;
    height: 21px;
  }

  .company-verified {
    width: fit-content;
    margin-top: 8px;
    display: inline-flex !important;
    min-height: 24px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 12px;
    background: #dff8ea;
    color: #11a45e !important;
    font-size: 0.72rem !important;
    font-weight: 900 !important;
  }

  .company-contact-id {
    color: #6b2df4 !important;
    font-weight: 900 !important;
  }

  .company-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 82px;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    font-weight: 900;
    font-size: 0.82rem;
  }

  .company-status::before {
    content: "";
    width: 11px;
    height: 11px;
    border-radius: 999px;
    background: currentColor;
  }

  .company-status--actif {
    background: #dcfce7;
    color: #166534;
  }

  .company-status--en_attente {
    background: #fff2e8;
    color: #ff7a1a;
  }

  .company-status--suspendu {
    background: #fee2e2;
    color: #991b1b;
  }

  .company-status--inactif {
    background: #ece8f4;
    color: #4b3b66;
  }

  .companies-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(84px, 1fr));
    gap: 12px;
    align-items: center;
  }

  .companies-action-btn {
    min-height: 42px;
    border-radius: 14px;
    border: 1px solid #e8e1f7;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #ffffff;
    color: #17113f;
    font-weight: 900;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .companies-action-btn--view {
    background: #f6f0ff;
    border-color: #f0e8ff;
    color: #6326ee;
  }

  .companies-action-btn--danger {
    background: #fff0f4;
    border-color: #ffe2ea;
    color: #ff315d;
  }

  .companies-action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .companies-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .companies-pagination-controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .companies-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(26, 18, 43, 0.42);
    backdrop-filter: blur(8px);
  }

  .companies-modal-card {
    width: min(980px, 100%);
    max-height: min(88vh, 980px);
    overflow: auto;
    border-radius: 20px;
    box-shadow: 0 28px 70px rgba(31, 18, 49, 0.24);
  }

  .companies-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .companies-modal-title {
    margin: 0;
    color: #201338;
    font-size: 1.4rem;
    line-height: 1.2;
  }

  .company-form {
    display: grid;
    gap: 14px;
  }

  .company-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .company-form-field {
    display: grid;
    gap: 8px;
  }

  .company-form-field--full {
    grid-column: 1 / -1;
  }

  .company-form-field label {
    color: #5a4a76;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .company-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 6px;
  }

  .company-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .company-detail-box {
    padding: 14px 16px;
    border-radius: 14px;
    background: #fbf9ff;
    border: 1px solid #eee8f8;
  }

  .company-detail-box strong {
    display: block;
    margin-bottom: 4px;
    color: #201338;
  }

  .company-detail-box p {
    margin: 0;
    color: #5a4a76;
    line-height: 1.45;
    word-break: break-word;
  }

  .company-detail-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
  }

  @media (max-width: 1024px) {
    .companies-toolbar,
    .companies-pagination {
      grid-template-columns: 1fr;
      display: grid;
    }

    .company-form-grid,
    .company-detail-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toCompanyForm(profile?: Partial<CompanyProfile> | null): CompanyFormState {
  return {
    nom: profile?.nom ?? "",
    email: profile?.email ?? "",
    telephone: profile?.telephone ?? "",
    addresse: profile?.addresse ?? "",
    nom_entreprise: profile?.nom_entreprise ?? "",
    patente: profile?.patente ?? "",
    rne: profile?.rne ?? "",
    date_fondation: profile?.date_fondation ? String(profile.date_fondation).slice(0, 10) : "",
    description: profile?.description ?? "",
    nbr_employe: profile?.nbr_employe?.toString() ?? "1",
    nbr_employe_handicape: profile?.nbr_employe_handicape?.toString() ?? "0",
    secteur_activite: profile?.secteur_activite ?? "",
    taille_entreprise: profile?.taille_entreprise ?? "",
    siret: profile?.siret ?? "",
    site_web: profile?.site_web ?? profile?.url_site ?? "",
    politique_handicap: profile?.politique_handicap ?? "",
    contact_rh_nom: profile?.contact_rh_nom ?? "",
    contact_rh_email: profile?.contact_rh_email ?? "",
    contact_rh_telephone: profile?.contact_rh_telephone ?? "",
    profil_publique: Boolean(profile?.profil_publique),
  };
}

function toUpdatePayload(form: CompanyFormState) {
  return {
    nom: form.nom.trim(),
    email: form.email.trim(),
    telephone: form.telephone.trim(),
    addresse: form.addresse.trim(),
    nom_entreprise: form.nom_entreprise.trim(),
    patente: form.patente.trim(),
    rne: form.rne.trim(),
    date_fondation: form.date_fondation,
    description: form.description.trim(),
    nbr_employe: Number(form.nbr_employe),
    nbr_employe_handicape: Number(form.nbr_employe_handicape),
    secteur_activite: form.secteur_activite.trim(),
    taille_entreprise: form.taille_entreprise.trim(),
    siret: form.siret.trim(),
    site_web: form.site_web.trim(),
    politique_handicap: form.politique_handicap.trim(),
    contact_rh_nom: form.contact_rh_nom.trim(),
    contact_rh_email: form.contact_rh_email.trim(),
    contact_rh_telephone: form.contact_rh_telephone.trim(),
    profil_publique: form.profil_publique,
  };
}

function normalizeCompany(profile: CompanyProfile): CompanyProfile {
  return {
    ...profile,
    site_web: profile.site_web ?? profile.url_site ?? "",
    url_site: profile.url_site ?? profile.site_web ?? "",
  };
}

function AdminCompaniesPage() {
  const [employers, setEmployers] = useState<EmployerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [form, setForm] = useState<CompanyFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadEmployers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        role: "entreprise",
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });

      if (status) params.set("statut", status);
      if (search.trim()) params.set("recherche", search.trim());

      const response = await authenticatedFetch(construireUrlApi(`/api/admin/utilisateurs?${params.toString()}`));
      const data: EmployersPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load companies.");
      }

      const pagination = data.donnees?.pagination;
      setEmployers(Array.isArray(data.donnees?.utilisateurs) ? data.donnees.utilisateurs : []);
      setTotalPages(Math.max(1, pagination?.totalPages ?? 1));
      setTotalEmployers(pagination?.total ?? 0);
    } catch (cause) {
      setEmployers([]);
      setTotalPages(1);
      setTotalEmployers(0);
      setError(cause instanceof Error ? cause.message : "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  const loadCompanyProfile = useCallback(async (id: string) => {
    const response = await authenticatedFetch(construireUrlApi(`/api/profil/admin/entreprises/${id}`));
    const data: CompanyPayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Unable to load company profile.");
    }

    const raw = data.donnees as CompanyProfile | { entreprise?: CompanyProfile } | undefined;
    if (raw && "entreprise" in raw && raw.entreprise) {
      return normalizeCompany({
        ...(raw.entreprise as CompanyProfile),
        ...(raw as { utilisateur?: EmployerAccount }).utilisateur,
      } as CompanyProfile);
    }

    return normalizeCompany(raw as CompanyProfile);
  }, []);

  useEffect(() => {
    void loadEmployers();
  }, [loadEmployers]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const refreshAfterAction = async () => {
    await loadEmployers();
  };

  const openCreate = () => {
    setSelectedId(null);
    setSelectedCompany(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalMode("create");
  };

  const openView = async (employer: EmployerAccount) => {
    try {
      setModalLoading(true);
      setFormError(null);
      setSelectedId(employer.id_utilisateur);
      setSelectedCompany(await loadCompanyProfile(employer.id_utilisateur));
      setModalMode("view");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load company profile.");
    } finally {
      setModalLoading(false);
    }
  };

  const openEdit = async (employer: EmployerAccount) => {
    try {
      setModalLoading(true);
      setFormError(null);
      setSelectedId(employer.id_utilisateur);
      const profile = await loadCompanyProfile(employer.id_utilisateur);
      setSelectedCompany(profile);
      setForm(toCompanyForm(profile));
      setModalMode("edit");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load company profile.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedId(null);
    setSelectedCompany(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalLoading(false);
  };

  const submitForm = async () => {
    try {
      setFormError(null);

      if (!form.nom.trim()) throw new Error("Le nom du contact est requis.");
      if (!form.email.trim()) throw new Error("L'email est requis.");
      if (!form.telephone.trim()) throw new Error("Le telephone est requis.");
      if (!form.addresse.trim()) throw new Error("L'adresse est requise.");
      if (!form.nom_entreprise.trim()) throw new Error("Le nom de l'entreprise est requis.");
      if (!form.patente.trim()) throw new Error("La patente est requise.");
      if (!form.rne.trim()) throw new Error("Le RNE est requis.");
      if (!form.date_fondation) throw new Error("La date de fondation est requise.");
      if (!form.description.trim()) throw new Error("La description est requise.");

      setModalLoading(true);
      const payload = toUpdatePayload(form);
      const endpoint = modalMode === "create"
        ? "/api/profil/admin/entreprises"
        : `/api/profil/admin/entreprises/${selectedId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const response = await authenticatedFetch(construireUrlApi(endpoint), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: CompanyPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save company.");
      }

      await refreshAfterAction();
      closeModal();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to save company.");
    } finally {
      setModalLoading(false);
    }
  };

  const changeStatus = async (employer: EmployerAccount, nextStatus: EmployerStatus) => {
    try {
      setActionInProgress(employer.id_utilisateur);
      setError(null);

      const response = await authenticatedFetch(
        construireUrlApi(`/api/admin/utilisateurs/${employer.id_utilisateur}/statut`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: nextStatus }),
        },
      );

      const data: { message?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to update company status.");
      }

      await refreshAfterAction();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update company status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const deleteCompany = async (employer: EmployerAccount) => {
    const confirmed = window.confirm(`Delete company account for ${employer.nom || employer.email}?`);
    if (!confirmed) return;

    try {
      setActionInProgress(employer.id_utilisateur);
      setError(null);

      const response = await authenticatedFetch(construireUrlApi(`/api/admin/utilisateurs/${employer.id_utilisateur}`), {
        method: "DELETE",
      });
      const data: { message?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete company.");
      }

      await refreshAfterAction();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete company.");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <main className="page-centree section-page app-theme">
      <style>{styles}</style>

      <section className="companies-page">
        <section className="companies-panel">
          <div className="companies-toolbar">
            <label className="companies-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company name or email..."
                aria-label="Search companies"
              />
            </label>
            <label className="companies-select-wrap">
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter companies by status">
                <option value="">All statuses</option>
                <option value="actif">Active</option>
                <option value="en_attente">Pending</option>
                <option value="suspendu">Suspended</option>
                <option value="inactif">Inactive</option>
              </select>
              <span aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </label>
            <button className="companies-toolbar-btn" onClick={() => void loadEmployers()} type="button">
              <RefreshCw aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <div className="companies-toolbar-actions">
              <button className="companies-toolbar-btn companies-toolbar-btn--primary" onClick={openCreate} type="button">
                <Plus aria-hidden="true" />
                <span>Create</span>
              </button>
            </div>
          </div>

          {error ? <p className="message message-erreur" role="alert">{error}</p> : null}

          <div className="companies-table-wrap">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Region</th>
                  <th>Address</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading companies...</td>
                  </tr>
                ) : employers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No companies match these filters.</td>
                  </tr>
                ) : (
                  employers.map((employer) => {
                    const isBusy = actionInProgress === employer.id_utilisateur;
                    const nextStatus: EmployerStatus = employer.statut === "actif" ? "suspendu" : "actif";

                    return (
                      <tr key={employer.id_utilisateur}>
                        <td>
                          <div className="company-cell">
                            <span className="company-icon" aria-hidden="true">
                              <Building2 />
                            </span>
                            <div>
                              <strong>{employer.nom_entreprise || employer.nom || "Company"}</strong>
                              <span>{employer.email}</span>
                              <span className="company-verified">Verified</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{employer.telephone || "-"}</strong>
                          <span className="company-contact-id">{employer.id_utilisateur.slice(0, 8)}</span>
                        </td>
                        <td>
                          <span className={`company-status company-status--${employer.statut}`}>
                            {STATUS_LABELS[employer.statut] || employer.statut}
                          </span>
                        </td>
                        <td>
                          <strong>{employer.gouvernorat || employer.region || "-"}</strong>
                          <span>{employer.delegation || "-"}</span>
                        </td>
                        <td title={employer.addresse || undefined}>{employer.addresse || "-"}</td>
                        <td>{formatDate(employer.created_at)}</td>
                        <td>
                          <div className="companies-actions">
                            <button className="companies-action-btn companies-action-btn--view" onClick={() => void openView(employer)} disabled={isBusy} type="button">
                              <Eye aria-hidden="true" />
                              <span>View</span>
                            </button>
                            <button className="companies-action-btn" onClick={() => void openEdit(employer)} disabled={isBusy} type="button">
                              <Pencil aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button className="companies-action-btn" onClick={() => void changeStatus(employer, nextStatus)} disabled={isBusy} type="button">
                              <CirclePause aria-hidden="true" />
                              <span>{employer.statut === "actif" ? "Suspend" : "Activate"}</span>
                            </button>
                            <button className="companies-action-btn companies-action-btn--danger" onClick={() => void deleteCompany(employer)} disabled={isBusy} type="button">
                              <Trash2 aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="companies-pagination">
            <span>
              Page {page} / {totalPages} - {totalEmployers} company account(s)
            </span>
            <div className="companies-pagination-controls">
              <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </footer>
        </section>
      </section>

      {modalMode && (modalMode === "view" ? selectedCompany : true) ? (
        <div
          className="companies-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <Card
            padding="lg"
            className="companies-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            {modalMode === "view" && selectedCompany ? (
              <div>
                <div className="companies-modal-header">
                  <div>
                    <p className="companies-kicker">Company profile</p>
                    <h2 className="companies-modal-title">{selectedCompany.nom_entreprise || selectedCompany.nom || "Company"}</h2>
                    <p className="texte-secondaire">{selectedCompany.email} - {selectedCompany.statut}</p>
                  </div>
                  <Button variant="ghost" onClick={closeModal}>Close</Button>
                </div>

                <div className="company-detail-grid">
                  <div className="company-detail-box">
                    <strong>Contact</strong>
                    <p>{selectedCompany.nom} - {selectedCompany.telephone || "-"}</p>
                  </div>
                  <div className="company-detail-box">
                    <strong>Status</strong>
                    <p>{STATUS_LABELS[selectedCompany.statut] || selectedCompany.statut}</p>
                  </div>
                  <div className="company-detail-box">
                    <strong>Legal</strong>
                    <p>Patente: {selectedCompany.patente || "-"}</p>
                    <p>RNE: {selectedCompany.rne || "-"}</p>
                    <p>Siret: {selectedCompany.siret || "-"}</p>
                  </div>
                  <div className="company-detail-box">
                    <strong>RH</strong>
                    <p>{selectedCompany.contact_rh_nom || "-"}</p>
                    <p>{selectedCompany.contact_rh_email || "-"}</p>
                    <p>{selectedCompany.contact_rh_telephone || "-"}</p>
                  </div>
                  <div className="company-detail-box">
                    <strong>Company info</strong>
                    <p>{selectedCompany.description || "-"}</p>
                  </div>
                  <div className="company-detail-box">
                    <strong>Access</strong>
                    <p>Visible: {selectedCompany.profil_publique ? "Yes" : "No"}</p>
                    <p>Created: {formatDate(selectedCompany.created_at)}</p>
                  </div>
                </div>

                <div className="company-detail-actions">
                  <Button variant="secondary" onClick={() => void openEdit(selectedCompany)}>Edit</Button>
                  <Button variant="ghost" onClick={() => void changeStatus(selectedCompany, selectedCompany.statut === "actif" ? "suspendu" : "actif")}>
                    {selectedCompany.statut === "actif" ? "Suspend" : "Activate"}
                  </Button>
                  <Button variant="danger" onClick={() => void deleteCompany(selectedCompany)}>Delete</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="companies-modal-header">
                  <div>
                    <p className="companies-kicker">{modalMode === "create" ? "New company" : "Edit company"}</p>
                    <h2 className="companies-modal-title">{modalMode === "create" ? "Create company account" : "Update company account"}</h2>
                    <p className="texte-secondaire">Fill in the account and company details in one pass.</p>
                  </div>
                  <Button variant="ghost" onClick={closeModal}>Close</Button>
                </div>

                {modalLoading ? (
                  <p>Loading...</p>
                ) : (
                  <form
                    className="company-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitForm();
                    }}
                  >
                    {formError ? <p className="message message-erreur" role="alert">{formError}</p> : null}

                    <div className="company-form-grid">
                      <div className="company-form-field">
                        <label htmlFor="company-contact-name">Contact name</label>
                        <input id="company-contact-name" value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-email">Email</label>
                        <input id="company-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-phone">Phone</label>
                        <input id="company-phone" value={form.telephone} onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-address">Address</label>
                        <input id="company-address" value={form.addresse} onChange={(event) => setForm((current) => ({ ...current, addresse: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-name">Company name</label>
                        <input id="company-name" value={form.nom_entreprise} onChange={(event) => setForm((current) => ({ ...current, nom_entreprise: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-date">Founding date</label>
                        <input id="company-date" type="date" value={form.date_fondation} onChange={(event) => setForm((current) => ({ ...current, date_fondation: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-patente">Patente</label>
                        <input id="company-patente" value={form.patente} onChange={(event) => setForm((current) => ({ ...current, patente: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rne">RNE</label>
                        <input id="company-rne" value={form.rne} onChange={(event) => setForm((current) => ({ ...current, rne: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-sector">Sector</label>
                        <input id="company-sector" value={form.secteur_activite} onChange={(event) => setForm((current) => ({ ...current, secteur_activite: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-size">Company size</label>
                        <input id="company-size" value={form.taille_entreprise} onChange={(event) => setForm((current) => ({ ...current, taille_entreprise: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-siret">Siret</label>
                        <input id="company-siret" value={form.siret} onChange={(event) => setForm((current) => ({ ...current, siret: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-site">Website</label>
                        <input id="company-site" value={form.site_web} onChange={(event) => setForm((current) => ({ ...current, site_web: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rh-name">RH contact</label>
                        <input id="company-rh-name" value={form.contact_rh_nom} onChange={(event) => setForm((current) => ({ ...current, contact_rh_nom: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rh-email">RH email</label>
                        <input id="company-rh-email" type="email" value={form.contact_rh_email} onChange={(event) => setForm((current) => ({ ...current, contact_rh_email: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-rh-phone">RH phone</label>
                        <input id="company-rh-phone" value={form.contact_rh_telephone} onChange={(event) => setForm((current) => ({ ...current, contact_rh_telephone: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-employees">Employees</label>
                        <input id="company-employees" type="number" min="0" value={form.nbr_employe} onChange={(event) => setForm((current) => ({ ...current, nbr_employe: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-employees-handicap">Employees with disability</label>
                        <input id="company-employees-handicap" type="number" min="0" value={form.nbr_employe_handicape} onChange={(event) => setForm((current) => ({ ...current, nbr_employe_handicape: event.target.value }))} />
                      </div>
                      <div className="company-form-field company-form-field--full">
                        <label htmlFor="company-description">Description</label>
                        <textarea id="company-description" rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                      </div>
                      <div className="company-form-field company-form-field--full">
                        <label htmlFor="company-policy">Disability policy</label>
                        <textarea id="company-policy" rows={4} value={form.politique_handicap} onChange={(event) => setForm((current) => ({ ...current, politique_handicap: event.target.value }))} />
                      </div>
                      <div className="company-form-field">
                        <label htmlFor="company-public">Public profile</label>
                        <select
                          id="company-public"
                          value={form.profil_publique ? "yes" : "no"}
                          onChange={(event) => setForm((current) => ({ ...current, profil_publique: event.target.value === "yes" }))}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </div>

                    <div className="company-form-actions">
                      <Button variant="secondary" type="button" onClick={closeModal}>
                        Cancel
                      </Button>
                      <Button type="submit">{modalMode === "create" ? "Create company" : "Save changes"}</Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </main>
  );
}

export default function PageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <AdminCompaniesPage />
    </RouteProtegee>
  );
}
