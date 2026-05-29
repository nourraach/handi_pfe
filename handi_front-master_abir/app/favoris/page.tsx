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

type FavoritesStats = {
  total: number;
  companies: number;
  latestSavedLabel: string;
  latestSavedValue: string;
};

const tndNumberFormatter = new Intl.NumberFormat("fr-TN", {
  maximumFractionDigits: 0,
});

const favoritePageStyles = `
  .favorites-page {
    display: grid;
    gap: 22px;
  }

  .favorites-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.85fr);
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

  .favorites-hero-actions {
    display: grid;
    justify-items: stretch;
    gap: 12px;
  }

  .favorites-hero-actions__row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .favorites-stat {
    padding: 16px 18px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: var(--shadow-1);
  }

  .favorites-stat__label {
    margin: 0 0 6px;
    color: var(--app-muted);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .favorites-stat__value {
    margin: 0;
    color: var(--app-text);
    font-family: var(--app-heading);
    font-size: 1.35rem;
    line-height: 1.1;
  }

  .favorites-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(290px, 0.9fr);
    gap: 18px;
    align-items: start;
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

  .favorites-aside {
    position: sticky;
    top: 16px;
    display: grid;
    gap: 14px;
  }

  .favorites-panel {
    display: grid;
    gap: 14px;
  }

  .favorites-panel__title {
    margin: 0;
    color: var(--app-text);
    font-family: var(--app-heading);
    font-size: 1.05rem;
  }

  .favorites-panel__subtitle {
    margin: 6px 0 0;
    color: var(--app-muted);
    line-height: 1.5;
  }

  .favorites-shortcuts {
    display: grid;
    gap: 10px;
  }

  .favorites-shortcut {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
  }

  .favorites-shortcut strong {
    display: block;
    color: var(--app-text);
    font-size: 0.95rem;
  }

  .favorites-shortcut span {
    color: var(--app-muted);
    font-size: 0.86rem;
  }

  .favorites-recent {
    display: grid;
    gap: 10px;
  }

  .favorites-recent__item {
    padding: 12px 14px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
  }

  .favorites-recent__title {
    margin: 0;
    color: var(--app-text);
    font-size: 0.95rem;
    font-weight: 700;
  }

  .favorites-recent__meta {
    margin: 6px 0 0;
    color: var(--app-muted);
    font-size: 0.86rem;
    line-height: 1.45;
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

    .favorites-layout {
      grid-template-columns: 1fr;
    }

    .favorites-aside {
      position: static;
    }

    .favorites-hero-actions__row {
      grid-template-columns: 1fr;
    }

    .favorites-toolbar {
      grid-template-columns: 1fr;
    }

    .favorite-card__actions {
      min-width: 0;
    }
  }
`;

const formatSalaryAmount = (value: number) => tndNumberFormatter.format(value);

const formatSalaryRange = (offre?: OffrePublique) => {
  if (!offre) {
    return null;
  }
  return `${formatSalaryAmount(offre.salaire_min)} - ${formatSalaryAmount(offre.salaire_max)} TND`;
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

  const favoriteCards = useMemo<FavoriteCardData[]>(
    () =>
      favoris.map((favori) => {
        const offre = offresById.get(favori.id_offre);
        return {
          favori,
          offre,
          title: favori.titre || offre?.titre || "Opportunity",
          company: favori.nom_entreprise || offre?.nom_entreprise || "Company",
          location: offre?.localisation || "Location not specified",
          contract: offre?.type_poste ? offre.type_poste.toUpperCase() : "Contract not specified",
        };
      }),
    [favoris, offresById],
  );

  const favoritesStats = useMemo<FavoritesStats>(() => {
    const companies = new Set(favoriteCards.map((item) => item.company).filter(Boolean));
    const dates = favoriteCards
      .map((item) => item.favori.created_at)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    const latest = dates[0];
    return {
      total: favoriteCards.length,
      companies: companies.size,
      latestSavedLabel: latest ? latest.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "No recent save",
      latestSavedValue: latest
        ? `Saved ${latest.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
        : "Nothing recent",
    };
  }, [favoriteCards]);

  const recentFavorites = useMemo(
    () =>
      [...favoriteCards]
        .sort((a, b) => {
          const left = a.favori.created_at ? new Date(a.favori.created_at).getTime() : 0;
          const right = b.favori.created_at ? new Date(b.favori.created_at).getTime() : 0;
          return right - left;
        })
        .slice(0, 3),
    [favoriteCards],
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
    return <LoadingState title="Loading your favorites" description="Collecting saved opportunities from your workspace." />;
  }

  return (
    <div className="app-page favorites-page">
      <style>{favoritePageStyles}</style>

      <header className="favorites-hero">
        <div className="favorites-hero__content">
          <p className="favorites-eyebrow">Saved roles</p>
          <h1 className="favorites-title">Favorite jobs</h1>
          <p className="favorites-subtitle">
            Keep the jobs you like in one simple list, then come back when you are ready to apply.
          </p>
        </div>
        <div className="favorites-hero-actions">
          <div className="favorites-hero-actions__row">
            <div className="favorites-stat">
              <p className="favorites-stat__label">Saved</p>
              <p className="favorites-stat__value">{favoritesStats.total}</p>
            </div>
            <div className="favorites-stat">
              <p className="favorites-stat__label">Companies</p>
              <p className="favorites-stat__value">{favoritesStats.companies}</p>
            </div>
            <div className="favorites-stat">
              <p className="favorites-stat__label">Latest save</p>
              <p className="favorites-stat__value">{favoritesStats.latestSavedLabel}</p>
            </div>
          </div>
          <Button onClick={charger} variant="secondary">Refresh</Button>
        </div>
      </header>

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      {favoris.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          description="Save an opportunity from the jobs page and it will appear here."
          action={<ButtonLink href="/offres">Browse jobs</ButtonLink>}
        />
      ) : (
        <div className="favorites-layout">
          <div className="favorites-column">
            <div className="favorites-toolbar">
              <label className="favorites-search">
                <span aria-hidden="true">Search</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search favorite jobs"
                  aria-label="Search favorite jobs"
                />
              </label>
              <div className="favorites-count">
                {filteredFavorites.length} of {favoris.length} saved
              </div>
            </div>

            {filteredFavorites.length === 0 ? (
              <EmptyState
                title="No favorites match your search"
                description="Try another job title, company, location, or contract type."
                action={<Button variant="secondary" onClick={() => setSearch("")}>Clear search</Button>}
              />
            ) : (
              <div className="favorites-list">
                {filteredFavorites.map(({ favori, offre, title, company, location, contract }) => (
                  <article key={favori.id} className="favorite-card">
                    <div className="favorite-card__main">
                      <div className="favorite-card__topline">
                        <span className="favorite-card__badge">Favorite</span>
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
                        View details
                      </Button>
                      <ButtonLink href="/offres" variant="ghost">Open jobs</ButtonLink>
                      <Button variant="danger" onClick={() => retirer(favori.id_offre)}>
                        Remove
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="favorites-aside">
            <Card padding="lg" className="favorites-panel">
              <div>
                <p className="favorites-eyebrow">Quick view</p>
                <h2 className="favorites-panel__title">Saved jobs at a glance</h2>
                <p className="favorites-panel__subtitle">
                  A compact summary of what you saved, where it comes from, and what to do next.
                </p>
              </div>

              <div className="details-grid">
                <div className="detail-box">
                  <strong>Total saved</strong>
                  <p>{favoritesStats.total}</p>
                </div>
                <div className="detail-box">
                  <strong>Companies</strong>
                  <p>{favoritesStats.companies}</p>
                </div>
                <div className="detail-box">
                  <strong>Latest save</strong>
                  <p>{favoritesStats.latestSavedValue}</p>
                </div>
                <div className="detail-box">
                  <strong>Search filter</strong>
                  <p>{search.trim() ? search : "All saved jobs"}</p>
                </div>
              </div>

              <div className="favorites-shortcuts">
                <div className="favorites-shortcut">
                  <div>
                    <strong>Browse jobs</strong>
                    <span>Find new roles to save.</span>
                  </div>
                  <ButtonLink href="/offres" variant="secondary">Open</ButtonLink>
                </div>
                <div className="favorites-shortcut">
                  <div>
                    <strong>Clear filters</strong>
                    <span>Reset the current search.</span>
                  </div>
                  <Button variant="ghost" onClick={() => setSearch("")}>Reset</Button>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="favorites-panel">
              <div>
                <p className="favorites-eyebrow">Recently saved</p>
                <h2 className="favorites-panel__title">Latest additions</h2>
              </div>

              <div className="favorites-recent">
                {recentFavorites.length === 0 ? (
                  <p className="favorites-panel__subtitle">No recent favorites to display.</p>
                ) : (
                  recentFavorites.map((item) => (
                    <div key={item.favori.id} className="favorites-recent__item">
                      <p className="favorites-recent__title">{item.title}</p>
                      <p className="favorites-recent__meta">
                        {item.company} - {item.location}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </aside>
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
                  <p className="badge" style={{ marginBottom: "12px" }}>Favorite job</p>
                  <h2 style={{ margin: 0, fontSize: "1.45rem", fontFamily: "var(--app-heading)" }}>{selectedOffre.titre}</h2>
                  <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                    {selectedOffre.nom_entreprise || "Company"} - {selectedOffre.localisation}
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
