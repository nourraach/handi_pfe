"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilAdminProps {
  utilisateur: UtilisateurConnecte;
}

interface ProfilAdminData {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  poste: string;
  departement: string;
  date_embauche: string;
  notifications_email: boolean;
  notifications_sms: boolean;
}

type Option = {
  value: string;
  label: string;
};

const departementValues = [
  "Executive management",
  "Human resources",
  "Information technology",
  "Marketing / Communications",
  "Sales",
  "Finance / Accounting",
  "Customer support",
  "Engineering",
  "Other",
] as const;

export function ProfilAdmin({ utilisateur }: ProfilAdminProps) {
  const { t, locale } = useI18n();
  const [profil, setProfil] = useState<ProfilAdminData>({
    nom: utilisateur.nom || "",
    email: utilisateur.email || "",
    telephone: "",
    addresse: "",
    poste: "",
    departement: "",
    date_embauche: "",
    notifications_email: true,
    notifications_sms: false,
  });
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modeEdition, setModeEdition] = useState(false);

  const valeurParDefaut = t("profile.candidate.notProvided");
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );
  const departements = useMemo<Option[]>(
    () => [
      { value: departementValues[0], label: t("profile.admin.departments.executive") },
      { value: departementValues[1], label: t("profile.admin.departments.hr") },
      { value: departementValues[2], label: t("profile.admin.departments.it") },
      { value: departementValues[3], label: t("profile.admin.departments.marketing") },
      { value: departementValues[4], label: t("profile.admin.departments.sales") },
      { value: departementValues[5], label: t("profile.admin.departments.finance") },
      { value: departementValues[6], label: t("profile.admin.departments.support") },
      { value: departementValues[7], label: t("profile.admin.departments.engineering") },
      { value: departementValues[8], label: t("profile.admin.departments.other") },
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

      const response = await fetch(construireUrlApi(`/api/admin/profil/${utilisateur.id_utilisateur}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setErreur(t("profile.admin.loadError"));
        return;
      }

      const data = (await response.json().catch(() => null)) as { donnees?: Partial<ProfilAdminData> } | null;
      if (data?.donnees) {
        setProfil((courant) => ({ ...courant, ...data.donnees }));
      }
    } catch (cause) {
      console.error("Unable to load the admin profile:", cause);
      setErreur(t("profile.admin.loadError"));
    }
  }

  async function sauvegarderProfil() {
    setChargement(true);
    setMessage(null);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi("/api/admin/profil"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profil),
      });

      const resultat = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErreur(resultat?.message || t("profile.admin.updateError"));
        return;
      }

      setMessage(t("profile.admin.profileUpdated"));
      setModeEdition(false);

      const utilisateurData = localStorage.getItem("utilisateur_connecte");
      if (utilisateurData) {
        const utilisateurParse = JSON.parse(utilisateurData) as UtilisateurConnecte;
        utilisateurParse.nom = profil.nom;
        utilisateurParse.email = profil.email;
        localStorage.setItem("utilisateur_connecte", JSON.stringify(utilisateurParse));
      }
    } catch (cause) {
      console.error("Unable to update the admin profile:", cause);
      setErreur(t("profile.admin.connectionError"));
    } finally {
      setChargement(false);
    }
  }

  const roleLabel = t(`common.roles.${utilisateur.role}`);
  const departement = resolveOptionLabel(profil.departement, departements) || valeurParDefaut;
  const dateEmbauche = formatDateValue(profil.date_embauche, dateFormatter, valeurParDefaut);

  return (
    <div className="stack-lg">
      <Card tone="accent" padding="lg" className="profile-overview-card">
        <div className="profile-surface-head">
          <div className="page-header-copy">
            <p className="badge">{t("profile.admin.title")}</p>
            <h2 className="page-title page-title-sm">{profil.nom || utilisateur.nom || valeurParDefaut}</h2>
            <p className="page-description">
              {roleLabel} • {departement}
            </p>
          </div>
          <div className="profile-surface-actions">
            <Button variant="secondary" onClick={() => setModeEdition((courant) => !courant)}>
              {modeEdition ? t("profile.candidate.exitEdit") : t("common.actions.edit")}
            </Button>
          </div>
        </div>

        <div className="details-grid">
          <OverviewFact label={t("profile.admin.fields.email")} value={profil.email || utilisateur.email || valeurParDefaut} />
          <OverviewFact label={t("profile.admin.fields.jobTitle")} value={profil.poste || valeurParDefaut} />
          <OverviewFact label={t("profile.admin.fields.department")} value={departement} />
          <OverviewFact label={t("profile.admin.fields.hireDate")} value={dateEmbauche} />
        </div>
      </Card>

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <Card className="profile-surface">
        <div className="profile-surface-head">
          <div>
            <strong>{t("profile.admin.personalTitle")}</strong>
          </div>
        </div>

        <div className="surface-grid surface-grid-2">
          <EditableField
            label={t("profile.admin.fields.fullName")}
            value={profil.nom}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, nom: value }))}
          />
          <EditableField
            label={t("profile.admin.fields.email")}
            value={profil.email}
            edit={modeEdition}
            type="email"
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, email: value }))}
          />
          <EditableField
            label={t("profile.admin.fields.phone")}
            value={profil.telephone}
            edit={modeEdition}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, telephone: value }))}
          />
          <EditableField
            label={t("profile.admin.fields.address")}
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
            <strong>{t("profile.admin.workTitle")}</strong>
          </div>
        </div>

        <div className="surface-grid surface-grid-2">
          <EditableField
            label={t("profile.admin.fields.jobTitle")}
            value={profil.poste}
            edit={modeEdition}
            placeholder={t("profile.admin.placeholders.jobTitle")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, poste: value }))}
          />
          <EditableSelect
            label={t("profile.admin.fields.department")}
            value={profil.departement}
            edit={modeEdition}
            options={departements}
            placeholder={t("profile.admin.placeholders.selectDepartment")}
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, departement: value }))}
          />
          <EditableField
            label={t("profile.admin.fields.hireDate")}
            value={profil.date_embauche}
            edit={modeEdition}
            type="date"
            emptyValue={valeurParDefaut}
            onChange={(value) => setProfil((courant) => ({ ...courant, date_embauche: value }))}
            renderValue={dateEmbauche}
          />
        </div>
      </Card>

      <Card className="profile-surface">
        <div className="profile-surface-head">
          <div>
            <strong>{t("profile.admin.notificationsTitle")}</strong>
          </div>
        </div>

        <div className="space-y-4">
          <PreferenceRow
            title={t("profile.admin.notifications.emailTitle")}
            description={t("profile.admin.notifications.emailDescription")}
            enabled={profil.notifications_email}
            edit={modeEdition}
            enabledLabel={t("profile.admin.notifications.enabled")}
            disabledLabel={t("profile.admin.notifications.disabled")}
            onToggle={(checked) => setProfil((courant) => ({ ...courant, notifications_email: checked }))}
          />
          <PreferenceRow
            title={t("profile.admin.notifications.smsTitle")}
            description={t("profile.admin.notifications.smsDescription")}
            enabled={profil.notifications_sms}
            edit={modeEdition}
            enabledLabel={t("profile.admin.notifications.enabled")}
            disabledLabel={t("profile.admin.notifications.disabled")}
            onToggle={(checked) => setProfil((courant) => ({ ...courant, notifications_sms: checked }))}
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
  emptyValue: string;
  renderValue?: string;
}) {
  return (
    <div className="groupe-champ">
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
  emptyValue,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  edit: boolean;
  options: Option[];
  placeholder: string;
  emptyValue: string;
}) {
  return (
    <div className="groupe-champ">
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

function PreferenceRow({
  title,
  description,
  enabled,
  edit,
  enabledLabel,
  disabledLabel,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  edit: boolean;
  enabledLabel: string;
  disabledLabel: string;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="profile-preference-row">
      <div className="profile-preference-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {edit ? (
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} className="sr-only peer" />
          <div className="w-12 h-7 rounded-full bg-slate-200 transition peer-checked:bg-slate-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
        </label>
      ) : (
        <span className={`status-pill ${enabled ? "message-info" : "message-neutre"}`}>
          {enabled ? enabledLabel : disabledLabel}
        </span>
      )}
    </div>
  );
}

function resolveOptionLabel(value: string, options: Option[]) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDateValue(value: string, formatter: Intl.DateTimeFormat, emptyValue: string) {
  if (!value) {
    return emptyValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatter.format(date);
}
