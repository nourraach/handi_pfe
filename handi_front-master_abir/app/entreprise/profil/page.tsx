"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { PageHeader, LoadingState } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { construireUrlApi } from "@/lib/config";
import { authenticatedFetch } from "@/lib/auth-utils";
import { Building2, CheckCircle2, FileText, Globe2, Mail, MapPin, Phone, ShieldCheck, Users } from "lucide-react";

type ProfilEntreprise = {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  nom_entreprise: string;
  patente: string;
  rne: string;
  site_web?: string;
  description?: string;
  secteur_activite?: string;
  taille_entreprise?: string;
  politique_handicap?: string;
  contact_rh_nom?: string;
  contact_rh_email?: string;
  contact_rh_telephone?: string;
  logo_url?: string;
  profil_publique?: boolean;
  patente_url?: string;
  rne_url?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function construireUrlFichier(path?: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  try {
    const origin = new URL(construireUrlApi("/api/sante")).origin;
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return path;
  }
}

function validerLogoEntreprise(file: File) {
  const mimeAutorises = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);
  const tailleMax = 5 * 1024 * 1024;
  if (!mimeAutorises.has(file.type)) {
    throw new Error("Logo invalide. Formats autorises: PNG, JPG, WEBP ou SVG.");
  }
  if (file.size > tailleMax) {
    throw new Error("Logo trop volumineux. Taille maximale: 5 MB.");
  }
}

type Membre = {
  id: string;
  nom: string;
  email: string;
  role?: string;
  telephone?: string;
};

export default function ProfilEntreprisePageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <ProfilEntreprisePage />
    </RouteProtegee>
  );
}

function ProfilEntreprisePage() {
  const { utilisateur } = useAuth();
  const [profil, setProfil] = useState<ProfilEntreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [nouveauMembre, setNouveauMembre] = useState<Membre>({
    id: "",
    nom: "",
    email: "",
    role: "",
    telephone: "",
  });
  const [patenteFile, setPatenteFile] = useState<File | null>(null);
  const [rneFile, setRneFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoActionLoading, setLogoActionLoading] = useState(false);
  const industryOptions = [
    "Technology / Software",
    "Healthcare / Medical",
    "Finance / Banking",
    "Education / Training",
    "Retail / Sales",
    "Industry / Manufacturing",
    "Services / Consulting",
    "Transport / Logistics",
    "Tourism / Hospitality",
    "Agriculture / Food",
    "Other",
  ];

  const creerProfilParDefaut = (): ProfilEntreprise => ({
    nom: utilisateur?.nom || "",
    email: utilisateur?.email || "",
    telephone: "",
    addresse: "",
    nom_entreprise: "",
    patente: "",
    rne: "",
    site_web: "",
    description: "",
    secteur_activite: "",
    taille_entreprise: "",
    politique_handicap: "",
    contact_rh_nom: "",
    contact_rh_email: "",
    contact_rh_telephone: "",
    logo_url: "",
    profil_publique: true,
    patente_url: "",
    rne_url: "",
  });

  const chargerDonneesInitiales = useEffectEvent(() => {
    setProfil((current) => current ?? creerProfilParDefaut());
    void chargerProfil();
    void chargerMembres();
  });

  useEffect(() => {
    if (!utilisateur) {
      return;
    }
    chargerDonneesInitiales();
  }, [utilisateur]);

  const chargerProfil = async () => {
    try {
      setLoading(true);
      setErreur(null);
      if (!utilisateur) throw new Error("Session expiree.");

      const res = await authenticatedFetch(construireUrlApi(`/api/entreprises/profil/${utilisateur.id_utilisateur}`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Impossible de charger le profil entreprise.");

      const profilePayload = data.donnees || {};
      const utilisateurProfil = profilePayload.utilisateur || profilePayload;
      const entrepriseProfil = profilePayload.entreprise || profilePayload;

      setProfil({
        ...creerProfilParDefaut(),
        nom: utilisateurProfil?.nom || "",
        email: utilisateurProfil?.email || utilisateur?.email || "",
        telephone: utilisateurProfil?.telephone || "",
        addresse: utilisateurProfil?.addresse || "",
        nom_entreprise: entrepriseProfil?.nom_entreprise || "",
        patente: entrepriseProfil?.patente || "",
        rne: entrepriseProfil?.rne || entrepriseProfil?.siret || "",
        patente_url: entrepriseProfil?.patente,
        rne_url: entrepriseProfil?.rne,
        site_web: entrepriseProfil?.site_web || entrepriseProfil?.url_site || "",
        description: entrepriseProfil?.description || "",
        secteur_activite: entrepriseProfil?.secteur_activite || "",
        taille_entreprise: entrepriseProfil?.taille_entreprise || "",
        politique_handicap: entrepriseProfil?.politique_handicap || "",
        contact_rh_nom: entrepriseProfil?.contact_rh_nom || "",
        contact_rh_email: entrepriseProfil?.contact_rh_email || "",
        contact_rh_telephone: entrepriseProfil?.contact_rh_telephone || "",
        logo_url: entrepriseProfil?.logo_url || "",
        profil_publique: entrepriseProfil?.profil_publique ?? true,
      });
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Impossible de charger le profil entreprise."));
    } finally {
      setLoading(false);
    }
  };

  const chargerMembres = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/membres"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible de charger les membres du compte.");
      setMembres(data.donnees || []);
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Impossible de charger les membres du compte."));
    }
  };

  const enregistrer = async () => {
    if (!profil) return;

    setMessage(null);
    setErreur(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/profil"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profil, profil_publique: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible d'enregistrer les modifications.");
      setMessage("Profil mis a jour avec succes.");
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Impossible d'enregistrer les modifications."));
    }
  };

  const enregistrerDocuments = async ({ removeLogo = false }: { removeLogo?: boolean } = {}) => {
    try {
      setLogoActionLoading(true);
      if (!patenteFile && !rneFile && !logoFile && !removeLogo) {
        setErreur("Ajoutez une patente, un RNE ou un logo avant le televersement.");
        return;
      }

      const formData = new FormData();
      if (patenteFile) formData.append("patente", patenteFile);
      if (rneFile) formData.append("rne", rneFile);
      if (logoFile) formData.append("logo", logoFile);
      if (removeLogo) formData.append("remove_logo", "true");

      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/profil/documents"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible de televerser les documents.");

      setMessage(removeLogo ? "Logo de l'entreprise supprime." : "Documents mis a jour.");
      setPatenteFile(null);
      setRneFile(null);
      setLogoFile(null);
      await chargerProfil();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Impossible de televerser les documents."));
    } finally {
      setLogoActionLoading(false);
    }
  };

  const creerMembre = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/membres"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nouveauMembre, id: undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible d'ajouter le membre.");

      setNouveauMembre({ id: "", nom: "", email: "", role: "", telephone: "" });
      setMessage("Membre ajoute.");
      void chargerMembres();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Impossible d'ajouter le membre."));
    }
  };

  const supprimerMembre = async (id: string) => {
    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/entreprises/membres/${id}`), {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(data.message || "Impossible de supprimer le membre.");
      }

      setMessage("Membre supprime.");
      void chargerMembres();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Impossible de supprimer le membre."));
    }
  };

  const emptyValue = "Not provided";

  const renderInput = (
    label: string,
    value: string,
    onChange: (nextValue: string) => void,
    options?: {
      type?: string;
      textarea?: boolean;
      fullWidth?: boolean;
      placeholder?: string;
    },
  ) => (
    <div className={`groupe-champ ${options?.fullWidth ? "profile-field-span-full" : ""}`.trim()}>
      <label>{label}</label>
      {options?.textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={options.placeholder}
          className="champ-zone"
        />
      ) : (
        <input
          type={options?.type || "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={options?.placeholder}
          className="champ"
        />
      )}
    </div>
  );

  if (!utilisateur) {
    return null;
  }

  if (loading && !profil) {
    return (
      <div className="app-page enterprise-profile-page">
        <PageHeader
          badge="Espace profil"
          title="Profil entreprise"
          description="Gerez l'identite de votre entreprise, vos references legales et vos contacts RH."
        />
        <Card className="profile-surface">
          <LoadingState title="Chargement du profil entreprise" description="Nous preparons votre espace entreprise." />
        </Card>
      </div>
    );
  }

  const profilCourant = profil ?? creerProfilParDefaut();

  const companyName = profilCourant.nom_entreprise || utilisateur.nom || "Entreprise";
  const companyInitial = companyName.slice(0, 1).toUpperCase() || "E";
  const companyLocation = profilCourant.addresse || "Adresse non renseignee";
  const companyWebsite = profilCourant.site_web || "Site web non renseigne";
  const rhContactName = profilCourant.contact_rh_nom || profilCourant.nom || "Contact RH";
  const rhContactEmail = profilCourant.contact_rh_email || profilCourant.email || utilisateur.email || emptyValue;
  const rhContactPhone = profilCourant.contact_rh_telephone || profilCourant.telephone || emptyValue;
  const uploadedDocumentsCount = [profilCourant.patente_url || profilCourant.patente, profilCourant.rne_url || profilCourant.rne, profilCourant.logo_url].filter(Boolean).length;
  const companySubtitle = [profilCourant.secteur_activite, profilCourant.taille_entreprise].filter(Boolean).join(" • ") || "Compte entreprise";

  return (
    <div className="app-page enterprise-profile-page">
      <PageHeader
        badge="Espace profil"
        title="Profil entreprise"
        description="Gerez l'identite de votre entreprise, vos references legales et vos contacts RH."
      />

      <div className="stack-lg enterprise-profile-content">
        <Card tone="accent" padding="lg" className="profile-overview-card">
          <div className="profile-surface-head">
            <div className="page-header-copy">
              <p className="badge">Profil entreprise</p>
              <h2 className="page-title page-title-sm">{companyName}</h2>
              <p className="page-description">{companySubtitle}</p>
            </div>
            <div className="profile-surface-actions">
              <Button onClick={enregistrer}>Enregistrer</Button>
            </div>
          </div>

          <div className="company-profile-view">
            <section className="company-profile-hero">
              <div className="company-profile-brandmark company-profile-logo">
                {profilCourant.logo_url ? (
                  <img src={construireUrlFichier(profilCourant.logo_url)} alt="Logo entreprise" className="company-profile-logo-image" />
                ) : (
                  <span>{companyInitial}</span>
                )}
              </div>
              <div>
                <p className="company-profile-kicker">Profil entreprise</p>
                <h3>{companyName}</h3>
                <div className="company-profile-meta">
                  <span><Building2 size={15} /> {profilCourant.secteur_activite || "Secteur non renseigne"}</span>
                  <span><MapPin size={15} /> {companyLocation}</span>
                  <span><Users size={15} /> {profilCourant.taille_entreprise || "Taille non renseignee"}</span>
                  <span><CheckCircle2 size={15} /> {profilCourant.profil_publique ? "Profil public" : "Profil prive"}</span>
                </div>
              </div>
            </section>

            <section className="company-profile-kpis" aria-label="Resume entreprise">
              <article><Mail size={18} /><span>Email principal</span><strong>{profilCourant.email || utilisateur.email || emptyValue}</strong></article>
              <article><Phone size={18} /><span>Telephone</span><strong>{profilCourant.telephone || emptyValue}</strong></article>
              <article><FileText size={18} /><span>Documents</span><strong>{uploadedDocumentsCount}/3</strong></article>
              <article><ShieldCheck size={18} /><span>Contact RH</span><strong>{profilCourant.contact_rh_nom ? "Configure" : "A completer"}</strong></article>
            </section>

            <section className="company-profile-grid">
              <article className="company-profile-panel company-profile-panel-wide">
                <h3>Vue d&apos;ensemble</h3>
                <p>{profilCourant.description || "Ajoutez une presentation claire de votre entreprise pour harmoniser votre profil avec l'espace admin."}</p>
                <div className="company-values">
                  <span><ShieldCheck size={16} /> Inclusion</span>
                  <span><Users size={16} /> Collaboration</span>
                  <span><Building2 size={16} /> Identite entreprise</span>
                </div>
              </article>

              <article className="company-profile-panel">
                <h3>Engagement handicap</h3>
                <p>{profilCourant.politique_handicap || "Ajoutez votre politique d'inclusion et vos engagements d'accessibilite."}</p>
              </article>

              <article className="company-profile-panel">
                <h3>Equipe recrutement</h3>
                <div className="company-contact-list">
                  <span><Users size={15} /> {rhContactName}</span>
                  <span><Mail size={15} /> {rhContactEmail}</span>
                  <span><Phone size={15} /> {rhContactPhone}</span>
                  <span><Globe2 size={15} /> {companyWebsite}</span>
                </div>
              </article>

              <article className="company-profile-panel">
                <h3>Documents</h3>
                <div className="company-contact-list">
                  <span><FileText size={15} /> Patente: {profilCourant.patente || "A completer"}</span>
                  <span><FileText size={15} /> RNE / SIRET: {profilCourant.rne || "A completer"}</span>
                  <span><Building2 size={15} /> Logo: {profilCourant.logo_url ? "Ajoute" : "A completer"}</span>
                </div>
              </article>

              <article className="company-profile-panel company-profile-panel-wide">
                <h3>Informations administratives</h3>
                <div className="company-admin-strip">
                  <span>Representant <b>{profilCourant.nom || emptyValue}</b></span>
                  <span>Site web <b>{profilCourant.site_web || emptyValue}</b></span>
                  <span>RNE <b>{profilCourant.rne || emptyValue}</b></span>
                  <span>Profil public <b>{profilCourant.profil_publique ? "Oui" : "Non"}</b></span>
                </div>
              </article>
            </section>
          </div>
        </Card>

        {message ? <div className="message message-info">{message}</div> : null}
        {erreur ? <div className="message message-erreur">{erreur}</div> : null}

        <Card className="profile-surface">
          <div className="profile-surface-head">
            <div>
              <strong>Coordonnees du contact</strong>
            </div>
          </div>

          <div className="surface-grid surface-grid-2">
            {renderInput("Nom du representant", profilCourant.nom, (value) => setProfil({ ...profilCourant, nom: value }))}
            {renderInput("Email", profilCourant.email || "", (value) => setProfil({ ...profilCourant, email: value }), { type: "email" })}
            {renderInput("Telephone", profilCourant.telephone, (value) => setProfil({ ...profilCourant, telephone: value }))}
            {renderInput("Adresse", profilCourant.addresse, (value) => setProfil({ ...profilCourant, addresse: value }), { textarea: true, fullWidth: true })}
          </div>
        </Card>

        <Card className="profile-surface">
          <div className="profile-surface-head">
            <div>
              <strong>Identite de l&apos;entreprise</strong>
            </div>
          </div>

          <div className="surface-grid surface-grid-2">
            {renderInput("Nom de l'entreprise", profilCourant.nom_entreprise, (value) => setProfil({ ...profilCourant, nom_entreprise: value }))}
            {renderInput("Site web", profilCourant.site_web || "", (value) => setProfil({ ...profilCourant, site_web: value }), { type: "url" })}
            {renderInput("Patente", profilCourant.patente, (value) => setProfil({ ...profilCourant, patente: value }))}
            {renderInput("RNE / SIRET", profilCourant.rne, (value) => setProfil({ ...profilCourant, rne: value }))}

            <div className="groupe-champ">
              <label>Secteur d&apos;activite</label>
              <select
                value={profilCourant.secteur_activite || ""}
                onChange={(event) => setProfil({ ...profilCourant, secteur_activite: event.target.value })}
                className="champ-select"
              >
                <option value="">Selectionner un secteur</option>
                {industryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {renderInput("Taille de l'entreprise", profilCourant.taille_entreprise || "", (value) => setProfil({ ...profilCourant, taille_entreprise: value }))}
            {renderInput("Description", profilCourant.description || "", (value) => setProfil({ ...profilCourant, description: value }), {
              textarea: true,
              fullWidth: true,
            })}
            {renderInput(
              "Politique d'inclusion",
              profilCourant.politique_handicap || "",
              (value) => setProfil({ ...profilCourant, politique_handicap: value }),
              { textarea: true, fullWidth: true },
            )}
          </div>
        </Card>

        <Card className="profile-surface">
          <div className="profile-surface-head">
            <div>
              <strong>Contacts RH</strong>
            </div>
          </div>

          <div className="surface-grid surface-grid-3">
            {renderInput("Nom du contact RH", profilCourant.contact_rh_nom || "", (value) => setProfil({ ...profilCourant, contact_rh_nom: value }))}
            {renderInput(
              "Email du contact RH",
              profilCourant.contact_rh_email || "",
              (value) => setProfil({ ...profilCourant, contact_rh_email: value }),
              { type: "email" },
            )}
            {renderInput(
              "Telephone du contact RH",
              profilCourant.contact_rh_telephone || "",
              (value) => setProfil({ ...profilCourant, contact_rh_telephone: value }),
            )}
          </div>
        </Card>

        <Card className="profile-surface">
          <div className="profile-surface-head">
            <div>
              <strong>Documents et logo</strong>
            </div>
            <div className="profile-surface-actions">
              <Button onClick={() => void enregistrerDocuments()} disabled={logoActionLoading}>
                {logoActionLoading ? "Televersement..." : "Mettre a jour les documents"}
              </Button>
              <Button variant="danger" onClick={() => void enregistrerDocuments({ removeLogo: true })} disabled={logoActionLoading || !profilCourant.logo_url}>
                Supprimer le logo
              </Button>
            </div>
          </div>

          <div className="surface-grid surface-grid-3">
            <div className="detail-box company-doc-box">
              <strong>Patente</strong>
              <input type="file" className="champ" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setPatenteFile(event.target.files?.[0] || null)} />
              {profilCourant.patente_url?.startsWith("/") || profilCourant.patente_url?.startsWith("http") ? (
                <a href={construireUrlFichier(profilCourant.patente_url)} target="_blank" rel="noreferrer">
                  Voir le fichier actuel
                </a>
              ) : (
                <span>{profilCourant.patente || emptyValue}</span>
              )}
            </div>

            <div className="detail-box company-doc-box">
              <strong>RNE / SIRET</strong>
              <input type="file" className="champ" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setRneFile(event.target.files?.[0] || null)} />
              {profilCourant.rne_url?.startsWith("/") || profilCourant.rne_url?.startsWith("http") ? (
                <a href={construireUrlFichier(profilCourant.rne_url)} target="_blank" rel="noreferrer">
                  Voir le fichier actuel
                </a>
              ) : (
                <span>{profilCourant.rne || emptyValue}</span>
              )}
            </div>

            <div className="detail-box company-doc-box">
              <strong>Logo de l&apos;entreprise</strong>
              <input
                type="file"
                className="champ"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                onChange={(event) => {
                  const fichier = event.target.files?.[0] || null;
                  if (!fichier) {
                    setLogoFile(null);
                    return;
                  }
                  try {
                    validerLogoEntreprise(fichier);
                    setLogoFile(fichier);
                    setErreur(null);
                  } catch (error: unknown) {
                    setLogoFile(null);
                    setErreur(getErrorMessage(error, "Logo d'entreprise invalide."));
                  }
                }}
              />
              {profilCourant.logo_url ? (
                <img src={construireUrlFichier(profilCourant.logo_url)} alt="Logo actuel de l'entreprise" className="company-doc-logo" />
              ) : (
                <span>{logoFile?.name || "Aucun logo televerse"}</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="profile-surface">
          <div className="profile-surface-head">
            <div>
              <strong>Membres du compte</strong>
            </div>
            <div className="profile-surface-actions">
              <Button onClick={creerMembre}>Ajouter un membre</Button>
            </div>
          </div>

          <div className="surface-grid surface-grid-4">
            {renderInput("Nom", nouveauMembre.nom, (value) => setNouveauMembre({ ...nouveauMembre, nom: value }))}
            {renderInput("Email", nouveauMembre.email, (value) => setNouveauMembre({ ...nouveauMembre, email: value }), { type: "email" })}
            {renderInput("Role", nouveauMembre.role || "", (value) => setNouveauMembre({ ...nouveauMembre, role: value }))}
            {renderInput("Telephone", nouveauMembre.telephone || "", (value) => setNouveauMembre({ ...nouveauMembre, telephone: value }))}
          </div>

          <div className="company-members-grid">
            {membres.length === 0 ? (
              <div className="detail-box company-member-card">
                <strong>Aucun membre ajoute pour le moment</strong>
                <p>Ajoutez des membres pour etendre l&apos;acces a votre espace entreprise.</p>
              </div>
            ) : (
              membres.map((membre) => (
                <div key={membre.id} className="detail-box company-member-card">
                  <strong>{membre.nom}</strong>
                  <p>{membre.email}</p>
                  <p>{membre.role || "-"}</p>
                  <p>{membre.telephone || "-"}</p>
                  <Button variant="ghost" size="sm" className="company-member-delete" onClick={() => supprimerMembre(membre.id)}>
                    Supprimer
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <style jsx>{`
        :global(.enterprise-profile-page) {
          --enterprise-profile-ink: #20142c;
          --enterprise-profile-muted: #6f6278;
          --enterprise-profile-line: rgba(74, 21, 75, 0.12);
          --enterprise-profile-surface: rgba(255, 255, 255, 0.9);
          --enterprise-profile-soft: rgba(248, 245, 252, 0.82);
          gap: 22px;
          color: var(--enterprise-profile-ink);
        }

        :global(.enterprise-profile-page .page-header) {
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        :global(.enterprise-profile-page .page-title) {
          font-size: clamp(32px, 4vw, 44px);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: var(--enterprise-profile-ink);
        }

        :global(.enterprise-profile-page .page-description) {
          max-width: 680px;
          color: var(--enterprise-profile-muted);
        }

        .enterprise-profile-content {
          gap: 18px;
        }

        :global(.enterprise-profile-page .profile-overview-card),
        :global(.enterprise-profile-page .profile-surface) {
          gap: 22px;
          border: 1px solid var(--enterprise-profile-line);
          border-radius: 24px;
          background: var(--enterprise-profile-surface);
          box-shadow: 0 18px 44px rgba(38, 18, 48, 0.06);
        }

        :global(.enterprise-profile-page .profile-overview-card) {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 92% 10%, rgba(123, 44, 191, 0.12), transparent 30%),
            linear-gradient(135deg, rgba(74, 21, 75, 0.07), rgba(255, 255, 255, 0.94));
        }

        :global(.enterprise-profile-page .profile-overview-card::before) {
          content: "";
          position: absolute;
          inset: 0;
          border: 0;
          border-radius: 0;
          pointer-events: none;
        }

        :global(.enterprise-profile-page .profile-overview-card > *) {
          position: relative;
          z-index: 1;
        }

        :global(.enterprise-profile-page .profile-surface-head) {
          align-items: center;
          gap: 18px;
        }

        :global(.enterprise-profile-page .profile-surface-head strong) {
          color: var(--enterprise-profile-ink);
          font-size: 1.05rem;
        }

        :global(.enterprise-profile-page .profile-surface-actions) {
          justify-content: flex-end;
        }

        :global(.enterprise-profile-page .detail-box) {
          border: 0;
          border-bottom: 1px solid var(--enterprise-profile-line);
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          padding: 0 0 14px;
        }

        :global(.enterprise-profile-page .detail-box strong) {
          color: var(--enterprise-profile-ink);
          font-size: 0.86rem;
        }

        :global(.enterprise-profile-page .detail-box span),
        :global(.enterprise-profile-page .detail-box p) {
          color: var(--enterprise-profile-muted);
          line-height: 1.5;
        }

        :global(.enterprise-profile-page .surface-grid) {
          gap: 18px;
        }

        :global(.enterprise-profile-page .groupe-champ) {
          gap: 8px;
        }

        :global(.enterprise-profile-page .groupe-champ label) {
          color: rgba(74, 21, 75, 0.66);
          font-size: 0.76rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 800;
        }

        :global(.enterprise-profile-page .champ),
        :global(.enterprise-profile-page .champ-zone),
        :global(.enterprise-profile-page .champ-select) {
          border-radius: 16px;
          border-color: var(--enterprise-profile-line);
          background: var(--enterprise-profile-soft);
          color: var(--enterprise-profile-ink);
          box-shadow: none;
        }

        :global(.enterprise-profile-page .champ:focus),
        :global(.enterprise-profile-page .champ-zone:focus),
        :global(.enterprise-profile-page .champ-select:focus) {
          border-color: rgba(74, 21, 75, 0.34);
          box-shadow: 0 0 0 4px rgba(74, 21, 75, 0.08);
        }

        .company-profile-view {
          display: grid;
          gap: 18px;
        }

        .company-profile-kicker {
          margin: 0;
          color: #6b5b86;
          font-size: 0.86rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .company-profile-hero {
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

        .company-profile-logo {
          width: 96px;
          height: 96px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 24px;
          background: linear-gradient(135deg, #4a1d59, #d86a8d);
          color: #fff;
          font-size: 1.8rem;
          font-weight: 900;
          box-shadow: 0 20px 40px rgba(74, 29, 89, 0.2);
        }

        .company-profile-logo-image,
        .company-doc-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .company-doc-logo {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          border: 1px solid var(--enterprise-profile-line);
          background: rgba(255, 255, 255, 0.86);
        }

        .company-profile-hero h3 {
          margin: 4px 0 12px;
          color: #1f1431;
          font-size: clamp(1.8rem, 4vw, 3rem);
          line-height: 1.02;
        }

        .company-profile-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .company-profile-meta span,
        .company-values span,
        .company-contact-list span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .company-profile-meta span {
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: #4f435f;
          font-size: 0.84rem;
          font-weight: 800;
        }

        .company-profile-meta svg,
        .company-profile-kpis svg,
        .company-values svg,
        .company-contact-list svg {
          color: #4a1d59;
        }

        .company-profile-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .company-profile-kpis article,
        .company-profile-panel {
          border: 1px solid rgba(74, 29, 89, 0.1);
          border-radius: 18px;
          background: linear-gradient(180deg, #fff, #fcfafd);
          box-shadow: 0 14px 34px rgba(31, 18, 49, 0.05);
        }

        .company-profile-kpis article {
          min-height: 104px;
          display: grid;
          align-content: center;
          gap: 7px;
          padding: 16px;
        }

        .company-profile-kpis span {
          color: #756b84;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .company-profile-kpis strong {
          color: #1f1431;
          font-size: 1rem;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .company-profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.82fr);
          gap: 14px;
        }

        .company-profile-panel {
          padding: 20px;
        }

        .company-profile-panel h3 {
          margin: 0 0 12px;
          color: #1f1431;
          font-size: 1.05rem;
        }

        .company-profile-panel p,
        .company-doc-box span,
        .company-doc-box a,
        .company-member-card p {
          margin: 0;
          color: var(--enterprise-profile-muted);
          line-height: 1.58;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .company-values {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }

        .company-values span {
          padding: 9px 11px;
          border-radius: 999px;
          background: rgba(74, 29, 89, 0.08);
          color: #4a1d59;
          font-size: 0.8rem;
          font-weight: 800;
        }

        .company-contact-list {
          display: grid;
          gap: 9px;
          font-size: 0.88rem;
        }

        .company-admin-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .company-admin-strip span {
          display: grid;
          gap: 5px;
          padding: 12px;
          border-radius: 14px;
          background: #f8f5fb;
          color: #786c88;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .company-admin-strip b {
          color: #1f1431;
          font-size: 0.92rem;
          overflow-wrap: anywhere;
        }

        .company-doc-box {
          gap: 12px;
          display: grid;
          align-content: start;
        }

        .company-doc-box a {
          color: #4a154b;
          text-decoration: none;
          font-weight: 700;
        }

        .company-doc-box a:hover {
          text-decoration: underline;
        }

        .company-members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .company-member-card {
          display: grid;
          gap: 8px;
          align-content: start;
        }

        .company-member-delete {
          justify-self: flex-start;
        }

        @media (max-width: 720px) {
          :global(.enterprise-profile-page .surface-grid-2),
          :global(.enterprise-profile-page .surface-grid-3),
          :global(.enterprise-profile-page .surface-grid-4),
          .company-profile-kpis,
          .company-profile-grid,
          .company-admin-strip {
            grid-template-columns: 1fr;
          }

          .company-profile-hero {
            grid-template-columns: 1fr;
            justify-items: start;
          }
        }
      `}</style>
    </div>
  );
}
