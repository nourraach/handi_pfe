"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type FavoriItem = {
  id: string;
  id_offre: string;
  titre?: string;
  nom_entreprise?: string;
  created_at?: string;
};

type OffrePublique = {
  id_offre: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  salaire_min: number;
  salaire_max: number;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  nom_entreprise?: string;
};

const tndNumberFormatter = new Intl.NumberFormat("fr-TN", {
  maximumFractionDigits: 0,
});

const formatSalaryAmount = (value: number) => tndNumberFormatter.format(value);

export default function PageProtegee() {
  return (
    <AuthenticatedWorkspace rolesAutorises={["candidat"]}>
      <FavorisPage />
    </AuthenticatedWorkspace>
  );
}

function FavorisPage() {
  const [favoris, setFavoris] = useState<FavoriItem[]>([]);
  const [offres, setOffres] = useState<OffrePublique[]>([]);
  const [selectedOffre, setSelectedOffre] = useState<OffrePublique | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    void charger();
  }, []);

  const charger = async () => {
    try {
      setLoading(true);
      setErreur(null);

      const [favorisRes, offresRes] = await Promise.all([
        authenticatedFetch(construireUrlApi("/api/favoris")),
        fetch(construireUrlApi("/api/offres/publiques")),
      ]);

      const favorisData = await favorisRes.json().catch(() => ({}));
      const offresData = await offresRes.json().catch(() => ({}));

      if (!favorisRes.ok) {
        throw new Error(favorisData.message || "Unable to load favorites.");
      }

      setFavoris(Array.isArray(favorisData.donnees) ? favorisData.donnees : []);
      setOffres(Array.isArray(offresData.donnees?.offres) ? offresData.donnees.offres : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load favorites.");
    } finally {
      setLoading(false);
    }
  };

  const retirer = async (idOffre: string) => {
    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/favoris/${idOffre}`), { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Unable to remove this favorite.");
      }
      setFavoris((prev) => prev.filter((f) => f.id_offre !== idOffre));
      if (selectedOffre?.id_offre === idOffre) {
        setSelectedOffre(null);
      }
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to remove this favorite.");
    }
  };

  const offresById = useMemo(
    () => new Map(offres.map((offre) => [offre.id_offre, offre])),
    [offres],
  );

  if (loading) {
    return <LoadingState title="Loading your favorites" description="Collecting saved opportunities from your workspace." />;
  }

  return (
    <div className="app-page">
      <PageHeader
        badge="Saved roles"
        title="Your favorite jobs, ready to revisit."
        description="Keep the opportunities that match your pace, interests, and access needs in one curated shortlist."
        actions={<Button onClick={charger} variant="secondary">Refresh</Button>}
      />

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      {favoris.length === 0 ? (
        <EmptyState title="No saved jobs yet" description="Save an opportunity from the jobs page and it will appear here." />
      ) : (
        <div className="surface-grid surface-grid-3">
          {favoris.map((favori) => {
            const offre = offresById.get(favori.id_offre);

            return (
              <Card key={favori.id} interactive padding="lg">
                <div className="stack-lg">
                  <div>
                    <p className="badge">Favorite</p>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", fontFamily: "var(--app-heading)" }}>
                      {favori.titre || offre?.titre || "Opportunity"}
                    </h2>
                    <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                      {favori.nom_entreprise || offre?.nom_entreprise || "Company"}
                    </p>
                    {offre ? (
                      <p className="texte-secondaire" style={{ margin: "8px 0 0" }}>
                        {offre.localisation} • {offre.type_poste.toUpperCase()}
                      </p>
                    ) : null}
                  </div>

                  <div className="page-header-actions">
                    <Button variant="secondary" onClick={() => setSelectedOffre(offre ?? null)} disabled={!offre}>
                      View details
                    </Button>
                    <ButtonLink href="/offres" variant="ghost">Open jobs</ButtonLink>
                  </div>

                  <Button variant="danger" onClick={() => retirer(favori.id_offre)}>
                    Remove favorite
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedOffre ? (
        <div
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "rgba(15, 23, 42, 0.52)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setSelectedOffre(null)}
        >
          <Card
            padding="lg"
            style={{ width: "min(100%, 820px)", maxHeight: "min(90vh, 860px)", overflowY: "auto" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-lg">
              <div className="page-header-actions" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="badge" style={{ marginBottom: "12px" }}>Favorite job</p>
                  <h2 style={{ margin: 0, fontSize: "1.45rem", fontFamily: "var(--app-heading)" }}>{selectedOffre.titre}</h2>
                  <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                    {selectedOffre.nom_entreprise || "Company"} • {selectedOffre.localisation}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedOffre(null)}>Close</Button>
              </div>

              <Card tone="accent" padding="md">
                <div className="details-grid">
                  <div className="detail-box">
                    <strong>Contract</strong>
                    <p>{selectedOffre.type_poste.toUpperCase()}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Salary</strong>
                    <p>{formatSalaryAmount(selectedOffre.salaire_min)} - {formatSalaryAmount(selectedOffre.salaire_max)} TND</p>
                  </div>
                  <div className="detail-box">
                    <strong>Experience</strong>
                    <p>{selectedOffre.experience_requise || "Not specified"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Education</strong>
                    <p>{selectedOffre.niveau_etude || "Not specified"}</p>
                  </div>
                </div>
              </Card>

              <div className="detail-box">
                <strong>Description</strong>
                <p>{selectedOffre.description}</p>
              </div>

              {selectedOffre.competences_requises ? (
                <div className="detail-box">
                  <strong>Skills</strong>
                  <p>{selectedOffre.competences_requises}</p>
                </div>
              ) : null}

              <div className="page-header-actions" style={{ justifyContent: "flex-end" }}>
                <ButtonLink href="/offres" variant="secondary">Open jobs</ButtonLink>
                <Button onClick={() => setSelectedOffre(null)}>Done</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
