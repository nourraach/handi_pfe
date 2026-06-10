"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { Building2, MapPin, Sparkles, X } from "lucide-react";
import { ProfilCandidatPublic } from "@/components/profil-candidat-public";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { useAuth } from "@/hooks/useAuth";
import { VisibleCandidate } from "@/lib/supervision";
import { UtilisateurConnecte } from "@/types/api";
import styles from "@/components/supervision/supervision-redesign.module.css";

const modalStyles = `
  .supervision-candidate-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(26, 18, 43, 0.42);
    backdrop-filter: blur(8px);
  }

  .supervision-candidate-modal-card {
    width: min(1240px, 100%);
    max-height: min(90vh, 1020px);
    overflow: auto;
    border-radius: 22px;
    border: 1px solid #e8e1f4;
    background: #ffffff;
    box-shadow: 0 28px 70px rgba(31, 18, 49, 0.24);
    padding: 28px 30px;
  }

  .supervision-candidate-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .supervision-candidate-kicker {
    margin: 0 0 6px;
    color: #6b5b86;
    font-size: 0.86rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .supervision-candidate-modal-title {
    margin: 0;
    color: #201338;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.18;
  }

  .supervision-candidate-modal-subtitle {
    margin: 6px 0 0;
    color: #647188;
    font-size: 1rem;
    font-weight: 500;
  }

  .supervision-candidate-modal-close {
    width: 48px;
    height: 48px;
    border-radius: 18px;
    border: 1px solid #d8cde9;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f4eefb;
    color: #3d1a67;
    flex: 0 0 auto;
  }

  .supervision-candidate-modal-close svg {
    width: 20px;
    height: 20px;
  }

  .supervision-candidate-modal-body {
    min-height: 220px;
  }
`;

function buildReadonlyCandidateUser(candidate: VisibleCandidate): UtilisateurConnecte {
  return {
    id_utilisateur: candidate.candidate_user_id,
    nom: candidateDisplayName(candidate),
    email: "",
    role: "candidat",
    statut: "actif",
    region: candidate.region,
  };
}

function compactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function candidateDisplayName(candidate: VisibleCandidate) {
  return candidate.candidate_name?.trim() || candidate.candidate_reference?.trim() || "Candidat";
}

function candidateInitials(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function candidateCardKey(candidate: VisibleCandidate, index: number) {
  return [
    candidate.application_id,
    candidate.candidate_user_id,
    candidate.candidate_reference,
    candidate.offer_title,
    candidate.company_name,
    index,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("-");
}

export function CandidatesVisibilityView() {
  const { utilisateur } = useAuth();
  const candidates = useSupervisionQuery<VisibleCandidate[]>("/candidates");
  const [selectedCandidate, setSelectedCandidate] = useState<VisibleCandidate | null>(null);
  const [stageFilter, setStageFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedRole = (utilisateur?.role || "").trim().toLowerCase();
  const visibleStages = normalizedRole === "aneti" ? ["hired", "shortlisted"] : ["hired"];

  const visibleCandidates = useMemo(
    () => (candidates.data ?? []).filter((candidate) => visibleStages.includes(candidate.stage)),
    [candidates.data, visibleStages],
  );

  const selectedUser = useMemo(
    () => (selectedCandidate ? buildReadonlyCandidateUser(selectedCandidate) : null),
    [selectedCandidate],
  );

  const regions = useMemo(
    () => Array.from(new Set(visibleCandidates.map((candidate) => candidate.region).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [visibleCandidates],
  );

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return visibleCandidates.filter((candidate) => {
      const matchesStage = stageFilter ? candidate.stage === stageFilter : true;
      const matchesRegion = regionFilter ? candidate.region === regionFilter : true;
      const matchesSearch = query
        ? [candidateDisplayName(candidate), candidate.company_name, candidate.offer_title, candidate.region]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true;
      return matchesStage && matchesRegion && matchesSearch;
    });
  }, [regionFilter, searchTerm, stageFilter, visibleCandidates]);

  const closeModal = useCallback(() => {
    setSelectedCandidate(null);
  }, []);

  if (candidates.loading) {
    return <LoadingState title="Chargement de la vue candidats" description="Preparation de la visibilite des profils en preselection et des profils recrutes." />;
  }

  if (candidates.error || !candidates.data) {
    return <EmptyState title="Candidats indisponibles" description={candidates.error || "Les profils visibles n ont pas pu etre charges."} />;
  }

  return (
    <SupervisionShell>
      <section className={styles.sectionStack}>
        <section className={`${styles.tableWrap} ${styles.filtersWrap}`}>
          <div className={`${styles.tableHeader} ${styles.filtersHeader}`}>
            <div className={styles.tableHeaderControls}>
              <label htmlFor="candidate-stage-filter">Statut</label>
              <select id="candidate-stage-filter" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                <option value="">Tous</option>
                {normalizedRole === "aneti" ? <option value="shortlisted">Preselectionnes</option> : null}
                <option value="hired">Recrutes</option>
              </select>
              <label htmlFor="candidate-region-filter">Region</label>
              <select id="candidate-region-filter" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
                <option value="">Toutes</option>
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <label htmlFor="candidate-search">Recherche</label>
              <div className={styles.searchField}>
                <Search size={15} />
                <input
                  id="candidate-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nom, entreprise, offre..."
                />
              </div>
            </div>
          </div>
        </section>

        {filteredCandidates.length === 0 ? (
          <div className={`${styles.panelCard} ${styles.emptyCard}`}>
            <h3>Aucun candidat ne correspond aux filtres</h3>
            <p>Ajustez les filtres pour retrouver des profils visibles dans le pipeline entreprise.</p>
          </div>
        ) : (
          <div className={styles.spotlightGrid}>
            {filteredCandidates.map((candidate, index) => {
              const displayName = candidateDisplayName(candidate);

              return (
                <article key={candidateCardKey(candidate, index)} className={styles.candidateCard}>
                  <div className={styles.cardTop}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span className={styles.avatarTile}>{candidateInitials(displayName)}</span>
                      <div className={styles.cardIdentity}>
                        <h3>{displayName}</h3>
                        <p>{candidate.offer_title}</p>
                      </div>
                    </div>
                    <span className={candidate.stage === "hired" ? styles.tagSuccess : styles.matchBadge}>
                      <Sparkles size={14} /> {candidate.stage === "hired" ? "Recrute" : "Shortliste"}
                    </span>
                  </div>

                  <div className={styles.cardMetaLine}>
                    <span className={styles.tag}><Building2 size={14} /> {candidate.company_name}</span>
                    <span className={styles.tag}><MapPin size={14} /> {candidate.region}</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.sectionSubtle}>Mise a jour le {compactDate(candidate.updated_at)}</span>
                    <button type="button" className={styles.textButton} onClick={() => setSelectedCandidate(candidate)}>
                      Voir le profil
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {typeof document !== "undefined" && selectedCandidate && selectedUser
        ? createPortal(
            <div className="supervision-candidate-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
              <style>{modalStyles}</style>
              <div className="supervision-candidate-modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="supervision-candidate-modal-header">
                  <div>
                    <p className="supervision-candidate-kicker">Profil candidat</p>
                    <h2 className="supervision-candidate-modal-title">{candidateDisplayName(selectedCandidate)}</h2>
                    <p className="supervision-candidate-modal-subtitle">
                      {selectedCandidate.offer_title} · {selectedCandidate.company_name}
                    </p>
                  </div>
                  <button className="supervision-candidate-modal-close" type="button" onClick={closeModal} aria-label="Fermer">
                    <X aria-hidden="true" />
                  </button>
                </div>
                <div className="supervision-candidate-modal-body">
                  <ProfilCandidatPublic
                    utilisateur={selectedUser}
                    subtitle={`${selectedCandidate.offer_title} · ${selectedCandidate.company_name}`}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </SupervisionShell>
  );
}
