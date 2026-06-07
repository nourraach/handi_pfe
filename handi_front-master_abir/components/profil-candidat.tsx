"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  EyeOff,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useAccessibility, type AccessibilityMode } from "@/components/accessibility-provider";
import { useI18n } from "@/components/i18n-provider";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilCandidatProps {
  utilisateur: UtilisateurConnecte;
  lectureSeule?: boolean;
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
  visibilite: {
    email?: boolean;
    telephone?: boolean;
    handicap?: boolean;
    addresse?: boolean;
    experience?: boolean;
    formation?: boolean;
    competences?: boolean;
    salaire_souhaite?: boolean;
    documents?: boolean;
  };
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

function resolveAccessibilityModeFromProfile(
  preferences: string[],
  handicap: string,
): AccessibilityMode | null {
  const normalizedPreferences = preferences.map((item) => item.trim().toLowerCase());
  const normalizedHandicap = handicap.trim().toLowerCase();

  if (normalizedPreferences.includes("speech")) return "visuallyImpaired";
  if (normalizedPreferences.includes("voice")) return "mobility";
  if (normalizedPreferences.includes("captions")) return "hearing";
  if (normalizedPreferences.includes("largeText") || normalizedPreferences.includes("contrast")) return "visuallyImpaired";
  if (normalizedPreferences.includes("keyboard")) return "mobility";

  if (normalizedHandicap.includes("visuel")) return "visuallyImpaired";
  if (normalizedHandicap.includes("non-voyant")) return "blindness";
  if (normalizedHandicap.includes("auditif")) return "hearing";
  if (normalizedHandicap.includes("mental") || normalizedHandicap.includes("psychique") || normalizedHandicap.includes("cognitif")) {
    return "cognitive";
  }
  if (normalizedHandicap.includes("physique") || normalizedHandicap.includes("mobil")) return "mobility";

  return null;
}

const VISIBILITY_FIELDS = [
  { key: "email", labelKey: "profile.candidate.visibility.email" },
  { key: "telephone", labelKey: "profile.candidate.visibility.phone" },
  { key: "handicap", labelKey: "profile.candidate.visibility.disability" },
  { key: "addresse", labelKey: "profile.candidate.visibility.address" },
  { key: "experience", labelKey: "profile.candidate.visibility.experience" },
  { key: "formation", labelKey: "profile.candidate.visibility.education" },
  { key: "competences", labelKey: "profile.candidate.visibility.skills" },
  { key: "salaire_souhaite", labelKey: "profile.candidate.visibility.expectedSalary" },
  { key: "documents", labelKey: "profile.candidate.visibility.documents" },
] as const;

type MediaPreview = {
  open: boolean;
  title: string;
  kind: "image" | "pdf" | "video" | "unknown";
  url: string | null;
  loading: boolean;
  error: string | null;
};

type SoftSkillsScoreState = {
  id_resultat: string;
  score: number;
  est_visible: boolean;
} | null;

export function ProfilCandidat({ utilisateur, lectureSeule = false }: ProfilCandidatProps) {
  const { t } = useI18n();
  const { settings, applyMode } = useAccessibility();
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
  const [mediaPreview, setMediaPreview] = useState<MediaPreview>({
    open: false,
    title: "",
    kind: "unknown",
    url: null,
    loading: false,
    error: null,
  });
  const [softSkillsScore, setSoftSkillsScore] = useState<SoftSkillsScoreState>(null);
  const [softSkillsLoading, setSoftSkillsLoading] = useState(false);

  useEffect(() => {
    void chargerProfil();
    if (!lectureSeule) {
      void chargerScoreSoftSkills();
    }
  }, []);

  const recommendedMode = useMemo(
    () =>
      resolveAccessibilityModeFromProfile(
        profil.preferences_accessibilite,
        profil.handicap,
      ),
    [profil.handicap, profil.preferences_accessibilite],
  );

  useEffect(() => {
    if (lectureSeule || !recommendedMode || settings.activeQuickMode === recommendedMode) {
      return;
    }

    applyMode(recommendedMode);
  }, [applyMode, lectureSeule, recommendedMode, settings.activeQuickMode]);

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

  const resolveApiUrl = (path?: string | null) => {
    if (!path) return null;
    const trimmed = String(path).trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return construireUrlApi(trimmed);
  };

  const closePreview = () => {
    setMediaPreview((current) => {
      if (current.url) {
        URL.revokeObjectURL(current.url);
      }
      return { open: false, title: "", kind: "unknown", url: null, loading: false, error: null };
    });
  };

  const openViewOnlyPreview = async (opts: { title: string; srcPath: string; kindHint?: MediaPreview["kind"] }) => {
    const resolved = resolveApiUrl(opts.srcPath);
    if (!resolved) {
      setErreur(t("profile.candidate.uploadDocuments"));
      return;
    }

    setMediaPreview({ open: true, title: opts.title, kind: opts.kindHint || "unknown", url: null, loading: true, error: null });

    try {
      const response = await fetch(resolved, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to open the file.");
      }

      const blob = await response.blob();
      const contentType = (blob.type || response.headers.get("content-type") || "").toLowerCase();

      const kind: MediaPreview["kind"] =
        opts.kindHint ||
        (contentType.includes("pdf")
          ? "pdf"
          : contentType.startsWith("image/")
            ? "image"
            : contentType.startsWith("video/")
              ? "video"
              : "unknown");

      const objectUrl = URL.createObjectURL(blob);
      setMediaPreview({ open: true, title: opts.title, kind, url: objectUrl, loading: false, error: null });
    } catch (cause: unknown) {
      setMediaPreview((current) => ({
        ...current,
        loading: false,
        error: cause instanceof Error ? cause.message : "Unable to open the file.",
      }));
    }
  };

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

  const chargerScoreSoftSkills = async () => {
    try {
      setSoftSkillsLoading(true);
      const response = await fetch(construireUrlApi("/api/tests-psychologiques/candidat/mes-resultats"), {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to load score.");
      }
      const resultats = Array.isArray(data?.donnees?.resultats)
        ? (data.donnees.resultats as Array<{
            id_resultat?: string;
            score_obtenu?: number | string;
            pourcentage?: number | string;
            est_visible?: boolean;
            test?: { type_test?: string };
          }>)
        : [];
      const softSkills = resultats.find((item) => String(item?.test?.type_test || "").toLowerCase() === "soft_skills");
      if (!softSkills) {
        setSoftSkillsScore(null);
        return;
      }
      const pourcentage = Number(softSkills?.pourcentage);
      const scoreObtenu = Number(softSkills?.score_obtenu);
      const score = Number.isFinite(pourcentage) && pourcentage > 0 ? pourcentage : Number.isFinite(scoreObtenu) ? scoreObtenu : 0;
      setSoftSkillsScore({
        id_resultat: String(softSkills.id_resultat || ""),
        score: Math.max(0, Math.min(100, Math.round(score))),
        est_visible: Boolean(softSkills.est_visible),
      });
    } catch {
      setSoftSkillsScore(null);
    } finally {
      setSoftSkillsLoading(false);
    }
  };

  const basculerVisibiliteScoreSoftSkills = async () => {
    if (!softSkillsScore?.id_resultat) return;
    try {
      setErreur(null);
      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/resultats/${softSkillsScore.id_resultat}/visibilite`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ est_visible: !softSkillsScore.est_visible }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Unable to update visibility.");
      }
      setSoftSkillsScore((current) =>
        current ? { ...current, est_visible: !current.est_visible } : current,
      );
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Unable to update visibility.");
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

  const isVisibleFlag = (field: keyof ProfilCandidatData["visibilite"]) => {
    // Default to visible if not configured yet.
    if (typeof profil.visibilite?.[field] === "boolean") return Boolean(profil.visibilite[field]);
    return true;
  };

  const initials = profil.nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const editionAutorisee = !lectureSeule && modeEdition;

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
        {!lectureSeule ? (
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
        ) : null}
      </div>

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <motion.article
        className="candidate-profile-card candidate-profile-hero candidate-profile-hero-surface"
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
            <span>
              <Mail size={14} /> {profil.email || "candidat@handitalents.com"}
              <span className="candidate-profile-visibility-pill" aria-label="Email visibility">
                {isVisibleFlag("email") ? <Eye size={12} /> : <EyeOff size={12} />}
              </span>
            </span>
            <span>
              <Phone size={14} /> {profil.telephone || t("profile.candidate.phoneNotProvided")}
              <span className="candidate-profile-visibility-pill" aria-label="Phone visibility">
                {isVisibleFlag("telephone") ? <Eye size={12} /> : <EyeOff size={12} />}
              </span>
            </span>
            {!lectureSeule ? (
              <label className="candidate-profile-upload candidate-profile-upload-inline">
                <span><Upload size={14} /> {t("profile.candidate.addPicture")}</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                />
              </label>
            ) : null}
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
        </div>
      </motion.article>

      <div className="candidate-profile-grid">
        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-general">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.generalInfo")}</strong>
          </div>
          <div className="candidate-profile-info-compact">
            {infoRows.map((row) => (
              <div key={row.key} className="candidate-profile-field candidate-profile-field-row">
                <span className="candidate-profile-label">{row.label}</span>
                {editionAutorisee ? (
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

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-accessibility">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.supportAccessibility")}</strong>
          </div>
          <div className="candidate-profile-stack">
            <div className="candidate-profile-support-chip">
              <ShieldCheck size={14} />
              <span>{profil.handicap || t("profile.candidate.notProvided")}</span>
              <span className="candidate-profile-visibility-pill" aria-label="Disability visibility">
                {isVisibleFlag("handicap") ? <Eye size={12} /> : <EyeOff size={12} />}
              </span>
            </div>

            {!lectureSeule ? (
              <div className="candidate-profile-support-chip">
                <FileText size={14} />
                <span>
                  Score soft skills:{" "}
                  {softSkillsLoading
                    ? "..."
                    : softSkillsScore
                      ? `${softSkillsScore.score}%`
                      : "Aucun resultat"}
                </span>
                {softSkillsScore ? (
                  <button
                    type="button"
                    className="candidate-profile-button candidate-profile-button-secondary"
                    onClick={() => void basculerVisibiliteScoreSoftSkills()}
                  >
                    {softSkillsScore.est_visible ? (
                      <>
                        <EyeOff size={12} /> Masquer du profil
                      </>
                    ) : (
                      <>
                        <Eye size={12} /> Afficher sur profil
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            ) : null}

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
                        onClick={() => editionAutorisee && togglePref(preference)}
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
                        disabled={!editionAutorisee}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-skills">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.skillsExperience")}</strong>
          </div>
          <div className="candidate-profile-stack">
            <div>
              <span className="candidate-profile-label">{t("profile.candidate.skills")}</span>
              {!lectureSeule ? (
                <div className="candidate-profile-skill-entry">
                  <input
                    type="text"
                    value={nouvelleCompetence}
                    onChange={(event) => setNouvelleCompetence(event.target.value)}
                    placeholder={t("profile.candidate.addSkillPlaceholder")}
                    disabled={!editionAutorisee}
                  />
                  <button type="button" className="candidate-profile-button candidate-profile-button-secondary" onClick={ajouterCompetence} disabled={!editionAutorisee}>
                    {t("profile.candidate.addSkill")}
                  </button>
                </div>
              ) : null}
              <div className="candidate-profile-chip-grid">
                {profil.competences.map((competence) => (
                  <span key={competence} className="candidate-profile-chip candidate-profile-chip-soft">
                    {competence}
                    {editionAutorisee ? (
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
              edit={editionAutorisee}
              onChange={(value) => setProfil({ ...profil, formation: value })}
              textarea
            />
            <InfoField
              label={t("profile.candidate.experience")}
              value={profil.experience}
              edit={editionAutorisee}
              onChange={(value) => setProfil({ ...profil, experience: value })}
              textarea
            />
          </div>
        </motion.article>

        <motion.article className="candidate-profile-card candidate-profile-section candidate-profile-upload-block">
          <div className="candidate-profile-card-head">
            <strong>{t("profile.candidate.uploadSection")}</strong>
          </div>
          {!lectureSeule ? (
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
          ) : null}

          <div className="candidate-profile-documents">
            <div className="candidate-profile-doc-row">
              <div>
                <strong>{t("profile.candidate.documents.disabilityCard")}</strong>
                <p>{profil.carte_handicap_url ? t("profile.candidate.documents.available") : t("profile.candidate.documents.notUploaded")}</p>
              </div>
              {profil.carte_handicap_url ? (
                <button
                  type="button"
                  className="candidate-profile-button candidate-profile-button-secondary"
                  onClick={() =>
                    void openViewOnlyPreview({
                      title: t("profile.candidate.documents.disabilityCard"),
                      srcPath: profil.carte_handicap_url || "",
                    })
                  }
                >
                  {t("common.actions.open")}
                </button>
              ) : null}
            </div>
            <div className="candidate-profile-doc-row">
              <div>
                <strong>{t("profile.candidate.documents.videoCv")}</strong>
                <p>{profil.video_cv_url ? t("profile.candidate.documents.available") : t("profile.candidate.documents.notUploaded")}</p>
              </div>
              {profil.video_cv_url ? (
                <button
                  type="button"
                  className="candidate-profile-button candidate-profile-button-secondary"
                  onClick={() =>
                    void openViewOnlyPreview({
                      title: t("profile.candidate.documents.videoCv"),
                      srcPath: profil.video_cv_url || "",
                      kindHint: "video",
                    })
                  }
                >
                  {t("common.actions.open")}
                </button>
              ) : null}
            </div>
          </div>
        </motion.article>
      </div>

      {mediaPreview.open ? (
        <div className="candidate-profile-modal" role="dialog" aria-modal="true" aria-label={mediaPreview.title}>
          <button type="button" className="candidate-profile-modal-backdrop" onClick={closePreview} aria-label="Close" />
          <div className="candidate-profile-modal-card" onContextMenu={(event) => event.preventDefault()}>
            <div className="candidate-profile-modal-head">
              <strong>{mediaPreview.title}</strong>
              <button type="button" className="candidate-profile-icon-btn" onClick={closePreview} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>

            {mediaPreview.loading ? (
              <div className="candidate-profile-modal-body">
                <p>{t("common.loading")}</p>
              </div>
            ) : mediaPreview.error ? (
              <div className="candidate-profile-modal-body">
                <p className="message message-erreur">{mediaPreview.error}</p>
              </div>
            ) : mediaPreview.url ? (
              <div className="candidate-profile-modal-body">
                {mediaPreview.kind === "video" ? (
                  <video
                    src={mediaPreview.url}
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    playsInline
                    style={{ width: "100%", borderRadius: 14 }}
                  />
                ) : mediaPreview.kind === "pdf" ? (
                  <iframe
                    title={mediaPreview.title}
                    src={mediaPreview.url}
                    style={{ width: "100%", height: "70vh", border: 0, borderRadius: 14 }}
                  />
                ) : (
                  <img src={mediaPreview.url} alt={mediaPreview.title} style={{ width: "100%", borderRadius: 14 }} />
                )}
                <p className="candidate-profile-modal-hint">{t("profile.candidate.documents.viewOnlyHint")}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
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
