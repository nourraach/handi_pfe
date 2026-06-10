"use client";

import { useEffect, useEffectEvent, useMemo, useState, type ReactNode } from "react";
import { Building2, Globe2, Mail, MapPin, Phone, ShieldCheck, Trash2, Upload, Users } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilEntrepriseProps {
  utilisateur: UtilisateurConnecte;
  lectureSeule?: boolean;
}

interface ProfilEntrepriseData {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  nom_entreprise: string;
  secteur_activite: string;
  taille_entreprise: string;
  siret: string;
  site_web: string;
  description: string;
  politique_handicap: string;
  contact_rh_nom: string;
  contact_rh_email: string;
  contact_rh_telephone: string;
  logo_url: string;
}

type Option = {
  value: string;
  label: string;
};

const secteurValues = [
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
] as const;

const tailleValues = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "More than 1000 employees",
] as const;

export function ProfilEntreprise({ utilisateur, lectureSeule = false }: ProfilEntrepriseProps) {
  const { t } = useI18n();
  const { utilisateur: utilisateurConnecte } = useAuth();
  const [profil, setProfil] = useState<ProfilEntrepriseData>({
    nom: utilisateur.nom || "",
    email: utilisateur.email || "",
    telephone: "",
    addresse: "",
    nom_entreprise: "",
    secteur_activite: "",
    taille_entreprise: "",
    siret: "",
    site_web: "",
    description: "",
    politique_handicap: "",
    contact_rh_nom: "",
    contact_rh_email: "",
    contact_rh_telephone: "",
    logo_url: "",
  });
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoSuppressionDemandee, setLogoSuppressionDemandee] = useState(false);

  const valeurParDefaut = t("profile.candidate.notProvided");
  const secteurs = useMemo<Option[]>(
    () => [
      { value: secteurValues[0], label: t("profile.company.sectors.technology") },
      { value: secteurValues[1], label: t("profile.company.sectors.healthcare") },
      { value: secteurValues[2], label: t("profile.company.sectors.finance") },
      { value: secteurValues[3], label: t("profile.company.sectors.education") },
      { value: secteurValues[4], label: t("profile.company.sectors.retail") },
      { value: secteurValues[5], label: t("profile.company.sectors.industry") },
      { value: secteurValues[6], label: t("profile.company.sectors.services") },
      { value: secteurValues[7], label: t("profile.company.sectors.transport") },
      { value: secteurValues[8], label: t("profile.company.sectors.tourism") },
      { value: secteurValues[9], label: t("profile.company.sectors.agriculture") },
      { value: secteurValues[10], label: t("profile.company.sectors.other") },
    ],
    [t],
  );
  const tailles = useMemo<Option[]>(
    () => [
      { value: tailleValues[0], label: t("profile.company.sizes.micro") },
      { value: tailleValues[1], label: t("profile.company.sizes.small") },
      { value: tailleValues[2], label: t("profile.company.sizes.medium") },
      { value: tailleValues[3], label: t("profile.company.sizes.large") },
      { value: tailleValues[4], label: t("profile.company.sizes.xlarge") },
      { value: tailleValues[5], label: t("profile.company.sizes.enterprise") },
    ],
    [t],
  );

  const chargerProfilInitial = useEffectEvent(() => {
    void chargerProfil();
  });

  useEffect(() => {
    chargerProfilInitial();
  }, [utilisateur.id_utilisateur]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const resolveApiUrl = (path?: string | null) => {
    if (!path) return null;
    const trimmed = String(path).trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
    return construireUrlApi(trimmed);
  };

  async function chargerProfil() {
    try {
      const token = localStorage.getItem("token_auth");
      if (!token) return;

      const response = await fetch(construireUrlApi(`/api/entreprises/profil/${utilisateur.id_utilisateur}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setErreur(t("profile.company.loadError"));
        return;
      }

      const data = (await response.json().catch(() => null)) as { donnees?: Partial<ProfilEntrepriseData> } | null;
      if (data?.donnees) {
        setProfil((courant) => ({ ...courant, ...data.donnees }));
      }
    } catch (cause) {
      console.error("Unable to load the company profile:", cause);
      setErreur(t("profile.company.loadError"));
    }
  }

  async function sauvegarderProfil() {
    setChargement(true);
    setMessage(null);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi("/api/entreprises/profil"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profil),
      });

      const resultat = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErreur(resultat?.message || t("profile.company.updateError"));
        return;
      }

      if (logoFile || logoSuppressionDemandee) {
        await sauvegarderLogoEntreprise();
      }

      await chargerProfil();
      setLogoFile(null);
      setLogoSuppressionDemandee(false);
      setMessage(t("profile.company.profileUpdated"));
      setModeEdition(false);

      const utilisateurData = localStorage.getItem("utilisateur_connecte");
      if (utilisateurData) {
        const utilisateurParse = JSON.parse(utilisateurData) as UtilisateurConnecte;
        utilisateurParse.nom = profil.nom;
        utilisateurParse.email = profil.email;
        localStorage.setItem("utilisateur_connecte", JSON.stringify(utilisateurParse));
      }
    } catch (cause) {
      console.error("Unable to update the company profile:", cause);
      setErreur(t("profile.company.connectionError"));
    } finally {
      setChargement(false);
    }
  }

  async function sauvegarderLogoEntreprise() {
    const token = localStorage.getItem("token_auth");
    const formData = new FormData();

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    if (logoSuppressionDemandee) {
      formData.append("remove_logo", "true");
    }

    const response = await fetch(construireUrlApi("/api/entreprises/profil/documents"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const resultat = (await response.json().catch(() => null)) as { message?: string; donnees?: Partial<ProfilEntrepriseData> } | null;

    if (!response.ok) {
      throw new Error(resultat?.message || "Impossible de mettre à jour la photo de profil.");
    }

    if (resultat?.donnees) {
      setProfil((courant) => ({ ...courant, ...resultat.donnees }));
    }
  }

  const nomEntreprise = profil.nom_entreprise || utilisateur.nom || valeurParDefaut;
  const secteur = resolveOptionLabel(profil.secteur_activite, secteurs) || valeurParDefaut;
  const taille = resolveOptionLabel(profil.taille_entreprise, tailles) || valeurParDefaut;
  const editionAutorisee = !lectureSeule && modeEdition;
  const masquerEquipeRecrutement = utilisateurConnecte?.role === "inspecteur";
  const completionPercent = Math.round(
    ([
      profil.nom,
      profil.email,
      profil.telephone,
      profil.addresse,
      profil.nom_entreprise,
      profil.secteur_activite,
      profil.taille_entreprise,
      profil.site_web,
      profil.description,
      profil.politique_handicap,
      profil.contact_rh_nom,
      profil.contact_rh_email,
      profil.logo_url,
    ].filter((value) => value && value.trim().length > 0).length /
      13) *
      100,
  );
  const logoSource = logoPreview || (logoSuppressionDemandee ? null : resolveApiUrl(profil.logo_url));
  const initials = nomEntreprise
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <section className="candidate-profile-medical enterprise-profile-page">

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <section className="candidate-profile-card enterprise-profile-overview">
        <div className="candidate-profile-topbar enterprise-profile-topbar">
          <div>
            <p className="candidate-profile-kicker">{t("profile.company.title")}</p>
            <h2>{t("profile.company.companyTitle")}</h2>
          </div>
          {!lectureSeule ? (
            <div className="candidate-profile-actions">
              <button
                type="button"
                className="candidate-profile-button candidate-profile-button-secondary"
                onClick={() => setModeEdition((courant) => !courant)}
              >
                {modeEdition ? t("profile.candidate.exitEdit") : t("common.actions.edit")}
              </button>
              <button
                type="button"
                className="candidate-profile-button candidate-profile-button-primary"
                onClick={() => void sauvegarderProfil()}
                disabled={chargement || !modeEdition}
              >
                {chargement ? t("profile.candidate.saving") : t("common.actions.save")}
              </button>
            </div>
          ) : null}
        </div>

        <article className="candidate-profile-hero enterprise-profile-hero">
          <div className="candidate-profile-hero-main enterprise-profile-hero-main">
          <div className="candidate-profile-photo-shell">
            {logoSource ? (
              <img src={logoSource} alt={`Logo ${nomEntreprise}`} className="candidate-profile-photo" />
            ) : (
              <div className="candidate-profile-photo-fallback">{initials || "E"}</div>
            )}
          </div>
          <div className="candidate-profile-identity-copy">
            <strong>{nomEntreprise}</strong>
            <span>
              <Mail size={14} /> {profil.email || utilisateur.email || valeurParDefaut}
            </span>
            <span>
              <Phone size={14} /> {profil.telephone || valeurParDefaut}
            </span>
            <span>
              <MapPin size={14} /> {profil.addresse || valeurParDefaut}
            </span>
            {editionAutorisee ? (
              <div className="enterprise-profile-logo-actions">
                <label className="candidate-profile-upload candidate-profile-upload-inline">
                  <span><Upload size={14} /> Photo de profil</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg"
                    onChange={(event) => {
                      setLogoFile(event.target.files?.[0] || null);
                      setLogoSuppressionDemandee(false);
                    }}
                  />
                </label>
                {(profil.logo_url || logoFile) && !logoSuppressionDemandee ? (
                  <button
                    type="button"
                    className="candidate-profile-button candidate-profile-button-secondary enterprise-profile-logo-remove"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoSuppressionDemandee(true);
                    }}
                  >
                    <Trash2 size={14} /> Retirer
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          </div>
          <div className="candidate-profile-hero-stats enterprise-profile-hero-stats">
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat enterprise-profile-mini-stat--completion">
              <div className="candidate-profile-ring" style={{ ["--completion" as string]: `${completionPercent}%` }} aria-label={`${completionPercent}%`}>
                <span>{completionPercent}%</span>
              </div>
              <span>Profil complet</span>
              <strong>{completionPercent}%</strong>
            </div>
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat">
              <Building2 size={18} />
              <span>Secteur</span>
              <strong>{secteur}</strong>
            </div>
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat">
              <Users size={18} />
              <span>Taille</span>
              <strong>{taille}</strong>
            </div>
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat">
              <Globe2 size={18} />
              <span>Site web</span>
              <strong>{profil.site_web || valeurParDefaut}</strong>
            </div>
          </div>
        </article>
      </section>

      <div className="candidate-profile-grid">
        <article className="candidate-profile-card candidate-profile-section candidate-profile-general">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.company.contactTitle")}</strong>
          </div>
          <div className="candidate-profile-info-compact">
            <EditableProfileField
              label={t("profile.company.fields.contactName")}
              value={profil.nom}
              edit={editionAutorisee}
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, nom: value }))}
            />
            <EditableProfileField
              label={t("profile.company.fields.email")}
              value={profil.email}
              edit={editionAutorisee}
              type="email"
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, email: value }))}
            />
            <EditableProfileField
              label={t("profile.company.fields.phone")}
              value={profil.telephone}
              edit={editionAutorisee}
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, telephone: value }))}
            />
            <EditableProfileField
              label={t("profile.company.fields.address")}
              value={profil.addresse}
              edit={editionAutorisee}
              textarea
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, addresse: value }))}
            />
          </div>
        </article>

        <article className="candidate-profile-card candidate-profile-section candidate-profile-accessibility">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.company.companyTitle")}</strong>
          </div>
          <div className="candidate-profile-stack">
            <div className="candidate-profile-support-chip">
              <Building2 size={14} />
              <span>{nomEntreprise}</span>
            </div>
            <div className="candidate-profile-support-chip">
              <ShieldCheck size={14} />
              <span>{profil.politique_handicap || valeurParDefaut}</span>
            </div>
            <div className="candidate-profile-accessibility-grid">
              <EditableProfileField
                label={t("profile.company.fields.companyName")}
                value={profil.nom_entreprise}
                edit={editionAutorisee}
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, nom_entreprise: value }))}
              />
              <EditableProfileField
                label={t("profile.company.fields.siret")}
                value={profil.siret}
                edit={editionAutorisee}
                placeholder={t("profile.company.placeholders.siret")}
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, siret: value }))}
              />
              <EditableProfileSelect
                label={t("profile.company.fields.sector")}
                value={profil.secteur_activite}
                edit={editionAutorisee}
                options={secteurs}
                placeholder={t("profile.company.placeholders.selectSector")}
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, secteur_activite: value }))}
              />
              <EditableProfileSelect
                label={t("profile.company.fields.size")}
                value={profil.taille_entreprise}
                edit={editionAutorisee}
                options={tailles}
                placeholder={t("profile.company.placeholders.selectSize")}
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, taille_entreprise: value }))}
              />
            </div>
          </div>
        </article>

        <article className="candidate-profile-card candidate-profile-section candidate-profile-skills">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.company.fields.description")}</strong>
          </div>
          <div className="candidate-profile-stack">
            <EditableProfileField
              label={t("profile.company.fields.website")}
              value={profil.site_web}
              edit={editionAutorisee}
              type="url"
              placeholder={t("profile.company.placeholders.website")}
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, site_web: value }))}
              renderValue={
                profil.site_web ? (
                  <a href={profil.site_web} target="_blank" rel="noreferrer">
                    {profil.site_web}
                  </a>
                ) : undefined
              }
            />
            <EditableProfileField
              label={t("profile.company.fields.description")}
              value={profil.description}
              edit={editionAutorisee}
              textarea
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, description: value }))}
            />
            <EditableProfileField
              label={t("profile.company.fields.inclusionPolicy")}
              value={profil.politique_handicap}
              edit={editionAutorisee}
              textarea
              emptyValue={valeurParDefaut}
              onChange={(value) => setProfil((courant) => ({ ...courant, politique_handicap: value }))}
            />
          </div>
        </article>

        {!masquerEquipeRecrutement ? (
          <article className="candidate-profile-card candidate-profile-section candidate-profile-upload-block">
            <div className="candidate-profile-card-head">
              <strong>{t("profile.company.hrTitle")}</strong>
            </div>
            <div className="candidate-profile-documents">
              <EditableDocumentRow
                label={t("profile.company.fields.hrName")}
                value={profil.contact_rh_nom}
                edit={editionAutorisee}
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, contact_rh_nom: value }))}
              />
              <EditableDocumentRow
                label={t("profile.company.fields.hrEmail")}
                value={profil.contact_rh_email}
                edit={editionAutorisee}
                type="email"
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, contact_rh_email: value }))}
              />
              <EditableDocumentRow
                label={t("profile.company.fields.hrPhone")}
                value={profil.contact_rh_telephone}
                edit={editionAutorisee}
                emptyValue={valeurParDefaut}
                onChange={(value) => setProfil((courant) => ({ ...courant, contact_rh_telephone: value }))}
              />
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function EditableProfileField({
  label,
  value,
  onChange,
  edit,
  textarea,
  type = "text",
  placeholder,
  fullWidth,
  emptyValue,
  renderValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  edit: boolean;
  textarea?: boolean;
  type?: string;
  placeholder?: string;
  fullWidth?: boolean;
  emptyValue: string;
  renderValue?: ReactNode;
}) {
  return (
    <div className={`candidate-profile-field ${fullWidth ? "profile-field-span-full" : ""}`.trim()}>
      <span className="candidate-profile-label">{label}</span>
      {edit ? (
        textarea ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            placeholder={placeholder}
            className="candidate-profile-input candidate-profile-input-area"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="candidate-profile-input"
          />
        )
      ) : (
        <p>{(renderValue ?? value) || emptyValue}</p>
      )}
    </div>
  );
}

function EditableProfileSelect({
  label,
  value,
  onChange,
  edit,
  options,
  placeholder,
  fullWidth,
  emptyValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  edit: boolean;
  options: Option[];
  placeholder: string;
  fullWidth?: boolean;
  emptyValue: string;
}) {
  return (
    <div className={`candidate-profile-field ${fullWidth ? "profile-field-span-full" : ""}`.trim()}>
      <span className="candidate-profile-label">{label}</span>
      {edit ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="candidate-profile-input">
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <p>{resolveOptionLabel(value, options) || emptyValue}</p>
      )}
    </div>
  );
}

function EditableDocumentRow({
  label,
  value,
  onChange,
  edit,
  emptyValue,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  edit: boolean;
  emptyValue: string;
  type?: string;
}) {
  return (
    <div className="candidate-profile-doc-row">
      <div>
        <strong>{label}</strong>
        {edit ? (
          <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="candidate-profile-input" />
        ) : (
          <p>{value || emptyValue}</p>
        )}
      </div>
    </div>
  );
}

function resolveOptionLabel(value: string, options: Option[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}
