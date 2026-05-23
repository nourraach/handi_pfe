"use client";

import { type SVGProps, useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireLienGoogleCalendar, extraireDureeMinutes, formaterDateEntretien, getEntretienStatutConfig, getEntretienTypeLabel } from "@/lib/entretiens";
import { construireUrlApi } from "@/lib/config";

type EntretienCandidat = {
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

function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="7" width="17" height="12" rx="2.5" />
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
      <path d="M3.5 11.5h17" />
    </svg>
  );
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 2" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M8 3.75v3.5" />
      <path d="M16 3.75v3.5" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13.5 8.5 15a3 3 0 0 1-4.24-4.24L7 8" />
      <path d="m14 10.5 1.5-1.5a3 3 0 1 1 4.24 4.24L17 16" />
      <path d="m9 15 6-6" />
    </svg>
  );
}

function NotesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 4.5h8l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V6A1.5 1.5 0 0 1 7.5 4.5Z" />
      <path d="M15 4.5V8h3" />
      <path d="M9 12h6" />
      <path d="M9 15.5h4" />
    </svg>
  );
}

export default function MesEntretiensPage() {
  const [entretiens, setEntretiens] = useState<EntretienCandidat[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [entretienEnAction, setEntretienEnAction] = useState<string | null>(null);

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

  const { aVenir, passes } = useMemo(() => {
    const maintenant = new Date();
    const futur: EntretienCandidat[] = [];
    const historique: EntretienCandidat[] = [];

    for (const item of entretiens) {
      const date = new Date(item.entretien.date_heure);
      if (!Number.isNaN(date.getTime()) && date >= maintenant && item.entretien.statut !== "termine") {
        futur.push(item);
      } else {
        historique.push(item);
      }
    }

    return { aVenir: futur, passes: historique };
  }, [entretiens]);

  const confirmerEntretien = async (id: string) => {
    try {
      setEntretienEnAction(id);
      setErreur(null);
      setInfo(null);

      const response = await authenticatedFetch(construireUrlApi(`/api/entretiens/${id}/confirmer`), {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm the interview.");
      }

      setInfo(data.message || "Interview confirmed.");
      await charger();
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to confirm the interview.");
    } finally {
      setEntretienEnAction(null);
    }
  };

  const renderSection = (titre: string, description: string, items: EntretienCandidat[]) => {
    if (items.length === 0) {
      return (
        <Card padding="lg">
          <div className="empty-state">
            <strong>{titre}</strong>
            <p>{description}</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="list-stack">
        {items.map((item) => {
          const statut = getEntretienStatutConfig(item.entretien.statut);
          const date = formaterDateEntretien(item.entretien.date_heure);
          const lieu =
            item.entretien.type === "visio"
              ? item.entretien.lieu_visio || ""
              : item.entretien.type === "presentiel"
                ? item.entretien.lieu || ""
                : item.entretien.contact_entreprise || item.entreprise?.contact_rh_telephone || "";

          const lienCalendar = construireLienGoogleCalendar({
            titre: `Interview - ${item.offre?.titre || "Role"}`,
            dateHeure: item.entretien.date_heure,
            dureeMinutes: extraireDureeMinutes(item.entretien.duree_prevue || undefined),
            details: `${item.entreprise?.nom || "Company"} - ${item.entreprise?.contact_rh_email || ""}`,
            location: lieu,
          });

          return (
            <Card key={item.entretien.id} padding="lg" className="entretien-card">
              <div className="entretien-stack">
                <div className="entretien-head">
                  <div className="entretien-head-main">
                    <div className="entretien-avatar" aria-hidden="true">
                      <BriefcaseIcon className="entretien-icon" />
                    </div>
                    <div className="entretien-title-wrap">
                      <div className="entretien-title-row">
                        <strong className="entretien-title">{item.offre?.titre || "Entretien"}</strong>
                        <span className={`status-pill ${statut.className}`}>{statut.label}</span>
                      </div>
                      <p className="entretien-subline">
                        {item.entreprise?.nom || "Entreprise"} <span>•</span> {date.date} <span>•</span> {date.time}
                      </p>
                    </div>
                  </div>
                  <div className="entretien-head-actions">
                    <a className="entretien-mini-action" href={lienCalendar} target="_blank" rel="noopener noreferrer">
                      <CalendarIcon className="entretien-mini-icon" />
                      Ajouter au calendrier
                    </a>
                    {item.entretien.statut === "planifie" ? (
                      <Button
                        onClick={() => confirmerEntretien(item.entretien.id)}
                        disabled={entretienEnAction === item.entretien.id}
                        size="sm"
                      >
                        Confirmer
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="entretien-grid">
                  <div className="entretien-meta-item">
                    <span className="entretien-meta-icon-wrap"><BriefcaseIcon className="entretien-meta-icon" /></span>
                    <div>
                      <strong>Type d&apos;entretien</strong>
                      <p>{getEntretienTypeLabel(item.entretien.type)}</p>
                    </div>
                  </div>
                  <div className="entretien-meta-item">
                    <span className="entretien-meta-icon-wrap"><ClockIcon className="entretien-meta-icon" /></span>
                    <div>
                      <strong>Duree</strong>
                      <p>{item.entretien.duree_prevue || "45 min"}</p>
                    </div>
                  </div>
                  <div className="entretien-meta-item">
                    <span className="entretien-meta-icon-wrap"><UserIcon className="entretien-meta-icon" /></span>
                    <div>
                      <strong>Contact RH</strong>
                      <p>{item.entreprise?.contact_rh_email || item.entreprise?.contact_rh_telephone || "Non communique"}</p>
                    </div>
                  </div>
                  <div className="entretien-meta-item">
                    <span className="entretien-meta-icon-wrap"><CalendarIcon className="entretien-meta-icon" /></span>
                    <div>
                      <strong>Calendrier</strong>
                      <p>Ajout rapide</p>
                    </div>
                  </div>
                </div>

                {lieu ? (
                  <div className="entretien-row">
                    <div className="entretien-row-main">
                      <span className="entretien-meta-icon-wrap"><LinkIcon className="entretien-meta-icon" /></span>
                      <div>
                        <strong>
                          {item.entretien.type === "visio" ? "Lien de la visioconference" : item.entretien.type === "presentiel" ? "Lieu" : "Contact"}
                        </strong>
                        <p>{lieu}</p>
                      </div>
                    </div>
                    {item.entretien.type === "visio" && item.entretien.lieu_visio ? (
                      <a className="entretien-inline-action" href={item.entretien.lieu_visio} target="_blank" rel="noopener noreferrer">
                        Ouvrir le lien
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {item.entretien.notes ? (
                  <div className="entretien-row">
                    <div className="entretien-row-main">
                      <span className="entretien-meta-icon-wrap"><NotesIcon className="entretien-meta-icon" /></span>
                      <div>
                        <strong>Notes partagees</strong>
                        <p>{item.entretien.notes}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="entretien-row">
                    <div className="entretien-row-main">
                      <span className="entretien-meta-icon-wrap"><NotesIcon className="entretien-meta-icon" /></span>
                      <div>
                        <strong>Notes partagees</strong>
                        <p>—</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="entretien-actions">
                  <a className="ui-button" href={lienCalendar} target="_blank" rel="noopener noreferrer">
                    Ajouter au calendrier
                  </a>
                  {item.entretien.type === "visio" && item.entretien.lieu_visio ? (
                    <a className="ui-button ui-button-secondary" href={item.entretien.lieu_visio} target="_blank" rel="noopener noreferrer">
                      Ouvrir le lien
                    </a>
                  ) : (
                    <span className="ui-button ui-button-secondary is-disabled" aria-hidden="true">
                      Ouvrir le lien
                    </span>
                  )}
                  <ButtonLink href="/notifications" variant="ghost">
                    Voir mes notifications
                  </ButtonLink>
                </div>

                <div className="sr-only">
                  <div className="details-grid">
                    <div className="detail-box">
                      <strong>Duration</strong>
                    <p>{item.entretien.duree_prevue || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-page">
      <div className="page-header-actions">
        <Button variant="secondary" onClick={charger}>
          Refresh
        </Button>
        <ButtonLink href="/notifications">Open notifications</ButtonLink>
      </div>

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}
      {info ? <div className="message message-info">{info}</div> : null}

      {loading ? (
        <Card padding="lg">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <strong>Loading your interviews</strong>
            <p>We are retrieving your meeting calendar.</p>
          </div>
        </Card>
      ) : entretiens.length === 0 ? (
        <EmptyState
          title="No interviews scheduled"
          description="When a company schedules a meeting, it will appear here with its status and your available actions."
          action={<ButtonLink href="/offres">Continue job search</ButtonLink>}
        />
      ) : (
        <>
          {renderSection("Upcoming interviews", "You do not have any upcoming interviews right now.", aVenir)}
          {renderSection("History", "No past interviews to show.", passes)}
        </>
      )}

      <style jsx global>{`
        .entretien-card {
          border: 1px solid var(--app-border);
          box-shadow: var(--shadow-1);
        }

        .entretien-stack {
          display: grid;
          gap: 14px;
        }

        .entretien-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .entretien-head-main {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .entretien-avatar {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(216, 202, 246, 0.45);
          color: #4c1ca3;
          flex: none;
        }

        .entretien-icon {
          width: 19px;
          height: 19px;
        }

        .entretien-title-wrap {
          min-width: 0;
          display: grid;
          gap: 5px;
        }

        .entretien-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .entretien-title {
          font-size: 1.3rem;
          line-height: 1.2;
          color: var(--app-text);
        }

        .entretien-subline {
          margin: 0;
          color: var(--app-muted);
          font-size: 13px;
          line-height: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .entretien-subline span {
          color: rgba(var(--app-primary-rgb), 0.55);
        }

        .entretien-head-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .entretien-mini-action {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.14);
          background: rgba(var(--app-primary-rgb), 0.03);
          color: var(--app-primary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background-color 150ms ease, border-color 150ms ease;
        }

        .entretien-mini-action:hover {
          border-color: rgba(var(--app-primary-rgb), 0.28);
          background: rgba(var(--app-primary-rgb), 0.08);
        }

        .entretien-mini-icon {
          width: 15px;
          height: 15px;
        }

        .entretien-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid var(--app-border);
          border-radius: 14px;
          overflow: hidden;
          background: var(--app-surface);
        }

        .entretien-meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-inline-end: 1px solid var(--app-border);
        }

        .entretien-meta-item:last-child {
          border-inline-end: 0;
        }

        .entretien-meta-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: rgba(216, 202, 246, 0.36);
          color: #5b29b8;
          flex: none;
        }

        .entretien-meta-icon {
          width: 15px;
          height: 15px;
        }

        .entretien-meta-item strong,
        .entretien-row-main strong {
          display: block;
          color: var(--app-text);
          font-size: 13px;
          line-height: 18px;
        }

        .entretien-meta-item p,
        .entretien-row-main p {
          margin: 4px 0 0;
          color: var(--app-muted);
          font-size: 13px;
          line-height: 20px;
          word-break: break-word;
        }

        .entretien-row {
          border: 1px solid var(--app-border);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--app-surface);
        }

        .entretien-row-main {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .entretien-inline-action {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          border: 0;
          background: rgba(var(--app-primary-rgb), 0.09);
          color: var(--app-primary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }

        .entretien-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .entretien-actions > * {
          width: 100%;
          justify-content: center;
        }

        .entretien-actions .is-disabled {
          opacity: 0.55;
          pointer-events: none;
        }

        @media (max-width: 980px) {
          .entretien-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .entretien-meta-item:nth-child(2n) {
            border-inline-end: 0;
          }

          .entretien-meta-item:nth-child(-n + 2) {
            border-bottom: 1px solid var(--app-border);
          }

          .entretien-actions {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .entretien-grid {
            grid-template-columns: 1fr;
          }

          .entretien-meta-item {
            border-inline-end: 0;
            border-bottom: 1px solid var(--app-border);
          }

          .entretien-meta-item:last-child {
            border-bottom: 0;
          }

          .entretien-row {
            flex-direction: column;
            align-items: stretch;
          }

          .entretien-inline-action {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
