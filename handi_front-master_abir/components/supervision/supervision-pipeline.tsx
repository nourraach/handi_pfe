"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Eye, MapPin, Search, ShieldAlert, Users, X } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { PipelineCompany, PipelineResponse } from "@/lib/supervision";
import styles from "@/components/supervision/supervision-redesign.module.css";

type CompanyProfile = {
  nom?: string | null;
  email?: string | null;
  telephone?: string | null;
  addresse?: string | null;
  region?: string | null;
  gouvernorat?: string | null;
  delegation?: string | null;
  created_at?: string | null;
  nom_entreprise?: string | null;
  patente?: string | null;
  rne?: string | null;
  statut_validation?: string | null;
  profil_publique?: boolean | null;
  description?: string | null;
  nbr_employe?: number | null;
  nbr_employe_handicape?: number | null;
  secteur_activite?: string | null;
  taille_entreprise?: string | null;
  siret?: string | null;
  site_web?: string | null;
  url_site?: string | null;
  politique_handicap?: string | null;
  contact_rh_nom?: string | null;
  contact_rh_email?: string | null;
  contact_rh_telephone?: string | null;
  logo_url?: string | null;
  statut?: string | null;
};

type CompanyPayload = {
  message?: string;
  donnees?: CompanyProfile | { entreprise?: CompanyProfile; utilisateur?: Partial<CompanyProfile> };
};

const modalStyles = `
  .supervision-company-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2200;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(26, 18, 43, 0.42);
    backdrop-filter: blur(8px);
  }

  .supervision-company-modal-card {
    width: min(1100px, 100%);
    max-height: min(88vh, 980px);
    overflow: auto;
    border-radius: 20px;
    border: 1px solid #e8e1f4;
    background: #ffffff;
    box-shadow: 0 28px 70px rgba(31, 18, 49, 0.24);
    padding: 30px 32px;
  }

  .supervision-company-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .supervision-company-kicker {
    margin: 0;
    color: #6b5b86;
    font-size: 0.86rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .supervision-company-modal-title {
    margin: 0;
    color: #201338;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .supervision-company-modal-email {
    margin: 4px 0 0;
    color: #647188;
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .supervision-company-modal-close {
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
  }

  .supervision-company-modal-close svg {
    width: 20px;
    height: 20px;
  }

  .supervision-company-profile-view {
    display: grid;
    gap: 18px;
  }

  .supervision-company-hero {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    align-items: center;
    gap: 20px;
    padding: 24px;
    border: 1px solid rgba(74, 29, 89, 0.1);
    border-radius: 24px;
    background:
      radial-gradient(circle at 92% 12%, rgba(216, 106, 141, 0.18), transparent 32%),
      linear-gradient(135deg, rgba(74, 29, 89, 0.08), rgba(255, 255, 255, 0.94));
  }

  .supervision-company-logo {
    width: 96px;
    height: 96px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 24px;
    background: linear-gradient(135deg, #5b2d91, #8a63d2);
    color: #fff;
    font-size: 1.8rem;
    font-weight: 900;
    box-shadow: 0 20px 40px rgba(91, 45, 145, 0.2);
  }

  .supervision-company-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .supervision-company-hero h3 {
    margin: 4px 0 12px;
    color: #1f1431;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1.02;
  }

  .supervision-company-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .supervision-company-meta span,
  .supervision-company-values span,
  .supervision-company-contact-list span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .supervision-company-meta span {
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: #4f435f;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .supervision-company-meta svg,
  .supervision-company-kpis svg,
  .supervision-company-values svg,
  .supervision-company-contact-list svg {
    color: #5b2d91;
  }

  .supervision-company-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .supervision-company-kpis article,
  .supervision-company-panel {
    border: 1px solid rgba(74, 29, 89, 0.1);
    border-radius: 18px;
    background: linear-gradient(180deg, #fff, #fcfafd);
    box-shadow: 0 14px 34px rgba(31, 18, 49, 0.05);
  }

  .supervision-company-kpis article {
    min-height: 104px;
    display: grid;
    align-content: center;
    gap: 7px;
    padding: 16px;
  }

  .supervision-company-kpis span {
    color: #756b84;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .supervision-company-kpis strong {
    color: #1f1431;
    font-size: 1.25rem;
    line-height: 1.15;
  }

  .supervision-company-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.82fr);
    gap: 14px;
  }

  .supervision-company-panel {
    padding: 20px;
  }

  .supervision-company-panel h3 {
    margin: 0 0 12px;
    color: #1f1431;
    font-size: 1.05rem;
  }

  .supervision-company-panel p {
    margin: 0;
    color: #625773;
    line-height: 1.58;
  }

  .supervision-company-values {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }

  .supervision-company-values span {
    padding: 9px 11px;
    border-radius: 999px;
    background: rgba(74, 29, 89, 0.08);
    color: #4a1d59;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .supervision-company-team-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
  }

  .supervision-company-team-card > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(135deg, #5b2d91, #8a63d2);
    color: #fff;
    font-weight: 900;
  }

  .supervision-company-team-card strong,
  .supervision-company-job-card strong {
    display: block;
    color: #1f1431;
  }

  .supervision-company-team-card small,
  .supervision-company-job-card span,
  .supervision-company-job-card small,
  .supervision-company-contact-list span {
    color: #6b607c;
  }

  .supervision-company-contact-list {
    display: grid;
    gap: 9px;
    font-size: 0.88rem;
  }

  .supervision-company-job-card {
    display: grid;
    gap: 7px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(74, 29, 89, 0.06);
  }

  .supervision-company-admin-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .supervision-company-admin-strip span {
    display: grid;
    gap: 5px;
    padding: 12px;
    border-radius: 14px;
    background: #f8f5fb;
    color: #786c88;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .supervision-company-admin-strip b {
    color: #1f1431;
    font-size: 0.92rem;
    overflow-wrap: anywhere;
  }
`;

function companyInitials(name?: string | null) {
  const parts = (name || "Company").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function resolveCompanyLogoUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function compactCompanyLocation(company: CompanyProfile) {
  return company.region || company.gouvernorat || company.delegation || company.addresse || "Localisation non renseignee";
}

function companySizeLabel(company: CompanyProfile) {
  if (company.nbr_employe) {
    return `${company.nbr_employe} employes`;
  }
  return company.taille_entreprise || "Taille non renseignee";
}

function supervisionSignal(company: PipelineCompany) {
  if (company.rejected_count > company.hired_count) {
    return { label: "A surveiller", className: styles.tagCritical };
  }
  if (company.applications_count === 0 || company.offers_count === 0) {
    return { label: "A relancer", className: styles.tagWarning };
  }
  return { label: "Stable", className: styles.tagSuccess };
}

export function SupervisionPipeline() {
  const pipeline = useSupervisionQuery<PipelineResponse>("/pipeline");
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [signalFilter, setSignalFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadCompanyProfile = useCallback(async (id: string) => {
    const response = await authenticatedFetch(construireUrlApi(`/api/entreprises/profil/${id}`));
    const data: CompanyPayload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Impossible de charger le profil de l'entreprise.");
    }

    const raw = data.donnees as CompanyProfile | { entreprise?: CompanyProfile; utilisateur?: Partial<CompanyProfile> } | undefined;
    if (raw && "entreprise" in raw && raw.entreprise) {
      return {
        ...(raw.entreprise as CompanyProfile),
        ...(raw.utilisateur || {}),
      } as CompanyProfile;
    }

    return (raw || {}) as CompanyProfile;
  }, []);

  const openView = useCallback(async (id: string) => {
    setSelectedCompany(null);
    setViewError(null);
    try {
      setModalLoading(true);
      setSelectedCompany(await loadCompanyProfile(id));
    } catch (cause) {
      setViewError(cause instanceof Error ? cause.message : "Impossible de charger le profil de l'entreprise.");
    } finally {
      setModalLoading(false);
    }
  }, [loadCompanyProfile]);

  const closeModal = useCallback(() => {
    setSelectedCompany(null);
    setViewError(null);
    setModalLoading(false);
  }, []);

  const regions = useMemo(
    () => Array.from(new Set((pipeline.data?.by_company ?? []).map((company) => company.region).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [pipeline.data],
  );

  const filteredCompanies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return (pipeline.data?.by_company ?? []).filter((company) => {
      const signal = supervisionSignal(company).label;
      const matchesSignal = signalFilter ? signal === signalFilter : true;
      const matchesRegion = regionFilter ? company.region === regionFilter : true;
      const matchesSearch = query
        ? [company.company_name, company.region]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true;
      return matchesSignal && matchesRegion && matchesSearch;
    });
  }, [pipeline.data, regionFilter, searchTerm, signalFilter]);

  const spotlightCompanies = useMemo(() => {
    return filteredCompanies
      .slice()
      .sort((a, b) => (b.applications_count + b.shortlisted_count) - (a.applications_count + a.shortlisted_count))
      .slice(0, 6);
  }, [filteredCompanies]);

  if (pipeline.loading) {
    return <LoadingState title="Chargement du pipeline de supervision" description="Preparation de la visibilite du recrutement entreprise par entreprise." />;
  }

  if (pipeline.error || !pipeline.data) {
    return <EmptyState title="Pipeline indisponible" description={pipeline.error || "Aucune donnee de pipeline n est disponible."} />;
  }

  return (
    <SupervisionShell
      badge="Entreprises"
    >
      <section className={styles.sectionStack}>
        <section className={styles.sectionStack}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Entreprises a prioriser</h2>
            </div>
          </div>

          {spotlightCompanies.length === 0 ? (
            <div className={`${styles.panelCard} ${styles.emptyCard}`}>
              <h3>Aucune entreprise ne correspond aux filtres</h3>
              <p>Ajustez les filtres pour retrouver des structures dans le pipeline de supervision.</p>
            </div>
          ) : (
            <div className={styles.spotlightGrid}>
              {spotlightCompanies.map((company) => {
                const signal = supervisionSignal(company);
                return (
                  <article key={company.company_id} className={styles.companyCard}>
                    <div className={styles.cardTop}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span className={styles.avatarTile}>{companyInitials(company.company_name)}</span>
                        <div className={styles.cardIdentity}>
                          <h3>{company.company_name}</h3>
                          <p>{company.region || "Region non renseignee"}</p>
                        </div>
                      </div>
                      <span className={signal.className}>{signal.label}</span>
                    </div>

                    <div className={styles.cardMetaLine}>
                      <span className={styles.tag}><Building2 size={14} /> {company.offers_count} offres</span>
                      <span className={styles.tag}><Users size={14} /> {company.applications_count} candidatures</span>
                    </div>

                    <div className={styles.cardStatRow}>
                      <div className={styles.cardStat}>
                        <span>Preselection</span>
                        <strong>{company.shortlisted_count}</strong>
                      </div>
                      <div className={styles.cardStat}>
                        <span>Entretiens</span>
                        <strong>{company.interviews_count}</strong>
                      </div>
                      <div className={styles.cardStat}>
                        <span>Refuses</span>
                        <strong>{company.rejected_count}</strong>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.tagSuccess}><MapPin size={14} /> {company.region || "Region"}</span>
                      <button type="button" className={styles.textButton} onClick={() => void openView(company.company_user_id)}>
                        Voir le profil
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={`${styles.tableWrap} ${styles.filtersWrap}`}>
          <div className={`${styles.tableHeader} ${styles.filtersHeader}`}>
            <div className={styles.tableHeaderControls}>
              <label htmlFor="pipeline-signal-filter">Signal</label>
              <select id="pipeline-signal-filter" value={signalFilter} onChange={(event) => setSignalFilter(event.target.value)}>
                <option value="">Tous</option>
                <option value="Stable">Stable</option>
                <option value="A relancer">A relancer</option>
                <option value="A surveiller">A surveiller</option>
              </select>
              <label htmlFor="pipeline-region-filter">Region</label>
              <select id="pipeline-region-filter" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
                <option value="">Toutes</option>
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <label htmlFor="pipeline-search">Recherche</label>
              <div className={styles.searchField}>
                <Search size={15} />
                <input
                  id="pipeline-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Entreprise, region..."
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <div>
              <h4>Registre detaille des entreprises</h4>
              <p>Conservez la lecture ligne par ligne pour l analyse precise et les controles ponctuels.</p>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Region</th>
                <th>Offres</th>
                <th>Candidatures</th>
                <th>Preselection</th>
                <th>Entretiens</th>
                <th>Acceptes</th>
                <th>Refuses</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const signal = supervisionSignal(company);
                return (
                  <tr key={company.company_id}>
                    <td>
                      <div className={styles.tablePrimaryCell}>
                        <strong>{company.company_name}</strong>
                        <button type="button" className={styles.textButton} onClick={() => void openView(company.company_user_id)}>
                          Ouvrir le profil
                        </button>
                      </div>
                    </td>
                    <td>{company.region}</td>
                    <td>{company.offers_count}</td>
                    <td>{company.applications_count}</td>
                    <td>{company.shortlisted_count}</td>
                    <td>{company.interviews_count}</td>
                    <td>{company.hired_count}</td>
                    <td>
                      <div className={styles.tablePrimaryCell}>
                        <strong>{company.rejected_count}</strong>
                        <span className={signal.className}>{signal.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>

      {typeof document !== "undefined" && (selectedCompany || modalLoading || viewError)
        ? createPortal(
            <div className="supervision-company-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
              <style>{modalStyles}</style>
              <div
                className="supervision-company-modal-card"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="supervision-company-modal-header">
                  <div>
                    <p className="supervision-company-kicker">Profil entreprise</p>
                    <h2 className="supervision-company-modal-title">{selectedCompany?.nom_entreprise || selectedCompany?.nom || "Entreprise"}</h2>
                    <p className="supervision-company-modal-email">{selectedCompany?.email || "-"}</p>
                  </div>
                  <button className="supervision-company-modal-close" type="button" onClick={closeModal} aria-label="Fermer">
                    <X aria-hidden="true" />
                  </button>
                </div>
                {modalLoading ? <p>Chargement du profil...</p> : null}
                {viewError ? <p>{viewError}</p> : null}
                {!modalLoading && !viewError && selectedCompany ? (() => {
                  const companyName = selectedCompany.nom_entreprise || selectedCompany.nom || "Entreprise";
                  const logoUrl = resolveCompanyLogoUrl(selectedCompany.logo_url);
                  const location = compactCompanyLocation(selectedCompany);
                  const activeStatus = selectedCompany.statut_validation || selectedCompany.statut || "en_attente";
                  const website = selectedCompany.site_web || selectedCompany.url_site;
                  const employeeCount = selectedCompany.nbr_employe ?? null;
                  const disabledEmployees = selectedCompany.nbr_employe_handicape ?? null;
                  const accessibilityRatio = employeeCount && disabledEmployees !== null
                    ? Math.round((disabledEmployees / Math.max(employeeCount, 1)) * 100)
                    : null;

                  return (
                    <div className="supervision-company-profile-view">
                      <section className="supervision-company-hero">
                        <div className="supervision-company-logo">
                          {logoUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={logoUrl} alt={`Logo ${companyName}`} />
                            </>
                          ) : <span>{companyInitials(companyName)}</span>}
                        </div>
                        <div>
                          <p className="supervision-company-kicker">Profil entreprise</p>
                          <h3>{companyName}</h3>
                          <div className="supervision-company-meta">
                            <span><Building2 size={15} /> {selectedCompany.secteur_activite || "Secteur non renseigne"}</span>
                            <span><MapPin size={15} /> {location}</span>
                            <span><Users size={15} /> {companySizeLabel(selectedCompany)}</span>
                            <span><ShieldAlert size={15} /> {activeStatus}</span>
                          </div>
                        </div>
                      </section>

                      <section className="supervision-company-kpis" aria-label="Statistiques entreprise">
                        <article><Building2 size={18} /><span>Offres actives</span><strong>-</strong></article>
                        <article><Users size={18} /><span>Employes</span><strong>{employeeCount ?? "-"}</strong></article>
                        <article><ShieldAlert size={18} /><span>Inclusion</span><strong>{accessibilityRatio === null ? "-" : `${accessibilityRatio}%`}</strong></article>
                        <article><Eye size={18} /><span>Inscrite le</span><strong>{formatDate(selectedCompany.created_at)}</strong></article>
                      </section>

                      <section className="supervision-company-grid">
                        <article className="supervision-company-panel">
                          <h3>Vue d ensemble</h3>
                          <p>{selectedCompany.description || "Cette entreprise n a pas encore ajoute de presentation publique detaillee."}</p>
                          <div className="supervision-company-values">
                            <span><ShieldAlert size={16} /> Engagement accessibilite</span>
                            <span><Users size={16} /> Diversite et inclusion</span>
                          </div>
                        </article>

                        <article className="supervision-company-panel">
                          <h3>Engagement handicap</h3>
                          <p>{selectedCompany.politique_handicap || "Politique handicap a completer dans le profil entreprise."}</p>
                        </article>

                        <article className="supervision-company-panel">
                          <h3>Equipe recrutement</h3>
                          <div className="supervision-company-team-card">
                            <span>{companyInitials(selectedCompany.contact_rh_nom || selectedCompany.nom)}</span>
                            <div>
                              <strong>{selectedCompany.contact_rh_nom || selectedCompany.nom || "Contact RH"}</strong>
                              <small>{selectedCompany.contact_rh_email || selectedCompany.email || "Email non renseigne"}</small>
                            </div>
                          </div>
                          <div className="supervision-company-contact-list">
                            <span>{selectedCompany.contact_rh_email || selectedCompany.email || "-"}</span>
                            <span>{selectedCompany.contact_rh_telephone || selectedCompany.telephone || "-"}</span>
                            <span>{website || "Site web non renseigne"}</span>
                          </div>
                        </article>

                        <article className="supervision-company-panel">
                          <h3>Postes ouverts</h3>
                          <div className="supervision-company-job-card">
                            <strong>{selectedCompany.secteur_activite || "Recrutement inclusif"}</strong>
                            <span>{companyName}</span>
                            <small>Les offres actives sont consultables dans l espace offres.</small>
                          </div>
                        </article>

                        <article className="supervision-company-panel">
                          <h3>Informations administratives</h3>
                          <div className="supervision-company-admin-strip">
                            <span>Patente <b>{selectedCompany.patente || "-"}</b></span>
                            <span>RNE <b>{selectedCompany.rne || "-"}</b></span>
                            <span>SIRET <b>{selectedCompany.siret || "-"}</b></span>
                            <span>Profil public <b>{selectedCompany.profil_publique ? "Oui" : "Non"}</b></span>
                          </div>
                        </article>
                      </section>
                    </div>
                  );
                })() : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </SupervisionShell>
  );
}
