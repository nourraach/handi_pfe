"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilInspecteurAnetiProps {
  utilisateur: UtilisateurConnecte;
  lectureSeule?: boolean;
}

interface ProfilInspecteurAnetiData {
  nom: string;
  email: string;
  region: string;
  telephone: string;
  addresse: string;
}

export function ProfilInspecteurAneti({ utilisateur, lectureSeule = false }: ProfilInspecteurAnetiProps) {
  const [profil, setProfil] = useState<ProfilInspecteurAnetiData>({
    nom: utilisateur.nom || "",
    email: utilisateur.email || "",
    region: utilisateur.region || "",
    telephone: "",
    addresse: "",
  });
  const [modeEdition, setModeEdition] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const roleLabel = utilisateur.role === "aneti" ? "ANETI" : "Inspecteur";
  const regionLabel = profil.region || "Non renseignée";
  const initials = getInitials(profil.nom, roleLabel);
  const missionLabel = utilisateur.role === "aneti" ? "Accompagnement emploi" : "Contrôle et conformité";
  const scopeLabel = utilisateur.role === "aneti" ? "Orientation des candidats et suivi des opportunités" : "Suivi des entreprises et conformité inclusive";
  const storageKey = `profil_${utilisateur.role}_${utilisateur.id_utilisateur}`;

  useEffect(() => {
    if (lectureSeule) {
      return;
    }

    const storedProfile = localStorage.getItem(storageKey);
    if (!storedProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(storedProfile) as Partial<ProfilInspecteurAnetiData>;
      setProfil((current) => ({ ...current, ...parsedProfile }));
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [lectureSeule, storageKey]);

  const sauvegarderProfil = async () => {
    setChargement(true);
    setMessage(null);
    setErreur(null);

    const profilSauvegarde = {
      ...profil,
      nom: profil.nom.trim(),
      email: profil.email.trim(),
      region: profil.region.trim(),
      telephone: profil.telephone.trim(),
      addresse: profil.addresse.trim(),
    };

    try {
      const token = localStorage.getItem("token_auth");
      if (token) {
        await fetch(construireUrlApi(`/api/admin/utilisateurs/${utilisateur.id_utilisateur}`), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...profilSauvegarde,
            role: utilisateur.role,
            statut: utilisateur.statut,
          }),
        }).catch(() => null);
      }

      localStorage.setItem(storageKey, JSON.stringify(profilSauvegarde));

      const utilisateurData = localStorage.getItem("utilisateur_connecte");
      if (utilisateurData) {
        const utilisateurParse = JSON.parse(utilisateurData) as UtilisateurConnecte;
        utilisateurParse.nom = profilSauvegarde.nom || utilisateurParse.nom;
        utilisateurParse.email = profilSauvegarde.email || utilisateurParse.email;
        utilisateurParse.region = profilSauvegarde.region || utilisateurParse.region;
        localStorage.setItem("utilisateur_connecte", JSON.stringify(utilisateurParse));
      }

      setProfil(profilSauvegarde);
      setModeEdition(false);
      setMessage("Profil mis à jour avec succès.");
    } catch {
      setErreur("Impossible d'enregistrer le profil pour le moment.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <section className="candidate-profile-medical enterprise-profile-page inspector-profile-page">
      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <section className="candidate-profile-card enterprise-profile-overview">
        <div className="candidate-profile-topbar enterprise-profile-topbar">
          <div>
            <p className="candidate-profile-kicker">Espace profil</p>
            <h2>Profil {roleLabel}</h2>
          </div>
          {!lectureSeule ? (
            <div className="candidate-profile-actions">
              <button
                type="button"
                className="candidate-profile-button candidate-profile-button-secondary"
                onClick={() => setModeEdition((current) => !current)}
              >
                {modeEdition ? "Quitter l'édition" : "Modifier"}
              </button>
              <button
                type="button"
                className="candidate-profile-button candidate-profile-button-primary"
                onClick={() => void sauvegarderProfil()}
                disabled={chargement}
              >
                {chargement ? "Enregistrement..." : "Enregistrer"}
              </button>
              <ButtonLink href="/supervision" size="sm" className="candidate-profile-button candidate-profile-button-primary">
                Ouvrir la supervision
              </ButtonLink>
            </div>
          ) : null}
        </div>

        <article className="candidate-profile-hero enterprise-profile-hero">
          <div className="candidate-profile-hero-main enterprise-profile-hero-main">
            <div className="candidate-profile-photo-shell">
              <div className="candidate-profile-photo-fallback">{initials}</div>
            </div>
            <div className="candidate-profile-identity-copy">
              <strong>{profil.nom || utilisateur.nom}</strong>
              <span>
                <Mail size={14} /> {profil.email || utilisateur.email}
              </span>
              <span>
                <MapPin size={14} /> {regionLabel}
              </span>
              <span>
                <ShieldCheck size={14} /> Compte {utilisateur.statut || "actif"}
              </span>
            </div>
          </div>

          <div className="candidate-profile-hero-stats enterprise-profile-hero-stats">
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat">
              <UserRound size={18} />
              <span>Rôle</span>
              <strong>{roleLabel}</strong>
            </div>
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat">
              <MapPin size={18} />
              <span>Délégation</span>
              <strong>{regionLabel}</strong>
            </div>
            <div className="candidate-profile-mini-stat enterprise-profile-mini-stat">
              <BriefcaseBusiness size={18} />
              <span>Mission</span>
              <strong>{missionLabel}</strong>
            </div>
          </div>
        </article>
      </section>

      <div className="candidate-profile-grid inspector-profile-grid">
        <article className="candidate-profile-card candidate-profile-section candidate-profile-general">
          <div className="candidate-profile-card-head">
            <strong>Informations du compte</strong>
          </div>
          <div className="candidate-profile-info-compact">
            <EditableProfileDetail
              label="Nom complet"
              value={profil.nom}
              edit={modeEdition}
              onChange={(value) => setProfil((current) => ({ ...current, nom: value }))}
            />
            <EditableProfileDetail
              label="Adresse email"
              value={profil.email}
              edit={modeEdition}
              type="email"
              onChange={(value) => setProfil((current) => ({ ...current, email: value }))}
            />
            <ProfileDetail label="Statut" value={utilisateur.statut || "Actif"} />
            <EditableProfileDetail
              label="Délégation"
              value={profil.region}
              edit={modeEdition}
              placeholder="Ex. Tunis"
              onChange={(value) => setProfil((current) => ({ ...current, region: value }))}
            />
            <EditableProfileDetail
              label="Téléphone"
              value={profil.telephone}
              edit={modeEdition}
              type="tel"
              placeholder="Ex. +216 00 000 000"
              onChange={(value) => setProfil((current) => ({ ...current, telephone: value }))}
            />
            <EditableProfileDetail
              label="Adresse"
              value={profil.addresse}
              edit={modeEdition}
              placeholder="Adresse professionnelle"
              onChange={(value) => setProfil((current) => ({ ...current, addresse: value }))}
            />
          </div>
        </article>

        <article className="candidate-profile-card candidate-profile-section candidate-profile-accessibility">
          <div className="candidate-profile-card-head">
            <strong>Périmètre de supervision</strong>
          </div>
          <div className="candidate-profile-stack">
            <div className="candidate-profile-support-chip">
              <ShieldCheck size={14} />
              <span>{scopeLabel}</span>
            </div>
            <div className="candidate-profile-support-chip">
              <BriefcaseBusiness size={14} />
              <span>Accès aux tableaux de supervision, rapports et dossiers suivis.</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function EditableProfileDetail({
  label,
  value,
  onChange,
  edit,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  edit: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="candidate-profile-field">
      <span className="candidate-profile-label">{label}</span>
      {edit ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="candidate-profile-input"
        />
      ) : (
        <p>{value || "Non renseigné"}</p>
      )}
    </div>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="candidate-profile-field">
      <span className="candidate-profile-label">{label}</span>
      <p>{value || "Non renseigné"}</p>
    </div>
  );
}

function getInitials(name: string, fallback: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || fallback.slice(0, 2).toUpperCase();
}

