"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Search, Video } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import {
  EntretienStatut,
  EntretienType,
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

const ITEMS_PER_PAGE = 25;
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

const interviewBoardStyles = `
  .interviews-board {
    width: 100%;
    color: #171142;
    font-family: "Manrope", "IBM Plex Sans", "Inter", system-ui, sans-serif;
  }

  .interviews-board__panel {
    display: grid;
    gap: 24px;
    padding: 22px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.06);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.025), transparent),
      rgba(11,8,20,0.9);
    box-shadow: 0 24px 60px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .interviews-board__toolbar {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(150px, 0.38fr) minmax(150px, 0.38fr) minmax(150px, 0.38fr);
    gap: 16px;
    align-items: center;
  }

  .interviews-board__search,
  .interviews-board__select {
    position: relative;
    min-width: 0;
  }

  .interviews-board__search svg,
  .interviews-board__select svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #6c42ef;
    pointer-events: none;
  }

  .interviews-board__search svg {
    left: 20px;
  }

  .interviews-board__select svg {
    right: 18px;
  }

  .interviews-board__search input,
  .interviews-board__select select {
    width: 100%;
    min-height: 54px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(7,5,13,0.74);
    color: #fff;
    outline: none;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    font-weight: 800;
  }

  .interviews-board__search input {
    padding: 0 18px 0 54px;
  }

  .interviews-board__search input::placeholder {
    color: rgba(216,208,255,0.42);
  }

  .interviews-board__select select {
    appearance: none;
    padding: 0 48px 0 20px;
  }

  .interviews-board__table-wrap {
    overflow-x: auto;
    overflow-y: hidden;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(11,8,20,0.84);
    scrollbar-width: thin;
    scrollbar-color: rgba(138,99,210,0.44) transparent;
  }

  .interviews-board__table-wrap::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    display: block;
  }

  .interviews-board__table-wrap::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(138,99,210,0.44);
  }

  .interviews-board__table {
    width: 100%;
    min-width: 940px;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
  }

  .interviews-board__table th {
    height: 56px;
    padding: 14px 12px;
    background: rgba(255,255,255,0.025);
    color: rgba(216,208,255,0.66);
    text-align: left;
    text-transform: uppercase;
    font-size: 0.7rem;
    font-weight: 950;
    letter-spacing: 0.02em;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    white-space: nowrap;
  }

  .interviews-board__sort {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .interviews-board__sort::after {
    content: "";
    color: #b8afd5;
    font-size: 0.7rem;
  }

  .interviews-board__table td {
    height: 116px;
    padding: 18px 12px;
    vertical-align: middle;
    border-bottom: 1px solid rgba(255,255,255,0.045);
    color: rgba(255,255,255,0.86);
    font-size: 0.84rem;
    font-weight: 750;
    line-height: 1.35;
  }

  .interviews-board__table tr:last-child td {
    border-bottom: 0;
  }

  .interviews-board__schedule {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .interviews-board__schedule-icon {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    background: linear-gradient(135deg, rgba(45,23,77,0.82), rgba(91,45,145,0.18));
    color: #ccb8ed;
    line-height: 1;
  }

  .interviews-board__schedule-icon svg {
    width: 17px;
    height: 17px;
    display: block;
    margin: auto;
  }

  .interviews-board__schedule strong,
  .interviews-board__candidate strong,
  .interviews-board__company strong {
    display: block;
    color: #f3eefc;
    font-weight: 950;
    min-width: 0;
  }

  .interviews-board__schedule strong {
    font-size: 0.82rem;
  }

  .interviews-board__schedule > div > span,
  .interviews-board__candidate > div > span,
  .interviews-board__company > span {
    display: block;
    margin-top: 5px;
    color: rgba(216,208,255,0.62);
    font-size: 0.8rem;
    line-height: 1.4;
    font-weight: 700;
    min-width: 0;
  }

  .interviews-board__candidate {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .interviews-board__avatar {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(45,23,77,0.82), rgba(91,45,145,0.18));
    color: #e8dfff;
    font-weight: 950;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.04);
    font-size: 0.72rem;
  }

  .interviews-board__candidate > div,
  .interviews-board__company {
    min-width: 0;
  }

  .interviews-board__candidate strong,
  .interviews-board__company strong {
    overflow-wrap: anywhere;
  }

  .interviews-board__candidate span,
  .interviews-board__company span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .interviews-board__candidate span {
    white-space: nowrap;
  }

  .interviews-board__company span {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .interviews-board__schedule .interviews-board__schedule-icon {
    display: grid;
    place-items: center;
    margin-top: 0;
    align-self: center;
    justify-self: start;
  }

  .interviews-board__schedule .interviews-board__schedule-icon svg {
    display: block;
    margin: 0;
  }

  .interviews-board__type,
  .interviews-board__location {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #d7c8f3;
    font-weight: 850;
    max-width: 100%;
    min-width: 0;
  }

  .interviews-board__type {
    white-space: nowrap;
  }

  .interviews-board__location {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .interviews-board__type svg,
  .interviews-board__location svg {
    flex: 0 0 auto;
    width: 17px;
    height: 17px;
    color: #a77bff;
  }

  .interviews-board__status {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 0 14px;
    font-size: 0.78rem;
    font-weight: 950;
    white-space: nowrap;
  }

  .interviews-board__status::before {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: currentColor;
  }

  .interviews-board__status--done {
    background: rgba(34,197,94,0.12);
    color: #80d8a0;
  }

  .interviews-board__status--scheduled {
    background: rgba(91,45,145,0.2);
    color: #d6c4ff;
  }

  .interviews-board__status--warning {
    background: rgba(217,120,7,0.16);
    color: #f4bf73;
  }

  .interviews-board__status--cancelled {
    background: rgba(217,47,88,0.12);
    color: #ff9cb4;
  }

  .interviews-board__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: rgba(216,208,255,0.66);
    font-size: 0.86rem;
    font-weight: 800;
  }

  .interviews-board__pagination-actions {
    display: inline-flex;
    gap: 8px;
  }

  .interviews-board__pagination button {
    min-height: 38px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 13px;
    padding: 0 14px;
    background: rgba(19,16,33,0.92);
    color: #fff;
    font-weight: 900;
  }

  .interviews-board__pagination button:disabled {
    opacity: 0.45;
  }

  @media (max-width: 1280px) {
    .interviews-board__toolbar {
      grid-template-columns: minmax(240px, 1fr) repeat(3, minmax(140px, 0.35fr));
      gap: 12px;
    }
  }

  @media (max-width: 1040px) {
    .interviews-board__toolbar {
      grid-template-columns: 1fr 1fr;
    }

    .interviews-board__search {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 680px) {
    .interviews-board__panel {
      padding: 14px;
      border-radius: 18px;
    }

    .interviews-board__toolbar {
      grid-template-columns: 1fr;
    }

    .interviews-board__pagination {
      align-items: stretch;
      flex-direction: column;
    }
  }
`;

function getLocation(item: EntretienAdmin) {
  if (item.entretien.type === "visio") return item.entretien.lieu_visio || "Video link missing";
  if (item.entretien.type === "presentiel") return item.entretien.lieu || "Location missing";
  return item.entretien.contact_entreprise || "Phone contact missing";
}

function getInitials(name?: string) {
  const parts = (name || "Candidate").trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "C"}${parts[1]?.[0] || ""}`.toUpperCase();
}

function formatSchedule(value?: string) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return { date: "-", time: "-" };
  }

  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function getStatusTone(status: EntretienStatut) {
  if (status === "termine" || status === "confirme") return "done";
  if (status === "reporte") return "warning";
  if (status === "annule") return "cancelled";
  return "scheduled";
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
  useEffect(() => {
    setPage(1);
  }, [period, search, status, type]);

  return (
    <main className="page-centree section-page app-theme">
      <style>{interviewBoardStyles}</style>
      <section className="interviews-board">
        <section className="interviews-board__panel">
          <div className="interviews-board__toolbar">
            <label className="interviews-board__search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidate, company, role..."
                aria-label="Search interviews"
              />
            </label>
            <label className="interviews-board__select">
              <select value={status} onChange={(event) => setStatus(event.target.value as "" | EntretienStatut)} aria-label="Filter by status">
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
            <label className="interviews-board__select">
              <select value={type} onChange={(event) => setType(event.target.value as "" | EntretienType)} aria-label="Filter by type">
                {typeOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
            <label className="interviews-board__select">
              <select value={period} onChange={(event) => setPeriod(event.target.value as "all" | "upcoming" | "past")} aria-label="Filter by period">
                <option value="all">All dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past / closed</option>
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
          </div>

          {erreur ? <p className="message message-erreur">{erreur}</p> : null}

          <div className="interviews-board__table-wrap">
            <table className="interviews-board__table">
              <colgroup>
                <col style={{ width: "150px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "92px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "188px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th><span className="interviews-board__sort">Schedule</span></th>
                  <th>Candidate</th>
                  <th>Company & role</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading interviews...</td>
                  </tr>
                ) : entretiensPage.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No interviews match these filters.</td>
                  </tr>
                ) : (
                  entretiensPage.map((item) => {
                    const date = formatSchedule(item.entretien.date_heure);
                    const statut = getEntretienStatutConfig(item.entretien.statut);
                    const statusTone = getStatusTone(item.entretien.statut);
                    const location = getLocation(item);
                    return (
                      <tr key={item.entretien.id}>
                        <td>
                          <div className="interviews-board__schedule">
                            <span className="interviews-board__schedule-icon" aria-hidden="true">
                              <CalendarDays />
                            </span>
                            <div>
                              <strong>{date.date}</strong>
                              <span>{date.time}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="interviews-board__candidate">
                            <span className="interviews-board__avatar" aria-hidden="true">
                              {getInitials(item.candidat?.nom)}
                            </span>
                            <div>
                              <strong>{item.candidat?.nom || "Candidate"}</strong>
                              <span>{item.candidat?.email || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="interviews-board__company">
                            <strong>{item.entreprise?.nom || "-"}</strong>
                            <span>{item.offre?.titre || "-"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="interviews-board__type">
                            <Video aria-hidden="true" />
                            {getEntretienTypeLabel(item.entretien.type)}
                          </span>
                        </td>
                        <td>
                          <span className={`interviews-board__status interviews-board__status--${statusTone}`}>
                            {statut.label}
                          </span>
                        </td>
                        <td title={location}>
                          <span className="interviews-board__location">
                            <MapPin aria-hidden="true" />
                            {location}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="interviews-board__pagination">
            <span>
              Page {pageCourante} / {totalPages} - {entretiensFiltres.length} interview(s)
            </span>
            <div className="interviews-board__pagination-actions">
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
