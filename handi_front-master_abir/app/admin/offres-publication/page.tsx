"use client";

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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
}

function AdminPublicationOffersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
                        <span style={{ 
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "8px",
                          backgroundColor: "#f0e6ff",
                          color: "#5a3a8f",
                          fontSize: "0.85em",
                          fontWeight: "600"
                        }}>
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
                                boxSizing: "border-box"
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
                                boxSizing: "border-box"
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
