"use client";

import { useEffect, useEffectEvent, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilEntrepriseProps {
  utilisateur: UtilisateurConnecte;
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

export function ProfilEntreprise({ utilisateur }: ProfilEntrepriseProps) {
  const { t } = useI18n();
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
  });
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modeEdition, setModeEdition] = useState(false);

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

  async function chargerProfil() {
    try {
      const token = localStorage.getItem("token_auth");
      if (!token) {
        return;
      }

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

  const nomEntreprise = profil.nom_entreprise || utilisateur.nom || valeurParDefaut;
  const secteur = resolveOptionLabel(profil.secteur_activite, secteurs) || valeurParDefaut;
  const taille = resolveOptionLabel(profil.taille_entreprise, tailles) || valeurParDefaut;

  return (
    <div className="stack-lg">
      <Card tone="accent" padding="lg" className="profile-overview-card">
        <div className="profile-surface-head">
          <div className="page-header-copy">
            <p className="badge">{t("profile.company.title")}</p>
            <h2 className="page-title page-title-sm">{nomEntreprise}</h2>
            <p className="page-description">
              {secteur} • {taille}
            </p>
          </div>
          <div className="profile-surface-actions">
            <Button variant="secondary" onClick={() => setModeEdition((courant) => !courant)}>
              {modeEdition ? t("profile.candidate.exitEdit") : t("common.actions.edit")}
            </Button>
          </div>
        </div>

        <div className="details-grid">
          <OverviewFact label={t("profile.company.fields.email")} value={profil.email || utilisateur.email || valeurParDefaut} />
          <OverviewFact label={t("profile.company.fields.phone")} value={profil.telephone || valeurParDefaut} />
          <OverviewFact label={t("profile.company.fields.website")} value={profil.site_web || valeurParDefaut} />
          <OverviewFact label={t("profile.company.fields.siret")} value={profil.siret || valeurParDefaut} />
        </div>
      </Card>

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <Card className="profile-surface">
        <div className="profile-surface-head">
          <div>
            <strong>{t("profile.company.contactTitle")}</strong>
          </div>
        </div>

        <div className="surface-grid surface-grid-2">
          <EditableField
            label={t("profile.company.fields.contactName")}
            value={profil.nom}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, nom: value }))}
          />
          <EditableField
            label={t("profile.company.fields.email")}
            value={profil.email}
            edit={modeEdition}
            type="email"
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, email: value }))}
          />
          <EditableField
            label={t("profile.company.fields.phone")}
            value={profil.telephone}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, telephone: value }))}
          />
          <EditableField
            label={t("profile.company.fields.address")}
            value={profil.addresse}
            edit={modeEdition}
            textarea
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, addresse: value }))}
          />
        </div>
      </Card>

      <Card className="profile-surface">
        <div className="profile-surface-head">
          <div>
            <strong>{t("profile.company.companyTitle")}</strong>
          </div>
        </div>

        <div className="surface-grid surface-grid-2">
          <EditableField
            label={t("profile.company.fields.companyName")}
            value={profil.nom_entreprise}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, nom_entreprise: value }))}
          />
          <EditableField
            label={t("profile.company.fields.siret")}
            value={profil.siret}
            edit={modeEdition}
            placeholder={t("profile.company.placeholders.siret")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, siret: value }))}
          />
          <EditableSelect
            label={t("profile.company.fields.sector")}
            value={profil.secteur_activite}
            edit={modeEdition}
            options={secteurs}
            placeholder={t("profile.company.placeholders.selectSector")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, secteur_activite: value }))}
          />
          <EditableSelect
            label={t("profile.company.fields.size")}
            value={profil.taille_entreprise}
            edit={modeEdition}
            options={tailles}
            placeholder={t("profile.company.placeholders.selectSize")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, taille_entreprise: value }))}
          />
          <EditableField
            label={t("profile.company.fields.website")}
            value={profil.site_web}
            edit={modeEdition}
            type="url"
            placeholder={t("profile.company.placeholders.website")}
            fullWidth
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
          <EditableField
            label={t("profile.company.fields.description")}
            value={profil.description}
            edit={modeEdition}
            textarea
            fullWidth
            placeholder={t("profile.company.placeholders.description")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, description: value }))}
          />
          <EditableField
            label={t("profile.company.fields.inclusionPolicy")}
            value={profil.politique_handicap}
            edit={modeEdition}
            textarea
            fullWidth
            placeholder={t("profile.company.placeholders.policy")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, politique_handicap: value }))}
          />
        </div>
      </Card>

      <Card className="profile-surface">
        <div className="profile-surface-head">
          <div>
            <strong>{t("profile.company.hrTitle")}</strong>
          </div>
        </div>

        <div className="surface-grid surface-grid-3">
          <EditableField
            label={t("profile.company.fields.hrName")}
            value={profil.contact_rh_nom}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, contact_rh_nom: value }))}
          />
          <EditableField
            label={t("profile.company.fields.hrEmail")}
            value={profil.contact_rh_email}
            edit={modeEdition}
            type="email"
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, contact_rh_email: value }))}
          />
          <EditableField
            label={t("profile.company.fields.hrPhone")}
            value={profil.contact_rh_telephone}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, contact_rh_telephone: value }))}
          />
        </div>
      </Card>

      {modeEdition ? (
        <Card className="profile-surface">
          <div className="profile-surface-actions" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setModeEdition(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={sauvegarderProfil} disabled={chargement}>
              {chargement ? t("profile.candidate.saving") : t("common.actions.save")}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function OverviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-box">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function EditableField({
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
    <div className={`groupe-champ ${fullWidth ? "profile-field-span-full" : ""}`.trim()}>
      <label>{label}</label>
      {edit ? (
        textarea ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            placeholder={placeholder}
            className="champ-zone"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="champ"
          />
        )
      ) : (
        <div className="profile-field-value">{(renderValue ?? value) || emptyValue}</div>
      )}
    </div>
  );
}

function EditableSelect({
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
    <div className={`groupe-champ ${fullWidth ? "profile-field-span-full" : ""}`.trim()}>
      <label>{label}</label>
      {edit ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className="champ-select">
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="profile-field-value">{resolveOptionLabel(value, options) || emptyValue}</div>
      )}
    </div>
  );
}

function resolveOptionLabel(value: string, options: Option[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}
