"use client";

import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type ApplicationStatus = "pending" | "shortlisted" | "interview_scheduled" | "rejected" | "accepted";

type UserLite = {
  nom?: string | null;
  email?: string | null;
  telephone?: string | null;
  addresse?: string | null;
};

type AdminApplicationApiItem = {
  id?: string;
  statut?: string | null;
  date_postulation?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  score_test?: number | null;
  candidature?: {
    id?: string;
    statut?: string | null;
    date_postulation?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    score_test?: number | null;
  };
  candidat?: {
    id?: string;
    id_utilisateur?: string;
    nom?: string | null;
    email?: string | null;
    telephone?: string | null;
    utilisateur?: UserLite | null;
  } | null;
  offre?: {
    id?: string;
    titre?: string | null;
    localisation?: string | null;
    type_poste?: string | null;
    statut?: string | null;
    entreprise?: {
      id?: string;
      nom?: string | null;
      nom_entreprise?: string | null;
      utilisateur?: UserLite | null;
    } | null;
  } | null;
};

type AdminApplicationsPayload = {
  message?: string;
  donnees?: AdminApplicationApiItem[];
};

type AdminApplication = {
  id: string;
  status: ApplicationStatus;
  statusLabel: string;
  datePostulation: string;
  updatedAt?: string | null;
  score?: number | null;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  companyName: string;
  roleTitle: string;
  location: string;
  contractType: string;
  offerStatus: string;
};

const ITEMS_PER_PAGE = 50;

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "En attente",
  shortlisted: "Preselection",
  interview_scheduled: "Entretien",
  rejected: "Refusee",
  accepted: "Acceptee",
};

const statusOptions: Array<{ value: "" | ApplicationStatus; label: string }> = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "shortlisted", label: "Preselection" },
  { value: "interview_scheduled", label: "Entretien" },
  { value: "accepted", label: "Acceptee" },
  { value: "rejected", label: "Refusee" },
];

function normalizeStatus(value?: string | null): ApplicationStatus {
  if (
    value === "shortlisted" ||
    value === "interview_scheduled" ||
    value === "rejected" ||
    value === "accepted"
  ) {
    return value;
  }

  return "pending";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function normalizeApplication(item: AdminApplicationApiItem, index: number): AdminApplication {
  const candidature = item.candidature ?? item;
  const candidateUser = item.candidat?.utilisateur;
  const company = item.offre?.entreprise;
  const companyUser = company?.utilisateur;
  const status = normalizeStatus(candidature.statut);

  return {
    id: candidature.id ?? item.id ?? `application-${index}`,
    status,
    statusLabel: statusLabels[status],
    datePostulation: candidature.date_postulation ?? candidature.created_at ?? new Date().toISOString(),
    updatedAt: candidature.updated_at ?? item.updated_at ?? null,
    score: candidature.score_test ?? item.score_test ?? null,
    candidateName: candidateUser?.nom ?? item.candidat?.nom ?? "Candidat",
    candidateEmail: candidateUser?.email ?? item.candidat?.email ?? "",
    candidatePhone: candidateUser?.telephone ?? item.candidat?.telephone ?? "",
    companyName: company?.nom_entreprise ?? company?.nom ?? companyUser?.nom ?? "Entreprise",
    roleTitle: item.offre?.titre ?? "Offre",
    location: item.offre?.localisation ?? candidateUser?.addresse ?? "-",
    contractType: item.offre?.type_poste ? item.offre.type_poste.replace("_", " ") : "-",
    offerStatus: item.offre?.statut ?? "-",
  };
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ApplicationStatus>("");
  const [company, setCompany] = useState("");
  const [page, setPage] = useState(1);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(construireUrlApi("/api/admin/candidatures/toutes?limit=500"));
      const data: AdminApplicationsPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les candidatures.");
      }

      const items = Array.isArray(data.donnees) ? data.donnees : [];
      setApplications(items.map(normalizeApplication));
    } catch (cause) {
      setApplications([]);
      setError(cause instanceof Error ? cause.message : "Impossible de charger les candidatures.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const companyOptions = useMemo(
    () => Array.from(new Set(applications.map((item) => item.companyName).filter(Boolean))).sort(),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applications
      .filter((item) => (status ? item.status === status : true))
      .filter((item) => (company ? item.companyName === company : true))
      .filter((item) => {
        if (!term) return true;
        return [
          item.candidateName,
          item.candidateEmail,
          item.companyName,
          item.roleTitle,
          item.location,
          item.statusLabel,
          item.contractType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => new Date(b.datePostulation).getTime() - new Date(a.datePostulation).getTime());
  }, [applications, company, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const exportApplications = () => {
    if (filteredApplications.length === 0) {
      return;
    }

    const headers = [
      "Candidat",
      "Email",
      "Téléphone",
      "Entreprise",
      "Offre",
      "Statut",
      "Candidature envoyée",
      "Mis à jour",
      "Score",
      "Statut de l'offre",
    ];

    const rows = filteredApplications.map((item) => [
      item.candidateName,
      item.candidateEmail,
      item.candidatePhone,
      item.companyName,
      item.roleTitle,
      item.statusLabel,
      formatDate(item.datePostulation),
      formatDate(item.updatedAt),
      typeof item.score === "number" ? `${item.score}%` : "-",
      item.offerStatus,
    ]);

    const csv = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `candidatures_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setPage(1);
  }, [company, search, status]);

  return (
    <main className="page-centree section-page app-theme">
      <section className="admin-interviews-page admin-applications-page">
        <section className="admin-interviews-panel">
          <div className="admin-interviews-toolbar admin-applications-toolbar">
            <button
              type="button"
              onClick={exportApplications}
              disabled={loading || filteredApplications.length === 0}
              aria-label="Exporter les candidatures"
            >
              Exporter les candidatures
            </button>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un candidat, une entreprise, une offre..."
              aria-label="Rechercher des candidatures"
            />
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | ApplicationStatus)} aria-label="Filtrer par statut de candidature">
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={company} onChange={(event) => setCompany(event.target.value)} aria-label="Filtrer par entreprise">
              <option value="">Toutes les entreprises</option>
              {companyOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {error ? <p className="message message-erreur">{error}</p> : null}

          <div className="admin-interviews-table-wrap admin-applications-table-wrap">
            <table className="admin-interviews-table admin-applications-table">
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Entreprise</th>
                  <th>Offre</th>
                  <th>Statut</th>
                  <th>Candidature envoyée</th>
                  <th>Score</th>
                  <th>Offre</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Chargement des candidatures...</td>
                  </tr>
                ) : visibleApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Aucune candidature ne correspond à ces filtres.</td>
                  </tr>
                ) : (
                  visibleApplications.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.candidateName}</strong>
                        <span>{item.candidateEmail || item.candidatePhone || "-"}</span>
                      </td>
                      <td>{item.companyName}</td>
                      <td>
                        <strong>{item.roleTitle}</strong>
                        <span>{item.location}</span>
                      </td>
                      <td>
                        <span className={`admin-interviews-status admin-applications-status admin-applications-status--${item.status}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                      <td>
                        <strong>{formatDate(item.datePostulation)}</strong>
                        <span>Mise a jour {formatDate(item.updatedAt)}</span>
                      </td>
                      <td>{typeof item.score === "number" ? `${item.score}%` : "-"}</td>
                      <td>
                        <strong>{item.contractType}</strong>
                        <span>{item.offerStatus}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="admin-interviews-pagination">
            <span>
              Page {currentPage} / {totalPages} - {filteredApplications.length} candidature(s)
            </span>
            <div>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
                Precedent
              </button>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                Suivant
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}
