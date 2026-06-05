"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilAdminProps {
  utilisateur: UtilisateurConnecte;
  lectureSeule?: boolean;
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

export function ProfilAdmin({ utilisateur, lectureSeule = false }: ProfilAdminProps) {
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
  const initials = (profil.nom || utilisateur.nom || "AD")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="candidate-profile-medical admin-profile-medical">
      <div className="candidate-profile-topbar">
        <div>
          <p className="candidate-profile-kicker">{t("profile.admin.title")}</p>
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
              onClick={sauvegarderProfil}
              disabled={chargement}
            >
              {chargement ? t("profile.candidate.saving") : t("common.actions.save")}
            </button>
          </div>
        ) : null}
      </div>

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <motion.article
        className="candidate-profile-card candidate-profile-hero admin-profile-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="candidate-profile-hero-main">
          <div className="candidate-profile-photo-shell">
            <div className="candidate-profile-photo-fallback">{initials || "A"}</div>
          </div>
          <div className="candidate-profile-identity-copy">
            <strong>{profil.nom || utilisateur.nom || valeurParDefaut}</strong>
            <span><Mail size={14} /> {profil.email || utilisateur.email || "admin@handitalents.com"}</span>
            <span><Phone size={14} /> {profil.telephone || t("profile.candidate.phoneNotProvided")}</span>
            <span><ShieldCheck size={14} /> {roleLabel} - {departement}</span>
          </div>
        </div>
      </motion.article>

      <div className="candidate-profile-grid">
        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-general" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>{t("profile.admin.personalTitle")}</strong>
          </div>
          <div className="candidate-profile-info-compact">
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
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-accessibility" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>{t("profile.admin.workTitle")}</strong>
          </div>
          <div className="candidate-profile-info-compact">
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
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-skills admin-profile-operations" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>Admin workspace</strong>
          </div>
          <div className="candidate-profile-stack">
            <div className="candidate-profile-support-chip">
              <ShieldCheck size={14} />
              <span>Secure account with platform management permissions.</span>
            </div>
            <div className="candidate-profile-chip-grid">
              <span className="candidate-profile-chip candidate-profile-chip-active">User management</span>
              <span className="candidate-profile-chip candidate-profile-chip-active">Job validation</span>
              <span className="candidate-profile-chip candidate-profile-chip-active">Analytics access</span>
              <span className="candidate-profile-chip candidate-profile-chip-soft">Admin role</span>
            </div>
          </div>
        </motion.article>

      </div>
    </section>
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
    <div className="candidate-profile-field candidate-profile-field-row">
      <span className="candidate-profile-label">{label}</span>
      {edit ? (
        textarea ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={3}
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
    <div className="candidate-profile-field candidate-profile-field-row">
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
