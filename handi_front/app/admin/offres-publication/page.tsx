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
    <section style={{ display: "grid", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>Validation des offres</h1>
        <p style={{ margin: "6px 0 0", color: "#605777" }}>
          Controlez les offres soumises avant leur publication.
        </p>
      </header>

      {message ? (
        <div role="status" style={{ border: "1px solid #d9d0f0", borderRadius: 10, background: "#f7f3ff", padding: 12 }}>
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
        <div style={{ display: "grid", gap: 12 }}>
          {offers.map((offer) => {
            const busy = processingId === offer.id_offre;
            return (
              <article key={offer.id_offre} style={{ border: "1px solid #ebe4f8", borderRadius: 14, background: "#fff", padding: 14 }}>
                <h2 style={{ margin: 0, fontSize: "1.08rem" }}>{offer.titre}</h2>
                <p style={{ margin: "6px 0 0", color: "#6a607f" }}>
                  {offer.entreprise_nom} · {offer.localisation} · {offer.type_poste.toUpperCase()} · {formatDate(offer.created_at)}
                </p>
                <p style={{ margin: "10px 0", color: "#2e2245" }}>{offer.description}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button disabled={busy} onClick={() => void approve(offer.id_offre)}>
                    Approuver et publier
                  </Button>
                  <Button disabled={busy} variant="danger" onClick={() => void reject(offer.id_offre)}>
                    Refuser avec motif
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function AdminPublicationOffersPageProtected() {
  return (
    <RouteProtegee rolesAutorises={["admin"]}>
      <AdminPublicationOffersPage />
    </RouteProtegee>
  );
}

