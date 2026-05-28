"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type EmployerStatus = "actif" | "en_attente" | "suspendu" | "inactif";

type EmployerAccount = {
  id_utilisateur: string;
  nom: string;
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

const STATUS_LABELS: Record<string, string> = {
  actif: "Active",
  en_attente: "Pending",
  suspendu: "Suspended",
  inactif: "Inactive",
};

const ITEMS_PER_PAGE = 50;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ComptesPage() {
  const [employers, setEmployers] = useState<EmployerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployers, setTotalEmployers] = useState(0);

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

  useEffect(() => {
    void loadEmployers();
  }, [loadEmployers]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const summary = useMemo(
    () => ({
      total: totalEmployers,
      active: employers.filter((item) => item.statut === "actif").length,
      pending: employers.filter((item) => item.statut === "en_attente").length,
      suspended: employers.filter((item) => item.statut === "suspendu").length,
    }),
    [employers, totalEmployers],
  );

  return (
    <main className="page-centree section-page app-theme">
      <section className="admin-interviews-page admin-employers-page">
        <header className="admin-interviews-hero">
          <div>
            <p className="admin-interviews-kicker">Employer directory</p>
            <h1>Companies on the platform</h1>
            <p>Browse employer accounts, check their status, and find company contact details without leaving the admin workspace.</p>
          </div>
          <div className="admin-interviews-summary admin-employers-summary" aria-label="Employers summary">
            <span><strong>{summary.total}</strong>Total</span>
            <span><strong>{summary.active}</strong>Active here</span>
            <span><strong>{summary.pending}</strong>Pending here</span>
            <span><strong>{summary.suspended}</strong>Suspended here</span>
          </div>
        </header>

        <section className="admin-interviews-panel">
          <div className="admin-interviews-toolbar admin-employers-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company name or email..."
              aria-label="Search companies"
            />
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter companies by status">
              <option value="">All statuses</option>
              <option value="actif">Active</option>
              <option value="en_attente">Pending</option>
              <option value="suspendu">Suspended</option>
              <option value="inactif">Inactive</option>
            </select>
            <button type="button" onClick={() => void loadEmployers()}>
              Refresh
            </button>
          </div>

          {error ? <p className="message message-erreur">{error}</p> : null}

          <div className="admin-interviews-table-wrap admin-employers-table-wrap">
            <table className="admin-interviews-table admin-employers-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Region</th>
                  <th>Address</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading companies...</td>
                  </tr>
                ) : employers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No companies match these filters.</td>
                  </tr>
                ) : (
                  employers.map((employer) => (
                    <tr key={employer.id_utilisateur}>
                      <td>
                        <strong>{employer.nom || "Company"}</strong>
                        <span>{employer.email}</span>
                      </td>
                      <td>
                        <strong>{employer.telephone || "-"}</strong>
                        <span>{employer.id_utilisateur.slice(0, 8)}</span>
                      </td>
                      <td>
                        <span className={`admin-interviews-status admin-employers-status admin-employers-status--${employer.statut}`}>
                          {STATUS_LABELS[employer.statut] || employer.statut}
                        </span>
                      </td>
                      <td>
                        <strong>{employer.gouvernorat || employer.region || "-"}</strong>
                        <span>{employer.delegation || "-"}</span>
                      </td>
                      <td title={employer.addresse || undefined}>{employer.addresse || "-"}</td>
                      <td>{formatDate(employer.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="admin-interviews-pagination">
            <span>
              Page {page} / {totalPages} - {totalEmployers} company account(s)
            </span>
            <div>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Previous
              </button>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}

export default function PageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <ComptesPage />
    </RouteProtegee>
  );
}
