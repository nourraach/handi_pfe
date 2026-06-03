"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Ellipsis,
  ExternalLink,
  MapPin,
  Video,
  BriefcaseBusiness,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireLienGoogleCalendar, extraireDureeMinutes } from "@/lib/entretiens";
import { construireUrlApi } from "@/lib/config";

type EntretienCandidat = {
  entretien: {
    id: string;
    id_candidature?: string;
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
  offre?: {
    titre?: string;
  };
  entreprise?: {
    nom?: string;
    contact_rh_nom?: string | null;
    contact_rh_email?: string | null;
    contact_rh_telephone?: string | null;
  };
};

type EntretiensPayload = {
  message?: string;
  donnees?: EntretienCandidat[];
};

type InterviewTone = "blue" | "green" | "red" | "violet";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDateParts(dateString?: string | null) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" });
  const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
  const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return {
    raw: date,
    fullDate: dateFormatter.format(date),
    monthLabel: monthFormatter.format(date),
    day: dayFormatter.format(date),
    weekday: weekdayFormatter.format(date).replace(/\.$/, ""),
    time: timeFormatter.format(date),
    monthNumber: date.getMonth(),
    year: date.getFullYear(),
  };
}

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMonthTitle(date: Date) {
  return capitalizeFirst(
    new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date),
  );
}

function getInterviewTypeLabel(type: EntretienCandidat["entretien"]["type"]) {
  switch (type) {
    case "visio":
      return "Visio";
    case "presentiel":
      return "Présentiel";
    case "telephonique":
      return "Téléphone";
    default:
      return "Entretien";
  }
}

function getStatusLabel(statut: EntretienCandidat["entretien"]["statut"]) {
  switch (statut) {
    case "confirme":
      return "Confirmé";
    case "reporte":
      return "Reporté";
    case "annule":
      return "Annulé";
    case "termine":
      return "Terminé";
    case "planifie":
    default:
      return "À venir";
  }
}

function getTone(statut: EntretienCandidat["entretien"]["statut"]): InterviewTone {
  switch (statut) {
    case "termine":
      return "green";
    case "annule":
      return "red";
    case "reporte":
      return "violet";
    case "confirme":
    case "planifie":
    default:
      return "blue";
  }
}

function formatDuration(duree?: string | null) {
  if (!duree) {
    return "45 min";
  }
  return duree;
}

function sameDay(left?: Date | null, right?: Date | null) {
  if (!left || !right) return false;
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getRelativeLabel(date?: Date | null) {
  if (!date) {
    return "";
  }

  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((normalizedTarget.getTime() - normalizedToday.getTime()) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Dans 1 jour";
  if (diffDays > 1) return `Dans ${diffDays} jours`;
  if (diffDays === -1) return "Il y a 1 jour";
  return `Il y a ${Math.abs(diffDays)} jours`;
}

function getInterviewLocation(item: EntretienCandidat) {
  if (item.entretien.type === "visio") {
    return item.entretien.lieu_visio || "";
  }
  if (item.entretien.type === "presentiel") {
    return item.entretien.lieu || "";
  }
  return item.entretien.contact_entreprise || item.entreprise?.contact_rh_telephone || "";
}

function formatCalendarLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(/\.$/, "");
}

function CalendarIcon() {
  return <CalendarDays aria-hidden="true" size={18} />;
}

function ClockIcon() {
  return <Clock3 aria-hidden="true" size={18} />;
}

function VideoIcon() {
  return <Video aria-hidden="true" size={18} />;
}

function LocationIcon() {
  return <MapPin aria-hidden="true" size={18} />;
}

function CompanyIcon() {
  return <BriefcaseBusiness aria-hidden="true" size={18} />;
}

function InterviewMarker({ tone }: { tone: InterviewTone }) {
  return (
    <span className={classes("candidate-interviews-marker", `candidate-interviews-marker--${tone}`)} aria-hidden="true">
      {tone === "green" ? <CheckCircle2 size={16} /> : <CalendarRange size={16} />}
    </span>
  );
}

function InterviewCardIcon({ type }: { type: EntretienCandidat["entretien"]["type"] }) {
  if (type === "visio") {
    return <VideoIcon />;
  }
  if (type === "presentiel") {
    return <LocationIcon />;
  }
  return <ClockIcon />;
}

function buildCalendarCells(month: Date, interviews: EntretienCandidat[]) {
  const firstDay = startOfMonth(month);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    const cellDate = new Date(month.getFullYear(), month.getMonth(), dayNumber);
    const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const key = cellDate.toISOString().slice(0, 10);
    const items = interviews.filter((item) => {
      const parsed = new Date(item.entretien.date_heure);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === key;
    });

    return {
      date: cellDate,
      inMonth,
      items,
    };
  });

  return { cells, firstDay };
}

export default function MesEntretiensPage() {
  const [entretiens, setEntretiens] = useState<EntretienCandidat[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [entretienEnAction, setEntretienEnAction] = useState<string | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [statusFilter, setStatusFilter] = useState("all");

  const charger = async () => {
    try {
      setLoading(true);
      setErreur(null);
      const response = await authenticatedFetch(construireUrlApi("/api/entretiens/candidat"));
      const data: EntretiensPayload = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your interviews.");
      }

      setEntretiens(Array.isArray(data.donnees) ? data.donnees : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load your interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void charger();
  }, []);

  const sortedEntretiens = useMemo(() => {
    return [...entretiens].sort((left, right) => {
      const leftDate = new Date(left.entretien.date_heure).getTime();
      const rightDate = new Date(right.entretien.date_heure).getTime();
      return leftDate - rightDate;
    });
  }, [entretiens]);

  const upcomingEntretiens = useMemo(() => {
    const now = Date.now();
    return sortedEntretiens.filter((item) => {
      const parsed = new Date(item.entretien.date_heure);
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= now && item.entretien.statut !== "termine" && item.entretien.statut !== "annule";
    });
  }, [sortedEntretiens]);

  const featuredInterview = upcomingEntretiens[0] ?? sortedEntretiens[0] ?? null;

  useEffect(() => {
    if (!selectedInterviewId && featuredInterview) {
      setSelectedInterviewId(featuredInterview.entretien.id);
      const parsed = new Date(featuredInterview.entretien.date_heure);
      if (!Number.isNaN(parsed.getTime())) {
        setCalendarMonth(startOfMonth(parsed));
      }
    }
  }, [featuredInterview, selectedInterviewId]);

  const selectedInterview = useMemo(() => {
    if (!selectedInterviewId) {
      return featuredInterview;
    }
    return sortedEntretiens.find((item) => item.entretien.id === selectedInterviewId) ?? featuredInterview;
  }, [featuredInterview, selectedInterviewId, sortedEntretiens]);

  const selectedInterviewDate = selectedInterview ? new Date(selectedInterview.entretien.date_heure) : null;
  const selectedInterviewParts = formatDateParts(selectedInterview?.entretien.date_heure);
  const featuredCalendarLink = selectedInterview
    ? construireLienGoogleCalendar({
        titre: `Entretien - ${selectedInterview.offre?.titre || "Role"}`,
        dateHeure: selectedInterview.entretien.date_heure,
        dureeMinutes: extraireDureeMinutes(selectedInterview.entretien.duree_prevue || undefined),
        details: `${selectedInterview.entreprise?.nom || "Entreprise"}${selectedInterview.entreprise?.contact_rh_email ? ` - ${selectedInterview.entreprise.contact_rh_email}` : ""}`,
        location: getInterviewLocation(selectedInterview),
      })
    : "#";

  const listInterviews = useMemo(() => {
    const pool = statusFilter === "all" ? sortedEntretiens : sortedEntretiens.filter((item) => item.entretien.statut === statusFilter);
    return pool;
  }, [sortedEntretiens, statusFilter]);

  const { cells: calendarCells } = useMemo(
    () => buildCalendarCells(calendarMonth, sortedEntretiens),
    [calendarMonth, sortedEntretiens],
  );

  const monthLabel = formatMonthTitle(calendarMonth);
  const calendarDateSelection = selectedInterviewDate && sameDay(selectedInterviewDate, calendarMonth) ? selectedInterviewDate : selectedInterviewDate;
  const interviewCountLabel = upcomingEntretiens.length > 0 ? `${upcomingEntretiens.length} entretien${upcomingEntretiens.length > 1 ? "s" : ""} à venir` : "Aucun entretien à venir";

  const onPickCalendarDay = (date: Date) => {
    const dayItems = sortedEntretiens.filter((item) => sameDay(new Date(item.entretien.date_heure), date));
    setCalendarMonth(startOfMonth(date));
    if (dayItems.length > 0) {
      setSelectedInterviewId(dayItems[0].entretien.id);
    }
  };

  const confirmerEntretien = async (id: string) => {
    try {
      setEntretienEnAction(id);
      setErreur(null);
      setInfo(null);

      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${id}/confirmer`), {
        method: "POST",
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm the interview.");
      }

      setInfo(data.message || "Entretien confirmé avec succès.");
      await charger();
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to confirm the interview.");
    } finally {
      setEntretienEnAction(null);
    }
  };

  const filteredUpcoming = upcomingEntretiens.filter((item) => (statusFilter === "all" ? true : item.entretien.statut === statusFilter));
  const quickList = listInterviews.length > 0 ? listInterviews : filteredUpcoming;

  const featuredActionSecondary = selectedInterview?.candidature?.id || selectedInterview?.entretien.id_candidature
    ? `/candidat/candidatures/${selectedInterview.entretien.id_candidature || selectedInterview.candidature?.id}/preparation-entretien`
    : "/offres";

  const featuredActionPrimary = selectedInterview?.entretien.type === "visio" && selectedInterview.entretien.lieu_visio
    ? { href: selectedInterview.entretien.lieu_visio, label: "Rejoindre l'entretien", external: true, icon: <ExternalLink size={18} /> }
    : { href: featuredActionSecondary, label: "Préparer l'entretien", external: false, icon: <ArrowRight size={18} /> };

  return (
    <div className="app-page candidate-interviews-page">
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}
      {info ? <div className="message message-info">{info}</div> : null}

      <section className="candidate-interviews-hero">
        <div className="candidate-interviews-hero-copy">
          <p className="candidate-interviews-kicker">Entretiens planifiés</p>
          <h1>Entretiens planifiés</h1>
          <p>Retrouvez tous vos entretiens à venir et préparez-vous sereinement.</p>
        </div>

        <div className="candidate-interviews-hero-actions">
          <ButtonLink
            href={featuredCalendarLink}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            className="candidate-interviews-top-cta"
          >
            <CalendarDays size={18} />
            Ajouter au calendrier
          </ButtonLink>
        </div>
      </section>

      {loading ? (
        <Card padding="lg" className="candidate-interviews-loading">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <strong>Chargement de vos entretiens</strong>
            <p>Nous récupérons votre planning d'entretiens.</p>
          </div>
        </Card>
      ) : entretiens.length === 0 ? (
        <EmptyState
          title="Aucun entretien planifié"
          description="Lorsqu'une entreprise programme un entretien, il apparaît ici avec son statut et vos actions disponibles."
          action={<ButtonLink href="/offres">Continuer ma recherche</ButtonLink>}
        />
      ) : (
        <>
          <section className="candidate-interviews-top-grid">
            <Card padding="lg" className="candidate-interviews-feature-card">
              <div className="candidate-interviews-feature-head">
                <span className="candidate-interviews-badge">PROCHAIN ENTRETIEN</span>
                <button type="button" className="candidate-interviews-more" aria-label="Plus d'options">
                  <Ellipsis size={20} />
                </button>
              </div>

              {selectedInterview && selectedInterviewParts ? (
                <div className="candidate-interviews-feature-body">
                  <div className="candidate-interviews-feature-copy">
                    <h2>{selectedInterview.offre?.titre || "Entretien"}</h2>
                    <p className="candidate-interviews-company">{selectedInterview.entreprise?.nom || "Entreprise"}</p>

                    <div className="candidate-interviews-feature-meta">
                      <span>
                        <CalendarDays size={16} />
                        {selectedInterviewParts.fullDate}
                      </span>
                      <span>
                        <Clock3 size={16} />
                        {selectedInterviewParts.time}
                      </span>
                      <span>
                        <CalendarRange size={16} />
                        Durée : {formatDuration(selectedInterview.entretien.duree_prevue)}
                      </span>
                    </div>

                    <div className="candidate-interviews-status-row">
                      <span className={classes("candidate-interviews-status-chip", `candidate-interviews-status-chip--${getTone(selectedInterview.entretien.statut)}`)}>
                        {getStatusLabel(selectedInterview.entretien.statut)}
                      </span>
                      <span className="candidate-interviews-deadline">{getRelativeLabel(selectedInterviewDate)}</span>
                    </div>

                    <div className="candidate-interviews-feature-actions">
                      <ButtonLink
                        href={featuredActionPrimary.href}
                        target={featuredActionPrimary.external ? "_blank" : undefined}
                        rel={featuredActionPrimary.external ? "noopener noreferrer" : undefined}
                        className="candidate-interviews-primary"
                      >
                        {featuredActionPrimary.icon}
                        {featuredActionPrimary.label}
                      </ButtonLink>

                      <ButtonLink
                        href={featuredActionSecondary}
                        variant="secondary"
                        className="candidate-interviews-secondary"
                      >
                        <CalendarRange size={18} />
                        Préparer l'entretien
                      </ButtonLink>
                    </div>

                    {selectedInterview.entretien.statut === "planifie" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void confirmerEntretien(selectedInterview.entretien.id)}
                        disabled={entretienEnAction === selectedInterview.entretien.id}
                        className="candidate-interviews-confirm"
                      >
                        Confirmer l'entretien
                      </Button>
                    ) : null}
                  </div>

                  <div className="candidate-interviews-date-card" aria-hidden="true">
                    <strong>{selectedInterviewParts.day}</strong>
                    <span>{selectedInterviewParts.monthLabel.split(" ")[0]}</span>
                    <small>{selectedInterviewParts.year}</small>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card padding="lg" className="candidate-interviews-calendar-card">
              <div className="candidate-interviews-calendar-head">
                <strong>Calendrier</strong>
                <div className="candidate-interviews-calendar-nav">
                  <button type="button" aria-label="Mois précédent" onClick={() => setCalendarMonth((current) => addMonths(current, -1))}>
                    <ChevronLeft size={18} />
                  </button>
                  <span>{monthLabel}</span>
                  <button type="button" aria-label="Mois suivant" onClick={() => setCalendarMonth((current) => addMonths(current, 1))}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="candidate-interviews-calendar-weekdays" aria-hidden="true">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="candidate-interviews-calendar-grid" role="grid" aria-label="Calendrier des entretiens">
                {calendarCells.map((cell) => {
                  const cellDate = cell.date;
                  const isCurrentMonth = cell.inMonth;
                  const selected = selectedInterviewDate ? sameDay(cellDate, selectedInterviewDate) : false;
                  const count = cell.items.length;

                  return (
                    <button
                      key={cellDate.toISOString()}
                      type="button"
                      className={classes("candidate-interviews-day", !isCurrentMonth && "is-outside", selected && "is-selected", count > 0 && "has-event")}
                      onClick={() => onPickCalendarDay(cellDate)}
                      disabled={!isCurrentMonth}
                    >
                      <span className="candidate-interviews-day-number">{cellDate.getDate()}</span>
                      {count > 0 ? <span className="candidate-interviews-day-dot" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="candidate-interviews-calendar-preview">
                {selectedInterviewParts ? (
                  <>
                    <span className="candidate-interviews-preview-dot" aria-hidden="true" />
                    <div>
                      <strong>{selectedInterviewParts.day} {selectedInterviewParts.monthLabel}</strong>
                      <p>
                        {selectedInterview?.offre?.titre || "Entretien"} - {selectedInterview?.entreprise?.nom || "Entreprise"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="candidate-interviews-preview-dot" aria-hidden="true" />
                    <div>
                      <strong>Calendrier</strong>
                      <p>{interviewCountLabel}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </section>

          <section className="candidate-interviews-list-section">
            <div className="candidate-interviews-list-head">
              <h2>Tous vos entretiens</h2>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer les entretiens par statut">
                <option value="all">Tous les statuts</option>
                <option value="planifie">À venir</option>
                <option value="confirme">Confirmés</option>
                <option value="reporte">Reportés</option>
                <option value="annule">Annulés</option>
                <option value="termine">Terminés</option>
              </select>
            </div>

            <Card padding="lg" className="candidate-interviews-timeline-card">
              {quickList.length === 0 ? (
                <div className="candidate-interviews-empty-inline">
                  <strong>Aucun entretien dans ce filtre</strong>
                  <p>Essayez de changer le statut ou revenez sur tous les entretiens.</p>
                </div>
              ) : (
                <div className="candidate-interviews-timeline">
                  {quickList.map((item, index) => {
                    const parsed = formatDateParts(item.entretien.date_heure);
                    const tone = getTone(item.entretien.statut);
                    const isSelected = selectedInterviewId === item.entretien.id;
                    const isLast = index === quickList.length - 1;
                    const location = getInterviewLocation(item);

                    return (
                      <button
                        key={item.entretien.id}
                        type="button"
                        className={classes("candidate-interviews-row", isSelected && "is-selected")}
                        onClick={() => {
                          setSelectedInterviewId(item.entretien.id);
                          if (parsed?.raw) {
                            setCalendarMonth(startOfMonth(parsed.raw));
                          }
                        }}
                      >
                        <span className={classes("candidate-interviews-row-line", isLast && "is-last")} aria-hidden="true" />
                        <InterviewMarker tone={tone} />

                        <div className="candidate-interviews-row-copy">
                          <div className="candidate-interviews-row-title">
                            <strong>{item.offre?.titre || "Entretien"}</strong>
                            <span className={classes("candidate-interviews-mini-status", `candidate-interviews-mini-status--${tone}`)}>
                              {getStatusLabel(item.entretien.statut)}
                            </span>
                          </div>

                          <p>{item.entreprise?.nom || "Entreprise"}</p>

                          <div className="candidate-interviews-row-meta">
                            <span>
                              <CalendarDays size={14} />
                              {parsed?.fullDate || "-"}
                            </span>
                            <span>
                              <Clock3 size={14} />
                              {parsed?.time || "-"}
                            </span>
                            <span>
                              <CalendarRange size={14} />
                              {formatDuration(item.entretien.duree_prevue)}
                            </span>
                            <span>
                              {item.entretien.type === "visio" ? <Video size={14} /> : <MapPin size={14} />}
                              {getInterviewTypeLabel(item.entretien.type)}
                            </span>
                          </div>

                          {location ? (
                            <div className="candidate-interviews-row-location">
                              <span>
                                <MapPin size={14} />
                                {location}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        <span className="candidate-interviews-row-arrow" aria-hidden="true">
                          <ArrowRight size={18} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

        </>
      )}

      <style jsx global>{`
        .candidate-interviews-page {
          display: grid;
          gap: 22px;
          padding-bottom: 34px;
        }

        .candidate-interviews-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 8px 2px 0;
        }

        .candidate-interviews-hero-copy {
          display: grid;
          gap: 10px;
          max-width: 780px;
        }

        .candidate-interviews-kicker {
          margin: 0;
          color: rgba(91, 36, 208, 0.72);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .candidate-interviews-hero h1 {
          margin: 0;
          color: #1a1532;
          font-size: clamp(2.15rem, 2.2vw + 1rem, 3.1rem);
          font-weight: 600;
          line-height: 1.02;
          letter-spacing: -0.04em;
        }

        .candidate-interviews-hero p:not(.candidate-interviews-kicker) {
          margin: 0;
          color: #6d6784;
          font-size: 0.95rem;
          line-height: 1.55;
          max-width: 660px;
        }

        .candidate-interviews-top-cta {
          min-height: 52px;
          border-radius: 16px;
          border: 1px solid rgba(92, 45, 160, 0.18);
          background: rgba(255, 255, 255, 0.72);
          color: #4b1cad;
          box-shadow: 0 10px 24px rgba(77, 34, 146, 0.08);
          padding-inline: 18px;
          font-weight: 600;
          gap: 10px;
        }

        .candidate-interviews-top-cta:hover {
          background: rgba(244, 238, 255, 0.9);
          border-color: rgba(92, 45, 160, 0.26);
        }

        .candidate-interviews-loading {
          min-height: 240px;
          display: grid;
          place-items: center;
        }

        .candidate-interviews-top-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.85fr);
          gap: 20px;
          align-items: start;
        }

        .candidate-interviews-feature-card,
        .candidate-interviews-calendar-card,
        .candidate-interviews-timeline-card {
          border-radius: 22px;
          border: 1px solid rgba(81, 56, 135, 0.08);
          background: rgba(255, 255, 255, 0.93);
          box-shadow: 0 18px 44px rgba(39, 30, 74, 0.08);
        }

        .candidate-interviews-feature-card {
          min-height: 374px;
        }

        .candidate-interviews-feature-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .candidate-interviews-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 12px;
          background: rgba(94, 43, 213, 0.08);
          color: #5e23d7;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
        }

        .candidate-interviews-more {
          border: 0;
          background: transparent;
          color: rgba(20, 18, 44, 0.72);
          padding: 0;
          min-height: 32px;
          display: inline-grid;
          place-items: center;
        }

        .candidate-interviews-feature-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 150px;
          gap: 18px;
          align-items: start;
        }

        .candidate-interviews-feature-copy {
          display: grid;
          gap: 14px;
          min-width: 0;
        }

        .candidate-interviews-feature-copy h2 {
          margin: 0;
          color: #1b1635;
          font-size: clamp(1.55rem, 1.9vw, 2rem);
          line-height: 1.1;
          letter-spacing: -0.04em;
          font-weight: 600;
        }

        .candidate-interviews-company {
          margin: 0;
          color: #5c5674;
          font-size: 0.98rem;
          font-weight: 500;
        }

        .candidate-interviews-feature-meta {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          color: #262143;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .candidate-interviews-feature-meta span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .candidate-interviews-feature-meta svg {
          color: #6b30db;
          flex: none;
        }

        .candidate-interviews-status-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .candidate-interviews-status-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 12px;
          background: rgba(91, 45, 145, 0.08);
          color: #5b2d91;
          border: 1px solid rgba(91, 45, 145, 0.08);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .candidate-interviews-status-chip--green {
          background: rgba(35, 154, 91, 0.12);
          border-color: rgba(35, 154, 91, 0.16);
          color: #1c7c4f;
        }

        .candidate-interviews-status-chip--red {
          background: rgba(214, 60, 60, 0.1);
          border-color: rgba(214, 60, 60, 0.15);
          color: #b22323;
        }

        .candidate-interviews-status-chip--violet {
          background: rgba(94, 43, 213, 0.08);
          border-color: rgba(94, 43, 213, 0.1);
          color: #5e23d7;
        }

        .candidate-interviews-deadline {
          color: #6d6784;
          font-size: 0.88rem;
        }

        .candidate-interviews-feature-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .candidate-interviews-primary,
        .candidate-interviews-secondary,
        .candidate-interviews-confirm {
          min-height: 46px;
          border-radius: 14px;
          padding-inline: 16px;
          gap: 10px;
          font-weight: 600;
        }

        .candidate-interviews-primary {
          background: linear-gradient(135deg, #6a2de0, #4322af);
          color: #fff;
          border: 1px solid transparent;
          box-shadow: 0 14px 34px rgba(94, 43, 213, 0.24);
        }

        .candidate-interviews-primary:hover {
          background: linear-gradient(135deg, #732ff0, #4a25ba);
        }

        .candidate-interviews-secondary {
          border: 1px solid rgba(94, 43, 213, 0.16);
          background: rgba(255, 255, 255, 0.86);
          color: #20163f;
        }

        .candidate-interviews-confirm {
          padding-inline: 12px;
          color: #5e23d7;
        }

        .candidate-interviews-date-card {
          align-self: center;
          justify-self: end;
          width: 148px;
          min-height: 176px;
          border-radius: 18px;
          border: 1px solid rgba(81, 56, 135, 0.08);
          background: rgba(246, 243, 255, 0.86);
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          color: #1d1840;
        }

        .candidate-interviews-date-card strong {
          font-size: 3.2rem;
          line-height: 1;
          font-weight: 600;
          letter-spacing: -0.05em;
        }

        .candidate-interviews-date-card span {
          color: #5e23d7;
          font-size: 0.96rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .candidate-interviews-date-card small {
          color: #6d6784;
          font-size: 0.92rem;
          font-weight: 600;
        }

        .candidate-interviews-calendar-card {
          display: grid;
          gap: 14px;
          min-height: 374px;
        }

        .candidate-interviews-calendar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #1f193c;
          font-size: 1rem;
          font-weight: 600;
        }

        .candidate-interviews-calendar-nav {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #241a44;
        }

        .candidate-interviews-calendar-nav button {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: inherit;
          display: grid;
          place-items: center;
        }

        .candidate-interviews-calendar-nav span {
          min-width: 108px;
          text-align: center;
          font-size: 1.04rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .candidate-interviews-calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
          color: #6e6784;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .candidate-interviews-calendar-weekdays span {
          text-align: center;
          padding: 6px 0;
        }

        .candidate-interviews-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 6px;
        }

        .candidate-interviews-day {
          position: relative;
          aspect-ratio: 1 / 1;
          border: 0;
          border-radius: 14px;
          background: transparent;
          color: #22203f;
          display: grid;
          place-items: center;
          padding: 0;
        }

        .candidate-interviews-day:not(.is-outside):hover {
          background: rgba(93, 45, 171, 0.06);
        }

        .candidate-interviews-day.is-outside {
          color: rgba(34, 32, 63, 0.34);
        }

        .candidate-interviews-day.is-selected {
          background: linear-gradient(135deg, #6a2de0, #4522b4);
          color: #fff;
          box-shadow: 0 14px 26px rgba(94, 43, 213, 0.24);
        }

        .candidate-interviews-day.has-event .candidate-interviews-day-number {
          transform: translateY(-2px);
        }

        .candidate-interviews-day-number {
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1;
        }

        .candidate-interviews-day-dot {
          position: absolute;
          bottom: 8px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.9;
        }

        .candidate-interviews-calendar-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(81, 56, 135, 0.08);
          background: rgba(248, 245, 255, 0.92);
        }

        .candidate-interviews-preview-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #6b2ce0;
          box-shadow: 0 0 0 6px rgba(107, 44, 224, 0.12);
          flex: none;
        }

        .candidate-interviews-calendar-preview strong {
          display: block;
          color: #1b1635;
          font-size: 0.94rem;
          line-height: 1.35;
        }

        .candidate-interviews-calendar-preview p {
          margin: 3px 0 0;
          color: #6d6784;
          font-size: 0.85rem;
        }

        .candidate-interviews-list-section {
          display: grid;
          gap: 14px;
        }

        .candidate-interviews-list-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .candidate-interviews-list-head h2 {
          margin: 0;
          color: #1a1532;
          font-size: 1.05rem;
          font-weight: 600;
        }

        .candidate-interviews-list-head select {
          min-height: 42px;
          min-width: 180px;
          border-radius: 14px;
          border: 1px solid rgba(81, 56, 135, 0.12);
          background: rgba(255, 255, 255, 0.9);
          color: #1d1739;
          padding: 0 14px;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .candidate-interviews-timeline-card {
          padding: 0;
          overflow: hidden;
        }

        .candidate-interviews-timeline {
          display: grid;
        }

        .candidate-interviews-row {
          position: relative;
          width: 100%;
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          gap: 16px;
          align-items: start;
          padding: 18px 18px 18px 22px;
          border: 0;
          border-bottom: 1px solid rgba(86, 62, 142, 0.08);
          background: transparent;
          text-align: left;
          color: inherit;
        }

        .candidate-interviews-row:hover {
          background: rgba(246, 243, 255, 0.76);
        }

        .candidate-interviews-row.is-selected {
          background: rgba(91, 45, 145, 0.05);
        }

        .candidate-interviews-row-line {
          position: absolute;
          left: 38px;
          top: 18px;
          bottom: -18px;
          width: 1px;
          background: linear-gradient(180deg, rgba(94, 43, 213, 0.22), rgba(94, 43, 213, 0.04));
        }

        .candidate-interviews-row-line.is-last {
          bottom: 18px;
        }

        .candidate-interviews-marker {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(95, 43, 219, 0.1);
          color: #6b2ce0;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
          z-index: 1;
        }

        .candidate-interviews-marker--green {
          background: rgba(33, 173, 101, 0.12);
          color: #1f9f62;
        }

        .candidate-interviews-marker--red {
          background: rgba(218, 61, 61, 0.12);
          color: #c52f2f;
        }

        .candidate-interviews-marker--violet {
          background: rgba(95, 43, 219, 0.12);
          color: #6b2ce0;
        }

        .candidate-interviews-row-copy {
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .candidate-interviews-row-title {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .candidate-interviews-row-title strong {
          color: #1a1532;
          font-size: 1rem;
          line-height: 1.25;
          font-weight: 600;
        }

        .candidate-interviews-mini-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .candidate-interviews-mini-status--blue {
          background: rgba(95, 43, 219, 0.08);
          color: #6b2ce0;
        }

        .candidate-interviews-mini-status--green {
          background: rgba(33, 173, 101, 0.12);
          color: #1f9f62;
        }

        .candidate-interviews-mini-status--red {
          background: rgba(218, 61, 61, 0.12);
          color: #c52f2f;
        }

        .candidate-interviews-mini-status--violet {
          background: rgba(95, 43, 219, 0.08);
          color: #6b2ce0;
        }

        .candidate-interviews-row-copy p {
          margin: 0;
          color: #6d6784;
          font-size: 0.92rem;
          font-weight: 500;
        }

        .candidate-interviews-row-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          color: #4b4660;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .candidate-interviews-row-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .candidate-interviews-row-meta svg {
          color: #6b2ce0;
        }

        .candidate-interviews-row-location {
          color: #4b4660;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .candidate-interviews-row-location span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .candidate-interviews-row-arrow {
          color: rgba(33, 29, 60, 0.48);
          padding-top: 4px;
        }

        .candidate-interviews-empty-inline {
          padding: 28px;
          display: grid;
          gap: 6px;
          justify-items: start;
          color: #6d6784;
        }

        .candidate-interviews-empty-inline strong {
          color: #1a1532;
          font-size: 1rem;
          font-weight: 600;
        }

        .candidate-interviews-empty-inline p {
          margin: 0;
        }

        @media (max-width: 1120px) {
          .candidate-interviews-top-grid {
            grid-template-columns: 1fr;
          }

          .candidate-interviews-date-card {
            justify-self: start;
          }
        }

        @media (max-width: 860px) {
          .candidate-interviews-hero {
            flex-direction: column;
          }

          .candidate-interviews-feature-body {
            grid-template-columns: 1fr;
          }

          .candidate-interviews-date-card {
            width: 100%;
            min-height: 132px;
            grid-template-columns: repeat(3, auto);
            place-items: center;
          }

          .candidate-interviews-list-head {
            flex-direction: column;
            align-items: stretch;
          }

          .candidate-interviews-list-head select {
            width: 100%;
          }

          .candidate-interviews-row {
            grid-template-columns: 34px minmax(0, 1fr);
          }

          .candidate-interviews-row-arrow {
            display: none;
          }
        }

        @media (max-width: 720px) {
          .candidate-interviews-page {
            gap: 18px;
          }

          .candidate-interviews-hero h1 {
            font-size: 1.85rem;
          }

          .candidate-interviews-feature-meta {
            gap: 12px;
          }

          .candidate-interviews-calendar-grid {
            gap: 4px;
          }

          .candidate-interviews-day {
            border-radius: 12px;
          }

          .candidate-interviews-row {
            padding: 16px 14px 16px 18px;
          }
        }
      `}</style>
    </div>
  );
}
