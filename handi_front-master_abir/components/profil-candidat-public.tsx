"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CalendarClock, GraduationCap, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { construireUrlApi } from "@/lib/config";
import { UtilisateurConnecte } from "@/types/api";

interface ProfilCandidatPublicProps {
  utilisateur: UtilisateurConnecte;
  subtitle?: string;
}

interface ProfilCandidatPublicData {
  nom: string;
  addresse: string;
  competences: string[];
  experience: string;
  formation: string;
  handicap: string;
  disponibilite: string;
  preferences_accessibilite: string[];
  type_handicap?: string;
  niveau_academique?: string;
  description?: string;
  secteur?: string;
  age?: number;
}

export function ProfilCandidatPublic({ utilisateur, subtitle }: ProfilCandidatPublicProps) {
  const [profil, setProfil] = useState<ProfilCandidatPublicData>({
    nom: utilisateur.nom || "",
    addresse: "",
    competences: [],
    experience: "",
    formation: "",
    handicap: "",
    disponibilite: "",
    preferences_accessibilite: [],
    type_handicap: "",
    niveau_academique: "",
    description: "",
    secteur: "",
  });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const chargerProfil = async () => {
      try {
        setChargement(true);
        setErreur(null);
        const token = localStorage.getItem("token_auth");
        const response = await fetch(construireUrlApi(`/api/candidats/profil/${utilisateur.id_utilisateur}`), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = (await response.json().catch(() => null)) as
          | { donnees?: Partial<ProfilCandidatPublicData>; message?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.message || "Impossible de charger le profil du candidat.");
        }

        if (!active) return;

        setProfil((courant) => ({
          ...courant,
          ...data?.donnees,
          nom: data?.donnees?.nom || utilisateur.nom || "",
        }));
      } catch (cause) {
        if (!active) return;
        setErreur(cause instanceof Error ? cause.message : "Impossible de charger le profil du candidat.");
      } finally {
        if (active) {
          setChargement(false);
        }
      }
    };

    void chargerProfil();

    return () => {
      active = false;
    };
  }, [utilisateur.id_utilisateur, utilisateur.nom]);

  const initials = useMemo(() => {
    const parts = (profil.nom || utilisateur.nom || "Candidat").split(" ").filter(Boolean);
    if (parts.length === 0) return "CA";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [profil.nom, utilisateur.nom]);

  const candidateRole =
    profil.secteur?.trim() ||
    profil.niveau_academique?.trim() ||
    profil.description?.trim() ||
    "Candidat HandiTalents";

  const supportLabel =
    profil.handicap?.trim() ||
    profil.type_handicap?.trim() ||
    "Accompagnement non renseigne";

  const locationLabel = profil.addresse?.trim() || utilisateur.region?.trim() || "Localisation non renseignee";
  const availabilityLabel = profil.disponibilite?.trim() || "Disponibilite non renseignee";
  const educationLabel = profil.formation?.trim() || profil.niveau_academique?.trim() || "Formation non renseignee";
  const experienceLabel = profil.experience?.trim() || "Experience non renseignee";
  const skills = Array.isArray(profil.competences) ? profil.competences.filter(Boolean).slice(0, 8) : [];
  const preferences = Array.isArray(profil.preferences_accessibilite)
    ? profil.preferences_accessibilite.filter(Boolean).slice(0, 6)
    : [];

  return (
    <section className="candidate-summary">
      <div className="candidate-summary-header">
        <div>
          <p className="candidate-summary-kicker">Profil candidat</p>
          <h2 className="candidate-summary-title">{profil.nom || utilisateur.nom || "Candidat"}</h2>
          <p className="candidate-summary-subtitle">{subtitle || candidateRole}</p>
        </div>
      </div>

      {chargement ? <p>Chargement du profil...</p> : null}
      {erreur ? <p className="message message-erreur">{erreur}</p> : null}

      {!chargement && !erreur ? (
        <div className="candidate-summary-layout">
          <section className="candidate-summary-hero">
            <div className="candidate-summary-avatar">{initials}</div>
            <div className="candidate-summary-identity">
              <p className="candidate-summary-kicker">Vue candidat</p>
              <h3>{profil.nom || utilisateur.nom || "Candidat"}</h3>
              <div className="candidate-summary-meta">
                <span><UserRound size={15} /> {candidateRole}</span>
                <span><MapPin size={15} /> {locationLabel}</span>
                <span><ShieldCheck size={15} /> {supportLabel}</span>
              </div>
            </div>
          </section>

          <section className="candidate-summary-kpis">
            <article>
              <CalendarClock size={18} />
              <span>Disponibilite</span>
              <strong>{availabilityLabel}</strong>
            </article>
            <article>
              <GraduationCap size={18} />
              <span>Formation</span>
              <strong>{educationLabel}</strong>
            </article>
            <article>
              <Briefcase size={18} />
              <span>Experience</span>
              <strong>{profil.experience?.trim() ? "Renseignee" : "A completer"}</strong>
            </article>
            <article>
              <Sparkles size={18} />
              <span>Competences</span>
              <strong>{skills.length ? `${skills.length} cles` : "A completer"}</strong>
            </article>
          </section>

          <section className="candidate-summary-grid">
            <article className="candidate-summary-panel">
              <h3>Presentation</h3>
              <p>{profil.description?.trim() || candidateRole}</p>
              {skills.length ? (
                <div className="candidate-summary-values">
                  {skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="candidate-summary-panel">
              <h3>Accompagnement</h3>
              <p>{supportLabel}</p>
              {preferences.length ? (
                <div className="candidate-summary-values">
                  {preferences.map((pref) => (
                    <span key={pref}>{pref}</span>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="candidate-summary-panel">
              <h3>Parcours</h3>
              <div className="candidate-summary-stack">
                <div>
                  <strong>Formation</strong>
                  <p>{educationLabel}</p>
                </div>
                <div>
                  <strong>Experience</strong>
                  <p>{experienceLabel}</p>
                </div>
              </div>
            </article>

            <article className="candidate-summary-panel">
              <h3>Disponibilite</h3>
              <div className="candidate-summary-stack">
                <div>
                  <strong>Statut candidat</strong>
                  <p>{availabilityLabel}</p>
                </div>
                <div>
                  <strong>Region</strong>
                  <p>{locationLabel}</p>
                </div>
              </div>
            </article>
          </section>
        </div>
      ) : null}
    </section>
  );
}
