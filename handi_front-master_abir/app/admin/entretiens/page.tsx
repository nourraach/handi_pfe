"use client";

import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import {
  EntretienStatut,
  EntretienType,
  formaterDateEntretien,
  getEntretienStatutConfig,
  getEntretienTypeLabel,
} from "@/lib/entretiens";

type EntretienAdmin = {
  entretien: {
    id: string;
    date_heure: string;
    type: EntretienType;
    lieu_visio?: string | null;
    lieu?: string | null;
    statut: EntretienStatut;
    duree_prevue?: string | null;
    contact_entreprise?: string | null;
    notes?: string | null;
  };
  candidature?: {
    id?: string;
    statut?: string;
  } | null;
  candidat?: {
    id?: string;
    id_utilisateur?: string;
    nom?: string;
    email?: string;
  } | null;
  entreprise?: {
    id?: string;
    id_utilisateur?: string;
    nom?: string;
  } | null;
  offre?: {
    id?: string;
    titre?: string;
  } | null;
};

type EntretiensAdminPayload = {
  message?: string;
  donnees?: EntretienAdmin[];
};

const ITEMS_PER_PAGE = 8;
const statusOptions: Array<{ value: "" | EntretienStatut; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "planifie", label: "Scheduled" },
  { value: "confirme", label: "Confirmed" },
  { value: "reporte", label: "Rescheduled" },
  { value: "termine", label: "Completed" },
  { value: "annule", label: "Cancelled" },
];
const typeOptions: Array<{ value: "" | EntretienType; label: string }> = [
  { value: "", label: "All types" },
  { value: "visio", label: "Video" },
  { value: "presentiel", label: "In person" },
  { value: "telephonique", label: "Phone" },
];

function getLocation(item: EntretienAdmin) {
  if (item.entretien.type === "visio") return item.entretien.lieu_visio || "Video link missing";
  if (item.entretien.type === "presentiel") return item.entretien.lieu || "Location missing";
  return item.entretien.contact_entreprise || "Phone contact missing";
}

function isUpcoming(item: EntretienAdmin) {
  const date = new Date(item.entretien.date_heure);
  return !Number.isNaN(date.getTime()) && date >= new Date() && item.entretien.statut !== "termine" && item.entretien.statut !== "annule";
}

export default function AdminEntretiensPage() {
  const [entretiens, setEntretiens] = useState<EntretienAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | EntretienStatut>("");
  const [type, setType] = useState<"" | EntretienType>("");
  const [period, setPeriod] = useState<"all" | "upcoming" | "past">("all");
  const [page, setPage] = useState(1);

  const chargerEntretiens = async () => {
    try {
      setLoading(true);
      setErreur(null);
      const response = await authenticatedFetch(construireUrlApi("/api/admin/entretiens"));
      const data: EntretiensAdminPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load interviews.");
      }

      setEntretiens(Array.isArray(data.donnees) ? data.donnees : []);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Unable to load interviews.");
      setEntretiens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void chargerEntretiens();
  }, []);

  const entretiensFiltres = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entretiens
      .filter((item) => (status ? item.entretien.statut === status : true))
      .filter((item) => (type ? item.entretien.type === type : true))
      .filter((item) => {
        if (period === "upcoming") return isUpcoming(item);
        if (period === "past") return !isUpcoming(item);
        return true;
      })
      .filter((item) => {
        if (!term) return true;
        return [
          item.candidat?.nom,
          item.candidat?.email,
          item.entreprise?.nom,
          item.offre?.titre,
          item.entretien.statut,
          item.entretien.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => new Date(a.entretien.date_heure).getTime() - new Date(b.entretien.date_heure).getTime());
  }, [entretiens, period, search, status, type]);

  const totalPages = Math.max(1, Math.ceil(entretiensFiltres.length / ITEMS_PER_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const entretiensPage = entretiensFiltres.slice((pageCourante - 1) * ITEMS_PER_PAGE, pageCourante * ITEMS_PER_PAGE);
  const upcomingCount = entretiens.filter(isUpcoming).length;
  const completedCount = entretiens.filter((item) => item.entretien.statut === "termine").length;

  useEffect(() => {
    setPage(1);
  }, [period, search, status, type]);

  return (
    <main className="page-centree section-page app-theme">
      <section className="admin-interviews-page">
        <header className="admin-interviews-hero">
          <div>
            <p className="admin-interviews-kicker">Interview operations</p>
            <h1>All interviews</h1>
            <p>Track scheduled, confirmed, rescheduled, and completed interviews from one compact admin view.</p>
          </div>
          <div className="admin-interviews-summary" aria-label="Interview summary">
            <span><strong>{entretiens.length}</strong>Total</span>
            <span><strong>{upcomingCount}</strong>Upcoming</span>
            <span><strong>{completedCount}</strong>Completed</span>
          </div>
        </header>

        <section className="admin-interviews-panel">
          <div className="admin-interviews-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate, company, role..."
              aria-label="Search interviews"
            />
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | EntretienStatut)} aria-label="Filter by status">
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={type} onChange={(event) => setType(event.target.value as "" | EntretienType)} aria-label="Filter by type">
              {typeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={period} onChange={(event) => setPeriod(event.target.value as "all" | "upcoming" | "past")} aria-label="Filter by period">
              <option value="all">All dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past / closed</option>
            </select>
            <button type="button" onClick={() => void chargerEntretiens()}>
              Refresh
            </button>
          </div>

          {erreur ? <p className="message message-erreur">{erreur}</p> : null}

          <div className="admin-interviews-table-wrap">
            <table className="admin-interviews-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Candidate</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>Loading interviews...</td>
                  </tr>
                ) : entretiensPage.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No interviews match these filters.</td>
                  </tr>
                ) : (
                  entretiensPage.map((item) => {
                    const date = formaterDateEntretien(item.entretien.date_heure);
                    const statut = getEntretienStatutConfig(item.entretien.statut);
                    const location = getLocation(item);
                    return (
                      <tr key={item.entretien.id}>
                        <td>
                          <strong>{date.shortDate}</strong>
                          <span>{date.time}</span>
                        </td>
                        <td>
                          <strong>{item.candidat?.nom || "Candidate"}</strong>
                          <span>{item.candidat?.email || "-"}</span>
                        </td>
                        <td>{item.entreprise?.nom || "-"}</td>
                        <td>{item.offre?.titre || "-"}</td>
                        <td>{getEntretienTypeLabel(item.entretien.type)}</td>
                        <td><span className={`admin-interviews-status ${statut.className}`}>{statut.label}</span></td>
                        <td title={location}>{location}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="admin-interviews-pagination">
            <span>
              Page {pageCourante} / {totalPages} - {entretiensFiltres.length} interview(s)
            </span>
            <div>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={pageCourante <= 1}>
                Previous
              </button>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={pageCourante >= totalPages}>
                Next
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}
