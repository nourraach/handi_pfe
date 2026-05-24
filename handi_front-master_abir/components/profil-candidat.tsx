"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilCandidatProps {
  utilisateur: UtilisateurConnecte;
}

interface ProfilCandidatData {
  nom: string;
  email: string;
  telephone: string;
  addresse: string;
  competences: string[];
  experience: string;
  formation: string;
  handicap: string;
  cv_url?: string;
  disponibilite: string;
  salaire_souhaite: string;
  preferences_accessibilite: string[];
  visibilite: { email?: boolean; telephone?: boolean; handicap?: boolean };
  carte_handicap_url?: string;
  video_cv_url?: string;
  photo_profil_url?: string;
}

const PREFERENCES = [
  "keyboard",
  "contrast",
  "speech",
  "captions",
  "largeText",
  "voice",
] as const;

const VISIBILITY_FIELDS = [
  { key: "email", labelKey: "profile.candidate.visibility.email" },
  { key: "telephone", labelKey: "profile.candidate.visibility.phone" },
  { key: "handicap", labelKey: "profile.candidate.visibility.disability" },
] as const;

export function ProfilCandidat({ utilisateur }: ProfilCandidatProps) {
  const { t } = useI18n();
  const [profil, setProfil] = useState<ProfilCandidatData>({
    nom: utilisateur.nom || "",
    email: utilisateur.email || "",
    telephone: "",
    addresse: "",
    competences: [],
    experience: "",
    formation: "",
    handicap: "",
    disponibilite: "Immediate",
    salaire_souhaite: "",
    preferences_accessibilite: [],
    visibilite: {},
    carte_handicap_url: "",
    video_cv_url: "",
    photo_profil_url: "",
  });

  const [nouvelleCompetence, setNouvelleCompetence] = useState("");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [carteFile, setCarteFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPersistedValue, setPhotoPersistedValue] = useState<string>("");

  useEffect(() => {
    void chargerProfil();
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      setPhotoPersistedValue("");
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);

    void convertirPhotoPourSauvegarde(photoFile)
      .then((resultat) => setPhotoPersistedValue(resultat))
      .catch(() => setPhotoPersistedValue(""));

    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const token = () => localStorage.getItem("token_auth");

  const chargerProfil = async () => {
    try {
      const response = await fetch(construireUrlApi(`/api/candidats/profil/${utilisateur.id_utilisateur}`), {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.donnees) {
          setProfil((prev) => ({ ...prev, ...data.donnees }));
        }
      }
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : t("common.loadingWorkspaceDescription"));
    }
  };

  const sauvegarderProfil = async () => {
    setMessage(null);
    setErreur(null);
    setChargement(true);

    try {
      const response = await fetch(construireUrlApi("/api/candidats/profil"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profil,
          photo_profil_url: photoPersistedValue || profil.photo_profil_url || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.candidate.saveProfile"));
      }

      await chargerProfil();
      setMessage(t("profile.candidate.profileUpdated"));
      setModeEdition(false);
      setPhotoFile(null);
      setPhotoPersistedValue("");
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : t("profile.candidate.saveProfile"));
    } finally {
      setChargement(false);
    }
  };

  const envoyerDocuments = async () => {
    if (!carteFile && !videoFile) {
      setErreur(t("profile.candidate.addDocumentFirst"));
      return;
    }

    setErreur(null);
    const fd = new FormData();
    if (carteFile) fd.append("carte", carteFile);
    if (videoFile) fd.append("video", videoFile);

    try {
      const response = await fetch(construireUrlApi("/api/candidats/profil/documents"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("profile.candidate.uploadDocuments"));
      }

      setMessage(t("profile.candidate.documentsUploaded"));
      setCarteFile(null);
      setVideoFile(null);
      await chargerProfil();
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : t("profile.candidate.uploadDocuments"));
    }
  };

  const ajouterCompetence = () => {
    const competence = nouvelleCompetence.trim();
    if (!competence || profil.competences.includes(competence)) return;

    setProfil((prev) => ({ ...prev, competences: [...prev.competences, competence] }));
    setNouvelleCompetence("");
  };

  const retirerCompetence = (competence: string) =>
    setProfil((prev) => ({
      ...prev,
      competences: prev.competences.filter((item) => item !== competence),
    }));

  const togglePref = (preference: string) => {
    setProfil((prev) => {
      const existe = prev.preferences_accessibilite.includes(preference);
      return {
        ...prev,
        preferences_accessibilite: existe
          ? prev.preferences_accessibilite.filter((item) => item !== preference)
          : [...prev.preferences_accessibilite, preference],
      };
    });
  };

  const toggleVisibilite = (field: keyof ProfilCandidatData["visibilite"]) => {
    setProfil((prev) => ({
      ...prev,
      visibilite: { ...prev.visibilite, [field]: !prev.visibilite[field] },
    }));
  };

  const initials = profil.nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const completionPercent = Math.round(
    ([
      profil.nom,
      profil.email,
      profil.telephone,
      profil.addresse,
      profil.experience,
      profil.formation,
      profil.handicap,
      profil.salaire_souhaite,
    ].filter((value) => value && value.trim().length > 0).length /
      8) *
      100,
  );

  const resolvedPhotoSource =
    photoPreview ||
    (profil.photo_profil_url
      ? profil.photo_profil_url.startsWith("data:")
        ? profil.photo_profil_url
        : construireUrlApi(profil.photo_profil_url)
      : null);
  const documentsReadyCount = [
    !!profil.cv_url,
    !!profil.carte_handicap_url,
    !!profil.video_cv_url,
    !!photoFile || !!profil.photo_profil_url,
  ].filter(Boolean).length;
  const infoRows = [
    { label: t("profile.candidate.fields.name"), key: "nom" as const },
    { label: t("profile.candidate.fields.email"), key: "email" as const },
    { label: t("profile.candidate.fields.phone"), key: "telephone" as const },
    { label: t("profile.candidate.fields.address"), key: "addresse" as const },
    { label: t("profile.candidate.fields.availability"), key: "disponibilite" as const },
    { label: t("profile.candidate.fields.expectedSalary"), key: "salaire_souhaite" as const },
  ];

  return (
    <section className="candidate-profile-medical">
      <div className="candidate-profile-topbar">
        <div>
          <p className="candidate-profile-kicker">{t("profile.candidate.kicker")}</p>
          <h2>{t("profile.candidate.title")}</h2>
        </div>
        <div className="candidate-profile-actions">
          <button
            type="button"
            className="candidate-profile-button candidate-profile-button-secondary"
            onClick={() => setModeEdition((current) => !current)}
          >
            {modeEdition ? t("profile.candidate.exitEdit") : t("profile.candidate.edit")}
          </button>
          <button
            type="button"
            className="candidate-profile-button candidate-profile-button-primary"
            onClick={sauvegarderProfil}
            disabled={chargement}
          >
            {chargement ? t("profile.candidate.saving") : t("profile.candidate.saveProfile")}
          </button>
        </div>
      </div>

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <motion.article
        className="candidate-profile-card candidate-profile-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="candidate-profile-hero-main">
          <div className="candidate-profile-photo-shell">
            {resolvedPhotoSource ? (
              <img src={resolvedPhotoSource} alt={profil.nom || t("profile.candidate.candidateName")} className="candidate-profile-photo" />
            ) : (
              <div className="candidate-profile-photo-fallback">{initials || "C"}</div>
            )}
          </div>
          <div className="candidate-profile-identity-copy">
            <strong>{profil.nom || t("profile.candidate.candidateName")}</strong>
            <span><Mail size={14} /> {profil.email || "candidat@handitalents.com"}</span>
            <span><Phone size={14} /> {profil.telephone || t("profile.candidate.phoneNotProvided")}</span>
            <label className="candidate-profile-upload candidate-profile-upload-inline">
              <span><Upload size={14} /> {t("profile.candidate.addPicture")}</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>
        <div className="candidate-profile-hero-stats">
          <div className="candidate-profile-mini-stat">
            <div
              className="candidate-profile-ring"
              style={{ ["--completion" as string]: `${completionPercent}%` }}
              aria-label={`${completionPercent}%`}
            >
              <span>{completionPercent}%</span>
            </div>
            <span>{t("profile.candidate.completion")}</span>
            <strong>{completionPercent}%</strong>
          </div>
          <div className="candidate-profile-mini-stat">
            <CalendarClock size={18} />
            <span>{t("profile.candidate.availability")}</span>
            <strong>{profil.disponibilite || t("profile.candidate.notProvided")}</strong>
          </div>
          <div className="candidate-profile-mini-stat">
            <FileText size={18} />
            <span>{t("profile.candidate.documentsReady")}</span>
            <strong>{documentsReadyCount}/4</strong>
          </div>
          <div className="candidate-profile-mini-stat">
            <Wallet size={18} />
            <span>{t("profile.candidate.expectedSalary")}</span>
            <strong>{profil.salaire_souhaite || t("profile.candidate.notProvided")}</strong>
          </div>
        </div>
      </motion.article>

      <div className="candidate-profile-grid">
        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-general" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.generalInfo")}</strong>
          </div>
          <div className="candidate-profile-info-compact">
            {infoRows.map((row) => (
              <div key={row.key} className="candidate-profile-field candidate-profile-field-row">
                <span className="candidate-profile-label">{row.label}</span>
                {modeEdition ? (
                  <input
                    type="text"
                    value={profil[row.key] || ""}
                    onChange={(event) => setProfil((prev) => ({ ...prev, [row.key]: event.target.value }))}
                    className="candidate-profile-input"
                  />
                ) : (
                  <p>{profil[row.key] || t("profile.candidate.notProvided")}</p>
                )}
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-accessibility" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.supportAccessibility")}</strong>
          </div>
          <div className="candidate-profile-stack">
            <div className="candidate-profile-support-chip">
              <ShieldCheck size={14} />
              <span>{profil.handicap || t("profile.candidate.notProvided")}</span>
            </div>

            <div className="candidate-profile-accessibility-grid">
              <div>
                <span className="candidate-profile-label">{t("profile.candidate.accessibilityPreferences")}</span>
                <div className="candidate-profile-chip-grid">
                  {PREFERENCES.map((preference) => {
                    const active = profil.preferences_accessibilite.includes(preference);
                    return (
                      <button
                        key={preference}
                        type="button"
                        className={`candidate-profile-chip ${active ? "candidate-profile-chip-active" : ""}`}
                        onClick={() => modeEdition && togglePref(preference)}
                      >
                        {t(`profile.candidate.preferences.${preference}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="candidate-profile-label">{t("profile.candidate.informationVisibility")}</span>
                <div className="candidate-profile-toggle-list">
                  {VISIBILITY_FIELDS.map((item) => (
                    <label key={item.key} className="candidate-profile-toggle-item">
                      <span>{t(item.labelKey)}</span>
                      <input
                        type="checkbox"
                        checked={!!profil.visibilite[item.key]}
                        onChange={() => toggleVisibilite(item.key)}
                        disabled={!modeEdition}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-skills" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.skillsExperience")}</strong>
          </div>
          <div className="candidate-profile-stack">
            <div>
              <span className="candidate-profile-label">{t("profile.candidate.skills")}</span>
              <div className="candidate-profile-skill-entry">
                <input
                  type="text"
                  value={nouvelleCompetence}
                  onChange={(event) => setNouvelleCompetence(event.target.value)}
                  placeholder={t("profile.candidate.addSkillPlaceholder")}
                  disabled={!modeEdition}
                />
                <button type="button" className="candidate-profile-button candidate-profile-button-secondary" onClick={ajouterCompetence} disabled={!modeEdition}>
                  {t("profile.candidate.addSkill")}
                </button>
              </div>
              <div className="candidate-profile-chip-grid">
                {profil.competences.map((competence) => (
                  <span key={competence} className="candidate-profile-chip candidate-profile-chip-soft">
                    {competence}
                    {modeEdition ? (
                      <button type="button" onClick={() => retirerCompetence(competence)} aria-label={`Remove ${competence}`}>
                        x
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
            <InfoField
              label={t("profile.candidate.education")}
              value={profil.formation}
              edit={modeEdition}
              onChange={(value) => setProfil({ ...profil, formation: value })}
              textarea
            />
            <InfoField
              label={t("profile.candidate.experience")}
              value={profil.experience}
              edit={modeEdition}
              onChange={(value) => setProfil({ ...profil, experience: value })}
              textarea
            />
          </div>
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-upload-block" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.uploadSection")}</strong>
          </div>
          <div className="candidate-profile-upload-inline-list">
            <label className="candidate-profile-upload candidate-profile-upload-compact">
              <span>{t("profile.candidate.documents.disabilityCard")}</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setCarteFile(event.target.files?.[0] || null)} />
            </label>
            <label className="candidate-profile-upload candidate-profile-upload-compact">
              <span>{t("profile.candidate.documents.videoCv")}</span>
              <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
            </label>
            <button type="button" className="candidate-profile-button candidate-profile-button-primary candidate-profile-upload-submit" onClick={envoyerDocuments}>
              {t("profile.candidate.uploadDocuments")}
            </button>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

async function convertirPhotoPourSauvegarde(file: File): Promise<string> {
  const dataUrl = await lireFichierEnDataUrl(file);
  const image = await chargerImage(dataUrl);

  const maxSize = 512;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function lireFichierEnDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load selected image."));
    image.src = src;
  });
}

function InfoField({
  label,
  value,
  onChange,
  edit,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  edit: boolean;
  textarea?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="candidate-profile-field">
      <span className="candidate-profile-label">{label}</span>
      {edit ? (
        textarea ? (
          <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="candidate-profile-input candidate-profile-input-area" />
        ) : (
          <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className="candidate-profile-input" />
        )
      ) : (
        <p>{value || t("profile.candidate.notProvided")}</p>
      )}
    </div>
  );
}
