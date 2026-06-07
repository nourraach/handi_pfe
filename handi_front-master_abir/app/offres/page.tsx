"use client";

import { type CSSProperties, type FormEvent, type SVGProps, useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/app-shell";
import { TextToSpeechButton } from "@/components/text-to-speech-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

interface OffreEmploi {
  id_offre: string;
  titre: string;
  description: string;
  localisation: string;
  type_poste: string;
  salaire_min: number;
  salaire_max: number;
  competences_requises?: string;
  experience_requise?: string;
  niveau_etude?: string;
  statut: string;
  date_limite?: string;
  created_at: string;
  candidatures_count: number;
  vues_count: number;
  nom_entreprise?: string;
}

type CandidatureOffreItem = {
  id_offre?: string;
  idOffre?: string;
  candidature?: {
    id_offre?: string;
    id_candidat?: string;
  };
  offre?: {
    id_offre?: string;
    id?: string | number;
  };
};

type FavoriItem = {
  id_offre?: string;
};

type ProfilCorrespondance = {
  competences?: string[];
  experience?: string;
  formation?: string;
  niveau_etude?: string;
};

const tndNumberFormatter = new Intl.NumberFormat("fr-TN", {
  maximumFractionDigits: 0,
});
const relativeDateFormatter = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const OFFRES_PAR_PAGE = 50;

const parseSalaryValue = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatSalaryAmount = (value: unknown) => {
  const parsed = parseSalaryValue(value);
  return parsed === null ? null : tndNumberFormatter.format(parsed);
};

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6.25 9.75a5.75 5.75 0 1 1 11.5 0v3.02l1.55 2.74a.75.75 0 0 1-.65 1.12H5.35a.75.75 0 0 1-.65-1.12l1.55-2.74z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 7h12" />
      <path d="M8 12h12" />
      <path d="M8 17h12" />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 4.75A1.75 1.75 0 0 1 8.75 3h6.5A1.75 1.75 0 0 1 17 4.75V20l-5-3-5 3z" />
    </svg>
  );
}

function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

function SalaryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" />
      <path d="M3.5 10.5h17" />
      <circle cx="12" cy="12" r="1.8" />
    </svg>
  );
}

function ExperienceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="7" width="16" height="12" rx="2.5" />
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M15 19v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1" />
      <circle cx="10" cy="10" r="3" />
      <path d="M21 19v-1a3 3 0 0 0-2-2.82" />
      <path d="M16 7.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M8 3.75v3.5" />
      <path d="M16 3.75v3.5" />
      <path d="M3.5 10h17" />
    </svg>
  );
}

function EmptyJobsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <circle cx="48" cy="48" r="34" fill="#F7F3FE" />
      <path d="M48 28c-13.255 0-24 8.507-24 19 0 5.586 3.07 10.61 8.003 14.095V70l10.117-5.192A33.08 33.08 0 0 0 48 65c13.255 0 24-8.507 24-19s-10.745-19-24-19Z" fill="#35063E" />
      <circle cx="39" cy="46.5" r="3.7" fill="#fff" />
      <circle cx="48" cy="46.5" r="3.7" fill="#fff" />
      <circle cx="57" cy="46.5" r="3.7" fill="#fff" />
      <circle cx="24" cy="34" r="3" fill="#D8CAF6" />
      <circle cx="72" cy="32" r="3" fill="#D8CAF6" />
      <circle cx="70" cy="67" r="3" fill="#D8CAF6" />
      <circle cx="26" cy="66" r="4" fill="#ECE4FB" />
    </svg>
  );
}

const formatSalaryRange = (offre: OffreEmploi) => {
  const min = formatSalaryAmount(offre.salaire_min);
  const max = formatSalaryAmount(offre.salaire_max);

  if (!min && !max) {
    return "Salaire non communiqué";
  }

  if (min && max) {
    return `${min} - ${max} TND`;
  }

  return `${min || max} TND`;
};

const formatContractLabel = (typePoste: string) => typePoste.trim().toUpperCase() || "CDI";

const formatExperienceLabel = (experience?: string) => {
  if (!experience?.trim()) {
    return "0 ans";
  }

  return experience.trim();
};

const formatDeadline = (date?: string) => {
  if (!date) {
    return "Ouvert";
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Ouvert";
  }

  return parsedDate.toLocaleDateString("fr-FR");
};

const formatPublishedDate = (value?: string) => {
  if (!value) {
    return "Date non disponible";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  const now = new Date();
  const diffInDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (Math.abs(diffInDays) < 7) {
    return relativeDateFormatter.format(diffInDays, "day");
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const inferWorkMode = (offre: OffreEmploi) => {
  const source = `${offre.titre} ${offre.description} ${offre.localisation}`.toLowerCase();

  if (/(hybrid|hybride)/.test(source)) {
    return "Hybride";
  }

  if (/(remote|distanciel|teletravail|à distance|a distance)/.test(source)) {
    return "Remote";
  }

  return "Sur site";
};

const normalizeMatchToken = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const splitMatchTerms = (value?: string) =>
  (value || "")
    .split(/[,;/|•]+/)
    .map((term) => normalizeMatchToken(term))
    .filter((term) => term.length > 1);

const extractExperienceYears = (value?: string) => {
  if (!value) return null;

  const normalized = normalizeMatchToken(value);
  const explicitYears = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:\+?\s*)?(?:ans?|years?|yrs?|an)/);
  if (explicitYears?.[1]) {
    return Number.parseFloat(explicitYears[1].replace(",", "."));
  }

  if (normalized.includes("senior")) return 5;
  if (normalized.includes("expert")) return 6;
  if (normalized.includes("intermediate") || normalized.includes("confirmed")) return 3;
  if (normalized.includes("junior")) return 1;

  return null;
};

const extractEducationRank = (value?: string) => {
  if (!value) return null;

  const normalized = normalizeMatchToken(value);
  if (normalized.includes("doctorat") || normalized.includes("phd") || normalized.includes("bac+8")) return 5;
  if (normalized.includes("master") || normalized.includes("bac+5")) return 4;
  if (normalized.includes("licence") || normalized.includes("bachelor") || normalized.includes("bac+3")) return 3;
  if (normalized.includes("bts") || normalized.includes("dut") || normalized.includes("deug") || normalized.includes("bac+2")) return 2;
  if (normalized.includes("bac")) return 1;

  return null;
};

const computeMatchDetails = (offre: OffreEmploi, profil?: ProfilCorrespondance | null) => {
  if (!profil) {
    return {
      percent: null as number | null,
      title: "Profil à compléter",
      skills: [] as string[],
      missingSkills: [] as string[],
      note: "Connectez votre profil candidat pour obtenir un score réel.",
    };
  }

  const offerSkills = splitMatchTerms(offre.competences_requises);
  const candidateSkills = (profil.competences || []).map((skill) => normalizeMatchToken(skill)).filter(Boolean);
  const matchedSkills = offerSkills.filter((skill) =>
    candidateSkills.some((candidateSkill) => candidateSkill.includes(skill) || skill.includes(candidateSkill)),
  );
  const missingSkills = offerSkills.filter((skill) => !matchedSkills.includes(skill));

  const requiredExperience = extractExperienceYears(offre.experience_requise);
  const candidateExperience = extractExperienceYears(profil.experience);
  const experienceScore = (() => {
    if (requiredExperience !== null && candidateExperience !== null) {
      return Math.max(0.2, Math.min(candidateExperience / Math.max(requiredExperience, 0.5), 1));
    }

    if (requiredExperience !== null) return 0.38;
    if (candidateExperience !== null) return 0.75;
    return 0.52;
  })();

  const requiredEducation = extractEducationRank(offre.niveau_etude);
  const candidateEducation = extractEducationRank(profil.formation || profil.niveau_etude);
  const educationScore = (() => {
    if (requiredEducation !== null && candidateEducation !== null) {
      return Math.max(0.25, Math.min(candidateEducation / Math.max(requiredEducation, 1), 1));
    }

    if (requiredEducation !== null) return 0.45;
    if (candidateEducation !== null) return 0.7;
    return 0.55;
  })();

  const skillsScore = offerSkills.length > 0
    ? Math.max(0.2, matchedSkills.length / offerSkills.length)
    : 0.55;

  const combined = Math.round(
    (skillsScore * 0.55 + experienceScore * 0.25 + educationScore * 0.2) * 100,
  );

  const percent = Math.min(98, Math.max(32, combined));
  const title = percent >= 80 ? "Excellent match" : percent >= 65 ? "Bon match" : "Match moyen";
  const note = offerSkills.length > 0
    ? matchedSkills.length > 0
      ? `En commun: ${matchedSkills.slice(0, 2).join(", ")}`
      : "Aucune compétence clé partagée"
    : "Correspondance calculée à partir de l’expérience et de la formation";

  return { percent, title, skills: matchedSkills, missingSkills, note };
};

const buildOfferSpeechContent = (offre: OffreEmploi, aiSummary?: string) => {
  const company = offre.nom_entreprise?.trim() || "Not specified";
  const skills = offre.competences_requises?.trim() || "Not specified";
  const experience = offre.experience_requise?.trim() || "Not specified";
  const location = offre.localisation?.trim() || "Not specified";
  const contractType = offre.type_poste?.trim() || "Not specified";
  const description = offre.description?.trim() || "Not specified";
  const summary = aiSummary?.trim() || "Not specified";

  return [
    `Job title: ${offre.titre}`,
    `Company name: ${company}`,
    `Job description: ${description}`,
    `Required skills: ${skills}`,
    `Experience: ${experience}`,
    `Location: ${location}`,
    `Contract type: ${contractType}`,
    `AI summary: ${summary}`,
  ].join(". ");
};

const jobsStudioScopedStyles = `
  .jobs-studio-shell {
    position: relative;
    display: grid;
    gap: 26px;
    padding: 30px 30px 34px;
    border-radius: 34px;
    background:
      radial-gradient(circle at top left, rgba(241, 232, 255, 0.92), transparent 28%),
      radial-gradient(circle at top right, rgba(228, 212, 255, 0.42), transparent 24%),
      rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    box-shadow: 0 28px 64px rgba(var(--app-primary-rgb), 0.09);
    overflow: hidden;
  }

  .jobs-studio-shell::before,
  .jobs-studio-shell::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
    opacity: 0.38;
  }

  .jobs-studio-shell::before {
    top: -120px;
    right: -100px;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(214, 191, 255, 0.48), transparent 68%);
  }

  .jobs-studio-shell::after {
    bottom: -140px;
    left: -80px;
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(239, 231, 255, 0.88), transparent 72%);
  }

  .jobs-studio-header,
  .jobs-studio-resultsbar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .jobs-studio-heading h1 {
    margin: 0;
    color: #181636;
    font-family: var(--app-heading);
    font-size: clamp(2.1rem, 2vw + 1.2rem, 3rem);
    line-height: 1.05;
  }

  .jobs-studio-heading p {
    margin: 12px 0 0;
    color: rgba(67, 63, 105, 0.72);
    font-size: 1rem;
    line-height: 1.65;
  }

  .jobs-studio-header-actions,
  .jobs-studio-resultsactions,
  .jobs-studio-cardbadges,
  .jobs-studio-cardactions,
  .jobs-studio-cardmeta,
  .jobs-studio-activefilters,
  .jobs-studio-viewtoggle {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .jobs-studio-iconbutton,
  .jobs-studio-viewtoggle button,
  .jobs-studio-bookmark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: rgba(255, 255, 255, 0.94);
    color: #61527f;
    box-shadow: 0 12px 28px rgba(var(--app-primary-rgb), 0.06);
  }

  .jobs-studio-iconbutton {
    width: 58px;
    height: 58px;
    border-radius: 20px;
  }

  .jobs-studio-filtersbutton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 58px;
    padding: 0 22px;
    border: 0;
    border-radius: 20px;
    background: linear-gradient(135deg, #35063e, #6d2bd0);
    color: white;
    font-weight: 800;
    box-shadow: 0 18px 34px rgba(var(--app-primary-rgb), 0.18);
  }

  .jobs-studio-toolbar {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 0.72fr));
    gap: 14px;
    align-items: center;
  }

  .jobs-studio-search,
  .jobs-studio-selectshell,
  .jobs-studio-morefilters {
    min-height: 60px;
    border-radius: 20px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.09);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  }

  .jobs-studio-search {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
  }

  .jobs-studio-search input,
  .jobs-studio-select,
  .jobs-studio-sorter select {
    width: 100%;
    border: 0;
    background: transparent;
    color: #2a2342;
    font: inherit;
  }

  .jobs-studio-search input::placeholder {
    color: rgba(91, 89, 122, 0.68);
  }

  .jobs-studio-search input:focus,
  .jobs-studio-select:focus,
  .jobs-studio-sorter select:focus {
    outline: none;
  }

  .jobs-studio-search:focus-within,
  .jobs-studio-selectshell:focus-within,
  .jobs-studio-sorter:focus-within {
    border-color: rgba(var(--app-primary-rgb), 0.22);
    box-shadow: 0 0 0 4px rgba(var(--app-primary-rgb), 0.08);
  }

  .jobs-studio-selectshell {
    display: flex;
    align-items: center;
    padding: 0 16px;
  }

  .jobs-studio-select,
  .jobs-studio-sorter select {
    appearance: none;
    padding-right: 24px;
    background-image:
      linear-gradient(45deg, transparent 50%, #6a5a90 50%),
      linear-gradient(135deg, #6a5a90 50%, transparent 50%);
    background-position:
      calc(100% - 14px) calc(50% - 2px),
      calc(100% - 9px) calc(50% - 2px);
    background-size: 5px 5px, 5px 5px;
    background-repeat: no-repeat;
  }

  .jobs-studio-morefilters {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 18px;
    color: #3b3157;
    font-weight: 700;
  }

  .jobs-studio-advanced {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-radius: 22px;
    background: rgba(247, 241, 255, 0.88);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
  }

  .jobs-studio-activechip {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.95);
    color: #4d3666;
    font-size: 0.9rem;
    font-weight: 700;
    border: 1px solid rgba(var(--app-primary-rgb), 0.06);
  }

  .jobs-studio-activechip.is-muted {
    color: rgba(77, 54, 102, 0.72);
  }

  .jobs-studio-resetfilters {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 16px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: white;
    color: #4d3666;
    font-weight: 700;
  }

  .jobs-studio-resetfilters:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .jobs-studio-resultscount {
    margin: 0;
    color: rgba(58, 50, 86, 0.84);
    font-size: 1.08rem;
  }

  .jobs-studio-resultscount strong {
    color: #5e21cb;
    font-size: 1.9rem;
    font-weight: 800;
  }

  .jobs-studio-sorter {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 18px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    background: rgba(255, 255, 255, 0.92);
    color: rgba(67, 63, 105, 0.8);
    font-weight: 700;
  }

  .jobs-studio-sorter select {
    min-width: 132px;
    color: #22183b;
    font-weight: 800;
  }

  .jobs-studio-viewtoggle {
    gap: 10px;
  }

  .jobs-studio-viewtoggle button {
    width: 48px;
    height: 48px;
    border-radius: 16px;
  }

  .jobs-studio-viewtoggle button.is-active {
    border-color: transparent;
    background: linear-gradient(135deg, #35063e, #6d2bd0);
    color: white;
    box-shadow: 0 16px 32px rgba(var(--app-primary-rgb), 0.18);
  }

  .jobs-studio-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .jobs-studio-grid.is-list {
    grid-template-columns: 1fr;
  }

  .jobs-studio-card {
    display: grid;
    gap: 18px;
    min-height: 100%;
    padding: 20px 20px 18px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(var(--app-primary-rgb), 0.08);
    box-shadow: 0 18px 36px rgba(var(--app-primary-rgb), 0.06);
  }

  .jobs-studio-cardtop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .jobs-studio-contractbadge,
  .jobs-studio-statusbadge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .jobs-studio-contractbadge {
    background: rgba(130, 68, 255, 0.1);
    color: #6a2fd2;
  }

  .jobs-studio-statusbadge {
    gap: 8px;
    background: rgba(42, 183, 102, 0.1);
    color: #1b9e54;
  }

  .jobs-studio-statusdot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #1fbe62;
  }

  .jobs-studio-bookmark {
    width: 42px;
    height: 42px;
    border-radius: 16px;
  }

  .jobs-studio-bookmark.is-active {
    color: #5c27c9;
    background: rgba(130, 68, 255, 0.1);
    border-color: rgba(130, 68, 255, 0.16);
  }

  .jobs-studio-bookmark.is-static {
    pointer-events: none;
  }

  .jobs-studio-cardbody {
    display: grid;
    gap: 12px;
    min-width: 0;
  }

  .jobs-studio-cardtitle {
    margin: 0;
    color: #171538;
    font-family: var(--app-heading);
    font-size: 1.35rem;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }

  .jobs-studio-cardcompany,
  .jobs-studio-cardsalary,
  .jobs-studio-carddeadline,
  .jobs-studio-cardmeta span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  .jobs-studio-cardcompany,
  .jobs-studio-cardmeta,
  .jobs-studio-carddeadline {
    color: rgba(67, 63, 105, 0.78);
  }

  .jobs-studio-cardsalary {
    color: #24193f;
    font-size: 1.02rem;
    font-weight: 800;
  }

  .jobs-studio-cardsnippet {
    margin: 0;
    color: rgba(67, 63, 105, 0.66);
    font-size: 0.94rem;
    line-height: 1.6;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .jobs-studio-cardmeta {
    gap: 18px;
  }

  .jobs-studio-carddeadline {
    font-weight: 700;
  }

  .jobs-studio-metaicon,
  .jobs-studio-icon {
    flex: none;
  }

  .jobs-studio-metaicon {
    width: 16px;
    height: 16px;
  }

  .jobs-studio-icon {
    width: 19px;
    height: 19px;
  }

  .jobs-studio-search-icon {
    width: 20px;
    height: 20px;
    color: rgba(67, 63, 105, 0.68);
  }

  .jobs-studio-more-icon {
    width: 18px;
    height: 18px;
  }

  .jobs-studio-cardactions {
    justify-content: space-between;
    align-items: stretch;
  }

  .jobs-studio-cardprimary,
  .jobs-studio-cardsecondary,
  .jobs-studio-emptybutton {
    min-height: 46px;
    border-radius: 16px;
    font-weight: 800;
  }

  .jobs-studio-cardprimary,
  .jobs-studio-emptybutton {
    padding: 0 20px;
    border: 0;
    background: linear-gradient(135deg, rgba(122, 64, 255, 0.14), rgba(233, 221, 255, 0.95));
    color: #5320b9;
  }

  .jobs-studio-cardsecondary {
    padding: 0 16px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: rgba(255, 255, 255, 0.96);
    color: #493264;
  }

  .jobs-studio-empty {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    gap: 14px;
    min-height: 520px;
    padding: 36px 20px;
    text-align: center;
  }

  .jobs-studio-emptyicon {
    display: grid;
    place-items: center;
    width: 220px;
    height: 220px;
  }

  .jobs-studio-emptyart {
    width: 100%;
    height: 100%;
  }

  .jobs-studio-empty h2 {
    margin: 0;
    color: #1b1738;
    font-family: var(--app-heading);
    font-size: 2rem;
  }

  .jobs-studio-empty p {
    margin: 0;
    max-width: 460px;
    color: rgba(67, 63, 105, 0.72);
    line-height: 1.7;
  }

  .jobs-studio-shell {
    padding: 22px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid rgba(53, 6, 62, 0.12);
    box-shadow: 0 10px 24px rgba(53, 6, 62, 0.08);
    gap: 16px;
  }

  .jobs-studio-shell::before,
  .jobs-studio-shell::after {
    display: none;
  }

  .jobs-studio-header {
    align-items: flex-end;
  }

  .jobs-studio-heading h1 {
    color: #35063e;
    font-size: clamp(2rem, 1.8vw + 1rem, 2.7rem);
    margin: 0;
  }

  .jobs-studio-heading p {
    margin: 8px 0 0;
    color: #4b4660;
    font-size: 1rem;
  }

  .jobs-studio-toolbar {
    grid-template-columns: minmax(0, 1fr) minmax(160px, 220px) minmax(160px, 220px);
    gap: 10px;
  }

  .jobs-studio-search,
  .jobs-studio-selectshell {
    min-height: 54px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid rgba(53, 6, 62, 0.14);
    box-shadow: none;
  }

  .jobs-studio-resultsbar {
    justify-content: flex-start;
  }

  .jobs-studio-resultscount {
    margin: 0;
    color: #1f1635;
    font-size: 1.18rem;
    font-weight: 700;
  }

  .jobs-studio-resultscount strong {
    color: #35063e;
    font-size: 2rem;
  }

  .jobs-studio-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .jobs-simple-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    padding: 16px;
    border-radius: 14px;
    border: 1px solid rgba(53, 6, 62, 0.14);
    background: #ffffff;
  }

  .jobs-simple-card__main {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .jobs-simple-card__title {
    margin: 0;
    font-size: 1.65rem;
    line-height: 1.2;
    color: #1b1330;
    font-family: var(--app-heading);
  }

  .jobs-simple-card__company,
  .jobs-simple-card__salary,
  .jobs-simple-card__deadline {
    margin: 0;
    font-size: 1rem;
    color: #39334b;
  }

  .jobs-simple-card__salary {
    font-size: 1.1rem;
    color: #24183f;
    font-weight: 800;
  }

  .jobs-simple-card__deadline {
    color: #5c5670;
  }

  .jobs-simple-card__match {
    display: grid;
    gap: 6px;
  }

  .jobs-simple-card__match span {
    color: #35063e;
    font-size: 0.96rem;
    font-weight: 700;
  }

  .jobs-simple-card__matchbar {
    width: min(360px, 100%);
    height: 9px;
    border-radius: 999px;
    background: #e8e5ef;
    overflow: hidden;
  }

  .jobs-simple-card__matchbar i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: #35063e;
  }

  .jobs-simple-card__action {
    display: flex;
    align-items: center;
  }

  .jobs-simple-card__apply {
    min-height: 44px;
    min-width: 128px;
    border-radius: 12px;
    border: 0;
    background: #35063e;
    color: #ffffff;
    padding: 0 18px;
    font-size: 1rem;
    font-weight: 800;
  }

  .jobs-simple-card__apply:hover {
    background: #4c0d59;
  }

  @media (max-width: 1320px) {
    .jobs-studio-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 1120px) {
    .jobs-studio-toolbar {
      grid-template-columns: minmax(0, 1fr) repeat(2, minmax(0, 1fr));
    }

    .jobs-studio-morefilters {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 920px) {
    .jobs-studio-shell {
      padding: 24px 20px 26px;
      border-radius: 28px;
    }

    .jobs-studio-header,
    .jobs-studio-resultsbar,
    .jobs-studio-advanced {
      flex-direction: column;
      align-items: stretch;
    }

    .jobs-studio-grid {
      grid-template-columns: 1fr;
    }

    .jobs-studio-resultsactions {
      justify-content: space-between;
    }
  }

  @media (max-width: 720px) {
    .jobs-studio-toolbar,
    .jobs-studio-grid {
      grid-template-columns: 1fr;
    }

    .jobs-simple-card {
      grid-template-columns: 1fr;
    }

    .jobs-studio-cardactions {
      flex-direction: column;
    }

    .jobs-studio-cardprimary,
    .jobs-studio-cardsecondary {
      width: 100%;
    }
  }

  @media (max-width: 560px) {
    .jobs-studio-heading h1 {
      font-size: 2rem;
    }

    .jobs-studio-header-actions,
    .jobs-studio-resultsactions {
      width: 100%;
      justify-content: space-between;
    }

    .jobs-studio-iconbutton,
    .jobs-studio-filtersbutton {
      min-height: 52px;
    }

    .jobs-studio-filtersbutton {
      flex: 1;
      justify-content: center;
    }

    .jobs-studio-sorter {
      width: 100%;
      justify-content: space-between;
    }

    .jobs-studio-card {
      padding: 18px;
    }

    .jobs-studio-empty {
      min-height: 420px;
    }

    .jobs-studio-emptyicon {
      width: 170px;
      height: 170px;
    }

    .jobs-studio-empty h2 {
      font-size: 1.7rem;
    }
  }

  .app-page {
    padding-inline: 16px;
    background: var(--app-bg);
  }

  .jobs-studio-shell {
    gap: 24px;
    padding: 24px;
    border-radius: 20px;
    background: var(--app-surface-strong);
    border: 1px solid var(--app-border);
    box-shadow: var(--shadow-1);
  }

  .jobs-studio-shell::before,
  .jobs-studio-shell::after {
    display: none;
  }

  .jobs-studio-heading h1 {
    color: var(--app-text);
    font-size: clamp(2rem, 5vw, 2.5rem);
    font-weight: 700;
    line-height: 1.1;
  }

  .jobs-studio-heading p {
    color: var(--app-muted);
    font-size: 13px;
    line-height: 20px;
    max-width: 75ch;
  }

  .jobs-studio-search,
  .jobs-studio-selectshell {
    min-height: 48px;
    border-radius: 10px;
    background: var(--app-surface-strong);
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .jobs-studio-search:hover,
  .jobs-studio-selectshell:hover {
    border-color: rgba(var(--app-primary-rgb), 0.2);
  }

  .jobs-studio-search:focus-within,
  .jobs-studio-selectshell:focus-within {
    border-color: rgba(var(--app-primary-rgb), 0.3);
    box-shadow: var(--ring-focus);
  }

  .jobs-studio-resultscount {
    color: var(--app-muted);
    font-size: 13px;
    line-height: 20px;
  }

  .jobs-studio-resultscount strong {
    font-size: 28px;
    color: var(--app-primary);
  }

  .jobs-studio-grid.is-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .jobs-simple-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    min-height: 320px;
    height: auto;
    padding: 16px;
    border: 1px solid rgba(85, 60, 145, 0.08);
    border-radius: 22px;
    background:
      radial-gradient(circle at 100% 0%, rgba(126, 92, 211, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(251, 249, 255, 0.98));
    box-shadow: 0 12px 28px rgba(33, 21, 60, 0.07);
    overflow: hidden;
    transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
    text-align: left;
  }

  .jobs-simple-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 42px rgba(43, 24, 79, 0.11);
  }

  .jobs-simple-card:focus-visible {
    outline: none;
    box-shadow: var(--ring-focus), 0 18px 42px rgba(43, 24, 79, 0.11);
  }

  .jobs-simple-card__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    text-align: left;
  }

  .jobs-simple-card__topMain {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
    flex: 1 1 auto;
    text-align: left;
  }

  .jobs-simple-card__avatar {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(111, 61, 214, 0.16), rgba(193, 172, 255, 0.32));
    color: #5b1db7;
    font-family: var(--app-heading);
    font-size: 1rem;
    font-weight: 800;
    box-shadow: inset 0 0 0 1px rgba(111, 61, 214, 0.08);
  }

  .jobs-simple-card__headerText {
    display: grid;
    gap: 6px;
    min-width: 0;
    flex: 1 1 auto;
    text-align: left;
  }

  .jobs-simple-card__main {
    display: grid;
    align-content: start;
    gap: 12px;
    min-width: 0;
    flex: 1 1 auto;
    text-align: left;
  }

  .jobs-simple-card__title,
  .jobs-simple-card__company,
  .jobs-simple-card__location,
  .jobs-simple-card__missingText {
    margin: 0;
  }

  .jobs-simple-card__title {
    color: var(--app-text);
    font-family: var(--font-geist-sans, var(--app-heading));
    font-size: 20px;
    line-height: 1.2;
    font-weight: 700;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .jobs-simple-card__company {
    color: #726784;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jobs-simple-card__location {
    color: #5f5674;
    font-size: 13px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jobs-simple-card__metaRow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .jobs-simple-card__metaPill,
  .jobs-simple-card__pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .jobs-simple-card__metaPill {
    background: rgba(88, 68, 152, 0.07);
    color: #605674;
    font-size: 13px;
    font-weight: 600;
  }

  .jobs-simple-card__metaPill--contract {
    background: rgba(109, 88, 186, 0.1);
    color: #6a52bc;
  }

  .jobs-simple-card__metaPill--mode {
    background: rgba(94, 109, 166, 0.08);
    color: #5b6480;
  }

  .jobs-simple-card__metaPill--salary {
    background: rgba(255, 255, 255, 0.92);
    color: #23183f;
    box-shadow: inset 0 0 0 1px rgba(93, 61, 176, 0.08);
    font-weight: 700;
  }

  .jobs-simple-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .jobs-simple-card__pill {
    background: rgba(90, 66, 191, 0.1);
    color: #5a42bf;
  }

  .jobs-simple-card__pill--access {
    background: rgba(34, 176, 110, 0.11);
    color: #168753;
  }

  .jobs-simple-card__pill--experience {
    background: rgba(97, 91, 193, 0.1);
    color: #5c56bf;
  }

  .jobs-simple-card__pill--match {
    background: rgba(34, 176, 110, 0.1);
    color: #1a8c59;
  }

  .jobs-simple-card__missingText {
    color: #766c8c;
    font-size: 0.8rem;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .jobs-simple-card__missingLabel {
    color: #31284a;
    font-weight: 700;
  }

  .jobs-simple-card__footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: end;
    justify-items: stretch;
    gap: 10px;
    margin-top: auto;
    padding-top: 4px;
  }

  .jobs-simple-card__save,
  .jobs-simple-card__apply,
  .jobs-simple-card__ghost {
    min-height: 40px;
    border-radius: 12px;
    transition: transform 150ms ease, background-color 150ms ease, color 150ms ease, box-shadow 150ms ease;
  }

  .jobs-simple-card__save:active,
  .jobs-simple-card__apply:active,
  .jobs-simple-card__ghost:active {
    transform: scale(0.98);
  }

  .jobs-simple-card__save {
    width: 38px;
    min-width: 38px;
    height: 38px;
    flex: 0 0 auto;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: rgba(96, 67, 173, 0.08);
    color: #7059ae;
    box-shadow: inset 0 0 0 1px rgba(96, 67, 173, 0.08);
  }

  .jobs-simple-card__save:hover {
    background: rgba(96, 67, 173, 0.13);
    color: #5a35b0;
  }

  .jobs-simple-card__save.is-active {
    background: rgba(96, 67, 173, 0.16);
    color: #4d1ca1;
  }

  .jobs-simple-card__save svg {
    width: 15px;
    height: 15px;
  }

  .jobs-simple-card__ghost {
    border: 1px solid rgba(96, 67, 173, 0.12);
    background: rgba(255, 255, 255, 0.92);
    color: #5f5784;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
    justify-content: center;
  }

  .jobs-simple-card__ghost:hover {
    background: rgba(96, 67, 173, 0.06);
    color: #472f79;
  }

  .jobs-simple-card__apply {
    border: 0;
    padding: 0 18px;
    background: linear-gradient(135deg, #5124a7, #35063e);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 12px 24px rgba(53, 6, 62, 0.18);
  }

  .jobs-simple-card__apply:hover:not(:disabled) {
    box-shadow: 0 14px 28px rgba(53, 6, 62, 0.24);
    filter: brightness(1.03);
  }

  .jobs-simple-card__apply:disabled {
    cursor: default;
    opacity: 0.78;
    box-shadow: none;
  }

  .jobs-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 4px;
  }

  .jobs-pagination__btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid #d9cfe9;
    background: #ffffff;
    color: #4b3f67;
    font-size: 1rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease, color 150ms ease;
  }

  .jobs-pagination__btn:hover {
    border-color: #c7b8de;
  }

  .jobs-pagination__btn:active {
    transform: scale(0.98);
  }

  .jobs-pagination__btn:focus-visible {
    box-shadow: var(--ring-focus);
  }

  .jobs-pagination__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .jobs-pagination__btn.is-active {
    border-color: #35063e;
    background: #35063e;
    color: #fff;
  }

  .jobs-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2140;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    overflow-y: auto;
    background: rgba(20, 17, 26, 0.55);
  }

  .jobs-modal-card {
    width: min(100%, 760px);
    max-height: min(90vh, 820px);
    overflow-y: auto;
    position: relative;
    z-index: 2141;
    background: #fff !important;
    border: 1px solid rgba(var(--app-primary-rgb), 0.14);
    border-radius: 22px;
    box-shadow: 0 28px 64px rgba(17, 12, 30, 0.35);
    opacity: 1 !important;
    transform: none !important;
    color: var(--app-text);
  }

  .jobs-modal-card-lg {
    width: min(100%, 1040px);
    max-height: min(90vh, 860px);
  }

  .company-job-profile {
    position: relative;
    display: grid;
    gap: 18px;
  }

  .company-job-close {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.14);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: var(--app-primary);
    font-size: 1.35rem;
    line-height: 1;
    cursor: pointer;
  }

  .company-job-hero {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    align-items: center;
    gap: 18px;
    padding: 22px 54px 22px 22px;
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    border-radius: 22px;
    background:
      radial-gradient(circle at 92% 12%, rgba(216, 106, 141, 0.18), transparent 34%),
      linear-gradient(135deg, rgba(var(--app-primary-rgb), 0.08), rgba(255, 255, 255, 0.96));
  }

  .company-job-logo {
    width: 82px;
    height: 82px;
    display: grid;
    place-items: center;
    border-radius: 22px;
    background: linear-gradient(135deg, var(--app-primary), #d86a8d);
    color: #fff;
    font-size: 1.5rem;
    font-weight: 900;
    box-shadow: 0 18px 38px rgba(var(--app-primary-rgb), 0.2);
  }

  .company-job-meta,
  .company-job-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .company-job-meta span,
  .company-job-skills span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    color: #4b415e;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .company-job-meta svg,
  .company-job-kpis svg {
    width: 16px;
    height: 16px;
    color: var(--app-primary);
  }

  .company-job-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .company-job-kpis article,
  .company-job-panel {
    border: 1px solid rgba(var(--app-primary-rgb), 0.1);
    border-radius: 16px;
    background: linear-gradient(180deg, #fff, #fcfafd);
    box-shadow: 0 14px 34px rgba(31, 18, 49, 0.05);
  }

  .company-job-kpis article {
    min-height: 98px;
    display: grid;
    align-content: center;
    gap: 6px;
    padding: 16px;
  }

  .company-job-kpis span {
    color: #716883;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .company-job-kpis strong {
    color: #1d1430;
    font-size: 0.96rem;
    line-height: 1.25;
  }

  .company-job-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.82fr);
    gap: 14px;
  }

  .company-job-panel {
    padding: 20px;
  }

  .company-job-panel-wide {
    grid-column: span 2;
  }

  .company-job-panel h3 {
    margin: 0 0 12px;
    color: #1d1430;
    font-size: 1.02rem;
  }

  .company-job-panel p {
    margin: 0;
    color: #625773;
    line-height: 1.58;
  }

  .company-job-skills {
    margin-top: 0;
  }

  .company-job-skills span {
    background: rgba(var(--app-primary-rgb), 0.08);
    color: var(--app-primary);
  }

  .company-job-stack {
    display: grid;
    gap: 10px;
  }

  .company-job-stack span {
    display: grid;
    gap: 4px;
    color: #625773;
    line-height: 1.35;
  }

  .company-job-stack b {
    color: #1d1430;
  }

  .company-job-actions {
    position: sticky;
    bottom: -1px;
    padding-top: 16px;
    border-top: 1px solid rgba(var(--app-primary-rgb), 0.1);
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(10px);
  }

  .jobs-modal-header {
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .jobs-modal-eyebrow {
    margin-bottom: 10px;
  }

  .jobs-modal-title {
    margin: 0;
    color: var(--app-text);
    font-size: 22px;
    line-height: 29px;
    font-family: var(--app-heading);
  }

  .jobs-modal-subtitle,
  .jobs-form-hint,
  .jobs-summary-helper {
    margin: 0;
    color: var(--app-muted);
    font-size: 13px;
    line-height: 20px;
  }

  .jobs-modal-role-summary,
  .jobs-form-field {
    display: grid;
    gap: 10px;
  }

  .jobs-form-label {
    font-weight: 700;
    color: var(--app-text-soft);
  }

  .jobs-required {
    color: #b91c1c;
  }

  .champ[data-invalid="true"] {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(254, 226, 226, 1);
  }

  .jobs-form-selected {
    margin: 0;
    color: var(--app-primary);
    font-weight: 700;
    font-size: 13px;
    line-height: 20px;
  }

  .jobs-form-error {
    margin: 0;
    color: #b91c1c;
    font-size: 13px;
    line-height: 20px;
    font-weight: 700;
  }

  .jobs-textarea {
    min-height: 220px;
    resize: vertical;
  }

  .jobs-modal-actions {
    justify-content: flex-end;
  }

  .jobs-summary-head {
    justify-content: space-between;
    align-items: center;
  }

  .jobs-summary-box {
    white-space: pre-wrap;
    line-height: 1.7;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    padding: 14px;
    background: rgba(255, 255, 255, 0.8);
  }

  .jobs-apply-modal {
    display: grid;
    gap: 22px;
  }

  .jobs-apply-modal__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .jobs-apply-modal__title {
    margin: 0;
    color: #181636;
    font-family: var(--app-heading);
    font-size: clamp(1.9rem, 1.2vw + 1.1rem, 2.25rem);
    line-height: 1.1;
  }

  .jobs-apply-modal__subtitle {
    margin: 10px 0 0;
    color: rgba(67, 63, 105, 0.86);
    font-size: 1.02rem;
    line-height: 1.6;
  }

  .jobs-apply-modal__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(53, 6, 62, 0.16);
    background: #fff;
    color: #2c2448;
    font-size: 1.55rem;
    line-height: 1;
    box-shadow: 0 8px 18px rgba(53, 6, 62, 0.08);
    transition: transform 150ms ease, border-color 150ms ease, color 150ms ease;
  }

  .jobs-apply-modal__close:hover {
    border-color: rgba(53, 6, 62, 0.24);
    color: #35063e;
  }

  .jobs-apply-modal__close:active {
    transform: scale(0.98);
  }

  .jobs-apply-modal__close:focus-visible {
    box-shadow: var(--ring-focus);
  }

  .jobs-apply-modal__field {
    display: grid;
    gap: 10px;
  }

  .jobs-apply-modal__label {
    color: #20193a;
    font-size: 1.08rem;
    font-weight: 800;
  }

  .jobs-apply-modal__dropzone {
    display: grid;
    place-items: center;
    gap: 8px;
    min-height: 164px;
    padding: 18px;
    border-radius: 14px;
    border: 1px dashed rgba(130, 68, 255, 0.44);
    background: rgba(247, 241, 255, 0.5);
    color: #402066;
    transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease;
    text-align: center;
  }

  .jobs-apply-modal__dropzone:hover {
    border-color: rgba(130, 68, 255, 0.68);
    background: rgba(240, 232, 255, 0.74);
  }

  .jobs-apply-modal__dropzone:active {
    transform: scale(0.98);
  }

  .jobs-apply-modal__dropzone:focus-visible {
    box-shadow: var(--ring-focus);
  }

  .jobs-apply-modal__dropzone.is-invalid {
    border-color: #dc2626;
    background: rgba(254, 242, 242, 0.96);
  }

  .jobs-apply-modal__drop-icon {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(130, 68, 255, 0.16);
    color: #6b2ed3;
    font-size: 1.35rem;
    font-weight: 800;
  }

  .jobs-apply-modal__dropzone strong {
    color: #2d2449;
    font-size: 1.75rem;
    line-height: 1.18;
    font-family: var(--app-heading);
  }

  .jobs-apply-modal__dropzone span {
    color: #6835ca;
    font-size: 1.08rem;
    font-weight: 700;
  }

  .jobs-apply-modal__help {
    margin: 0;
    color: rgba(67, 63, 105, 0.9);
    text-align: center;
    font-size: 0.98rem;
  }

  .jobs-apply-modal__file {
    margin: 0;
    color: #35063e;
    font-size: 0.94rem;
    font-weight: 700;
  }

  .jobs-apply-modal__textarea {
    min-height: 142px;
    resize: vertical;
  }

  .jobs-apply-modal__counter {
    margin: 0;
    justify-self: end;
    color: rgba(67, 63, 105, 0.84);
    font-size: 0.92rem;
  }

  .jobs-apply-modal__actions {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 14px;
  }

  .jobs-apply-modal__btn {
    min-height: 52px;
    border-radius: 12px;
    font-size: 1.08rem;
    font-weight: 800;
    transition: transform 150ms ease, background-color 150ms ease, border-color 150ms ease;
  }

  .jobs-apply-modal__btn:active {
    transform: scale(0.98);
  }

  .jobs-apply-modal__btn:focus-visible {
    box-shadow: var(--ring-focus);
  }

  .jobs-apply-modal__btn--secondary {
    border: 1px solid rgba(53, 6, 62, 0.2);
    background: #fff;
    color: #2b2448;
  }

  .jobs-apply-modal__btn--secondary:hover {
    border-color: rgba(53, 6, 62, 0.32);
  }

  .jobs-apply-modal__btn--primary {
    border: 0;
    background: #35063e;
    color: #fff;
  }

  .jobs-apply-modal__btn--primary:hover {
    background: #4b0a57;
  }

  .jobs-apply-modal__btn:disabled {
    opacity: 0.72;
    cursor: not-allowed;
  }

  @media (min-width: 640px) {
    .app-page {
      padding-inline: 24px;
    }
  }

  @media (min-width: 1024px) {
    .app-page {
      padding-inline: 32px;
    }
  }

  @media (max-width: 980px) {
    .jobs-studio-grid.is-list {
      grid-template-columns: 1fr;
    }

    .jobs-simple-card {
      min-height: 320px;
      height: auto;
    }
  }

  @media (max-width: 640px) {
    .jobs-simple-card {
      min-height: 280px;
    }

    .jobs-simple-card__footer {
      grid-template-columns: 1fr;
    }

    .jobs-modal-overlay {
      align-items: flex-end;
      padding: 0;
    }

    .jobs-modal-card,
    .jobs-modal-card-lg {
      width: 100%;
      max-width: none;
      max-height: 92vh;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      overflow-y: auto;
    }

    .company-job-hero,
    .company-job-kpis,
    .company-job-grid {
      grid-template-columns: 1fr;
    }

    .company-job-panel-wide {
      grid-column: auto;
    }

    .company-job-hero {
      padding: 18px 50px 18px 18px;
    }

    .jobs-apply-modal__title {
      font-size: 1.6rem;
    }

    .jobs-apply-modal__actions {
      grid-template-columns: 1fr;
    }
  }
`;

export default function OffresPage() {
  const CV_REQUIS_MESSAGE = "Le CV est obligatoire";
  const [offres, setOffres] = useState<OffreEmploi[]>([]);
  const [offresFiltered, setOffresFiltered] = useState<OffreEmploi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [filtres, setFiltres] = useState({
    titre: "",
    localisation: "",
    type_poste: "",
    accessibilite_handicap: true,
  });
  const [favoris, setFavoris] = useState<Set<string>>(new Set());
  const [candidatures, setCandidatures] = useState<Set<string>>(new Set());
  const [offreEnDetails, setOffreEnDetails] = useState<OffreEmploi | null>(null);
  const [offreSelectionnee, setOffreSelectionnee] = useState<OffreEmploi | null>(null);
  const [lettreMotivation, setLettreMotivation] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFieldTouched, setCvFieldTouched] = useState(false);
  const [envoiCandidature, setEnvoiCandidature] = useState(false);
  const [erreurCandidature, setErreurCandidature] = useState<string | null>(null);
  const [tri] = useState<"recent" | "salary" | "deadline">("recent");
  const [summaryLoadingOfferId, setSummaryLoadingOfferId] = useState<string | null>(null);
  const [summaryByOfferId, setSummaryByOfferId] = useState<Record<string, string>>({});
  const [summaryErrorByOfferId, setSummaryErrorByOfferId] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [pageActuelle, setPageActuelle] = useState(1);
  const [profilCorrespondance, setProfilCorrespondance] = useState<ProfilCorrespondance | null>(null);
  const [profilCorrespondanceCharge, setProfilCorrespondanceCharge] = useState(false);
  const { utilisateur } = useAuth();
  const cvFieldError = cvFieldTouched && !cvFile ? CV_REQUIS_MESSAGE : null;
  const applyModalRef = useRef<HTMLDivElement | null>(null);
  const detailsModalRef = useRef<HTMLDivElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const modalOverlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 5000,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "max(16px, 4vh) 24px 24px",
    background: "rgba(20, 17, 26, 0.5)",
    backdropFilter: "blur(7px)",
    WebkitBackdropFilter: "blur(7px)",
    overflowY: "auto",
  };
  const modalCardBaseStyle: CSSProperties = {
    width: "min(100%, 580px)",
    maxHeight: "min(92vh, 860px)",
    overflowY: "auto",
    background: "#ffffff",
    border: "1px solid rgba(53, 6, 62, 0.14)",
    borderRadius: "24px",
    boxShadow: "0 22px 48px rgba(20, 17, 26, 0.24)",
    color: "var(--app-text)",
    padding: "28px",
  };
  const modalCardLargeStyle: CSSProperties = {
    ...modalCardBaseStyle,
    width: "min(100%, 760px)",
    maxHeight: "min(92vh, 860px)",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const chargerProfilCorrespondance = async () => {
      setProfilCorrespondance(null);
      setProfilCorrespondanceCharge(false);

      if (!utilisateur || utilisateur.role !== "candidat") {
        setProfilCorrespondanceCharge(true);
        return;
      }

      try {
        const response = await authenticatedFetch(
          construireUrlApi(`/api/candidats/profil/${utilisateur.id_utilisateur}`),
        );
        if (!response.ok) {
          setProfilCorrespondanceCharge(true);
          return;
        }

        const data = await response.json().catch(() => ({}));
        const profil = (data.donnees ?? {}) as ProfilCorrespondance;
        if (!cancelled) {
          setProfilCorrespondance(profil);
        }
      } catch {
        if (!cancelled) {
          setProfilCorrespondance(null);
        }
      } finally {
        if (!cancelled) {
          setProfilCorrespondanceCharge(true);
        }
      }
    };

    void chargerProfilCorrespondance();

    return () => {
      cancelled = true;
    };
  }, [utilisateur]);

  useEffect(() => {
    if (!offreSelectionnee && !offreEnDetails) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [offreSelectionnee, offreEnDetails]);

  useEffect(() => {
    const activeModal = (offreSelectionnee ? applyModalRef.current : detailsModalRef.current) ?? null;
    if (!activeModal) return;

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(activeModal.querySelectorAll<HTMLElement>(focusableSelector));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (offreSelectionnee) {
          fermerFormulaireCandidature();
        } else {
          fermerDetailsOffre();
        }
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [offreSelectionnee, offreEnDetails]);

  useEffect(() => {
    chargerOffresPubliques();
    chargerFavoris();
    chargerMesCandidatures();
  }, [utilisateur]);

  useEffect(() => {
    let filtered = offres;
    const recherche = filtres.titre.trim().toLowerCase();

    if (recherche) {
      filtered = filtered.filter((o) =>
        [o.titre, o.description, o.localisation, o.nom_entreprise]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(recherche)),
      );
    }
    if (filtres.localisation) {
      filtered = filtered.filter((o) => o.localisation.toLowerCase() === filtres.localisation.toLowerCase());
    }
    if (filtres.type_poste) {
      filtered = filtered.filter((o) => o.type_poste.toLowerCase() === filtres.type_poste.toLowerCase());
    }

    filtered = filtered.filter((o) => o.statut === "active");
    filtered = [...filtered].sort((offreA, offreB) => {
      if (tri === "salary") {
        return offreB.salaire_max - offreA.salaire_max;
      }

      if (tri === "deadline") {
        const deadlineA = offreA.date_limite ? new Date(offreA.date_limite).getTime() : Number.MAX_SAFE_INTEGER;
        const deadlineB = offreB.date_limite ? new Date(offreB.date_limite).getTime() : Number.MAX_SAFE_INTEGER;
        return deadlineA - deadlineB;
      }

      return new Date(offreB.created_at).getTime() - new Date(offreA.created_at).getTime();
    });
    setOffresFiltered(filtered);
  }, [offres, filtres, tri]);

  useEffect(() => {
    setPageActuelle(1);
  }, [filtres.titre, filtres.localisation, filtres.type_poste, tri]);

  const reinitialiserFiltres = () =>
    setFiltres({ titre: "", localisation: "", type_poste: "", accessibilite_handicap: true });

  const chargerFavoris = useEffectEvent(async () => {
    try {
      if (!utilisateur || utilisateur.role !== "candidat") return;
      const res = await authenticatedFetch(construireUrlApi("/api/favoris"));
      if (!res.ok) return;
      const data = await res.json();
      const donnees = Array.isArray(data.donnees) ? (data.donnees as FavoriItem[]) : [];
      setFavoris(new Set(donnees.map((f) => f.id_offre).filter((id): id is string => typeof id === "string" && id.length > 0)));
    } catch {}
  });

  const chargerMesCandidatures = useEffectEvent(async () => {
    try {
      if (!utilisateur || utilisateur.role !== "candidat") return;
      const res = await authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures"));
      if (!res.ok) return;
      const data = await res.json();
      const donneesBrutes = Array.isArray(data.donnees) ? (data.donnees as CandidatureOffreItem[]) : [];
      const idCandidatConnecte = (utilisateur as { candidat?: { id?: string } } | null)?.candidat?.id;
      const donnees = idCandidatConnecte
        ? donneesBrutes.filter((item) => !item.candidature?.id_candidat || item.candidature.id_candidat === idCandidatConnecte)
        : donneesBrutes;
      const ids = new Set(
        donnees
          .map(
            (item) =>
              item.id_offre ??
              item.candidature?.id_offre ??
              item.offre?.id_offre ??
              item.offre?.id ??
              item.idOffre,
          )
          .filter((id): id is string | number => id !== null && id !== undefined)
          .map((id) => String(id))
          .filter((id) => id.length > 0),
      );
      setCandidatures(ids);
    } catch {}
  });

  const chargerOffresPubliques = useEffectEvent(async () => {
    setLoading(true);
    setErreur(null);

    try {
      const response = await fetch(construireUrlApi("/api/offres/publiques"), {
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setOffres(data.donnees?.offres || []);
      } else {
        await chargerOffresDepuisAPIEntreprise();
      }
    } catch {
      await chargerOffresDepuisAPIEntreprise();
    } finally {
      setLoading(false);
    }
  });

  const chargerOffresDepuisAPIEntreprise = async () => {
    try {
      const response = await fetch(construireUrlApi("/api/entreprise/offres"), {
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setOffres(data.donnees?.offres || []);
      } else {
        setErreur("Impossible de charger les offres.");
      }
    } catch {
      setErreur("Impossible de charger les offres.");
    }
  };

  const toggleFavori = async (idOffre: string) => {
    setInfo(null);
    if (!utilisateur || utilisateur.role !== "candidat") {
      setErreur("Connectez-vous en tant que candidat pour gerer vos favoris.");
      return;
    }

    try {
      const estFavori = favoris.has(idOffre);
      const res = await authenticatedFetch(construireUrlApi(`/api/favoris/${idOffre}`), {
        method: estFavori ? "DELETE" : "POST",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Impossible de mettre a jour le favori");
      }

      const next = new Set(favoris);
      if (estFavori) {
        next.delete(idOffre);
      } else {
        next.add(idOffre);
      }
      setFavoris(next);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de mettre a jour le favori");
    }
  };

  const reinitialiserFormulaireCandidature = () => {
    setOffreSelectionnee(null);
    setLettreMotivation("");
    setCvFile(null);
    setCvFieldTouched(false);
    setErreurCandidature(null);
  };

  const ouvrirDetailsOffre = (offre: OffreEmploi) => {
    setErreur(null);
    setInfo(null);
    setOffreEnDetails(offre);
  };

  const fermerDetailsOffre = () => {
    setOffreEnDetails(null);
  };

  const ouvrirFormulaireCandidature = (offre: OffreEmploi) => {
    setErreur(null);
    setInfo(null);
    setErreurCandidature(null);

    if (!utilisateur || utilisateur.role !== "candidat") {
      setErreur("Connectez-vous en tant que candidat pour postuler.");
      return;
    }

    setOffreSelectionnee(offre);
  };

  const ouvrirFormulaireDepuisDetails = (offre: OffreEmploi) => {
    fermerDetailsOffre();
    ouvrirFormulaireCandidature(offre);
  };

  const buildOfferTextForSummary = (offre: OffreEmploi) =>
    [
      `Titre: ${offre.titre}`,
      `Entreprise: ${offre.nom_entreprise || "Non prÃ©cisÃ©"}`,
      `Localisation: ${offre.localisation || "Non prÃ©cisÃ©"}`,
      `Type de poste: ${offre.type_poste || "Non prÃ©cisÃ©"}`,
      `Salaire minimum: ${String(offre.salaire_min ?? "Non prÃ©cisÃ©")}`,
      `Salaire maximum: ${String(offre.salaire_max ?? "Non prÃ©cisÃ©")}`,
      `CompÃ©tences requises: ${offre.competences_requises || "Non prÃ©cisÃ©"}`,
      `ExpÃ©rience requise: ${offre.experience_requise || "Non prÃ©cisÃ©"}`,
      `Niveau Ã©tude: ${offre.niveau_etude || "Non prÃ©cisÃ©"}`,
      `Date limite: ${offre.date_limite || "Non prÃ©cisÃ©"}`,
      "",
      `Description: ${offre.description || "Non prÃ©cisÃ©"}`,
    ].join("\n");

  const resumerOffre = async (offre: OffreEmploi) => {
    setSummaryLoadingOfferId(offre.id_offre);
    setSummaryErrorByOfferId((current) => ({ ...current, [offre.id_offre]: "" }));

    try {
      const response = await fetch("/api/job-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobOffer: buildOfferTextForSummary(offre) }),
      });

      const data = (await response.json()) as { summary?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Impossible de rÃ©sumer cette offre.");
      }

      if (!data.summary) {
        throw new Error("RÃ©sumÃ© vide reÃ§u.");
      }

      setSummaryByOfferId((current) => ({ ...current, [offre.id_offre]: data.summary as string }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur pendant le rÃ©sumÃ©.";
      setSummaryErrorByOfferId((current) => ({ ...current, [offre.id_offre]: message }));
    } finally {
      setSummaryLoadingOfferId((current) => (current === offre.id_offre ? null : current));
    }
  };

  const fermerFormulaireCandidature = () => {
    if (envoiCandidature) {
      return;
    }
    reinitialiserFormulaireCandidature();
  };

  const postuler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreur(null);
    setInfo(null);
    setErreurCandidature(null);

    if (!offreSelectionnee) {
      return;
    }

    if (!cvFile) {
      setCvFieldTouched(true);
      setErreurCandidature(CV_REQUIS_MESSAGE);
      return;
    }

    setEnvoiCandidature(true);

    try {
      const lettre = lettreMotivation.trim();
      const formData = new FormData();
      formData.append("id_offre", offreSelectionnee.id_offre);
      formData.append("cv", cvFile);
      if (lettre) {
        formData.append("lettre_motivation", lettre);
      }

      const res = await authenticatedFetch(construireUrlApi("/api/candidatures"), {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setInfo(data.message || "Candidature envoyee.");
        setCandidatures((prev) => new Set(prev).add(offreSelectionnee.id_offre));
        reinitialiserFormulaireCandidature();
        return;
      }

      if (res.status === 409) {
        setInfo(data.message || "Vous avez deja postule a cette offre.");
        setCandidatures((prev) => new Set(prev).add(offreSelectionnee.id_offre));
        reinitialiserFormulaireCandidature();
        return;
      }

      setErreurCandidature(data.message || "Erreur candidature");
    } catch (error: unknown) {
      setErreurCandidature(error instanceof Error ? error.message : "Erreur candidature");
    } finally {
      setEnvoiCandidature(false);
    }
  };

  const contractTypes = Array.from(
    new Set(offres.map((offre) => offre.type_poste.trim()).filter((value) => value.length > 0)),
  ).sort((typeA, typeB) => typeA.localeCompare(typeB, "fr"));

  const locations = Array.from(
    new Set(offres.map((offre) => offre.localisation.trim()).filter((value) => value.length > 0)),
  ).sort((locationA, locationB) => locationA.localeCompare(locationB, "fr"));
  const hasActiveFilters = Boolean(filtres.titre.trim() || filtres.localisation || filtres.type_poste);
  const totalPages = Math.max(1, Math.ceil(offresFiltered.length / OFFRES_PAR_PAGE));
  const offresVisibles = offresFiltered.slice((pageActuelle - 1) * OFFRES_PAR_PAGE, pageActuelle * OFFRES_PAR_PAGE);

  useEffect(() => {
    if (pageActuelle > totalPages) {
      setPageActuelle(totalPages);
    }
  }, [pageActuelle, totalPages]);

  const contenu = (
    <div className="app-page">
      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}
      {info ? <div className="message message-info" aria-live="polite">{info}</div> : null}

      <section className="jobs-studio-shell" aria-busy={loading} aria-live="polite">
        <div className="jobs-studio-toolbar">
          <label className="jobs-studio-search">
            <SearchIcon className="jobs-studio-icon jobs-studio-search-icon" />
            <input
              type="text"
              value={filtres.titre}
              onChange={(event) => setFiltres({ ...filtres, titre: event.target.value })}
              placeholder="Rechercher par poste, entreprise ou mot-cle"
              aria-label="Rechercher des offres"
            />
          </label>

          <label className="jobs-studio-selectshell">
            <select
              value={filtres.type_poste}
              onChange={(event) => setFiltres({ ...filtres, type_poste: event.target.value })}
              className="jobs-studio-select"
              aria-label="Filtrer par type de contrat"
            >
              <option value="">Tous les contrats</option>
              {contractTypes.map((typePoste) => (
                <option key={typePoste} value={typePoste}>
                  {formatContractLabel(typePoste)}
                </option>
              ))}
            </select>
          </label>

          <label className="jobs-studio-selectshell">
            <select
              value={filtres.localisation}
              onChange={(event) => setFiltres({ ...filtres, localisation: event.target.value })}
              className="jobs-studio-select"
              aria-label="Filtrer par localisation"
            >
              <option value="">Toutes les localisations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

        </div>

        <div className="jobs-studio-resultsbar">
          <p className="jobs-studio-resultscount">
            <strong>{offresFiltered.length}</strong> offre{offresFiltered.length > 1 ? "s" : ""} disponible{offresFiltered.length > 1 ? "s" : ""}
          </p>
        </div>

        {offresFiltered.length === 0 ? (
          <div className="jobs-studio-empty" aria-live="polite">
            <div className="jobs-studio-emptyicon">
              <EmptyJobsIcon className="jobs-studio-emptyart" />
            </div>
            <h2>Aucune offre ne correspond a vos criteres</h2>
            <p>{hasActiveFilters ? "Elargissez la recherche pour decouvrir plus d'opportunites." : "Aucune offre n'est publiee pour le moment, revenez bientot."}</p>
            {hasActiveFilters ? (
              <button type="button" className="jobs-studio-emptybutton" onClick={reinitialiserFiltres}>
                Elargir la recherche
              </button>
            ) : null}
          </div>
        ) : (
          <div className="jobs-studio-grid is-list">
            {offresVisibles.map((offre) => {
              const matchDetails = profilCorrespondanceCharge
                ? computeMatchDetails(offre, profilCorrespondance)
                : {
                    percent: null as number | null,
                    title: "Calcul en cours",
                    skills: [] as string[],
                    missingSkills: [] as string[],
                    note: "Chargement du profil candidat...",
                  };
              const matchPercentLabel = matchDetails.percent === null ? "—" : `${matchDetails.percent}%`;
              const estFavori = favoris.has(offre.id_offre);
              const dejaPostule = candidatures.has(offre.id_offre);

              return (
                <article key={offre.id_offre} className="jobs-simple-card" tabIndex={0}>
                  <div className="jobs-simple-card__top">
                    <div className="jobs-simple-card__topMain">
                      <div className="jobs-simple-card__avatar" aria-hidden="true">
                        {(offre.titre.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || ["U", "X"]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="jobs-simple-card__headerText">
                        <h2 className="jobs-simple-card__title" title={offre.titre}>
                          {offre.titre}
                        </h2>
                        <p className="jobs-simple-card__company" title={(offre.nom_entreprise || "Entreprise de test").trim()}>
                          {(offre.nom_entreprise || "Entreprise de test").trim()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`jobs-simple-card__save ${estFavori ? "is-active" : ""}`}
                      onClick={() => void toggleFavori(offre.id_offre)}
                      aria-pressed={estFavori}
                      aria-label={`${estFavori ? "Retirer" : "Sauvegarder"} l'offre ${offre.titre}`}
                    >
                      <BookmarkIcon />
                    </button>
                  </div>

                  <div className="jobs-simple-card__main">
                    <p className="jobs-simple-card__location" title={offre.localisation || "Tunis"}>
                      {offre.localisation || "Tunis"}
                    </p>

                    <div className="jobs-simple-card__metaRow">
                      <span className="jobs-simple-card__metaPill jobs-simple-card__metaPill--contract">{formatContractLabel(offre.type_poste)}</span>
                      <span className="jobs-simple-card__metaPill jobs-simple-card__metaPill--mode">{inferWorkMode(offre)}</span>
                      <span className="jobs-simple-card__metaPill jobs-simple-card__metaPill--salary">{formatSalaryRange(offre)}</span>
                    </div>

                    <div className="jobs-simple-card__tags">
                      <span className="jobs-simple-card__pill jobs-simple-card__pill--access">Accessibilite adaptee</span>
                      <span className="jobs-simple-card__pill jobs-simple-card__pill--experience">
                        Exp. {formatExperienceLabel(offre.experience_requise)}
                      </span>
                      <span
                        className="jobs-simple-card__pill jobs-simple-card__pill--match"
                        aria-label={matchDetails.percent === null ? "Correspondance en cours" : `Match IA ${matchPercentLabel}`}
                      >
                        Match IA {matchPercentLabel}
                      </span>
                    </div>

                    <p className="jobs-simple-card__missingText" title={matchDetails.missingSkills.join(" • ") || "Profil bien aligne avec cette opportunite"}>
                      <span className="jobs-simple-card__missingLabel">Competences a renforcer :</span>{" "}
                      {matchDetails.missingSkills.length > 0
                        ? matchDetails.missingSkills.slice(0, 4).join(" • ")
                        : "Profil bien aligne avec cette opportunite"}
                    </p>
                  </div>

                  <div className="jobs-simple-card__footer">
                    <button
                      type="button"
                      className="jobs-simple-card__ghost"
                      onClick={() => ouvrirDetailsOffre(offre)}
                      aria-label={`Voir les details de l'offre ${offre.titre}`}
                    >
                      Voir les details
                    </button>
                    <button
                      type="button"
                      className="jobs-simple-card__apply"
                      onClick={() => ouvrirFormulaireCandidature(offre)}
                      aria-label={`Postuler a l'offre ${offre.titre}`}
                      disabled={dejaPostule}
                    >
                      {dejaPostule ? "Deja postule" : "Postuler"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {offresFiltered.length > 0 && totalPages > 1 ? (
          <div className="jobs-pagination" aria-label="Pagination des offres">
            <button
              type="button"
              className="jobs-pagination__btn"
              onClick={() => setPageActuelle((current) => Math.max(1, current - 1))}
              disabled={pageActuelle === 1}
              aria-label="Page precedente"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={pageActuelle === page ? "jobs-pagination__btn is-active" : "jobs-pagination__btn"}
                onClick={() => setPageActuelle(page)}
                aria-label={`Aller a la page ${page}`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="jobs-pagination__btn"
              onClick={() => setPageActuelle((current) => Math.min(totalPages, current + 1))}
              disabled={pageActuelle === totalPages}
              aria-label="Page suivante"
            >
              &gt;
            </button>
          </div>
        ) : null}
      </section>

      {offreSelectionnee && mounted
        ? createPortal(
          <div
            aria-labelledby="application-modal-title"
            aria-modal="true"
            role="dialog"
            style={modalOverlayStyle}
            onClick={fermerFormulaireCandidature}
          >
            <div
              ref={applyModalRef}
              style={modalCardBaseStyle}
              onClick={(event) => event.stopPropagation()}
            >
              <form className="jobs-apply-modal" onSubmit={postuler}>
                <div className="jobs-apply-modal__head">
                  <div>
                    <h2 id="application-modal-title" className="jobs-apply-modal__title">
                      Postuler à cette offre
                    </h2>
                    <p className="jobs-apply-modal__subtitle">
                      Déposez votre CV et ajoutez une note de motivation si vous le souhaitez.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="jobs-apply-modal__close"
                    onClick={fermerFormulaireCandidature}
                    aria-label="Fermer la fenêtre"
                    disabled={envoiCandidature}
                  >
                    ×
                  </button>
                </div>

                <div className="jobs-apply-modal__field">
                  <label htmlFor="application-cv" className="jobs-apply-modal__label">
                    CV <span aria-hidden="true" className="jobs-required">*</span>
                  </label>
                  <input
                    ref={cvInputRef}
                    id="application-cv"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      setCvFile(event.target.files?.[0] || null);
                      setCvFieldTouched(true);
                      if (erreurCandidature === CV_REQUIS_MESSAGE) {
                        setErreurCandidature(null);
                      }
                    }}
                    onBlur={() => setCvFieldTouched(true)}
                    className="sr-only"
                    disabled={envoiCandidature}
                    aria-invalid={cvFieldError ? "true" : "false"}
                    aria-describedby={cvFieldError ? "application-cv-help application-cv-error" : "application-cv-help"}
                    aria-required="true"
                    required
                  />
                  <button
                    type="button"
                    className={`jobs-apply-modal__dropzone ${cvFieldError ? "is-invalid" : ""}`}
                    onClick={() => cvInputRef.current?.click()}
                    aria-label="Déposer votre CV ici ou cliquer pour parcourir"
                  >
                    <span className="jobs-apply-modal__drop-icon" aria-hidden="true">⇪</span>
                    <strong>Déposer votre CV ici</strong>
                    <span>ou cliquez pour parcourir</span>
                  </button>
                  <p id="application-cv-help" className="jobs-apply-modal__help">
                    Formats acceptés : .pdf, .doc, .docx
                  </p>
                  {cvFile ? <p className="jobs-apply-modal__file">Fichier sélectionné : {cvFile.name}</p> : null}
                  {cvFieldError ? (
                    <p id="application-cv-error" className="jobs-form-error" role="alert">
                      {cvFieldError}
                    </p>
                  ) : null}
                </div>

                <div className="jobs-apply-modal__field">
                  <label htmlFor="lettre-motivation" className="jobs-apply-modal__label">
                    Note de motivation (optionnelle)
                  </label>
                  <textarea
                    id="lettre-motivation"
                    value={lettreMotivation}
                    onChange={(event) => setLettreMotivation(event.target.value)}
                    placeholder="Ajoutez une courte note si vous le souhaitez..."
                    className="champ jobs-apply-modal__textarea"
                    rows={5}
                    maxLength={1000}
                    disabled={envoiCandidature}
                  />
                  <p className="jobs-apply-modal__counter">{lettreMotivation.length} / 1000</p>
                </div>

                <div className="jobs-apply-modal__actions">
                  <button
                    type="button"
                    className="jobs-apply-modal__btn jobs-apply-modal__btn--secondary"
                    onClick={fermerFormulaireCandidature}
                    disabled={envoiCandidature}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="jobs-apply-modal__btn jobs-apply-modal__btn--primary"
                    disabled={envoiCandidature}
                  >
                    {envoiCandidature ? "Envoi..." : "Envoyer ma candidature"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
        : null}

      {offreEnDetails && mounted
        ? createPortal(
          <div
            aria-labelledby="job-details-modal-title"
            aria-modal="true"
            role="dialog"
            style={modalOverlayStyle}
            onClick={fermerDetailsOffre}
          >
            <div
              ref={detailsModalRef}
              style={modalCardLargeStyle}
              onClick={(event) => event.stopPropagation()}
            >
            <div className="company-job-profile">
              <button className="company-job-close" type="button" onClick={fermerDetailsOffre} aria-label="Fermer">×</button>

              <section className="company-job-hero">
                <div className="company-job-logo">{(offreEnDetails.nom_entreprise || "Entreprise").slice(0, 2).toUpperCase()}</div>
                <div>
                  <p className="badge jobs-modal-eyebrow">Entreprise qui recrute</p>
                  <h2 id="job-details-modal-title" className="jobs-modal-title">
                    {(offreEnDetails.nom_entreprise || "Entreprise").trim()}
                  </h2>
                  <p className="jobs-modal-subtitle">
                    {offreEnDetails.titre} - {offreEnDetails.localisation}
                  </p>
                  <div className="company-job-meta">
                    <span><LocationIcon /> {offreEnDetails.localisation}</span>
                    <span><ExperienceIcon /> {offreEnDetails.type_poste.toUpperCase()}</span>
                    <span><UsersIcon /> Recrutement actif</span>
                  </div>
                </div>
              </section>

              <section className="company-job-kpis">
                <article><ExperienceIcon /><span>Poste</span><strong>{offreEnDetails.titre}</strong></article>
                <article><SalaryIcon /><span>Salaire</span><strong>{formatSalaryRange(offreEnDetails)}</strong></article>
                <article><UsersIcon /><span>Candidatures</span><strong>{offreEnDetails.candidatures_count || "—"}</strong></article>
                <article><CalendarIcon /><span>Date limite</span><strong>{formatDeadline(offreEnDetails.date_limite)}</strong></article>
              </section>

              <section className="company-job-grid">
                <article className="company-job-panel company-job-panel-wide">
                  <h3>Vue d&apos;ensemble</h3>
                  <p>{offreEnDetails.description}</p>
                </article>

              <Card tone="accent" padding="md">
                <div className="jobs-form-field">
                  <strong>Lecture vocale</strong>
                  <TextToSpeechButton
                    text={buildOfferSpeechContent(
                      offreEnDetails,
                      summaryByOfferId[offreEnDetails.id_offre],
                    )}
                  />
                </div>
              </Card>

              <Card tone="accent" padding="md">
                <div className="stack-lg">
                  <div className="page-header-actions jobs-summary-head">
                    <strong>RÃ©sumÃ© simplifiÃ© (IA)</strong>
                    <Button
                      variant="secondary"
                      onClick={() => void resumerOffre(offreEnDetails)}
                      disabled={summaryLoadingOfferId === offreEnDetails.id_offre}
                    >
                      {summaryLoadingOfferId === offreEnDetails.id_offre ? "RÃ©sumÃ© en cours..." : "RÃ©sumer lâ€™offre"}
                    </Button>
                  </div>

                  {summaryErrorByOfferId[offreEnDetails.id_offre] ? (
                    <div className="message message-erreur" role="alert">{summaryErrorByOfferId[offreEnDetails.id_offre]}</div>
                  ) : null}

                  {summaryByOfferId[offreEnDetails.id_offre] ? (
                    <div className="jobs-summary-box">{summaryByOfferId[offreEnDetails.id_offre]}</div>
                  ) : (
                    <p className="texte-secondaire jobs-summary-helper">
                      Cliquez sur le bouton pour generer un resume simple et accessible.
                    </p>
                  )}
                </div>
              </Card>

                <article className="company-job-panel">
                  <h3>Competences recherchees</h3>
                  <div className="company-job-skills">
                    {(offreEnDetails.competences_requises || "Communication, Adaptabilite, Collaboration")
                      .split(/[,;•]/)
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((skill) => <span key={skill}>{skill}</span>)}
                  </div>
                </article>

                <article className="company-job-panel">
                  <h3>Profil attendu</h3>
                  <div className="company-job-stack">
                    <span><b>Experience</b>{offreEnDetails.experience_requise || "Non renseignee"}</span>
                    <span><b>Niveau d&apos;etude</b>{offreEnDetails.niveau_etude || "Non renseigne"}</span>
                    <span><b>Accessibilite</b>Processus inclusif HandiTalents</span>
                  </div>
                </article>
              </section>

              <div className="page-header-actions jobs-modal-actions company-job-actions">
                <Button variant="secondary" onClick={fermerDetailsOffre}>
                  Fermer
                </Button>
                <Button onClick={() => ouvrirFormulaireDepuisDetails(offreEnDetails)}>Postuler</Button>
              </div>
            </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      <style jsx global>{jobsStudioScopedStyles}</style>
    </div>
  );

  if (loading) {
    return utilisateur ? (
      <AppShell utilisateur={utilisateur}>
        <LoadingState title="Chargement des offres" description="Preparation d'une experience fluide pour votre recherche." />
      </AppShell>
    ) : (
      <main className="page-centree section-page app-theme">
        <LoadingState title="Chargement des offres" description="Preparation d'une experience fluide pour votre recherche." />
      </main>
    );
  }

  return utilisateur ? <AppShell utilisateur={utilisateur}>{contenu}</AppShell> : <main className="page-centree section-page app-theme">{contenu}</main>;
}
