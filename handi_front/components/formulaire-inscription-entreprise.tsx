"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  FileText,
  FileUp,
  Globe,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { construireUrlApi } from "@/lib/config";
import styles from "./formulaire-inscription-entreprise.module.css";

const etatInitial = {
  nom: "",
  email: "",
  telephone: "",
  mdp: "",
  addresse: "",
  nom_entreprise: "",
  rne: "",
  profil_publique: true,
  url_site: "",
  date_fondation: "",
  description: "",
  nbr_employe: "1",
  nbr_employe_handicape: "",
};

function normalizeIntegerInput(value: string, minimum: number) {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return String(minimum);
  const parsed = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed) || parsed < minimum) return String(minimum);
  return String(parsed);
}

export function FormulaireInscriptionEntreprise() {
  const [formulaire, setFormulaire] = useState(etatInitial);
  const [patentePhoto, setPatentePhoto] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChargement(true);
    setMessage(null);
    setErreur(null);

    if (formulaire.date_fondation) {
      const dateFondation = new Date(formulaire.date_fondation);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

      if (dateFondation > aujourdhui) {
        setErreur("La date de fondation ne peut pas etre dans le futur.");
        setChargement(false);
        return;
      }
    }

    if (!patentePhoto) {
      setErreur("La photo de patente est requise.");
      setChargement(false);
      return;
    }

    const mimeAutorises = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
    if (!mimeAutorises.has(patentePhoto.type)) {
      setErreur("La photo de patente doit etre en PNG, JPG ou WEBP.");
      setChargement(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nom", formulaire.nom);
      formData.append("email", formulaire.email);
      formData.append("telephone", formulaire.telephone);
      formData.append("mdp", formulaire.mdp);
      formData.append("addresse", formulaire.addresse);
      formData.append("nom_entreprise", formulaire.nom_entreprise);
      formData.append("patente", patentePhoto);
      formData.append("rne", formulaire.rne);
      formData.append("profil_publique", String(formulaire.profil_publique));
      formData.append("url_site", formulaire.url_site);
      formData.append("date_fondation", formulaire.date_fondation);
      formData.append("description", formulaire.description);
      formData.append("nbr_employe", String(Number(formulaire.nbr_employe)));
      formData.append("nbr_employe_handicape", String(Number(formulaire.nbr_employe_handicape)));

      const reponse = await fetch(construireUrlApi("/api/auth/inscription/entreprise"), {
        method: "POST",
        body: formData,
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.message ?? "Impossible de soumettre la demande.");
      }

      setMessage(resultat.message ?? "Votre demande a bien ete envoyee.");
      setFormulaire(etatInitial);
      setPatentePhoto(null);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={soumettre}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Inscription entreprise</p>
          <h1 className={styles.title}>Simple et rapide</h1>
          <p className={styles.subtitle}>
            Juste les informations utiles pour déposer la demande et activer le premier accès.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <Field
          label="Nom complet"
          placeholder="Ex. Asma Bouazizi"
          icon={<UserRound aria-hidden="true" />}
          value={formulaire.nom}
          onChange={(nom) => setFormulaire({ ...formulaire, nom })}
        />
        <Field
          label="Email"
          type="email"
          placeholder="exemple@handitalents.tn"
          icon={<Mail aria-hidden="true" />}
          value={formulaire.email}
          onChange={(email) => setFormulaire({ ...formulaire, email })}
        />
        <Field
          label="Téléphone"
          placeholder="+216 XX XXX XXX"
          icon={<Phone aria-hidden="true" />}
          value={formulaire.telephone}
          onChange={(telephone) => setFormulaire({ ...formulaire, telephone })}
        />
        <Field
          label="Mot de passe"
          type="password"
          placeholder="Créer un mot de passe"
          icon={<LockKeyhole aria-hidden="true" />}
          value={formulaire.mdp}
          onChange={(mdp) => setFormulaire({ ...formulaire, mdp })}
        />

        <Field
          label="Nom de l entreprise"
          placeholder="Ex. HandiTalents"
          icon={<Building2 aria-hidden="true" />}
          value={formulaire.nom_entreprise}
          onChange={(nom_entreprise) => setFormulaire({ ...formulaire, nom_entreprise })}
        />
        <Field
          label="RNE"
          placeholder="Ex. RNE-TN-000000"
          icon={<FileText aria-hidden="true" />}
          value={formulaire.rne}
          onChange={(rne) => setFormulaire({ ...formulaire, rne })}
        />
        <Field
          label="Adresse"
          placeholder="Rue, ville, code postal"
          icon={<MapPin aria-hidden="true" />}
          value={formulaire.addresse}
          onChange={(addresse) => setFormulaire({ ...formulaire, addresse })}
        />
        <Field
          label="Site web"
          type="url"
          placeholder="https://..."
          icon={<Globe aria-hidden="true" />}
          value={formulaire.url_site}
          onChange={(url_site) => setFormulaire({ ...formulaire, url_site })}
        />

        <Field
          label="Date de fondation"
          type="date"
          icon={<CalendarDays aria-hidden="true" />}
          value={formulaire.date_fondation}
          onChange={(date_fondation) => setFormulaire({ ...formulaire, date_fondation })}
          max={todayIso}
        />

        <div className={styles.numbersRow}>
          <Field
            label="Nombre d employés"
            type="number"
            placeholder="Ex. 45"
            icon={<Users aria-hidden="true" />}
            value={formulaire.nbr_employe}
            min="1"
            step="1"
            inputMode="numeric"
            onChange={(nbr_employe) => setFormulaire({ ...formulaire, nbr_employe: normalizeIntegerInput(nbr_employe, 1) })}
          />
          <Field
            label="Employés en situation de handicap"
            type="number"
            placeholder="Ex. 5"
            icon={<Users aria-hidden="true" />}
            value={formulaire.nbr_employe_handicape}
            min="0"
            step="1"
            inputMode="numeric"
            onChange={(nbr_employe_handicape) =>
              setFormulaire({ ...formulaire, nbr_employe_handicape: normalizeIntegerInput(nbr_employe_handicape, 0) })
            }
          />
        </div>

        <div className={styles.detailsRow}>
          <div className={styles.mediaField}>
            <label className={styles.fieldLabel} htmlFor="patente-photo">
              Photo de patente
            </label>
            <label className={`${styles.dropzone}${patentePhoto ? ` ${styles.dropzoneFilled}` : ""}`} htmlFor="patente-photo">
              <span className={styles.dropzoneIcon} aria-hidden="true">
                <FileUp />
              </span>
              <span className={styles.dropzoneCopy}>
                <strong>{patentePhoto ? patentePhoto.name : "Ajouter une image"}</strong>
                <span>PNG, JPG ou WEBP.</span>
              </span>
              <span className={styles.dropzoneAction}>{patentePhoto ? "Modifier" : "Choisir"}</span>
            </label>
            <input
              id="patente-photo"
              className={styles.fileInput}
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(event) => setPatentePhoto(event.target.files?.[0] || null)}
              required
            />
          </div>

          <div className={styles.textField}>
            <label className={styles.fieldLabel} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              placeholder="Activite de l'entreprise"
              value={formulaire.description}
              onChange={(event) => setFormulaire({ ...formulaire, description: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button disabled={chargement} type="submit" size="lg" className={styles.submitButton}>
          {chargement ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </div>

      {message ? <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{message}</p> : null}
      {erreur ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{erreur}</p> : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon,
  min,
  max,
  step,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  min?: string;
  max?: string;
  step?: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        {icon ? <span className={styles.inputIcon}>{icon}</span> : null}
        <input
          id={id}
          className={`${styles.input}${icon ? ` ${styles.inputWithIcon}` : ""}`}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={type !== "url"}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
        />
      </div>
    </div>
  );
}
