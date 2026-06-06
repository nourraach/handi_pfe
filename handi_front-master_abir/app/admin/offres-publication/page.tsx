"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/layout";

type PendingOffer = {
  id_offre: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  created_at: string;
  entreprise_nom: string;
  review_status: "pending";
};

const modalStyles = `
  .admin-offer-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(26, 18, 43, 0.42);
    backdrop-filter: blur(8px);
  }

  .admin-offer-modal-card {
    width: min(1100px, 100%);
    max-height: min(88vh, 980px);
    overflow: auto;
    border-radius: 22px;
    border: 1px solid #e8e1f4;
    background: #ffffff;
    box-shadow: 0 28px 70px rgba(31, 18, 49, 0.24);
    padding: 30px 32px;
    position: relative;
  }

  .admin-offer-modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid #d8cde9;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f4eefb;
    color: #3d1a67;
    font-size: 1.15rem;
    cursor: pointer;
  }

  .admin-offer-modal-shell {
    display: grid;
    gap: 18px;
  }

  .admin-offer-hero {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    align-items: center;
    gap: 18px;
    padding: 22px 54px 22px 22px;
    border: 1px solid rgba(74, 29, 89, 0.1);
    border-radius: 22px;
    background:
      radial-gradient(circle at 92% 12%, rgba(216, 106, 141, 0.18), transparent 34%),
      linear-gradient(135deg, rgba(74, 29, 89, 0.08), rgba(255, 255, 255, 0.96));
  }

  .admin-offer-logo {
    width: 82px;
    height: 82px;
    display: grid;
    place-items: center;
    border-radius: 22px;
    background: linear-gradient(135deg, #5b2d91, #8a63d2);
    color: #fff;
    font-size: 1.5rem;
    font-weight: 900;
    box-shadow: 0 18px 38px rgba(91, 45, 145, 0.2);
  }

  .admin-offer-kicker {
    margin: 0;
    color: #6b5b86;
    font-size: 0.86rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .admin-offer-title {
    margin: 4px 0 8px;
    color: #1f1431;
    font-size: clamp(1.7rem, 3vw, 2.5rem);
    line-height: 1.05;
  }

  .admin-offer-subtitle {
    margin: 0;
    color: #647188;
    font-size: 1rem;
    line-height: 1.4;
  }

  .admin-offer-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .admin-offer-meta span,
  .admin-offer-badges span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    color: #4b415e;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .admin-offer-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-offer-grid article,
  .admin-offer-panel {
    border: 1px solid rgba(74, 29, 89, 0.1);
    border-radius: 18px;
    background: linear-gradient(180deg, #fff, #fcfafd);
    box-shadow: 0 14px 34px rgba(31, 18, 49, 0.05);
  }

  .admin-offer-grid article {
    min-height: 104px;
    display: grid;
    align-content: center;
    gap: 7px;
    padding: 16px;
  }

  .admin-offer-grid span {
    color: #756b84;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .admin-offer-grid strong {
    color: #1f1431;
    font-size: 1.25rem;
    line-height: 1.15;
  }

  .admin-offer-panels {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
    gap: 14px;
  }

  .admin-offer-panel {
    padding: 20px;
  }

  .admin-offer-panel h3 {
    margin: 0 0 12px;
    color: #1f1431;
    font-size: 1.05rem;
  }

  .admin-offer-panel p {
    margin: 0;
    color: #625773;
    line-height: 1.58;
  }

  .admin-offer-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .admin-offer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media (max-width: 820px) {
    .admin-offer-hero,
    .admin-offer-panels {
      grid-template-columns: 1fr;
    }

    .admin-offer-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .admin-offer-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
}

function AdminPublicationOffersPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [offerEnDetails, setOfferEnDetails] = useState<PendingOffer | null>(null);

  const loadPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(construireUrlApi("/api/admin/offres/publication/en-attente"));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.message || "Erreur lors du chargement des offres en attente.");
        setOffers([]);
        return;
      }
      setOffers(Array.isArray(payload?.donnees) ? payload.donnees : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadPending();
  }, []);

  const approve = async (id: string) => {
    try {
      setProcessingId(id);
      setError(null);
      const response = await authenticatedFetch(construireUrlApi(`/api/admin/offres/publication/${id}/approuver`), {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.message || "Impossible d'approuver cette offre.");
        return;
      }
      setMessage("Offre approuvee et publiee.");
      await loadPending();
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (id: string) => {
    const motif = window.prompt("Motif du refus (minimum 5 caracteres):", "");
    if (!motif) return;

    try {
      setProcessingId(id);
      setError(null);
      const response = await authenticatedFetch(construireUrlApi(`/api/admin/offres/publication/${id}/refuser`), {
        method: "POST",
        body: JSON.stringify({ motif }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.message || "Impossible de refuser cette offre.");
        return;
      }
      setMessage("Offre refusee. Le motif a ete envoye a l'entreprise.");
      await loadPending();
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <LoadingState title="Validation des offres" description="Chargement des offres en attente..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Validation indisponible"
        description={error}
        action={<Button onClick={() => void loadPending()}>Reessayer</Button>}
      />
    );
  }

  return (
    <>
      {message ? (
        <div role="status" className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4">
          {message}
        </div>
      ) : null}

      {offers.length === 0 ? (
        <EmptyState
          title="Aucune offre en attente"
          description="Toutes les offres ont deja ete traitees."
          action={<Button onClick={() => void loadPending()}>Actualiser</Button>}
        />
      ) : (
        <div className="carte bloc-principal">
          <div className="tableau">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left" }}>Offre</th>
                  <th style={{ padding: "14px 16px", textAlign: "left" }}>Entreprise</th>
                  <th style={{ padding: "14px 16px", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "14px 16px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const busy = processingId === offer.id_offre;
                  return (
                    <tr key={offer.id_offre}>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <strong style={{ display: "block", marginBottom: "4px" }}>{offer.titre}</strong>
                          <p style={{ margin: 0, fontSize: "0.9em", color: "#666" }}>{offer.description}</p>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div>
                          <div>{offer.entreprise_nom}</div>
                          <div style={{ fontSize: "0.85em", color: "#666" }}>{offer.localisation}</div>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "8px",
                            backgroundColor: "#f0e6ff",
                            color: "#5a3a8f",
                            fontSize: "0.85em",
                            fontWeight: "600",
                          }}
                        >
                          {offer.type_poste.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.9em" }}>
                        {formatDate(offer.created_at)}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ display: "inline-block" }}>
                            <button
                              className="offer-publication-action offer-publication-action--view"
                              disabled={busy}
                              onClick={() => setOfferEnDetails(offer)}
                              style={{
                                all: "unset",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#4a1d59",
                                minWidth: "140px",
                                padding: "10px 20px",
                                borderRadius: "12px",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: busy ? "not-allowed" : "pointer",
                                opacity: busy ? 0.5 : 1,
                                boxSizing: "border-box",
                                backgroundColor: "#f3eaf7",
                                border: "2px solid #e7dbf3",
                              }}
                            >
                              Voir offre
                            </button>
                          </span>
                          <span style={{ display: "inline-block" }}>
                            <button
                              className="offer-publication-action offer-publication-action--approve"
                              disabled={busy}
                              onClick={() => void approve(offer.id_offre)}
                              style={{
                                all: "unset",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                minWidth: "220px",
                                padding: "10px 20px",
                                borderRadius: "12px",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: busy ? "not-allowed" : "pointer",
                                opacity: busy ? 0.5 : 1,
                                boxSizing: "border-box",
                              }}
                            >
                              Approuver et publier
                            </button>
                          </span>
                          <span style={{ display: "inline-block" }}>
                            <button
                              className="offer-publication-action offer-publication-action--reject"
                              disabled={busy}
                              onClick={() => void reject(offer.id_offre)}
                              style={{
                                all: "unset",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                minWidth: "220px",
                                padding: "10px 20px",
                                borderRadius: "12px",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: busy ? "not-allowed" : "pointer",
                                opacity: busy ? 0.5 : 1,
                                boxSizing: "border-box",
                              }}
                            >
                              Refuser avec motif
                            </button>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mounted && offerEnDetails
        ? createPortal(
            <div className="admin-offer-modal-overlay" role="dialog" aria-modal="true" onClick={() => setOfferEnDetails(null)}>
              <style>{modalStyles}</style>
              <div className="admin-offer-modal-card" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="admin-offer-modal-close" onClick={() => setOfferEnDetails(null)} aria-label="Fermer">
                  ×
                </button>

                <div className="admin-offer-modal-shell">
                  <section className="admin-offer-hero">
                    <div className="admin-offer-logo">{offerEnDetails.entreprise_nom.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <p className="admin-offer-kicker">Offre en attente de validation</p>
                      <h2 className="admin-offer-title">{offerEnDetails.titre}</h2>
                      <p className="admin-offer-subtitle">
                        {offerEnDetails.entreprise_nom} - {offerEnDetails.localisation}
                      </p>
                      <div className="admin-offer-meta">
                        <span>{offerEnDetails.localisation}</span>
                        <span>{offerEnDetails.type_poste.toUpperCase()}</span>
                        <span>{formatDate(offerEnDetails.created_at)}</span>
                      </div>
                    </div>
                  </section>

                  <section className="admin-offer-grid">
                    <article>
                      <span>Entreprise</span>
                      <strong>{offerEnDetails.entreprise_nom}</strong>
                    </article>
                    <article>
                      <span>Type</span>
                      <strong>{offerEnDetails.type_poste.toUpperCase()}</strong>
                    </article>
                    <article>
                      <span>Statut</span>
                      <strong>En attente</strong>
                    </article>
                    <article>
                      <span>Date</span>
                      <strong>{formatDate(offerEnDetails.created_at)}</strong>
                    </article>
                  </section>

                  <section className="admin-offer-panels">
                    <article className="admin-offer-panel">
                      <h3>Description</h3>
                      <p>{offerEnDetails.description || "Aucune description detaillee n'a ete renseignee pour cette offre."}</p>
                    </article>

                    <article className="admin-offer-panel">
                      <h3>Informations rapides</h3>
                      <div className="admin-offer-badges">
                        <span>{offerEnDetails.localisation}</span>
                        <span>{offerEnDetails.type_poste.toUpperCase()}</span>
                        <span>Publication admin</span>
                      </div>
                    </article>
                  </section>

                  <div className="admin-offer-actions">
                    <Button variant="secondary" onClick={() => setOfferEnDetails(null)}>Fermer</Button>
                    <Button onClick={() => void approve(offerEnDetails.id_offre)} disabled={processingId === offerEnDetails.id_offre}>
                      Approuver et publier
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <style jsx>{`
        .offer-publication-action {
          border-width: 2px;
          border-style: solid;
          box-shadow: none;
          transition: filter 0.18s ease, transform 0.18s ease;
        }

        .offer-publication-action:hover:not(:disabled) {
          filter: brightness(1.03);
          transform: translateY(-1px);
        }

        .offer-publication-action--approve {
          background: #16a34a !important;
          background-color: #16a34a !important;
          border-color: #16a34a !important;
          color: #ffffff !important;
        }

        .offer-publication-action--reject {
          background: #dc2626 !important;
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
          color: #ffffff !important;
        }

        .offer-publication-action--view {
          background: #f3eaf7 !important;
          background-color: #f3eaf7 !important;
          border-color: #e7dbf3 !important;
          color: #4a1d59 !important;
        }
      `}</style>
    </>
  );
}

export default function AdminPublicationOffersPageProtected() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <main className="page-centree section-page app-theme">
        <div className="admin-queue-page">
          <AdminPublicationOffersPage />
        </div>
      </main>
    </RouteProtegee>
  );
}
