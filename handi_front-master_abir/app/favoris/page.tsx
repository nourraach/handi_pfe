"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
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

type FavoriteCardData = {
  favori: FavoriItem;
  offre?: OffrePublique;
  title: string;
  company: string;
  location: string;
  contract: string;
};

const tndNumberFormatter = new Intl.NumberFormat("fr-TN", {
  maximumFractionDigits: 0,
});

const parseSalaryValue = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const favoritePageStyles = `
  .favorites-page {
    display: grid;
    gap: 22px;
  }

  .favorites-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    align-items: end;
    padding: 6px 0 0;
  }

  .favorites-eyebrow {
    margin: 0 0 8px;
    color: var(--app-primary);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .favorites-title {
    margin: 0;
    color: var(--app-text);
    font-family: var(--app-heading);
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.05;
  }

  .favorites-subtitle {
    max-width: 620px;
    margin: 10px 0 0;
    color: var(--app-muted);
    font-size: 1rem;
    line-height: 1.6;
  }

  .favorites-layout {
    display: block;
  }

  .favorites-column {
    display: grid;
    gap: 14px;
  }

  .favorites-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 16px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: var(--shadow-1);
  }

  .favorites-search {
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.12);
    border-radius: 8px;
    background: #fff;
  }

  .favorites-search span {
    color: var(--app-primary);
    font-size: 1.05rem;
  }

  .favorites-search input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--app-text);
    font: inherit;
  }

  .favorites-count {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    border-radius: 8px;
    background: rgba(var(--app-primary-rgb), 0.08);
    color: var(--app-primary);
    font-weight: 800;
    white-space: nowrap;
  }

  .favorites-list {
    display: grid;
    gap: 16px;
  }

  .favorite-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: stretch;
    padding: 18px 18px 18px 20px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: var(--shadow-1);
  }

  .favorite-card__main {
    min-width: 0;
  }

  .favorite-card__topline {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .favorite-card__badge {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(var(--app-primary-rgb), 0.09);
    color: var(--app-primary);
    font-size: 0.78rem;
    font-weight: 800;
  }

  .favorite-card__date {
    color: var(--app-muted);
    font-size: 0.86rem;
  }

  .favorite-card__title {
    margin: 0;
    color: var(--app-text);
    font-family: var(--app-heading);
    font-size: 1.28rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .favorite-card__company {
    margin: 8px 0 0;
    color: var(--app-muted);
    line-height: 1.5;
  }

  .favorite-card__meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .favorite-card__chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    color: #51496c;
    background: rgba(255, 255, 255, 0.86);
    font-size: 0.86rem;
    font-weight: 700;
  }

  .favorite-card__actions {
    display: grid;
    justify-items: stretch;
    gap: 10px;
    min-width: 180px;
    align-content: center;
  }

  .favorite-detail-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(6px);
  }

  .favorite-detail-card {
    width: min(100%, 780px);
    max-height: min(90vh, 820px);
    overflow-y: auto;
  }

  .favorite-detail-head {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  @media (max-width: 760px) {
    .favorites-hero,
    .favorite-card {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .favorites-hero {
      display: grid;
    }

    .favorites-toolbar {
      grid-template-columns: 1fr;
    }

    .favorite-card__actions {
      min-width: 0;
    }
  }
`;

const formatSalaryAmount = (value: unknown) => {
  const parsed = parseSalaryValue(value);
  return parsed === null ? null : tndNumberFormatter.format(parsed);
};

const formatSalaryRange = (offre?: OffrePublique) => {
  if (!offre) {
    return null;
  }
  const min = formatSalaryAmount(offre.salaire_min);
  const max = formatSalaryAmount(offre.salaire_max);

  if (!min && !max) {
    return "Salaire non communiqué";
  }

  if (min && max) {
    return `${min} - ${max} TND`;
  }

  return `${min || max} TND`;
};

const formatDate = (date?: string) => {
  if (!date) {
    return "Saved";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Saved";
  }

  return `Saved ${parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })}`;
};

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
  const [search, setSearch] = useState("");
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
        throw new Error(favorisData.message || "Impossible de charger les offres enregistrees.");
      }

      setFavoris(Array.isArray(favorisData.donnees) ? favorisData.donnees : []);
      setOffres(Array.isArray(offresData.donnees?.offres) ? offresData.donnees.offres : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger les offres enregistrees.");
    } finally {
      setLoading(false);
    }
  };

  const retirer = async (idOffre: string) => {
    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/favoris/${idOffre}`), { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Impossible de retirer cette offre des enregistrements.");
      }
      setFavoris((prev) => prev.filter((f) => f.id_offre !== idOffre));
      if (selectedOffre?.id_offre === idOffre) {
        setSelectedOffre(null);
      }
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de retirer cette offre des enregistrements.");
    }
  };

  const offresById = useMemo(
    () => new Map(offres.map((offre) => [offre.id_offre, offre])),
    [offres],
  );

  const favoriteCards = useMemo<FavoriteCardData[]>(
    () =>
      favoris.map((favori) => {
        const offre = offresById.get(favori.id_offre);
        return {
          favori,
          offre,
          title: favori.titre || offre?.titre || "Offre",
          company: favori.nom_entreprise || offre?.nom_entreprise || "Entreprise",
          location: offre?.localisation || "Localisation non renseignée",
          contract: offre?.type_poste ? offre.type_poste.toUpperCase() : "Contrat non renseigné",
        };
      }),
    [favoris, offresById],
  );

  const filteredFavorites = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return favoriteCards;
    }

    return favoriteCards.filter((item) =>
      [item.title, item.company, item.location, item.contract].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [favoriteCards, search]);

  if (loading) {
    return <LoadingState title="Chargement de vos offres enregistrées" description="Récupération des offres sauvegardées dans votre espace." />;
  }

  return (
    <div className="app-page favorites-page">
      <style>{favoritePageStyles}</style>

      <header className="favorites-hero">
        <div className="favorites-hero__content">
          <p className="favorites-eyebrow">Offres enregistrées</p>
          <h1 className="favorites-title">Offres enregistrées</h1>
        </div>
      </header>

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      {favoris.length === 0 ? (
        <EmptyState
          title="Aucune offre enregistrée"
          description="Enregistrez une offre depuis la page des offres et elle apparaîtra ici."
          action={<ButtonLink href="/offres">Voir les offres</ButtonLink>}
        />
      ) : (
        <div className="favorites-layout">
          <div className="favorites-column">
            <div className="favorites-toolbar">
              <label className="favorites-search">
                <span aria-hidden="true">Rechercher</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher dans les offres enregistrées"
                  aria-label="Rechercher dans les offres enregistrées"
                />
              </label>
              <div className="favorites-count">
                {filteredFavorites.length} sur {favoris.length} enregistrées
              </div>
            </div>

            {filteredFavorites.length === 0 ? (
              <EmptyState
                title="Aucune offre ne correspond à votre recherche"
                description="Essayez un autre intitulé, une autre entreprise, une localisation ou un type de contrat."
                action={<Button variant="secondary" onClick={() => setSearch("")}>Effacer la recherche</Button>}
              />
            ) : (
              <div className="favorites-list">
                {filteredFavorites.map(({ favori, offre, title, company, location, contract }) => (
                  <article key={favori.id} className="favorite-card">
                    <div className="favorite-card__main">
                      <div className="favorite-card__topline">
                        <span className="favorite-card__badge">Enregistrée</span>
                        <span className="favorite-card__date">{formatDate(favori.created_at)}</span>
                      </div>

                      <h2 className="favorite-card__title">{title}</h2>
                      <p className="favorite-card__company">{company}</p>

                      <div className="favorite-card__meta">
                        <span className="favorite-card__chip">{location}</span>
                        <span className="favorite-card__chip">{contract}</span>
                        {formatSalaryRange(offre) ? <span className="favorite-card__chip">{formatSalaryRange(offre)}</span> : null}
                      </div>
                    </div>

                    <div className="favorite-card__actions">
                      <Button variant="secondary" onClick={() => setSelectedOffre(offre ?? null)} disabled={!offre}>
                        Voir les détails
                      </Button>
                      <ButtonLink href="/offres" variant="ghost">Voir les offres</ButtonLink>
                      <Button variant="danger" onClick={() => retirer(favori.id_offre)}>
                        Supprimer
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
      {selectedOffre ? (
        <div
          className="favorite-detail-overlay"
          aria-modal="true"
          role="dialog"
          onClick={() => setSelectedOffre(null)}
        >
          <Card
            className="favorite-detail-card"
            padding="lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack-lg">
              <div className="favorite-detail-head">
                <div>
                  <p className="badge" style={{ marginBottom: "12px" }}>Offre enregistrée</p>
                  <h2 style={{ margin: 0, fontSize: "1.45rem", fontFamily: "var(--app-heading)" }}>{selectedOffre.titre}</h2>
                  <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                    {selectedOffre.nom_entreprise || "Entreprise"} - {selectedOffre.localisation}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedOffre(null)} aria-label="Fermer">✕</Button>
              </div>

              <Card tone="accent" padding="md">
                <div className="details-grid">
                  <div className="detail-box">
                    <strong>Contrat</strong>
                    <p>{selectedOffre.type_poste.toUpperCase()}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Salaire</strong>
                    <p>{formatSalaryRange(selectedOffre) || "Salaire non communiqué"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Expérience</strong>
                    <p>{selectedOffre.experience_requise || "Non renseignée"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Formation</strong>
                    <p>{selectedOffre.niveau_etude || "Non renseignée"}</p>
                  </div>
                </div>
              </Card>

              <div className="detail-box">
                <strong>Description</strong>
                <p>{selectedOffre.description}</p>
              </div>

              {selectedOffre.competences_requises ? (
                <div className="detail-box">
                  <strong>Compétences</strong>
                  <p>{selectedOffre.competences_requises}</p>
                </div>
              ) : null}

              <div className="page-header-actions" style={{ justifyContent: "flex-end" }}>
                <ButtonLink href="/offres" variant="secondary">Voir les offres</ButtonLink>
                <Button onClick={() => setSelectedOffre(null)}>Fermer</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
