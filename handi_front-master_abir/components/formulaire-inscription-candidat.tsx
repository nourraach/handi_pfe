"use client";

import Link from "next/link";
import { type FormEvent, type HTMLAttributes, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { construireUrlApi } from "@/lib/config";
import styles from "./formulaire-inscription-candidat.module.css";

const genreOptions = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
];

const handicapOptions = [
  { value: "", label: "Sélectionnez un type de handicap" },
  { value: "Handicap organique", label: "Handicap organique" },
  { value: "Handicap physique", label: "Handicap physique" },
  { value: "Handicap visuel", label: "Handicap visuel" },
  { value: "Handicap auditif", label: "Handicap auditif" },
  { value: "Handicap mental ou psychique", label: "Handicap mental ou psychique" },
  { value: "Autre", label: "Autre" },
];

const communicationOptions = [
  { value: "", label: "Sélectionnez une préférence" },
  { value: "Email", label: "Email" },
  { value: "Téléphone", label: "Téléphone" },
  { value: "SMS", label: "SMS" },
];

const AGE_MINIMUM = 18;
const AGE_DEFAULT = String(AGE_MINIMUM);

const steps = [
  {
    shortLabel: "1",
    title: "Informations personnelles",
    description: "Commençons par vos informations de base.",
    calloutTitle: "Des informations exactes facilitent la validation de votre compte.",
    calloutText: "Prenez quelques instants pour vérifier vos coordonnées avant de passer à l’étape suivante.",
  },
  {
    shortLabel: "2",
    title: "Profil et préférences",
    description: "Décrivez vos besoins et vos préférences de contact pour accélérer la mise en relation.",
    calloutTitle: "Nous vous aidons à éviter les erreurs de saisie.",
    calloutText: "Les listes déroulantes et les dates limitées réduisent les oublis et rendent le formulaire plus simple à compléter.",
  },
  {
    shortLabel: "3",
    title: "Informations complémentaires",
    description: "Finalisez votre profil avec quelques détails utiles.",
    calloutTitle: "Cette dernière section vous permet d’ajouter du contexte.",
    calloutText: "Une présentation claire aide les recruteurs à mieux comprendre votre parcours et vos attentes.",
  },
];

const initialState = {
  nom: "",
  email: "",
  telephone: "",
  mdp: "",
  addresse: "",
  genre: "homme",
  type_handicap: "",
  preciser_handicap: "",
  num_carte_handicap: "",
  date_expiration_carte_handicap: "",
  niveau_academique: "",
  description: "",
  secteur: "",
  preference_communication: "",
  age: AGE_DEFAULT,
};

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type FormField = keyof typeof initialState;
type FieldName = FormField | "confirmationMotDePasse" | "carte_handicap_file";

const stepFields: Record<number, FieldName[]> = {
  0: ["nom", "email", "telephone", "mdp", "confirmationMotDePasse", "genre", "age", "addresse"],
  1: [
    "type_handicap",
    "preciser_handicap",
    "num_carte_handicap",
    "date_expiration_carte_handicap",
    "carte_handicap_file",
    "niveau_academique",
    "secteur",
    "preference_communication",
  ],
  2: [],
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

function getTomorrowDateValue() {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateInput(tomorrow);
}

function normalizeAgeInput(value: string) {
  const digitsOnly = value.replace(/\D+/g, "");

  if (!digitsOnly) {
    return "";
  }

  const parsedValue = Number(digitsOnly);

  if (digitsOnly.length > 1 && parsedValue < AGE_MINIMUM) {
    return AGE_DEFAULT;
  }

  return String(parsedValue);
}

function clampAgeValue(value: string) {
  const parsedValue = Number(value);

  if (!value || Number.isNaN(parsedValue) || parsedValue < AGE_MINIMUM) {
    return AGE_DEFAULT;
  }

  return String(parsedValue);
}

function getOptionLabel(options: Array<{ value: string; label: string }>, value: string, fallback = "") {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

export function FormulaireInscriptionCandidat() {
  const [formulaire, setFormulaire] = useState(initialState);
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<FieldName, boolean>>>({});
  const [chargement, setChargement] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [carteHandicapFile, setCarteHandicapFile] = useState<File | null>(null);
  const minimumExpirationDate = getTomorrowDateValue();

  const clearStatusFeedback = () => {
    if (message) {
      setMessage(null);
    }

    if (erreur) {
      setErreur(null);
    }
  };

  const validateField = (
    field: FieldName,
    currentForm = formulaire,
    currentConfirmation = confirmationMotDePasse,
    currentCarteHandicapFile = carteHandicapFile,
  ) => {
    switch (field) {
      case "nom":
        return currentForm.nom.trim() ? null : "Veuillez renseigner votre nom complet.";
      case "email":
        if (!currentForm.email.trim()) return "Veuillez renseigner votre adresse email.";
        return /\S+@\S+\.\S+/.test(currentForm.email.trim()) ? null : "Veuillez saisir une adresse email valide.";
      case "telephone":
        return currentForm.telephone.trim() ? null : "Veuillez renseigner votre numéro de téléphone.";
      case "mdp":
        if (!currentForm.mdp.trim()) return "Veuillez créer un mot de passe.";
        return currentForm.mdp.length >= 8 ? null : "Le mot de passe doit contenir au moins 8 caractères.";
      case "confirmationMotDePasse":
        if (!currentConfirmation.trim()) return "Veuillez confirmer votre mot de passe.";
        return currentForm.mdp === currentConfirmation ? null : "Les mots de passe ne correspondent pas.";
      case "genre":
        return currentForm.genre.trim() ? null : "Veuillez sélectionner votre genre.";
      case "age": {
        if (!currentForm.age.trim()) return "Veuillez renseigner votre âge.";
        const parsedAge = Number(currentForm.age);
        if (Number.isNaN(parsedAge)) return "Veuillez renseigner un âge valide.";
        return parsedAge >= AGE_MINIMUM ? null : "Âge minimum requis : 18 ans";
      }
      case "addresse":
        return currentForm.addresse.trim() ? null : "Veuillez renseigner votre adresse complète.";
      case "type_handicap":
        return currentForm.type_handicap.trim() ? null : "Veuillez préciser le type de handicap.";
      case "preciser_handicap":
        if (currentForm.type_handicap !== "Autre") return null;
        return currentForm.preciser_handicap.trim() ? null : "Veuillez préciser votre handicap.";
      case "num_carte_handicap":
        return currentForm.num_carte_handicap.trim() ? null : "Veuillez renseigner le numéro de carte handicap.";
      case "date_expiration_carte_handicap": {
        if (!currentForm.date_expiration_carte_handicap.trim()) {
          return "Veuillez renseigner la date d'expiration de la carte.";
        }

        const expirationDate = parseDateInput(currentForm.date_expiration_carte_handicap);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!expirationDate || expirationDate <= today) {
          return "La date d’expiration doit être dans le futur";
        }

        return null;
      }
      case "carte_handicap_file":
        return currentCarteHandicapFile ? null : "Veuillez televerser votre carte handicap.";
      case "niveau_academique":
        return currentForm.niveau_academique.trim() ? null : "Veuillez renseigner votre niveau académique.";
      case "secteur":
        return currentForm.secteur.trim() ? null : "Veuillez préciser le secteur visé.";
      case "preference_communication":
        return currentForm.preference_communication.trim() ? null : "Veuillez préciser votre préférence de communication.";
      default:
        return null;
    }
  };

  const touchField = (field: FieldName) => {
    setTouchedFields((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  const touchFields = (fields: FieldName[]) => {
    setTouchedFields((current) => {
      const nextTouchedFields = { ...current };

      fields.forEach((field) => {
        nextTouchedFields[field] = true;
      });

      return nextTouchedFields;
    });
  };

  const collectValidationErrors = (
    fields: FieldName[],
    currentForm = formulaire,
    currentConfirmation = confirmationMotDePasse,
    currentCarteHandicapFile = carteHandicapFile,
  ) => {
    const nextErrors: Partial<Record<FieldName, string>> = {};

    fields.forEach((field) => {
      const errorMessage = validateField(field, currentForm, currentConfirmation, currentCarteHandicapFile);

      if (errorMessage) {
        nextErrors[field] = errorMessage;
      }
    });

    return nextErrors;
  };

  const applyValidationErrors = (fields: FieldName[], nextErrors: Partial<Record<FieldName, string>>) => {
    setFieldErrors((current) => {
      const mergedErrors = { ...current };

      fields.forEach((field) => {
        delete mergedErrors[field];
      });

      return { ...mergedErrors, ...nextErrors };
    });
  };

  const updateField = (field: FormField, value: string) => {
    const nextValue = field === "age" ? normalizeAgeInput(value) : value;
    const nextForm = {
      ...formulaire,
      [field]: nextValue,
    };

    if (field === "type_handicap" && nextValue !== "Autre") {
      nextForm.preciser_handicap = "";
      setTouchedFields((current) => {
        if (!current.preciser_handicap) {
          return current;
        }

        const nextTouchedFields = { ...current };
        delete nextTouchedFields.preciser_handicap;
        return nextTouchedFields;
      });
    }

    setFormulaire(nextForm);
    clearStatusFeedback();

    const fieldsToRefresh: FieldName[] = [field];

    if (field === "mdp") {
      fieldsToRefresh.push("confirmationMotDePasse");
    }

    if (field === "type_handicap") {
      fieldsToRefresh.push("preciser_handicap");
    }

    const touchedFieldsToRefresh = fieldsToRefresh.filter((fieldName) => Boolean(touchedFields[fieldName]));

    if (touchedFieldsToRefresh.length > 0) {
      applyValidationErrors(touchedFieldsToRefresh, collectValidationErrors(touchedFieldsToRefresh, nextForm, confirmationMotDePasse));
    }
  };

  const updateConfirmationField = (value: string) => {
    setConfirmationMotDePasse(value);
    clearStatusFeedback();

    if (touchedFields.confirmationMotDePasse) {
      applyValidationErrors(["confirmationMotDePasse"], collectValidationErrors(["confirmationMotDePasse"], formulaire, value));
    }
  };

  const handleFieldBlur = (field: FieldName) => {
    touchField(field);
    applyValidationErrors([field], collectValidationErrors([field]));
  };

  const updateCarteHandicapFile = (file: File | null) => {
    setCarteHandicapFile(file);
    clearStatusFeedback();

    if (touchedFields.carte_handicap_file) {
      applyValidationErrors(
        ["carte_handicap_file"],
        collectValidationErrors(["carte_handicap_file"], formulaire, confirmationMotDePasse, file),
      );
    }
  };

  const handleAgeBlur = () => {
    const clampedAge = clampAgeValue(formulaire.age);
    const nextForm = clampedAge === formulaire.age ? formulaire : { ...formulaire, age: clampedAge };

    if (nextForm !== formulaire) {
      setFormulaire(nextForm);
    }

    touchField("age");
    applyValidationErrors(["age"], collectValidationErrors(["age"], nextForm));
  };

  const validateStep = (stepIndex: number) => {
    const fieldsToValidate = stepFields[stepIndex] ?? [];

    if (fieldsToValidate.length === 0) {
      return true;
    }

    touchFields(fieldsToValidate);
    const validationErrors = collectValidationErrors(fieldsToValidate);
    applyValidationErrors(fieldsToValidate, validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const goToStep = (targetStep: number) => {
    const nextStep = targetStep > activeStep + 1 ? activeStep + 1 : targetStep;

    if (nextStep <= activeStep) {
      setErreur(null);
      setActiveStep(nextStep);
      return;
    }

    if (!validateStep(activeStep)) {
      setErreur(null);
      return;
    }

    setErreur(null);
    setActiveStep(nextStep);
  };

  const goNext = () => {
    if (!validateStep(activeStep)) {
      setErreur(null);
      return;
    }

    setErreur(null);
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setErreur(null);
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const submitApplication = async () => {
    for (let index = 0; index < steps.length - 1; index += 1) {
      if (!validateStep(index)) {
        setErreur(null);
        setActiveStep(index);
        return;
      }
    }

    setChargement(true);
    setMessage(null);
    setErreur(null);

    try {
      const { preciser_handicap, ...restOfForm } = formulaire;
      const normalizedHandicap =
        formulaire.type_handicap === "Autre" ? `Autre : ${preciser_handicap.trim()}` : formulaire.type_handicap;

      const payload = new FormData();
      payload.append("nom", restOfForm.nom);
      payload.append("email", restOfForm.email);
      payload.append("telephone", restOfForm.telephone);
      payload.append("mdp", restOfForm.mdp);
      payload.append("addresse", restOfForm.addresse);
      payload.append("genre", restOfForm.genre);
      payload.append("type_handicap", normalizedHandicap);
      payload.append("num_carte_handicap", restOfForm.num_carte_handicap);
      payload.append("date_expiration_carte_handicap", restOfForm.date_expiration_carte_handicap);
      payload.append("niveau_academique", restOfForm.niveau_academique);
      payload.append("description", restOfForm.description);
      payload.append("secteur", restOfForm.secteur);
      payload.append("type_licence", "");
      payload.append("preference_communication", restOfForm.preference_communication);
      payload.append("age", clampAgeValue(restOfForm.age));

      if (carteHandicapFile) {
        payload.append("carte_handicap", carteHandicapFile);
      }

      const response = await fetch(construireUrlApi("/api/auth/inscription/candidat"), {
        method: "POST",
        body: payload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Impossible de créer votre compte pour le moment.");
      }

      setMessage(result.message ?? "Votre compte a bien été créé.");
      setFormulaire(initialState);
      setConfirmationMotDePasse("");
      setCarteHandicapFile(null);
      setFieldErrors({});
      setTouchedFields({});
      setActiveStep(0);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activeStep < steps.length - 1) {
      goNext();
      return;
    }

    await submitApplication();
  };

  const currentStep = steps[activeStep];
  const progressValue = (activeStep / (steps.length - 1)) * 100;
  const profileSummary = `${formulaire.nom || "Votre nom"}, ${getOptionLabel(genreOptions, formulaire.genre, "non précisé")}`;
  const communicationSummary = getOptionLabel(communicationOptions, formulaire.preference_communication, "À définir");

  return (
    <main className={classes("app-theme", styles.signupPage)}>
      <section className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <Link href="/" className={styles.wordmark} aria-label="Retour à l'accueil HandiTalents">
              <span>HANDI</span>
              <span>TALENTS</span>
            </Link>

            <nav className={styles.sidebarSteps} aria-label="Étapes d'inscription">
              {steps.map((step, index) => {
                const isActive = activeStep === index;
                const isCompleted = activeStep > index;

                return (
                  <div key={step.title} className={styles.sidebarStep}>
                    <button
                      type="button"
                      className={classes(
                        styles.sidebarStepButton,
                        isActive && styles.sidebarStepButtonActive,
                        isCompleted && styles.sidebarStepButtonCompleted,
                      )}
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => goToStep(index)}
                    >
                      <span className={styles.sidebarStepMarker}>{step.shortLabel}</span>
                      <span className={styles.sidebarStepText}>{step.title}</span>
                    </button>
                    {index < steps.length - 1 ? <span className={styles.sidebarConnector} aria-hidden="true" /> : null}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <Card className={styles.formCard} padding="lg">
          <div className={styles.headerRow}>
            <div className={styles.headerCopy}>
              <h1 className={styles.pageTitle}>
                Créez votre <span>compte</span>
                <span className={styles.wave} aria-hidden="true">
                </span>
              </h1>
            </div>

            <div className={styles.authSwitch}>
              <span>Déjà un compte ?</span>
              <Link href="/connexion">Se connecter</Link>
            </div>
          </div>

          <div className={styles.progressBlock} aria-label="Progression de l'inscription">
            <div className={styles.progressTrack} aria-hidden="true">
              <div className={styles.progressFill} style={{ width: `${progressValue}%` }} />
            </div>
            <div className={styles.progressSteps}>
              {steps.map((step, index) => {
                const isActive = activeStep === index;
                const isCompleted = activeStep > index;

                return (
                  <button
                    key={step.title}
                    type="button"
                    className={classes(
                      styles.progressStep,
                      isActive && styles.progressStepActive,
                      isCompleted && styles.progressStepCompleted,
                    )}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => goToStep(index)}
                  >
                    {step.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.sectionIntro}>
            <div className={styles.sectionIcon} aria-hidden="true">
              <UserCircleIcon />
            </div>
            <div>
              <h2>{currentStep.title}</h2>
              <p>{currentStep.description}</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {activeStep === 0 ? (
              <div className={styles.formGrid}>
                <InputField
                  name="nom"
                  label="Nom complet"
                  placeholder="Entrez votre nom complet"
                  value={formulaire.nom}
                  autoComplete="name"
                  icon={<UserIcon />}
                  onChange={(value) => updateField("nom", value)}
                  onBlur={() => handleFieldBlur("nom")}
                  error={fieldErrors.nom}
                  required
                />
                <InputField
                  name="email"
                  label="Email"
                  placeholder="Entrez votre email"
                  value={formulaire.email}
                  autoComplete="email"
                  type="email"
                  icon={<MailIcon />}
                  onChange={(value) => updateField("email", value)}
                  onBlur={() => handleFieldBlur("email")}
                  error={fieldErrors.email}
                  required
                />
                <InputField
                  name="telephone"
                  label="Numéro de téléphone"
                  placeholder="Entrez votre numéro"
                  value={formulaire.telephone}
                  autoComplete="tel"
                  icon={<PhoneIcon />}
                  onChange={(value) => updateField("telephone", value)}
                  onBlur={() => handleFieldBlur("telephone")}
                  error={fieldErrors.telephone}
                  required
                />
                <PasswordField
                  name="mot-de-passe"
                  label="Mot de passe"
                  placeholder="Créez un mot de passe"
                  value={formulaire.mdp}
                  visible={showPassword}
                  onToggleVisibility={() => setShowPassword((current) => !current)}
                  onChange={(value) => updateField("mdp", value)}
                  onBlur={() => handleFieldBlur("mdp")}
                  error={fieldErrors.mdp}
                />
                <PasswordField
                  name="confirmation-mot-de-passe"
                  label="Confirmer le mot de passe"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmationMotDePasse}
                  visible={showPasswordConfirmation}
                  onToggleVisibility={() => setShowPasswordConfirmation((current) => !current)}
                  onChange={updateConfirmationField}
                  onBlur={() => handleFieldBlur("confirmationMotDePasse")}
                  error={fieldErrors.confirmationMotDePasse}
                />
                <SelectField
                  name="genre"
                  label="Genre"
                  value={formulaire.genre}
                  icon={<UserCircleIcon />}
                  onChange={(value) => updateField("genre", value)}
                  onBlur={() => handleFieldBlur("genre")}
                  options={genreOptions}
                  error={fieldErrors.genre}
                  required
                />
                <InputField
                  name="age"
                  label="Âge"
                  value={formulaire.age}
                  type="number"
                  min={AGE_DEFAULT}
                  max="99"
                  step="1"
                  inputMode="numeric"
                  icon={<SparkIcon />}
                  onChange={(value) => updateField("age", value)}
                  onBlur={handleAgeBlur}
                  error={fieldErrors.age}
                  helpText="Âge minimum requis : 18 ans"
                  required
                />
                <InputField
                  name="addresse"
                  label="Adresse"
                  placeholder="Entrez votre adresse complète"
                  value={formulaire.addresse}
                  autoComplete="street-address"
                  icon={<MapPinIcon />}
                  onChange={(value) => updateField("addresse", value)}
                  onBlur={() => handleFieldBlur("addresse")}
                  error={fieldErrors.addresse}
                  required
                  span="wide"
                />
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className={styles.formGrid}>
                <SelectField
                  name="type-handicap"
                  label="Type de handicap"
                  value={formulaire.type_handicap}
                  icon={<AccessibilityIcon />}
                  onChange={(value) => updateField("type_handicap", value)}
                  onBlur={() => handleFieldBlur("type_handicap")}
                  options={handicapOptions}
                  error={fieldErrors.type_handicap}
                  required
                />
                {formulaire.type_handicap === "Autre" ? (
                  <InputField
                    name="preciser-handicap"
                    label="Veuillez préciser votre handicap"
                    placeholder="Décrivez votre handicap"
                    value={formulaire.preciser_handicap}
                    icon={<AccessibilityIcon />}
                    onChange={(value) => updateField("preciser_handicap", value)}
                    onBlur={() => handleFieldBlur("preciser_handicap")}
                    error={fieldErrors.preciser_handicap}
                    required
                    span="wide"
                  />
                ) : null}
                <InputField
                  name="num-carte-handicap"
                  label="Numéro de carte handicap"
                  placeholder="Entrez votre numéro"
                  value={formulaire.num_carte_handicap}
                  icon={<BadgeIcon />}
                  onChange={(value) => updateField("num_carte_handicap", value)}
                  onBlur={() => handleFieldBlur("num_carte_handicap")}
                  error={fieldErrors.num_carte_handicap}
                  required
                />
                <InputField
                  name="expiration-carte"
                  label="Expiration de la carte"
                  value={formulaire.date_expiration_carte_handicap}
                  type="date"
                  min={minimumExpirationDate}
                  icon={<CalendarIcon />}
                  onChange={(value) => updateField("date_expiration_carte_handicap", value)}
                  onBlur={() => handleFieldBlur("date_expiration_carte_handicap")}
                  error={fieldErrors.date_expiration_carte_handicap}
                  required
                />
                <FileField
                  name="carte-handicap-file"
                  label="Carte handicap (obligatoire)"
                  icon={<BadgeIcon />}
                  accept=".pdf,.png,.jpg,.jpeg"
                  file={carteHandicapFile}
                  onChange={updateCarteHandicapFile}
                  onBlur={() => handleFieldBlur("carte_handicap_file")}
                  error={fieldErrors.carte_handicap_file}
                  helpText="Ajoutez une copie PDF, PNG ou JPG de votre carte en cours de validite."
                  span="wide"
                />
                <InputField
                  name="niveau-academique"
                  label="Niveau académique"
                  placeholder="Votre niveau d'études"
                  value={formulaire.niveau_academique}
                  icon={<GraduationIcon />}
                  onChange={(value) => updateField("niveau_academique", value)}
                  onBlur={() => handleFieldBlur("niveau_academique")}
                  error={fieldErrors.niveau_academique}
                  required
                />
                <InputField
                  name="secteur-vise"
                  label="Secteur visé"
                  placeholder="Ex. design, support, tech"
                  value={formulaire.secteur}
                  icon={<BriefcaseIcon />}
                  onChange={(value) => updateField("secteur", value)}
                  onBlur={() => handleFieldBlur("secteur")}
                  error={fieldErrors.secteur}
                  required
                />
                <SelectField
                  name="preference-communication"
                  label="Préférence de communication"
                  value={formulaire.preference_communication}
                  icon={<ChatIcon />}
                  onChange={(value) => updateField("preference_communication", value)}
                  onBlur={() => handleFieldBlur("preference_communication")}
                  options={communicationOptions}
                  error={fieldErrors.preference_communication}
                  required
                  span="wide"
                />
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className={styles.finalStep}>
                <div className={styles.formGrid}>
                  <TextAreaField
                    name="description"
                    label="Présentation"
                    placeholder="Parlez-nous de votre parcours, de vos aspirations et des conditions qui vous aident à travailler sereinement."
                    value={formulaire.description}
                    icon={<EditIcon />}
                    onChange={(value) => updateField("description", value)}
                    span="full"
                  />
                </div>

                <div className={styles.summaryGrid}>
                  <SummaryItem label="Profil" value={profileSummary} />
                  <SummaryItem label="Contact" value={formulaire.email || "Votre email"} />
                  <SummaryItem label="Secteur" value={formulaire.secteur || "À définir"} />
                  <SummaryItem label="Communication" value={communicationSummary} />
                </div>
              </div>
            ) : null}

            <div className={styles.callout}>
              <span className={styles.calloutIcon} aria-hidden="true">
                <InfoIcon />
              </span>
              <div>
                <strong>{currentStep.calloutTitle}</strong>
                <p>{currentStep.calloutText}</p>
              </div>
            </div>

            {erreur ? (
              <p className={classes(styles.feedback, styles.feedbackError)} role="alert" aria-live="polite">
                {erreur}
              </p>
            ) : null}

            {message ? (
              <p className={classes(styles.feedback, styles.feedbackSuccess)} role="status" aria-live="polite">
                {message}
              </p>
            ) : null}

            <div className={styles.actionRow}>
              {activeStep > 0 ? (
                <Button type="button" variant="ghost" className={styles.secondaryAction} onClick={goBack}>
                  Retour
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}

              <Button type="submit" variant="primary" className={styles.primaryAction} disabled={chargement}>
                {chargement ? "Création..." : activeStep === steps.length - 1 ? "Créer mon compte" : "Continuer"}
              </Button>
            </div>
          </form>
        </Card>

        
      </section>
    </main>
  );
}

function InputField({
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  icon,
  type = "text",
  autoComplete,
  min,
  max,
  step,
  inputMode,
  error,
  helpText,
  required,
  span,
}: {
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon: ReactNode;
  type?: string;
  autoComplete?: string;
  min?: string;
  max?: string;
  step?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  helpText?: string;
  required?: boolean;
  span?: "wide" | "full";
}) {
  const id = `candidate-signup-${name}`;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      className={classes(
        styles.field,
        span === "wide" && styles.fieldSpanTwo,
        span === "full" && styles.fieldFullWidth,
        error && styles.fieldError,
      )}
      htmlFor={id}
    >
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.controlShell}>
        <span className={styles.leadingIcon} aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          className={styles.control}
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      </span>
      {helpText ? (
        <span id={helpId} className={styles.fieldHelp}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.fieldErrorText} role="alert" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function FileField({
  name,
  label,
  icon,
  accept,
  file,
  onChange,
  onBlur,
  error,
  helpText,
  required,
  span,
}: {
  name: string;
  label: string;
  icon: ReactNode;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  span?: "wide" | "full";
}) {
  const id = `candidate-signup-${name}`;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      className={classes(
        styles.field,
        span === "wide" && styles.fieldSpanTwo,
        span === "full" && styles.fieldFullWidth,
        error && styles.fieldError,
      )}
      htmlFor={id}
    >
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.controlShell} style={{ position: "relative", cursor: "pointer" }}>
        <span className={styles.leadingIcon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.control} style={{ display: "inline-flex", alignItems: "center" }}>
          {file ? file.name : "Aucun fichier selectionne"}
        </span>
        <span className={styles.trailingIcon} aria-hidden="true">
          {file ? "Remplacer" : "Choisir"}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          required={required && !file}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          onBlur={onBlur}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </span>
      {helpText ? (
        <span id={helpId} className={styles.fieldHelp}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.fieldErrorText} role="alert" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function PasswordField({
  name,
  label,
  placeholder,
  value,
  visible,
  onChange,
  onBlur,
  onToggleVisibility,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onToggleVisibility: () => void;
  error?: string;
}) {
  const id = `candidate-signup-${name}`;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className={classes(styles.field, error && styles.fieldError)} htmlFor={id}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.controlShell}>
        <span className={styles.leadingIcon} aria-hidden="true">
          <LockIcon />
        </span>
        <input
          id={id}
          className={styles.control}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete="new-password"
          placeholder={placeholder}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggleVisibility}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {error ? (
        <span id={errorId} className={styles.fieldErrorText} role="alert" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  name,
  label,
  value,
  onChange,
  onBlur,
  icon,
  options,
  error,
  helpText,
  required,
  span,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon: ReactNode;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helpText?: string;
  required?: boolean;
  span?: "wide" | "full";
}) {
  const id = `candidate-signup-${name}`;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      className={classes(
        styles.field,
        span === "wide" && styles.fieldSpanTwo,
        span === "full" && styles.fieldFullWidth,
        error && styles.fieldError,
      )}
      htmlFor={id}
    >
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.controlShell}>
        <span className={styles.leadingIcon} aria-hidden="true">
          {icon}
        </span>
        <select
          id={id}
          className={classes(styles.control, styles.selectControl)}
          value={value}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.trailingIcon} aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </span>
      {helpText ? (
        <span id={helpId} className={styles.fieldHelp}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.fieldErrorText} role="alert" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  icon,
  error,
  helpText,
  span,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon: ReactNode;
  error?: string;
  helpText?: string;
  span?: "wide" | "full";
}) {
  const id = `candidate-signup-${name}`;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      className={classes(
        styles.field,
        span === "wide" && styles.fieldSpanTwo,
        span === "full" && styles.fieldFullWidth,
        error && styles.fieldError,
      )}
      htmlFor={id}
    >
      <span className={styles.fieldLabel}>{label}</span>
      <span className={classes(styles.controlShell, styles.textAreaShell)}>
        <span className={styles.leadingIcon} aria-hidden="true">
          {icon}
        </span>
        <textarea
          id={id}
          className={classes(styles.control, styles.textareaControl)}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      </span>
      {helpText ? (
        <span id={helpId} className={styles.fieldHelp}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.fieldErrorText} role="alert" aria-live="polite">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BaseIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function UserIcon() {
  return (
    <BaseIcon>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </BaseIcon>
  );
}

function UserCircleIcon() {
  return (
    <BaseIcon>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7.5 18a5.2 5.2 0 0 1 9 0" />
    </BaseIcon>
  );
}

function MailIcon() {
  return (
    <BaseIcon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </BaseIcon>
  );
}

function PhoneIcon() {
  return (
    <BaseIcon>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.3 19.3 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 16.9Z" />
    </BaseIcon>
  );
}

function LockIcon() {
  return (
    <BaseIcon>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </BaseIcon>
  );
}

function EyeIcon() {
  return (
    <BaseIcon>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </BaseIcon>
  );
}

function EyeOffIcon() {
  return (
    <BaseIcon>
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a16.7 16.7 0 0 1-3.1 4.2" />
      <path d="M6.6 6.6C4 8.2 2 12 2 12a16.9 16.9 0 0 0 7.4 5.7" />
    </BaseIcon>
  );
}

function MapPinIcon() {
  return (
    <BaseIcon>
      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </BaseIcon>
  );
}

function SparkIcon() {
  return (
    <BaseIcon>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
      <path d="m5 14 .7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z" />
    </BaseIcon>
  );
}

function AccessibilityIcon() {
  return (
    <BaseIcon>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M8 10h8" />
      <path d="m12 7 1.5 5.5 4 1.5" />
      <path d="m12 7-1.5 5.5-4 1.5" />
      <path d="m10.5 15.5-1.5 4.5" />
      <path d="m13.5 15.5 1.5 4.5" />
    </BaseIcon>
  );
}

function BadgeIcon() {
  return (
    <BaseIcon>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 13h4" />
    </BaseIcon>
  );
}

function CalendarIcon() {
  return (
    <BaseIcon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </BaseIcon>
  );
}

function GraduationIcon() {
  return (
    <BaseIcon>
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    </BaseIcon>
  );
}

function BriefcaseIcon() {
  return (
    <BaseIcon>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </BaseIcon>
  );
}

function ChatIcon() {
  return (
    <BaseIcon>
      <path d="M5 18 3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </BaseIcon>
  );
}

function EditIcon() {
  return (
    <BaseIcon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </BaseIcon>
  );
}

function InfoIcon() {
  return (
    <BaseIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

function ChevronDownIcon() {
  return (
    <BaseIcon>
      <path d="m6 9 6 6 6-6" />
    </BaseIcon>
  );
}
