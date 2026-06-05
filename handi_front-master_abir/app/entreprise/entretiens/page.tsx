"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { CalendarDays, CheckCircle2, Clock, ExternalLink, MapPin, Phone, RotateCw, Video, XCircle } from "lucide-react";
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

function initials(name?: string) {
  const text = (name || "Candidat").trim();
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

function getInterviewLocation(item: EntretienEntreprise) {
  if (item.entretien.type === "visio") {
    return item.entretien.lieu_visio || "Lien visio a renseigner";
  }

  if (item.entretien.type === "presentiel") {
    return item.entretien.lieu || "Lieu a renseigner";
  }

  return item.entretien.contact_entreprise || item.candidat?.telephone || "Contact telephonique a renseigner";
}

function canJoinCall(item: EntretienEntreprise | null) {
  return Boolean(item?.entretien.type === "visio" && item.entretien.lieu_visio);
}

function isFutureInterview(item: EntretienEntreprise, now = new Date()) {
  const date = new Date(item.entretien.date_heure);
  return !Number.isNaN(date.getTime()) && date.getTime() >= now.getTime() && item.entretien.statut !== "annule";
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
        throw new Error(data.message || "Impossible de charger les entretiens.");
      }

      setEntretiens(Array.isArray(data.donnees) ? data.donnees : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger les entretiens.");
    } finally {
      setLoading(false);
    }
  };

  const chargerCandidateuresPlanifiables = async () => {
    try {
      const response = await authenticatedFetch(construireUrlApi("/api/candidatures/entreprise?limit=100"));
      const data: CandidateuresPlanifiablesPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les candidatures pour les entretiens.");
      }

      const candidatures = Array.isArray(data.donnees) ? data.donnees : [];
      setCandidateuresPlanifiables(
        candidatures.filter((item) => item.candidature?.statut === "pending" || item.candidature?.statut === "shortlisted"),
      );
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger les candidatures pour les entretiens.");
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

  const prochainesEntretiens = useMemo(
    () => entretiensFiltres.filter((item) => isFutureInterview(item)).slice(0, 8),
    [entretiensFiltres],
  );

  const prochainEntretien = useMemo(() => prochainesEntretiens[0] || entretiensFiltres[0] || null, [entretiensFiltres, prochainesEntretiens]);

  const entretiensJourSelectionne = useMemo(
    () => entretiensParJour.get(selectedDay) || [],
    [entretiensParJour, selectedDay],
  );

  useEffect(() => {
    if (entretiensJourSelectionne.length === 0) {
      setEntretienSelectionneId(null);
      return;
    }

    const existing = entretienSelectionneId
      ? entretiensJourSelectionne.find((item) => item.entretien.id === entretienSelectionneId)
      : null;

    if (!existing) {
      setEntretienSelectionneId(entretiensJourSelectionne[0].entretien.id);
    }
  }, [entretiensJourSelectionne, entretienSelectionneId]);

  const entretienSelectionne = useMemo(
    () => entretiensJourSelectionne.find((item) => item.entretien.id === entretienSelectionneId) || null,
    [entretiensJourSelectionne, entretienSelectionneId],
  );

  const selectedDayDate = useMemo(() => {
    const [year, month, day] = selectedDay.split("-").map((value) => Number.parseInt(value, 10));
    const date = new Date(year, (month || 1) - 1, day || 1);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }, [selectedDay]);

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
        throw new Error("Selectionnez une candidature avant de planifier un entretien.");
      }

      if (!formulairePlanification.date_heure) {
        throw new Error("La date et l'heure de l'entretien sont requises.");
      }

      if (formulairePlanification.type === "visio" && !formulairePlanification.lieu_visio.trim()) {
        throw new Error("Un lien de visioconference est requis pour un entretien en visio.");
      }

      if (formulairePlanification.type === "presentiel" && !formulairePlanification.lieu.trim()) {
        throw new Error("Un lieu est requis pour un entretien en presentiel.");
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
        throw new Error(data.message || "Impossible de planifier l'entretien.");
      }

      setInfo(data.message || "Entretien planifie avec succes.");
      fermerPlanification();
      await Promise.all([charger(), chargerCandidateuresPlanifiables()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de planifier l'entretien.");
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
        throw new Error("La date et l'heure de l'entretien sont requises.");
      }

      if (formulaire.type === "visio" && !formulaire.lieu_visio.trim()) {
        throw new Error("Un lien de visioconference est requis.");
      }

      if (formulaire.type === "presentiel" && !formulaire.lieu.trim()) {
        throw new Error("Un lieu est requis.");
      }

      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(construirePayloadEntretien(formulaire)),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre a jour l'entretien.");
      }

      setInfo(data.message || "Entretien mis a jour avec succes.");
      fermerEdition();
      await Promise.all([charger(), chargerCandidateuresPlanifiables()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de mettre a jour l'entretien.");
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
        throw new Error(data.message || "Impossible de terminer cette action.");
      }

      setInfo(data.message || "Action terminÃ©e avec succÃ¨s.");
      fermerEdition();
      await Promise.all([charger(), chargerCandidateuresPlanifiables()]);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de terminer cette action.");
    } finally {
      setEntretienEnAction(null);
    }
  };


  const renderSelectedDayInterviewCard = (item: EntretienEntreprise) => {
    const date = formaterDateEntretien(item.entretien.date_heure);
    const statut = getEntretienStatutConfig(item.entretien.statut);
    const selected = entretienSelectionneId === item.entretien.id;
    const duration = item.entretien.duree_prevue || "60 min";
    const actionEnCours = entretienEnAction === item.entretien.id;
    const TypeIcon =
      item.entretien.type === "visio" ? Video : item.entretien.type === "presentiel" ? MapPin : Phone;
    const googleCalendarLink = construireLienGoogleCalendar({
      titre: `Interview - ${item.candidat?.nom || "Candidate"}`,
      dateHeure: item.entretien.date_heure,
      dureeMinutes: extraireDureeMinutes(item.entretien.duree_prevue || undefined),
      details: `${item.offre?.titre || "Role"} - ${item.candidat?.email || ""}`,
      location:
        item.entretien.type === "visio"
          ? item.entretien.lieu_visio || ""
          : item.entretien.type === "presentiel"
            ? item.entretien.lieu || ""
            : item.entretien.contact_entreprise || item.candidat?.telephone || "",
    });

    return (
      <article className={`selected-event-card ${selected ? "selected-event-card-active" : ""}`} key={item.entretien.id}>
        <div
          role="button"
          tabIndex={0}
          className="selected-event-main"
          onClick={() => {
            setEntretienSelectionneId(item.entretien.id);
            if (date.raw) {
              setSelectedDay(dayKey(date.raw));
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setEntretienSelectionneId(item.entretien.id);
              if (date.raw) {
                setSelectedDay(dayKey(date.raw));
              }
            }
          }}
        >
          <div className="selected-event-candidate">
            <span className="selected-event-avatar">{initials(item.candidat?.nom)}</span>
            <div className="selected-event-copy">
              <div className="selected-event-titleline">
                <div>
                  <strong>{item.candidat?.nom || "Candidat"}</strong>
                  <small>{item.offre?.titre || "Poste"}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="selected-event-meta">
            <div className="selected-event-meta-item selected-event-meta-box">
              <Clock size={14} />
              <span>{date.time}</span>
            </div>
            <div className="selected-event-meta-item selected-event-meta-box">
              <span>{duration}</span>
            </div>
            <div className="selected-event-meta-item selected-event-meta-box">
              <TypeIcon size={14} />
              <span>{getEntretienTypeLabel(item.entretien.type)}</span>
            </div>
            <div className="selected-event-meta-status selected-event-meta-box">
              <span className={`status-pill ${statusClass(item.entretien.statut)}`}>{statut.label}</span>
            </div>
          </div>
        </div>

        {item.entretien.notes || googleCalendarLink ? (
          <div className="selected-event-notes">
            <div className="selected-event-notes-copy">
              {item.entretien.notes ? <p>{item.entretien.notes}</p> : <p>No notes added for this interview yet.</p>}
            </div>
            {googleCalendarLink ? (
              <a className="selected-event-calendar" href={googleCalendarLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> Ajouter au calendrier
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="selected-event-actions">
          <Button variant="secondary" onClick={() => ouvrirEdition(item)} disabled={actionEnCours}>
            <RotateCw size={15} /> Replanifier
          </Button>
          <Button variant="secondary" onClick={() => lancerAction(item.entretien.id, "terminer")} disabled={actionEnCours}>
            <CheckCircle2 size={15} /> Marquer comme termine
          </Button>
          <Button
            variant="secondary"
            className="cancel-soft"
            onClick={() => {
              if (confirm("Confirmer l'annulation de cet entretien ?")) {
                void lancerAction(item.entretien.id, "annuler");
              }
            }}
            disabled={actionEnCours}
          >
            <XCircle size={15} /> Annuler l&apos;entretien
          </Button>
        </div>
      </article>
    );
  };

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
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

  return (
    <div className="app-page interviews-dashboard" aria-live="polite">
      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}
      {info ? <div className="message message-info" role="status">{info}</div> : null}

      {planificationOuverte ? (
        <Card tone="accent" padding="lg">
          <div className="form-section">
            <div>
              <strong className="form-section-title">Inviter un candidat a un entretien</strong>
              <p className="texte-secondaire form-section-subtitle">
                Selectionnez une candidature, renseignez les details et publiez l&apos;entretien dans les deux espaces.
              </p>
            </div>

            {candidaturesPlanifiables.length === 0 ? (
              <div className="message message-neutre">
                Aucune candidature n&apos;est prete pour un entretien. Faites d&apos;abord avancer les candidatures en preselection.
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="groupe-champ">
                    <label htmlFor="candidature-planification">Candidature</label>
                    <select
                      id="candidature-planification"
                      className="champ-select"
                      value={formulairePlanification.id_candidature}
                      onChange={(event) =>
                        setFormulairePlanification((courant) => ({ ...courant, id_candidature: event.target.value }))
                      }
                    >
                      <option value="">Selectionner une candidature</option>
                      {candidaturesPlanifiables.map((item) => (
                        <option key={item.candidature.id} value={item.candidature.id}>
                          {(item.candidat?.nom || "Candidat").trim()} - {item.offre?.titre || "Offre"} (
                          {item.candidature.statut === "shortlisted" ? "preselection" : "nouvelle candidature"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="date-planification">Date et heure</label>
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
                      <option value="visio">Visio</option>
                      <option value="presentiel">Presentiel</option>
                      <option value="telephonique">Telephone</option>
                    </select>
                  </div>

                  <div className="groupe-champ">
                    <label htmlFor="duree-planification">Duree prevue</label>
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
                    <label htmlFor="visio-planification">Lien de visioconference</label>
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
                    <label htmlFor="lieu-planification">Lieu</label>
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
                Planifier un entretien
              </Button>
              <Button variant="ghost" onClick={fermerPlanification} aria-label="Fermer">
                âœ•
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
              Planifier un entretien
            </Button>
          </div>
        </Card>
      ) : (
        <div className="interviews-workspace-layout">
          {prochainEntretien ? (
            (() => {
              const date = formaterDateEntretien(prochainEntretien.entretien.date_heure);
              const statut = getEntretienStatutConfig(prochainEntretien.entretien.statut);
              const actionEnCours = entretienEnAction === prochainEntretien.entretien.id;

              return (
                <section className="next-interview-hero">
                  <div className="hero-date">
                    <span>{date.raw?.toLocaleDateString("en-US", { weekday: "short" }) || "-"}</span>
                    <strong>{date.raw?.toLocaleDateString("en-US", { day: "2-digit" }) || "--"}</strong>
                    <small>{date.time}</small>
                  </div>
                  <div className="hero-main">
                    <span className={`status-pill ${statusClass(prochainEntretien.entretien.statut)}`}>{statut.label}</span>
                    <h2>{prochainEntretien.candidat?.nom || "Candidat"}</h2>
                    <p>{prochainEntretien.offre?.titre || "Poste"} - Entretien {getEntretienTypeLabel(prochainEntretien.entretien.type)}</p>
                    <div className="hero-meta">
                      <span><Clock size={14} /> {prochainEntretien.entretien.duree_prevue || "60 min"}</span>
                      <span><MapPin size={14} /> {getInterviewLocation(prochainEntretien)}</span>
                    </div>
                  </div>
                  <div className="hero-actions">
                    <Button
                      className="join-action"
                      onClick={() => {
                        if (canJoinCall(prochainEntretien)) {
                          window.open(prochainEntretien.entretien.lieu_visio || "", "_blank", "noopener,noreferrer");
                        }
                      }}
                      disabled={!canJoinCall(prochainEntretien)}
                    >
                      <Video size={16} /> Rejoindre l&apos;entretien
                    </Button>
                    <Button variant="secondary" onClick={() => ouvrirEdition(prochainEntretien)} disabled={actionEnCours}>
                      <RotateCw size={15} /> Reprogrammer
                    </Button>
                    <Button
                      variant="secondary"
                      className="cancel-soft"
                      onClick={() => {
                        if (confirm("Confirmer l'annulation de cet entretien ?")) {
                          void lancerAction(prochainEntretien.entretien.id, "annuler");
                        }
                      }}
                      disabled={actionEnCours}
                    >
                      <XCircle size={15} /> Annuler
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => lancerAction(prochainEntretien.entretien.id, "terminer")}
                      disabled={actionEnCours}
                    >
                      <CheckCircle2 size={15} /> Terminer
                    </Button>
                  </div>
                </section>
              );
            })()
          ) : null}

          <section className="interview-controls" aria-label="Filtres des entretiens">
            <div>
              <strong>{entretiensFiltres.length}</strong>
              <span>entretien(s) affichÃ©(s)</span>
            </div>
            <label>
              <span>Type</span>
              <select className="champ-select" value={filtreType} onChange={(event) => setFiltreType(event.target.value)}>
                <option value="">Tous les entretiens</option>
                <option value="visio">Visio</option>
                <option value="presentiel">PrÃ©sentiel</option>
                <option value="telephonique">TÃ©lÃ©phone</option>
              </select>
            </label>
            <label>
              <span>Statut</span>
              <select className="champ-select" value={filtreStatut} onChange={(event) => setFiltreStatut(event.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="planifie">PlanifiÃ©</option>
                <option value="confirme">ConfirmÃ©</option>
                <option value="reporte">ReprogrammÃ©</option>
                <option value="annule">AnnulÃ©</option>
                <option value="termine">TerminÃ©</option>
              </select>
            </label>
          </section>

          <div className="main-grid">
          {false ? (
          <section className="calendar-panel">
            <div className="calendar-header">
              <h3>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
              <div className="calendar-nav">
                <button type="button" onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                  â€¹
                </button>
                <button type="button" onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                  â€º
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
                      } else {
                        setEntretienSelectionneId(null);
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
              <strong>Filtres</strong>
              <select className="champ-select" value={filtreType} onChange={(event) => setFiltreType(event.target.value)}>
                <option value="">Tous les entretiens</option>
                <option value="visio">Visio</option>
                <option value="presentiel">Presentiel</option>
                <option value="telephonique">Telephone</option>
              </select>
              <select className="champ-select" value={filtreStatut} onChange={(event) => setFiltreStatut(event.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="planifie">Planifie</option>
                <option value="confirme">Confirme</option>
                <option value="reporte">Reprogramme</option>
                <option value="annule">Annule</option>
                <option value="termine">Termine</option>
              </select>
            </div>
          </section>

          ) : null}

          <section className="timeline-panel">
            <header className="compact-calendar-header">
              <button
                type="button"
                onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                aria-label="Mois precedent"
              >
                {"<"}
              </button>
              <h3>{calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3>
              <button
                type="button"
                onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                aria-label="Mois suivant"
              >
                {">"}
              </button>
            </header>

            <div className="compact-weekdays">
              {"Lun Mar Mer Jeu Ven Sam Dim".split(" ").map((day) => <span key={day}>{day}</span>)}
            </div>

            <div className="compact-calendar-grid">
              {calendarCells.map((cell) => {
                const count = interviewCountParJour.get(cell.key) || 0;
                const selected = selectedDay === cell.key;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`compact-day ${cell.currentMonth ? "" : "compact-day-muted"} ${selected ? "compact-day-selected" : ""}`}
                    onClick={() => {
                      setSelectedDay(cell.key);
                      const first = entretiensParJour.get(cell.key)?.[0];
                      if (first) {
                        setEntretienSelectionneId(first.entretien.id);
                      } else {
                        setEntretienSelectionneId(null);
                      }
                    }}
                    aria-label={`${cell.dayNumber} ${count} interview(s)`}
                  >
                    <span>{cell.dayNumber}</span>
                    {count > 0 ? (
                      <em aria-hidden="true">
                        {Array.from({ length: Math.min(count, 3) }).map((_, index) => <i key={index} />)}
                        {count > 3 ? <b>{count}</b> : null}
                      </em>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <section className="selected-day-panel">
              <header>
                <div>
                  <p className="panel-eyebrow">Selected day</p>
                  <h3>{selectedDayDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
                </div>
                {entretiensJourSelectionne.length > 0 ? <span><CalendarDays size={13} /> {entretiensJourSelectionne.length} entretien{entretiensJourSelectionne.length > 1 ? "s" : ""}</span> : null}
              </header>
              {entretiensJourSelectionne.length === 0 ? (
                <p className="selected-day-empty">No interviews scheduled for this day.</p>
              ) : (
                <div className="selected-day-list">
                  {entretiensJourSelectionne.map((item) => renderSelectedDayInterviewCard(item))}
                </div>
              )}
            </section>
          </section>

          <section className="details-panel">
            <div className="details-head">
              <p className="panel-eyebrow">Recruiter workspace</p>
              <h3>Interview brief</h3>
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
                    <div className="details-identity candidate-profile-card">
                      <span className="avatar large">{initials(entretienSelectionne.candidat?.nom)}</span>
                      <div>
                        <strong>{entretienSelectionne.candidat?.nom || "Candidate"}</strong>
                        <small>{entretienSelectionne.offre?.titre || "Role"}</small>
                      </div>
                      <span className={`status-pill ${statusClass(entretienSelectionne.entretien.statut)}`}>{statut.label}</span>
                      <div className="candidate-contact">
                        <span>{entretienSelectionne.candidat?.email || "Email non renseigne"}</span>
                        <span><Phone size={13} /> {entretienSelectionne.candidat?.telephone || "Telephone non renseigne"}</span>
                      </div>
                    </div>

                    <article className="candidate-interview-card">
                      <p>
                        Interview with <strong>{entretienSelectionne.candidat?.nom || "Candidate"}</strong> for{" "}
                        <strong>{entretienSelectionne.offre?.titre || "Role"}</strong>.
                      </p>
                      <div className="interview-brief-chips">
                        <span><CalendarDays size={14} /> {date.shortDate}</span>
                        <span><Clock size={14} /> {date.time}</span>
                        <span><Video size={14} /> {getEntretienTypeLabel(entretienSelectionne.entretien.type)}</span>
                        <span><MapPin size={14} /> {getInterviewLocation(entretienSelectionne)}</span>
                      </div>
                      {entretienSelectionne.entretien.notes ? (
                        <blockquote>{entretienSelectionne.entretien.notes}</blockquote>
                      ) : null}
                      <a className="calendar-utility-link" href={googleCalendarLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} /> Add to calendar
                      </a>
                    </article>

                    <div className="details-actions">
                      <Button
                        onClick={() => {
                          if (entretienSelectionne.entretien.type === "visio" && entretienSelectionne.entretien.lieu_visio) {
                            window.open(entretienSelectionne.entretien.lieu_visio, "_blank", "noopener,noreferrer");
                          }
                        }}
                        disabled={entretienSelectionne.entretien.type !== "visio" || !entretienSelectionne.entretien.lieu_visio}
                      >
                        <Video size={16} /> Join Interview
                      </Button>
                      <Button variant="secondary" onClick={() => ouvrirEdition(entretienSelectionne)} disabled={actionEnCours}>
                        <RotateCw size={15} /> Reschedule
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => lancerAction(entretienSelectionne.entretien.id, "terminer")}
                        disabled={actionEnCours}
                      >
                        <CheckCircle2 size={15} /> Mark Complete
                      </Button>
                      <Button
                        variant="secondary"
                        className="cancel-soft"
                        onClick={() => {
                          if (confirm("Confirmer l'annulation de cet entretien ?")) {
                            void lancerAction(entretienSelectionne.entretien.id, "annuler");
                          }
                        }}
                        disabled={actionEnCours}
                      >
                        <XCircle size={15} /> Cancel
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
                            <Button variant="ghost" onClick={fermerEdition} disabled={actionEnCours} aria-label="Close">
                              âœ•
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
                <p>Select a candidate interview to open the scheduling workspace.</p>
              </div>
            )}
          </section>
        </div>
        </div>
      )}

      <style jsx>{`
        .interviews-dashboard {
          background: var(--color-bg, #fbfafc);
          border-radius: 24px;
          padding: 14px;
        }
        .interviews-header {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 14px;
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
          font-size: clamp(1.7rem, 3vw, 2.15rem);
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
          grid-template-columns: 300px minmax(0, 1fr) 280px;
          gap: 10px;
          align-items: start;
        }
        .calendar-panel,
        .timeline-panel,
        .details-panel {
          background: #fff;
          border: 1px solid #ece4f9;
          border-radius: 20px;
          padding: 12px;
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
          margin-bottom: 8px;
        }
        .calendar-header h3 {
          margin: 0;
          color: #2a1843;
          font-size: 1rem;
        }
        .calendar-nav {
          display: flex;
          gap: 5px;
        }
        .calendar-nav button {
          width: 24px;
          height: 24px;
          border-radius: 8px;
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
          min-height: 33px;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #2f1f4d;
          padding: 3px 0;
          font-size: 0.72rem;
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
          margin-top: 10px;
          display: grid;
          gap: 6px;
        }
        .calendar-filters strong {
          color: #4a3d66;
          font-size: 0.85rem;
        }
        .timeline-panel {
          display: grid;
          gap: 10px;
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
          gap: 7px;
        }
        .timeline-item {
          width: 100%;
          border: 1px solid #ece4f9;
          background: #fcfbff;
          border-radius: 13px;
          padding: 8px;
          display: grid;
          grid-template-columns: 64px 32px 1fr auto;
          align-items: center;
          gap: 8px;
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
          font-size: 0.78rem;
        }
        .avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, #35063e, #7f43aa);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 0.65rem;
          font-weight: 800;
        }
        .timeline-copy {
          display: grid;
          gap: 2px;
        }
        .timeline-copy strong {
          color: #2a1843;
          font-size: 0.8rem;
        }
        .timeline-copy small {
          color: #847e9b;
          font-size: 0.7rem;
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
          padding: 4px 8px;
          font-size: 0.68rem;
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
        .interviews-workspace-layout {
          display: grid;
          gap: 10px;
        }
        .next-interview-hero {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 14px;
          border: 1px solid rgba(95, 42, 200, 0.16);
          border-radius: 20px;
          background:
            radial-gradient(circle at 92% 10%, rgba(216, 106, 141, 0.16), transparent 28%),
            linear-gradient(135deg, #ffffff, #faf7ff);
          box-shadow: 0 14px 34px rgba(31, 18, 49, 0.08);
        }
        .hero-date {
          width: 86px;
          min-height: 96px;
          border-radius: 18px;
          background: #2a1040;
          color: #fff;
          display: grid;
          place-items: center;
          padding: 10px;
          text-align: center;
        }
        .hero-date span,
        .hero-date small {
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.75rem;
          font-weight: 800;
        }
        .hero-date strong {
          font-size: 2rem;
          line-height: 1;
        }
        .hero-main h2 {
          margin: 8px 0 4px;
          color: #1d1430;
          font-size: 1.55rem;
          line-height: 1.1;
        }
        .hero-main p {
          margin: 0;
          color: #625773;
          font-weight: 700;
        }
        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .hero-meta span,
        .candidate-contact span,
        .details-list p,
        .interview-card-main em {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .hero-meta span {
          max-width: 420px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(95, 42, 200, 0.07);
          color: #4f4266;
          font-size: 0.8rem;
          font-weight: 750;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          max-width: 360px;
        }
        .interview-controls {
          min-height: 46px;
          display: grid;
          grid-template-columns: minmax(140px, 1fr) 190px 190px;
          align-items: end;
          gap: 10px;
          padding: 9px 12px;
          border: 1px solid #ece4f9;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.86);
        }
        .interview-controls > div {
          display: flex;
          align-items: baseline;
          gap: 7px;
          color: #6f6786;
          font-size: 0.82rem;
        }
        .interview-controls strong {
          color: #2a1843;
          font-size: 1rem;
        }
        .interview-controls label {
          display: grid;
          gap: 3px;
        }
        .interview-controls label span {
          color: #7b7390;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .interview-controls :global(.champ-select),
        .calendar-filters :global(.champ-select) {
          min-height: 36px;
          border-radius: 11px;
          font-size: 0.82rem;
        }
        .main-grid {
          grid-template-columns: minmax(0, 1.28fr) minmax(285px, 0.72fr);
        }
        .calendar-panel {
          display: none;
        }
        .timeline-panel,
        .details-panel {
          min-height: 0;
          border-radius: 18px;
          padding: 11px;
        }
        .timeline-panel {
          display: grid;
          gap: 10px;
          align-content: start;
        }
        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 2px 2px 2px;
        }
        .panel-head h3,
        .details-head h3 {
          margin: 0;
          color: #2a1843;
          font-size: 0.92rem;
        }
        .panel-eyebrow {
          margin: 0 0 3px;
          color: #7c55b6;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .week-agenda {
          display: grid;
          gap: 6px;
          margin-bottom: 4px;
        }
        .agenda-day {
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr);
          gap: 7px;
          align-items: start;
          padding: 7px;
          border: 1px solid #f0e9fb;
          border-radius: 14px;
          background: #fff;
        }
        .agenda-day-label {
          display: grid;
          gap: 2px;
        }
        .agenda-day-label strong {
          color: #2a1843;
          font-size: 0.8rem;
        }
        .agenda-day-label span,
        .agenda-empty {
          color: #8a839e;
          font-size: 0.72rem;
        }
        .agenda-day-list {
          display: grid;
          gap: 6px;
        }
        .agenda-empty {
          margin: 0;
          padding: 7px 9px;
          border-radius: 10px;
          background: #faf8fe;
        }
        .timeline-group {
          display: grid;
          gap: 8px;
        }
        .timeline-group header {
          margin-bottom: 0;
          padding: 0 2px;
        }
        .timeline-list {
          display: grid;
          gap: 8px;
        }
        .interview-card {
          width: 100%;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ece4f9;
          border-radius: 14px;
          background: linear-gradient(180deg, #fff, #fdfbff);
          text-align: left;
          cursor: pointer;
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .interview-card:hover,
        .interview-card-active {
          transform: translateY(-1px);
          border-color: #cdb8f0;
          box-shadow: 0 10px 24px rgba(31, 18, 49, 0.08);
        }
        .interview-card-main {
          min-width: 0;
          display: grid;
          gap: 2px;
        }
        .interview-card-main strong {
          overflow: hidden;
          color: #241735;
          font-size: 0.82rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .interview-card-main small,
        .interview-card-main em,
        .interview-card-meta small {
          color: #746d86;
          font-size: 0.69rem;
          font-style: normal;
        }
        .interview-card-meta {
          display: grid;
          justify-items: end;
          gap: 5px;
        }
        .candidate-profile-card {
          padding: 10px;
          border: 1px solid rgba(95, 42, 200, 0.1);
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(95, 42, 200, 0.07), rgba(255, 255, 255, 0.96));
        }
        .avatar.large {
          width: 40px;
          height: 40px;
          font-size: 0.76rem;
        }
        .candidate-contact {
          grid-column: 1 / -1;
          display: grid;
          gap: 6px;
          color: #625773;
          font-size: 0.78rem;
        }
        .details-list {
          grid-template-columns: 1fr;
          padding: 10px;
          border: 1px solid #ece4f9;
          border-radius: 15px;
          background: #fff;
        }
        .details-list p {
          justify-content: flex-start;
          gap: 8px;
          padding: 5px 0;
        }
        .details-list p strong {
          min-width: 68px;
          color: #2a1843;
        }
        .details-list .notes-row {
          display: block;
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid #efe8fb;
          line-height: 1.45;
        }
        .candidate-interview-card {
          display: grid;
          gap: 8px;
          margin-bottom: 10px;
          padding: 10px;
          border: 1px solid #ece4f9;
          border-radius: 16px;
          background: #fff;
        }
        .candidate-interview-card p {
          margin: 0;
          color: #4a3d67;
          font-size: 0.9rem;
          line-height: 1.45;
        }
        .candidate-interview-card strong {
          color: #241735;
        }
        .interview-brief-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .interview-brief-chips span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 24px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(95, 42, 200, 0.07);
          color: #4f4266;
          font-size: 0.7rem;
          font-weight: 750;
        }
        .candidate-interview-card blockquote {
          margin: 0;
          padding-left: 10px;
          border-left: 3px solid #d86a8d;
          color: #625773;
          font-size: 0.84rem;
          line-height: 1.45;
        }
        .details-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .details-actions :global(.ui-button),
        .details-extra-actions :global(.ui-button),
        .hero-actions :global(.ui-button),
        .interviews-header-actions :global(.ui-button) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 40px;
        }
        .cancel-soft {
          color: #9f4a57 !important;
          border-color: #ead1d8 !important;
          background: #fff7f8 !important;
        }
        .next-interview-hero,
        .interview-controls {
          display: none;
        }
        .main-grid {
          grid-template-columns: minmax(0, 7fr) minmax(300px, 3fr);
          gap: 12px;
          align-items: start;
        }
        .timeline-panel,
        .details-panel {
          background: #fff;
          border: 1px solid #ede7f8;
          border-radius: 16px;
          box-shadow: 0 10px 24px rgba(31, 18, 49, 0.05);
        }
        .timeline-panel {
          padding: 10px;
        }
        .details-panel {
          padding: 12px;
        }
        .compact-calendar-header {
          display: grid;
          grid-template-columns: 30px minmax(0, 1fr) 30px;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .compact-calendar-header h3 {
          margin: 0;
          text-align: center;
          color: #201135;
          font-size: 0.92rem;
          font-weight: 850;
        }
        .compact-calendar-header button {
          width: 30px;
          height: 30px;
          border: 1px solid #e5daf7;
          border-radius: 10px;
          background: #fff;
          color: var(--app-primary);
          font-weight: 900;
          cursor: pointer;
        }
        .compact-weekdays,
        .compact-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 5px;
        }
        .compact-weekdays {
          margin-bottom: 6px;
        }
        .compact-weekdays span {
          color: #756b88;
          font-size: 0.68rem;
          font-weight: 850;
          text-align: center;
        }
        .compact-day {
          min-height: 45px;
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 3px;
          padding: 5px 2px;
          border: 1px solid #f0e9fb;
          border-radius: 10px;
          background: #fff;
          color: #241735;
          cursor: pointer;
        }
        .compact-day:hover {
          border-color: rgba(var(--app-primary-rgb), 0.22);
          background: rgba(var(--app-primary-rgb), 0.04);
        }
        .compact-day span {
          font-size: 0.72rem;
          font-weight: 850;
        }
        .compact-day-muted {
          color: #b8afc8;
          background: #fcfbfd;
        }
        .compact-day-selected {
          border-color: var(--app-primary);
          background: var(--app-primary);
          color: #fff;
          box-shadow: 0 8px 18px rgba(var(--app-primary-rgb), 0.24);
        }
        .compact-day em {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          min-height: 10px;
          font-style: normal;
        }
        .compact-day i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--app-primary);
        }
        .compact-day-selected i {
          background: #fff;
        }
        .compact-day b {
          min-width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #ede9fe;
          color: #4c1d95;
          font-size: 0.62rem;
          font-style: normal;
        }
        .selected-day-panel {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f0e9fb;
        }
        .selected-day-panel > header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .selected-day-panel h3 {
          margin: 0;
          color: #201135;
          font-size: 0.98rem;
        }
        .selected-day-panel header > span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #ede9fe;
          color: #4c1d95;
          font-size: 0.72rem;
          font-weight: 850;
          white-space: nowrap;
        }
        .selected-day-list {
          display: grid;
          gap: 10px;
        }
        .selected-event-card {
          display: grid;
          gap: 12px;
          padding: 14px;
          border: 1px solid #ece4f9;
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff, #fcfbff);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .selected-event-card-active {
          border-color: #cdb8f0;
          box-shadow: 0 0 0 1px rgba(95, 42, 200, 0.12), 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .selected-event-main {
          display: grid;
          gap: 12px;
          width: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }
        .selected-event-candidate {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr);
          align-items: center;
          gap: 14px;
        }
        .selected-event-avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #35063e, #7f43aa);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 0.92rem;
          font-weight: 800;
        }
        .selected-event-copy {
          display: grid;
          gap: 8px;
          min-width: 0;
        }
        .selected-event-titleline {
          display: block;
        }
        .selected-event-titleline > div {
          min-width: 0;
        }
        .selected-event-titleline strong {
          display: block;
          color: #201135;
          font-size: 0.98rem;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .selected-event-titleline small {
          display: block;
          margin-top: 4px;
          color: #6f6484;
          font-size: 0.78rem;
          line-height: 1.4;
        }
        .selected-event-meta {
          display: flex;
          align-items: stretch;
          gap: 10px;
          flex-wrap: nowrap;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
        }
        .selected-event-meta::-webkit-scrollbar {
          display: none;
        }
        .selected-event-meta-item,
        .selected-event-meta-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 42px;
          padding: 0 14px;
          flex: 1 0 132px;
          color: #4f4266;
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .selected-event-meta-box {
          border-radius: 12px;
          border: 1px solid #e8def8;
          background: #fff;
          box-shadow: 0 1px 2px rgba(31, 23, 53, 0.03);
        }
        .selected-event-meta-item span,
        .selected-event-meta-status span {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }
        .selected-event-meta-status {
          justify-content: flex-end;
        }
        .selected-event-meta-status .status-pill {
          min-height: 34px;
          padding: 0 14px;
          font-size: 0.72rem;
        }
        .selected-event-notes {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding-top: 2px;
          border-top: 1px solid #f2ecfb;
          padding-top: 12px;
        }
        .selected-event-notes-copy {
          min-width: 0;
          flex: 1 1 auto;
        }
        .selected-event-notes-copy p {
          margin: 0;
          color: #5d536f;
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .selected-event-calendar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(95, 42, 200, 0.22);
          color: #5b21b6;
          background: #fff;
          font-size: 0.78rem;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }
        .selected-event-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          border-top: 1px solid #f2ecfb;
          padding-top: 12px;
        }
        .selected-event-actions :global(.ui-button) {
          min-height: 38px;
          padding-inline: 10px;
          border-radius: 12px;
          font-size: 0.78rem;
          width: 100%;
        }
        .selected-day-empty {
          margin: 0;
          padding: 10px 12px;
          border: 1px dashed #d8c7f4;
          border-radius: 12px;
          color: #756b88;
          font-size: 0.82rem;
          text-align: center;
        }
        .interview-card {
          min-height: 62px;
          padding: 8px 10px;
          border-radius: 12px;
        }
        .interview-card-main strong {
          font-size: 0.86rem;
        }
        .interview-card-main small,
        .interview-card-main em,
        .interview-card-meta small {
          font-size: 0.7rem;
        }
        .details-head {
          margin-bottom: 10px;
        }
        .candidate-profile-card {
          margin-bottom: 10px;
        }
        .candidate-interview-card {
          padding: 10px;
        }
        .details-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }
        .details-actions :global(.ui-button) {
          min-height: 36px;
          padding-inline: 10px;
          border-radius: 10px;
          font-size: 0.8rem;
        }
        .details-actions :global(.ui-button:first-child) {
          grid-column: 1 / -1;
          background: #5b21b6;
          border-color: #5b21b6;
        }
        .calendar-utility-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          color: #5b21b6;
          font-size: 0.78rem;
          font-weight: 800;
          text-decoration: none;
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
        @media (max-width: 980px) {
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
          .selected-event-titleline,
          .selected-event-notes,
          .selected-event-actions {
            grid-template-columns: 1fr;
            display: grid;
          }
          .selected-event-titleline {
            justify-content: start;
          }
          .selected-event-meta-item,
          .selected-event-meta-status {
            justify-content: center;
          }
        }
        @media (max-width: 560px) {
          .selected-event-meta-item,
          .selected-event-meta-status {
            justify-content: flex-start;
          }
          .selected-event-calendar {
            width: 100%;
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
