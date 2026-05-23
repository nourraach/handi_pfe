"use client";

import { useEffect, useMemo, useState } from "react";
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

  const documents = useMemo(
    () => [
      {
        label: t("profile.candidate.documents.cv"),
        value: profil.cv_url ? t("profile.candidate.documents.available") : t("profile.candidate.documents.notUploaded"),
        accent: !!profil.cv_url,
      },
      {
        label: t("profile.candidate.documents.disabilityCard"),
        value: profil.carte_handicap_url
          ? t("profile.candidate.documents.uploaded")
          : t("profile.candidate.documents.notUploaded"),
        accent: !!profil.carte_handicap_url,
      },
      {
        label: t("profile.candidate.documents.videoCv"),
        value: profil.video_cv_url
          ? t("profile.candidate.documents.uploaded")
          : t("profile.candidate.documents.notUploaded"),
        accent: !!profil.video_cv_url,
      },
      {
        label: t("profile.candidate.documents.profilePicture"),
        value: photoFile
          ? photoFile.name
          : profil.photo_profil_url
            ? t("profile.candidate.documents.uploaded")
            : t("profile.candidate.documents.notUploaded"),
        accent: !!photoFile || !!profil.photo_profil_url,
      },
    ],
    [photoFile, profil.carte_handicap_url, profil.cv_url, profil.photo_profil_url, profil.video_cv_url, t],
  );

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

      <div className="candidate-profile-layout">
        <aside className="candidate-profile-sidebar">
          <article className="candidate-profile-card candidate-profile-identity">
            <div className="candidate-profile-photo-shell">
              {resolvedPhotoSource ? (
                <img src={resolvedPhotoSource} alt={profil.nom || t("profile.candidate.candidateName")} className="candidate-profile-photo" />
              ) : (
                <div className="candidate-profile-photo-fallback">{initials || "C"}</div>
              )}
            </div>

            <div className="candidate-profile-identity-copy">
              <strong>{profil.nom || t("profile.candidate.candidateName")}</strong>
              <span>{profil.email || "candidate@email.com"}</span>
              <span>{profil.telephone || t("profile.candidate.phoneNotProvided")}</span>
            </div>

            <label className="candidate-profile-upload">
              <span>{t("profile.candidate.addPicture")}</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              />
            </label>
            <p className="candidate-profile-upload-note">
              {t("profile.candidate.uploadNote")}
            </p>
          </article>

          <article className="candidate-profile-card candidate-profile-quickfacts">
            <div className="candidate-profile-card-head">
              <strong>{t("profile.candidate.summary")}</strong>
            </div>
            <div className="candidate-profile-quickfact-list">
              <div className="candidate-profile-quickfact">
                <span>{t("profile.candidate.completion")}</span>
                <strong>{completionPercent}%</strong>
              </div>
              <div className="candidate-profile-quickfact">
                <span>{t("profile.candidate.availability")}</span>
                <strong>{profil.disponibilite || t("profile.candidate.notProvided")}</strong>
              </div>
              <div className="candidate-profile-quickfact">
                <span>{t("profile.candidate.documentsReady")}</span>
                <strong>{documents.filter((item) => item.accent).length}/4</strong>
              </div>
              <div className="candidate-profile-quickfact">
                <span>{t("profile.candidate.expectedSalary")}</span>
                <strong>{profil.salaire_souhaite || t("profile.candidate.notProvided")}</strong>
              </div>
            </div>
          </article>
        </aside>

        <div className="candidate-profile-content">
          <article className="candidate-profile-card candidate-profile-section">
            <div className="candidate-profile-card-head">
              <strong>{t("profile.candidate.generalInfo")}</strong>
            </div>
            <div className="candidate-profile-info-grid">
              <InfoField label={t("profile.candidate.fields.name")} value={profil.nom} edit={modeEdition} onChange={(value) => setProfil({ ...profil, nom: value })} />
              <InfoField label={t("profile.candidate.fields.email")} value={profil.email} edit={modeEdition} onChange={(value) => setProfil({ ...profil, email: value })} />
              <InfoField label={t("profile.candidate.fields.phone")} value={profil.telephone} edit={modeEdition} onChange={(value) => setProfil({ ...profil, telephone: value })} />
              <InfoField label={t("profile.candidate.fields.address")} value={profil.addresse} edit={modeEdition} onChange={(value) => setProfil({ ...profil, addresse: value })} />
              <InfoField label={t("profile.candidate.fields.availability")} value={profil.disponibilite} edit={modeEdition} onChange={(value) => setProfil({ ...profil, disponibilite: value })} />
              <InfoField label={t("profile.candidate.fields.expectedSalary")} value={profil.salaire_souhaite} edit={modeEdition} onChange={(value) => setProfil({ ...profil, salaire_souhaite: value })} />
            </div>
          </article>

          <div className="candidate-profile-two-col">
            <article className="candidate-profile-card candidate-profile-section">
              <div className="candidate-profile-card-head">
                <strong>{t("profile.candidate.supportAccessibility")}</strong>
              </div>
              <div className="candidate-profile-stack">
                <InfoField
                  label={t("profile.candidate.supportNeeds")}
                  value={profil.handicap}
                  edit={modeEdition}
                  onChange={(value) => setProfil({ ...profil, handicap: value })}
                  textarea
                />

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
                        <input
                          type="checkbox"
                          checked={!!profil.visibilite[item.key]}
                          onChange={() => toggleVisibilite(item.key)}
                          disabled={!modeEdition}
                        />
                        <span>{t(item.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="candidate-profile-card candidate-profile-section">
              <div className="candidate-profile-card-head">
                <strong>{t("profile.candidate.filesReadiness")}</strong>
              </div>
              <div className="candidate-profile-file-list">
                {documents.map((item) => (
                  <div key={item.label} className="candidate-profile-file-item">
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </div>
                    <span className={`candidate-profile-status ${item.accent ? "candidate-profile-status-active" : ""}`}>
                      {item.accent ? t("profile.candidate.documents.ready") : t("profile.candidate.documents.pending")}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="candidate-profile-card candidate-profile-section">
            <div className="candidate-profile-card-head">
              <strong>{t("profile.candidate.skillsExperience")}</strong>
            </div>
            <div className="candidate-profile-split">
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
              </div>

              <InfoField
                label={t("profile.candidate.experience")}
                value={profil.experience}
                edit={modeEdition}
                onChange={(value) => setProfil({ ...profil, experience: value })}
                textarea
              />
            </div>
          </article>

          <article className="candidate-profile-card candidate-profile-section">
            <div className="candidate-profile-card-head">
              <strong>{t("profile.candidate.uploadSection")}</strong>
            </div>
            <div className="candidate-profile-stack">
              <label className="candidate-profile-upload">
                <span>{t("profile.candidate.documents.disabilityCard")}</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setCarteFile(event.target.files?.[0] || null)} />
              </label>
              <label className="candidate-profile-upload">
                <span>{t("profile.candidate.documents.videoCv")}</span>
                <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
              </label>
              <button type="button" className="candidate-profile-button candidate-profile-button-primary" onClick={envoyerDocuments}>
                {t("profile.candidate.uploadDocuments")}
              </button>
            </div>
          </article>
        </div>
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
