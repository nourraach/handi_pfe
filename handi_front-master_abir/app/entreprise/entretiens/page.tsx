"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import {
  construireLienGoogleCalendar,
  extraireDureeMinutes,
  formaterDateEntretien,
  getEntretienStatutConfig,
  getEntretienTypeLabel,
} from "@/lib/entretiens";

type EntretienEntreprise = {
  entretien: {
    id: string;
    date_heure: string;
    type: "visio" | "presentiel" | "telephonique";
    lieu_visio?: string | null;
    lieu?: string | null;
    statut: "planifie" | "confirme" | "reporte" | "annule" | "termine";
    duree_prevue?: string | null;
    contact_entreprise?: string | null;
    notes?: string | null;
  };
  candidature?: {
    id?: string;
    statut?: string;
  };
  candidat?: {
    nom?: string;
    email?: string;
    telephone?: string;
  };
  offre?: {
    titre?: string;
  };
};

type EntretienFormulaire = {
  date_heure: string;
  type: "visio" | "presentiel" | "telephonique";
  lieu_visio: string;
  lieu: string;
  duree_prevue: string;
  contact_entreprise: string;
  notes: string;
};

type FormEdition = EntretienFormulaire;
type FormPlanification = EntretienFormulaire & { id_candidature: string };

type CandidateurePlanifiable = {
  candidature: {
    id: string;
    statut?: "pending" | "shortlisted" | "interview_scheduled" | "rejected" | "accepted";
  };
  candidat?: {
    nom?: string;
    email?: string;
    telephone?: string;
  };
  offre?: {
    titre?: string;
  };
};

type EntretiensEntreprisePayload = {
  message?: string;
  donnees?: EntretienEntreprise[];
};

type CandidateuresPlanifiablesPayload = {
  message?: string;
  donnees?: CandidateurePlanifiable[];
};

type TimelineGroups = {
  today: EntretienEntreprise[];
  tomorrow: EntretienEntreprise[];
  upcoming: EntretienEntreprise[];
};

function versDateTimeLocal(dateString?: string) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function initials(name?: string) {
  const text = (name || "Candidate").trim();
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function statusClass(statut: EntretienEntreprise["entretien"]["statut"]) {
  switch (statut) {
    case "confirme":
      return "status-confirmed";
    case "planifie":
      return "status-scheduled";
    case "reporte":
      return "status-rescheduled";
    case "termine":
      return "status-completed";
    case "annule":
    default:
      return "status-cancelled";
  }
}

const formulaireVide: EntretienFormulaire = {
  date_heure: "",
  type: "visio",
  lieu_visio: "",
  lieu: "",
  duree_prevue: "60 minutes",
  contact_entreprise: "",
  notes: "",
};

const formulairePlanificationInitial: FormPlanification = {
  id_candidature: "",
  ...formulaireVide,
};

function construirePayloadEntretien(formulaire: EntretienFormulaire) {
  return {
    date_heure: new Date(formulaire.date_heure).toISOString(),
    type: formulaire.type,
    lieu_visio: formulaire.type === "visio" ? formulaire.lieu_visio : undefined,
    lieu: formulaire.type === "presentiel" ? formulaire.lieu : undefined,
    duree_prevue: formulaire.duree_prevue || undefined,
    contact_entreprise: formulaire.contact_entreprise || undefined,
    notes: formulaire.notes || undefined,
  };
}

export default function EntretiensEntreprisePage() {
  const [entretiens, setEntretiens] = useState<EntretienEntreprise[]>([]);
  const [candidaturesPlanifiables, setCandidateuresPlanifiables] = useState<CandidateurePlanifiable[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [entretienEnAction, setEntretienEnAction] = useState<string | null>(null);
  const [entretienEnEdition, setEntretienEnEdition] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState<FormEdition>(formulaireVide);
  const [planificationOuverte, setPlanificationOuverte] = useState(false);
  const [formulairePlanification, setFormulairePlanification] = useState<FormPlanification>(formulairePlanificationInitial);
  const [entretienSelectionneId, setEntretienSelectionneId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const [filtreType, setFiltreType] = useState<string>("");
  const [filtreStatut, setFiltreStatut] = useState<string>("");

  const charger = async () => {
    try {
      setLoading(true);
      setErreur(null);
      const response = await authenticatedFetch(construireUrlApi("/api/entretiens/entreprise"));
      const data: EntretiensEntreprisePayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load interviews.");
      }

      setEntretiens(Array.isArray(data.donnees) ? data.donnees : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  const chargerCandidateuresPlanifiables = async () => {
    try {
      const response = await authenticatedFetch(construireUrlApi("/api/candidatures/entreprise?limit=100"));
      const data: CandidateuresPlanifiablesPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load candidates for interviews.");
      }

      const candidatures = Array.isArray(data.donnees) ? data.donnees : [];
      setCandidateuresPlanifiables(
        candidatures.filter((item) => item.candidature?.statut === "pending" || item.candidature?.statut === "shortlisted"),
      );
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load candidates for interviews.");
    }
  };

  useEffect(() => {
    void Promise.all([charger(), chargerCandidateuresPlanifiables()]);
  }, []);

  const entretiensFiltres = useMemo(() => {
    return [...entretiens]
      .filter((item) => (filtreType ? item.entretien.type === filtreType : true))
      .filter((item) => (filtreStatut ? item.entretien.statut === filtreStatut : true))
      .sort((a, b) => new Date(a.entretien.date_heure).getTime() - new Date(b.entretien.date_heure).getTime());
  }, [entretiens, filtreType, filtreStatut]);

  const entretiensParJour = useMemo(() => {
    const map = new Map<string, EntretienEntreprise[]>();
    for (const item of entretiensFiltres) {
      const date = new Date(item.entretien.date_heure);
      if (Number.isNaN(date.getTime())) continue;
      const key = dayKey(date);
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }

    for (const value of map.values()) {
      value.sort((a, b) => new Date(a.entretien.date_heure).getTime() - new Date(b.entretien.date_heure).getTime());
    }

    return map;
  }, [entretiensFiltres]);

  const interviewCountParJour = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of entretiensFiltres) {
      const date = new Date(item.entretien.date_heure);
      if (Number.isNaN(date.getTime())) continue;
      const key = dayKey(date);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [entretiensFiltres]);

  const timeline = useMemo<TimelineGroups>(() => {
    const groups: TimelineGroups = { today: [], tomorrow: [], upcoming: [] };
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    for (const item of entretiensFiltres) {
      const date = new Date(item.entretien.date_heure);
      if (Number.isNaN(date.getTime())) continue;

      if (sameDay(date, today)) {
        groups.today.push(item);
      } else if (sameDay(date, tomorrow)) {
        groups.tomorrow.push(item);
      } else {
        groups.upcoming.push(item);
      }
    }

    return groups;
  }, [entretiensFiltres]);

  useEffect(() => {
    if (entretiensFiltres.length === 0) {
      setEntretienSelectionneId(null);
      return;
    }

    const existing = entretienSelectionneId
      ? entretiensFiltres.find((item) => item.entretien.id === entretienSelectionneId)
      : null;

    if (existing) {
      return;
    }

    const first = entretiensFiltres[0];
    setEntretienSelectionneId(first.entretien.id);
    const date = new Date(first.entretien.date_heure);
    if (!Number.isNaN(date.getTime())) {
      setSelectedDay(dayKey(date));
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [entretiensFiltres, entretienSelectionneId]);

  const entretienSelectionne = useMemo(
    () => entretiensFiltres.find((item) => item.entretien.id === entretienSelectionneId) || null,
    [entretiensFiltres, entretienSelectionneId],
  );

  const ouvrirEdition = (item: EntretienEntreprise) => {
    setEntretienEnEdition(item.entretien.id);
    setFormulaire({
      date_heure: versDateTimeLocal(item.entretien.date_heure),
      type: item.entretien.type,
      lieu_visio: item.entretien.lieu_visio || "",
      lieu: item.entretien.lieu || "",
      duree_prevue: item.entretien.duree_prevue || "60 minutes",
      contact_entreprise: item.entretien.contact_entreprise || "",
      notes: item.entretien.notes || "",
    });
    setErreur(null);
    setInfo(null);
  };

  const fermerEdition = () => {
    setEntretienEnEdition(null);
    setFormulaire(formulaireVide);
  };

  const ouvrirPlanification = () => {
    setPlanificationOuverte(true);
    setEntretienEnEdition(null);
    setErreur(null);
    setInfo(null);
    setFormulairePlanification((courant) => ({
      ...formulairePlanificationInitial,
      id_candidature: courant.id_candidature || candidaturesPlanifiables[0]?.candidature.id || "",
    }));
  };

  const fermerPlanification = () => {
    setPlanificationOuverte(false);
    setFormulairePlanification(formulairePlanificationInitial);
  };

  const planifierEntretien = async () => {
    try {
      setEntretienEnAction("creation");
      setErreur(null);
      setInfo(null);

      if (!formulairePlanification.id_candidature) {
        throw new Error("Select an application before scheduling an interview.");
      }

      if (!formulairePlanification.date_heure) {
        throw new Error("The interview date and time are required.");
      }

      if (formulairePlanification.type === "visio" && !formulairePlanification.lieu_visio.trim()) {
        throw new Error("A video link is required for a video interview.");
      }

      if (formulairePlanification.type === "presentiel" && !formulairePlanification.lieu.trim()) {
        throw new Error("A location is required for an in-person interview.");
      }

      const response = await authenticatedFetch(construireUrlApi("/api/entretiens/planifier"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_candidature: formulairePlanification.id_candidature,
          ...construirePayloadEntretien(formulairePlanification),
        }),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to schedule the interview.");
      }

      setInfo(data.message || "Interview scheduled successfully.");
      fermerPlanification();
      await Promise.all([charger(), chargerCandidateuresPlanifiables()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to schedule the interview.");
    } finally {
      setEntretienEnAction(null);
    }
  };

  const planificationValide =
    Boolean(formulairePlanification.id_candidature) &&
    Boolean(formulairePlanification.date_heure) &&
    (formulairePlanification.type !== "visio" || Boolean(formulairePlanification.lieu_visio.trim())) &&
    (formulairePlanification.type !== "presentiel" || Boolean(formulairePlanification.lieu.trim()));

  const modifierEntretien = async (id: string) => {
    try {
      setEntretienEnAction(id);
      setErreur(null);
      setInfo(null);

      if (!formulaire.date_heure) {
        throw new Error("The interview date and time are required.");
      }

      if (formulaire.type === "visio" && !formulaire.lieu_visio.trim()) {
        throw new Error("A video link is required.");
      }

      if (formulaire.type === "presentiel" && !formulaire.lieu.trim()) {
        throw new Error("A location is required.");
      }

      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(construirePayloadEntretien(formulaire)),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update the interview.");
      }

      setInfo(data.message || "Interview updated successfully.");
      fermerEdition();
      await Promise.all([charger(), chargerCandidateuresPlanifiables()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to update the interview.");
    } finally {
      setEntretienEnAction(null);
    }
  };

  const lancerAction = async (id: string, action: "annuler" | "terminer") => {
    try {
      setEntretienEnAction(id);
      setErreur(null);
      setInfo(null);

      const body = action === "annuler" ? { motif: formulaire.notes || undefined } : { notes: formulaire.notes || undefined };

      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${id}/${action}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete this action.");
      }

      setInfo(data.message || "Action completed successfully.");
      fermerEdition();
      await Promise.all([charger(), chargerCandidateuresPlanifiables()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to complete this action.");
    } finally {
      setEntretienEnAction(null);
    }
  };

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{ date: Date; currentMonth: boolean; key: string; dayNumber: number }> = [];

    for (let i = 0; i < 42; i += 1) {
      const dayOffset = i - startWeekday + 1;
      let date: Date;
      let currentMonth = true;

      if (dayOffset <= 0) {
        date = new Date(year, month - 1, daysInPrevMonth + dayOffset);
        currentMonth = false;
      } else if (dayOffset > daysInMonth) {
        date = new Date(year, month + 1, dayOffset - daysInMonth);
        currentMonth = false;
      } else {
        date = new Date(year, month, dayOffset);
      }

      cells.push({ date, currentMonth, key: dayKey(date), dayNumber: date.getDate() });
    }

    return cells;
  }, [calendarMonth]);

  const selectedDateText = useMemo(() => {
    const [year, month, day] = selectedDay.split("-").map((value) => Number.parseInt(value, 10));
    const selected = new Date(year, (month || 1) - 1, day || 1);
    if (Number.isNaN(selected.getTime())) return "";
    return selected.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  }, [selectedDay]);

  const renderTimelineSection = (title: string, subtitle: string, items: EntretienEntreprise[]) => (
    <section className="timeline-group">
      <header>
        <h4>{title}</h4>
        <span>{subtitle}</span>
      </header>
      {items.length === 0 ? (
        <div className="timeline-empty">
          <p>Aucun entretien programme sur ce creneau</p>
          <small>Vous pouvez planifier un entretien depuis les candidatures shortlist.</small>
        </div>
      ) : (
        <div className="timeline-list">
          {items.map((item) => {
            const date = formaterDateEntretien(item.entretien.date_heure);
            const statut = getEntretienStatutConfig(item.entretien.statut);
            return (
              <button
                key={item.entretien.id}
                type="button"
                className={`timeline-item ${entretienSelectionneId === item.entretien.id ? "timeline-item-active" : ""}`}
                onClick={() => {
                  setEntretienSelectionneId(item.entretien.id);
                  if (date.raw) {
                    setSelectedDay(dayKey(date.raw));
                    setCalendarMonth(new Date(date.raw.getFullYear(), date.raw.getMonth(), 1));
                  }
                }}
              >
                <div className="timeline-time">
                  <strong>{date.time}</strong>
                </div>
                <span className="avatar">{initials(item.candidat?.nom)}</span>
                <div className="timeline-copy">
                  <strong>{item.candidat?.nom || "Candidate"}</strong>
                  <small>{item.offre?.titre || "Role"}</small>
                  <small>
                    {getEntretienTypeLabel(item.entretien.type)} interview - {item.entretien.duree_prevue || "60 min"}
                  </small>
                </div>
                <span className={`status-pill ${statusClass(item.entretien.statut)}`}>{statut.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="app-page interviews-dashboard" aria-live="polite">
      <div className="interviews-header">
        <div>
          <p className="section-eyebrow">INTERVIEWS</p>
          <h1>Track, reschedule, and manage interviews</h1>
          <p>This page is now connected to the company&apos;s live interview API.</p>
        </div>
        <div className="interviews-header-actions">
          <Button onClick={ouvrirPlanification} disabled={candidaturesPlanifiables.length === 0}>
            Schedule interview
          </Button>
          <ButtonLink href="/entreprise/candidatures" variant="secondary">
            View applications
          </ButtonLink>
        </div>
      </div>

      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}
      {info ? <div className="message message-info" role="status">{info}</div> : null}

      {planificationOuverte ? (
        <Card tone="accent" padding="lg">
          <div className="form-section">
            <div>
              <strong className="form-section-title">Invite a candidate to an interview</strong>
              <p className="texte-secondaire form-section-subtitle">
                Select an application, set meeting details, and publish the interview in both workspaces.
              </p>
            </div>

            {candidaturesPlanifiables.length === 0 ? (
              <div className="message message-neutre">
                No applications are ready for interviews. Shortlist candidates first from Applications.
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="groupe-champ">
                    <label htmlFor="candidature-planification">Application</label>
                    <select
                      id="candidature-planification"
                      className="champ-select"
                      value={formulairePlanification.id_candidature}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({ ...courant, id_candidature: event.target.value }))
                      }
                    >
                      <option value="">Select an application</option>
                      {candidaturesPlanifiables.map((item) => (
                        <option key={item.candidature.id} value={item.candidature.id}>
                          {(item.candidat?.nom || "Candidate").trim()} - {item.offre?.titre || "Role"} (
                          {item.candidature.statut === "shortlisted" ? "shortlisted" : "new application"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="date-planification">Date and time</label>
                    <input
                      id="date-planification"
                      className="champ"
                      type="datetime-local"
                      value={formulairePlanification.date_heure}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({ ...courant, date_heure: event.target.value }))
                      }
                    />
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="type-planification">Type</label>
                    <select
                      id="type-planification"
                      className="champ-select"
                      value={formulairePlanification.type}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({
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
                      value={formulairePlanification.duree_prevue}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({ ...courant, duree_prevue: event.target.value }))
                      }
                    />
                  </div>
                </div>

                {formulairePlanification.type === "visio" ? (
                  <div className="groupe-champ">
                    <label htmlFor="visio-planification">Video meeting link</label>
                    <input
                      id="visio-planification"
                      className="champ"
                      placeholder="https://meet.google.com/..."
                      value={formulairePlanification.lieu_visio}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({ ...courant, lieu_visio: event.target.value }))
                      }
                    />
                  </div>
                ) : null}

                {formulairePlanification.type === "presentiel" ? (
                  <div className="groupe-champ">
                    <label htmlFor="lieu-planification">Location</label>
                    <input
                      id="lieu-planification"
                      className="champ"
                      value={formulairePlanification.lieu}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({ ...courant, lieu: event.target.value }))
                      }
                    />
                  </div>
                ) : null}

                <div className="groupe-champ">
                  <label htmlFor="notes-planification">Notes</label>
                  <textarea
                    id="notes-planification"
                    className="champ-zone"
                    value={formulairePlanification.notes}
                    onChange={(event) =>
                      setFormulairePlanification((courant) => ({ ...courant, notes: event.target.value }))
                    }
                  />
                </div>
              </>
            )}

            <div className="page-header-actions">
              <Button
                onClick={planifierEntretien}
                disabled={entretienEnAction === "creation" || candidaturesPlanifiables.length === 0 || !planificationValide}
              >
                Create interview
              </Button>
              <Button variant="secondary" onClick={() => void chargerCandidateuresPlanifiables()}>
                Refresh applications
              </Button>
              <Button variant="ghost" onClick={fermerPlanification}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card padding="lg">
          <LoadingState title="Chargement des entretiens" description="Nous preparons votre planning d'entretiens." />
        </Card>
      ) : entretiens.length === 0 ? (
        <Card padding="lg">
          <div className="empty-main">
            <svg viewBox="0 0 160 120" className="empty-illustration" aria-hidden="true">
              <rect x="18" y="26" width="124" height="68" rx="14" fill="#F6F5F8" stroke="#D9D5DF" />
              <rect x="34" y="42" width="44" height="10" rx="5" fill="#D8CAF6" />
              <rect x="34" y="60" width="84" height="8" rx="4" fill="#ECEAF0" />
              <circle cx="122" cy="44" r="11" fill="#35063E" />
              <path d="M122 38v12M116 44h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>Aucun entretien programme pour le moment</h3>
            <p>Lancez votre premier entretien pour garder le pipeline candidat actif.</p>
            <Button onClick={ouvrirPlanification} disabled={candidaturesPlanifiables.length === 0}>
              Schedule interview
            </Button>
          </div>
        </Card>
      ) : (
        <div className="main-grid">
          <section className="calendar-panel">
            <div className="calendar-header">
              <h3>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
              <div className="calendar-nav">
                <button type="button" onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                  ‹
                </button>
                <button type="button" onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                  ›
                </button>
              </div>
            </div>

            <div className="weekday-row">
              {"Su Mo Tu We Th Fr Sa".split(" ").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarCells.map((cell) => {
                const count = interviewCountParJour.get(cell.key) || 0;
                const selected = selectedDay === cell.key;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`day-cell ${cell.currentMonth ? "" : "day-muted"} ${selected ? "day-selected" : ""}`}
                    onClick={() => {
                      setSelectedDay(cell.key);
                      const first = entretiensParJour.get(cell.key)?.[0];
                      if (first) {
                        setEntretienSelectionneId(first.entretien.id);
                      }
                    }}
                  >
                    <span>{cell.dayNumber}</span>
                    {count > 0 ? <small>{count}</small> : null}
                  </button>
                );
              })}
            </div>

            <div className="calendar-filters">
              <strong>Filters</strong>
              <select className="champ-select" value={filtreType} onChange={(event) => setFiltreType(event.target.value)}>
                <option value="">All interviews</option>
                <option value="visio">Video</option>
                <option value="presentiel">In person</option>
                <option value="telephonique">Phone</option>
              </select>
              <select className="champ-select" value={filtreStatut} onChange={(event) => setFiltreStatut(event.target.value)}>
                <option value="">All statuses</option>
                <option value="planifie">Scheduled</option>
                <option value="confirme">Confirmed</option>
                <option value="reporte">Rescheduled</option>
                <option value="annule">Cancelled</option>
                <option value="termine">Completed</option>
              </select>
            </div>
          </section>

          <section className="timeline-panel">
            {renderTimelineSection("Today", selectedDateText || "", timeline.today)}
            {renderTimelineSection(
              "Tomorrow",
              addDays(new Date(), 1).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
              timeline.tomorrow,
            )}
            {renderTimelineSection("Upcoming", "Next interviews", timeline.upcoming)}
          </section>

          <section className="details-panel">
            <div className="details-head">
              <h3>Interview details</h3>
            </div>

            {entretienSelectionne ? (
              (() => {
                const date = formaterDateEntretien(entretienSelectionne.entretien.date_heure);
                const statut = getEntretienStatutConfig(entretienSelectionne.entretien.statut);
                const actionEnCours = entretienEnAction === entretienSelectionne.entretien.id;
                const googleCalendarLink = construireLienGoogleCalendar({
                  titre: `Interview - ${entretienSelectionne.candidat?.nom || "Candidate"}`,
                  dateHeure: entretienSelectionne.entretien.date_heure,
                  dureeMinutes: extraireDureeMinutes(entretienSelectionne.entretien.duree_prevue || undefined),
                  details: `${entretienSelectionne.offre?.titre || "Role"} - ${entretienSelectionne.candidat?.email || ""}`,
                  location:
                    entretienSelectionne.entretien.type === "visio"
                      ? entretienSelectionne.entretien.lieu_visio || ""
                      : entretienSelectionne.entretien.type === "presentiel"
                        ? entretienSelectionne.entretien.lieu || ""
                        : entretienSelectionne.entretien.contact_entreprise || entretienSelectionne.candidat?.telephone || "",
                });

                return (
                  <>
                    <div className="details-identity">
                      <span className="avatar">{initials(entretienSelectionne.candidat?.nom)}</span>
                      <div>
                        <strong>{entretienSelectionne.candidat?.nom || "Candidate"}</strong>
                        <small>{entretienSelectionne.offre?.titre || "Role"}</small>
                      </div>
                      <span className={`status-pill ${statusClass(entretienSelectionne.entretien.statut)}`}>{statut.label}</span>
                    </div>

                    <div className="details-list">
                      <p><strong>Date:</strong> {date.date}</p>
                      <p><strong>Time:</strong> {date.time}</p>
                      <p><strong>Type:</strong> {getEntretienTypeLabel(entretienSelectionne.entretien.type)} interview</p>
                      <p><strong>Duration:</strong> {entretienSelectionne.entretien.duree_prevue || "60 min"}</p>
                      <p><strong>Video link:</strong> {entretienSelectionne.entretien.lieu_visio || "-"}</p>
                      <p><strong>Email:</strong> {entretienSelectionne.candidat?.email || "-"}</p>
                      <p><strong>Phone:</strong> {entretienSelectionne.candidat?.telephone || "-"}</p>
                      <p><strong>Notes:</strong> {entretienSelectionne.entretien.notes || "No notes"}</p>
                    </div>

                    <div className="details-actions">
                      <Button
                        onClick={() => {
                          if (entretienSelectionne.entretien.type === "visio" && entretienSelectionne.entretien.lieu_visio) {
                            window.open(entretienSelectionne.entretien.lieu_visio, "_blank", "noopener,noreferrer");
                          }
                        }}
                        disabled={entretienSelectionne.entretien.type !== "visio" || !entretienSelectionne.entretien.lieu_visio}
                      >
                        Join call
                      </Button>
                      <Button variant="secondary" onClick={() => ouvrirEdition(entretienSelectionne)} disabled={actionEnCours}>
                        Reschedule
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (confirm("Confirmer l'annulation de cet entretien ?")) {
                            void lancerAction(entretienSelectionne.entretien.id, "annuler");
                          }
                        }}
                        disabled={actionEnCours}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="details-extra-actions">
                      <a className="ui-button ui-button-ghost" href={googleCalendarLink} target="_blank" rel="noopener noreferrer">
                        Add to calendar
                      </a>
                      <Button
                        variant="ghost"
                        onClick={() => lancerAction(entretienSelectionne.entretien.id, "terminer")}
                        disabled={actionEnCours}
                      >
                        Mark completed
                      </Button>
                    </div>

                    {entretienEnEdition === entretienSelectionne.entretien.id ? (
                      <Card tone="accent" padding="lg">
                        <div className="form-section">
                          <div>
                            <strong className="form-section-title">Reschedule interview</strong>
                            <p className="texte-secondaire form-section-subtitle">
                              Update date/time and interview details.
                            </p>
                          </div>

                          <div className="form-grid">
                            <div className="groupe-champ">
                              <label htmlFor="edit-date">Date and time</label>
                              <input
                                id="edit-date"
                                className="champ"
                                type="datetime-local"
                                value={formulaire.date_heure}
                                onChange={(event) => setFormulaire((courant) => ({ ...courant, date_heure: event.target.value }))}
                              />
                            </div>

                            <div className="groupe-champ">
                              <label htmlFor="edit-type">Type</label>
                              <select
                                id="edit-type"
                                className="champ-select"
                                value={formulaire.type}
                                onChange={(event) =>
                                  setFormulaire((courant) => ({
                                    ...courant,
                                    type: event.target.value as FormEdition["type"],
                                  }))
                                }
                              >
                                <option value="visio">Video</option>
                                <option value="presentiel">In person</option>
                                <option value="telephonique">Phone</option>
                              </select>
                            </div>

                            <div className="groupe-champ">
                              <label htmlFor="edit-duration">Duration</label>
                              <input
                                id="edit-duration"
                                className="champ"
                                value={formulaire.duree_prevue}
                                onChange={(event) => setFormulaire((courant) => ({ ...courant, duree_prevue: event.target.value }))}
                              />
                            </div>

                            <div className="groupe-champ">
                              <label htmlFor="edit-contact">Company contact</label>
                              <input
                                id="edit-contact"
                                className="champ"
                                value={formulaire.contact_entreprise}
                                onChange={(event) =>
                                  setFormulaire((courant) => ({ ...courant, contact_entreprise: event.target.value }))
                                }
                              />
                            </div>
                          </div>

                          {formulaire.type === "visio" ? (
                            <div className="groupe-champ">
                              <label htmlFor="edit-visio">Video link</label>
                              <input
                                id="edit-visio"
                                className="champ"
                                value={formulaire.lieu_visio}
                                onChange={(event) => setFormulaire((courant) => ({ ...courant, lieu_visio: event.target.value }))}
                              />
                            </div>
                          ) : null}

                          {formulaire.type === "presentiel" ? (
                            <div className="groupe-champ">
                              <label htmlFor="edit-location">Location</label>
                              <input
                                id="edit-location"
                                className="champ"
                                value={formulaire.lieu}
                                onChange={(event) => setFormulaire((courant) => ({ ...courant, lieu: event.target.value }))}
                              />
                            </div>
                          ) : null}

                          <div className="groupe-champ">
                            <label htmlFor="edit-notes">Notes</label>
                            <textarea
                              id="edit-notes"
                              className="champ-zone"
                              value={formulaire.notes}
                              onChange={(event) => setFormulaire((courant) => ({ ...courant, notes: event.target.value }))}
                            />
                          </div>

                          <div className="page-header-actions">
                            <Button onClick={() => modifierEntretien(entretienSelectionne.entretien.id)} disabled={actionEnCours}>
                              Save changes
                            </Button>
                            <Button variant="ghost" onClick={fermerEdition} disabled={actionEnCours}>
                              Close
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : null}
                  </>
                );
              })()
            ) : (
              <div className="empty-side">
                <p>Selectionnez un entretien dans la timeline pour afficher tous les details.</p>
              </div>
            )}
          </section>
        </div>
      )}

      <style jsx>{`
        .interviews-dashboard {
          background: var(--color-bg, #fbfafc);
          border-radius: 24px;
          padding: 16px;
        }
        .interviews-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .section-eyebrow {
          margin: 0 0 6px;
          color: #8d5ccc;
          letter-spacing: 0.08em;
          font-weight: 700;
          font-size: 0.76rem;
        }
        .interviews-header h1 {
          margin: 0;
          font-size: clamp(2rem, 3.4vw, 2.5rem);
          line-height: 1.05;
          color: #14111a;
          font-weight: 800;
          max-width: 780px;
        }
        .interviews-header p {
          margin: 8px 0 0;
          color: #6b6478;
        }
        .interviews-header-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .main-grid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr) 320px;
          gap: 12px;
          align-items: start;
        }
        .calendar-panel,
        .timeline-panel,
        .details-panel {
          background: #fff;
          border: 1px solid #ece4f9;
          border-radius: 20px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(20, 17, 26, 0.06), 0 1px 2px rgba(20, 17, 26, 0.04);
          transition: box-shadow 150ms ease, transform 150ms ease, border-color 150ms ease;
        }
        .calendar-panel:hover,
        .timeline-panel:hover,
        .details-panel:hover {
          transform: translateY(-2px);
          border-color: #d8caf6;
          box-shadow: 0 4px 12px rgba(20, 17, 26, 0.08), 0 2px 4px rgba(20, 17, 26, 0.06);
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .calendar-header h3 {
          margin: 0;
          color: #2a1843;
          font-size: 1.15rem;
        }
        .calendar-nav {
          display: flex;
          gap: 6px;
        }
        .calendar-nav button {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          border: 1px solid #e7def5;
          background: #fff;
          color: #5f2ac8;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
        }
        .calendar-nav button:hover {
          border-color: #d8caf6;
          background: #f6f5f8;
          color: #35063e;
        }
        .weekday-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
          margin-bottom: 6px;
        }
        .weekday-row span {
          text-align: center;
          color: #8d87a3;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
        }
        .day-cell {
          border: 1px solid transparent;
          background: transparent;
          border-radius: 10px;
          min-height: 40px;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #2f1f4d;
          padding: 4px 0;
          font-size: 0.8rem;
          transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .day-cell:hover {
          border-color: #d8caf6;
          background: #f6f5f8;
        }
        .day-cell small {
          font-size: 0.64rem;
          color: #8b5fd0;
          font-weight: 700;
        }
        .day-muted {
          color: #b3acc6;
        }
        .day-selected {
          background: #5f2ac8;
          color: #fff;
        }
        .day-selected small {
          color: #fff;
        }
        .calendar-filters {
          margin-top: 14px;
          display: grid;
          gap: 8px;
        }
        .calendar-filters strong {
          color: #4a3d66;
          font-size: 0.85rem;
        }
        .timeline-panel {
          display: grid;
          gap: 12px;
        }
        .timeline-group header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 8px;
        }
        .timeline-group h4 {
          margin: 0;
          color: #2a1843;
          font-size: 1rem;
        }
        .timeline-group header span {
          color: #807a97;
          font-size: 0.82rem;
        }
        .timeline-list {
          display: grid;
          gap: 8px;
        }
        .timeline-item {
          width: 100%;
          border: 1px solid #ece4f9;
          background: #fcfbff;
          border-radius: 14px;
          padding: 10px;
          display: grid;
          grid-template-columns: 72px 38px 1fr auto;
          align-items: center;
          gap: 10px;
          text-align: left;
          cursor: pointer;
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease, background-color 150ms ease;
        }
        .timeline-item:hover {
          border-color: #d8caf6;
          box-shadow: 0 4px 12px rgba(20, 17, 26, 0.08), 0 2px 4px rgba(20, 17, 26, 0.06);
          transform: translateY(-1px);
        }
        .timeline-item-active {
          border-color: #cdb8f0;
          box-shadow: 0 0 0 2px rgba(95, 42, 200, 0.12);
        }
        .timeline-time strong {
          color: #2a1843;
          font-size: 0.86rem;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #35063e, #7f43aa);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .timeline-copy {
          display: grid;
          gap: 2px;
        }
        .timeline-copy strong {
          color: #2a1843;
          font-size: 0.88rem;
        }
        .timeline-copy small {
          color: #847e9b;
          font-size: 0.75rem;
        }
        .timeline-empty {
          border: 1px dashed #dfd2f4;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }
        .timeline-empty p {
          margin: 0;
          color: #6f6786;
          font-weight: 600;
        }
        .timeline-empty small {
          color: #9a93b0;
        }
        .status-pill {
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          animation: fadeIn 220ms ease;
        }
        .status-confirmed {
          background: #def6e8;
          color: #1f8f4e;
        }
        .status-scheduled {
          background: #fff0d8;
          color: #ad6b09;
        }
        .status-rescheduled {
          background: #efe8fb;
          color: #6438b4;
        }
        .status-completed {
          background: #e8efff;
          color: #275fc0;
        }
        .status-cancelled {
          background: #fde7ec;
          color: #b12e3f;
        }
        .details-head h3 {
          margin: 0 0 10px;
          color: #2a1843;
        }
        .details-identity {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }
        .details-identity strong {
          display: block;
          color: #2a1843;
        }
        .details-identity small {
          color: #817b98;
        }
        .details-list {
          display: grid;
          gap: 7px;
          margin-bottom: 14px;
        }
        .details-list p {
          margin: 0;
          color: #4a3d67;
          font-size: 0.84rem;
          line-height: 1.35;
        }
        .details-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        .details-extra-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }
        .empty-main,
        .empty-side {
          text-align: center;
          padding: 28px 10px;
          display: grid;
          gap: 12px;
          justify-items: center;
        }
        .empty-illustration {
          width: 160px;
          height: 120px;
        }
        .empty-main h3 {
          margin: 0 0 8px;
          color: #2a1843;
        }
        .empty-main p,
        .empty-side p {
          margin: 0 0 14px;
          color: #746e8b;
        }
        .form-section-title {
          display: block;
          font-size: 1.1rem;
          color: #2a1843;
        }
        .form-section-subtitle {
          margin: 10px 0 0;
        }
        .interviews-dashboard :global(button),
        .interviews-dashboard :global(a) {
          transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
        }
        .interviews-dashboard :global(button):active,
        .interviews-dashboard :global(a):active {
          transform: scale(0.98);
        }
        .interviews-dashboard :global(button):focus-visible,
        .interviews-dashboard :global(a):focus-visible,
        .day-cell:focus-visible,
        .timeline-item:focus-visible,
        .champ:focus-visible,
        .champ-select:focus-visible,
        .champ-zone:focus-visible {
          outline: none;
          box-shadow: var(--ring-focus, 0 0 0 3px #d8caf6);
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
        @media (max-width: 1400px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          .timeline-panel {
            order: 2;
          }
          .details-panel {
            order: 3;
          }
        }
        @media (max-width: 1100px) {
          .interviews-dashboard {
            padding: 24px;
          }
          .interviews-header h1 {
            font-size: 2.2rem;
          }
        }
        @media (max-width: 720px) {
          .interviews-dashboard {
            padding: 16px;
          }
          .interviews-header {
            flex-direction: column;
          }
          .timeline-item {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .details-extra-actions {
            grid-template-columns: 1fr;
          }
          .calendar-nav button,
          .day-cell,
          .interviews-header-actions :global(a),
          .interviews-header-actions :global(button),
          .page-header-actions :global(a),
          .page-header-actions :global(button) {
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
}
