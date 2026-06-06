"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";

type CvTemplate = "classic" | "modern" | "sidebar" | "creative";

type CvTheme = {
  id: string;
  name: string;
  primary: string;
  surface: string;
  accent: string;
};

type CvExperience = {
  id: string;
  role: string;
  company: string;
  period: string;
  details: string;
};

type CvEducation = {
  id: string;
  diploma: string;
  school: string;
  period: string;
  details: string;
};

type CvProject = {
  id: string;
  title: string;
  period: string;
  details: string;
};

type CvAchievement = {
  id: string;
  title: string;
  details: string;
};

type CvVolunteer = {
  id: string;
  role: string;
  organization: string;
  period: string;
  details: string;
};

type CvFormState = {
  fullName: string;
  title: string;
  headline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  objective: string;
  skills: string;
  languages: string;
  certifications: string;
  template: CvTemplate;
  colorThemeId: string;
  experiences: CvExperience[];
  education: CvEducation[];
  projects: CvProject[];
  achievements: CvAchievement[];
  volunteer: CvVolunteer[];
};

const STORAGE_KEY = "candidate_cv_builder_v1";
type CvStepId = "profile" | "experience" | "education" | "skills" | "projects" | "extras" | "review";

type CvBuilderTourStep = {
  stepId: CvStepId;
  targetId: string;
  title: string;
  description: string;
  tip: string;
  icon: string;
};

const themes: CvTheme[] = [
  { id: "handitalents", name: "HandiTalents", primary: "#1f1738", surface: "#111325", accent: "#7b4dd9" },
  { id: "midnight", name: "Midnight", primary: "#1f2a44", surface: "#eef2ff", accent: "#5669ff" },
  { id: "emerald", name: "Emerald", primary: "#184f46", surface: "#eefaf6", accent: "#2aa889" },
  { id: "sunrise", name: "Sunrise", primary: "#7f3d2f", surface: "#fff4ee", accent: "#ee7b4c" },
];

const templateCards: Array<{ id: CvTemplate; title: string; subtitle: string; accent: string; tone: string }> = [
  { id: "sidebar", title: "Moderne", subtitle: "Mise en page latérale", accent: "#2d174d", tone: "Sidebar sombre" },
  { id: "modern", title: "Minimaliste", subtitle: "Ligne claire", accent: "#5b2d91", tone: "Deux colonnes épurées" },
  { id: "creative", title: "Creatif", subtitle: "Accent visuel", accent: "#8f3a62", tone: "Plus expressif" },
  { id: "classic", title: "Classique", subtitle: "Sobre et formel", accent: "#8b7b65", tone: "Structure traditionelle" },
];

const CV_BUILDER_TOUR_STEPS: CvBuilderTourStep[] = [
  {
    stepId: "profile",
    targetId: "cvb-guide-active-fields",
    title: "Etape 1: Profil",
    description: "Renseignez vos informations personnelles principales.",
    tip: "Nom, titre, email et localisation doivent etre remplis.",
    icon: "1",
  },
  {
    stepId: "experience",
    targetId: "cvb-guide-active-fields",
    title: "Etape 2: Experience",
    description: "Ajoutez au moins une experience avec role, entreprise et details.",
    tip: "Une experience claire aide le recruteur a comprendre votre impact.",
    icon: "2",
  },
  {
    stepId: "education",
    targetId: "cvb-guide-active-fields",
    title: "Etape 3: Education",
    description: "Ajoutez votre formation la plus pertinente.",
    tip: "Diplome + ecole suffisent pour valider cette etape.",
    icon: "3",
  },
  {
    stepId: "skills",
    targetId: "cvb-guide-active-fields",
    title: "Etape 4: Competences",
    description: "Indiquez vos competences et langues, une ligne par element.",
    tip: "Restez precis et simple pour une lecture rapide.",
    icon: "4",
  },
  {
    stepId: "projects",
    targetId: "cvb-guide-active-fields",
    title: "Etape 5: Projets",
    description: "Ajoutez un projet representatif de votre savoir-faire.",
    tip: "Titre + details concrets permettent de valider l etape.",
    icon: "5",
  },
  {
    stepId: "extras",
    targetId: "cvb-guide-active-fields",
    title: "Etape 6: Extras",
    description: "Ajoutez un element supplementaire: accroche, objectif, benevolat ou realisation.",
    tip: "Un petit plus bien choisi peut faire la difference.",
    icon: "6",
  },
  {
    stepId: "review",
    targetId: "cvb-guide-preview",
    title: "Etape 7: Verification",
    description: "Verifiez le rendu final avant telechargement.",
    tip: "Controlez la mise en page puis telechargez votre CV.",
    icon: "7",
  },
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultState(): CvFormState {
  return {
    fullName: "Mohamed Djeddi",
    title: "UX/UI Designer",
    headline: "Creating inclusive digital experiences",
    email: "mohamed.djeddi@mail.com",
    phone: "+33 6 12 34 56 78",
    address: "Lyon, France",
    website: "mohameddjeddi.com",
    linkedin: "linkedin.com/in/mohamed-djeddi",
    github: "github.com/mohamed-djeddi",
    summary:
      "Designer UX/UI passionné avec plus de 4 ans d'expérience dans la création de produits numériques accessibles et centrés sur l'utilisateur. J'aime résoudre des problèmes avec empathie et concevoir des expériences utiles.",
    objective: "Je recherche un poste à temps plein.",
    skills: "Design UI\nRecherche UX\nFigma\nPrototypage\nAccessibilité\nTests utilisateurs",
    languages: "Français - Langue maternelle\nAnglais - Courant",
    certifications: "Certificat professionnel Google UX Design - 2023\nFondamentaux de l'accessibilité - 2022",
    template: "sidebar",
    colorThemeId: "handitalents",
    experiences: [
      {
        id: createId("exp"),
        role: "UX/UI Designer",
        company: "Webelite Agency",
        period: "2021 - Present",
        details:
          "Conception et prototypage d'interfaces web et mobiles accessibles, collaboration avec les développeurs et tests d'amélioration auprès des utilisateurs.",
      },
      {
        id: createId("exp"),
        role: "Junior UX Designer",
        company: "Digital House",
        period: "2019 - 2021",
        details:
          "Contribution aux systèmes de design, préparation de maquettes et participation aux sessions de recherche et d'utilisabilité.",
      },
    ],
    education: [
      {
        id: createId("edu"),
        diploma: "Master in Digital Design",
        school: "Universite Lyon 2",
        period: "2017 - 2019",
        details: "Interaction design, product strategy, and accessible service design.",
      },
      {
        id: createId("edu"),
        diploma: "Bachelor in Graphic Design",
        school: "Universite Lyon 2",
        period: "2014 - 2017",
        details: "Visual communication, typography, and design fundamentals.",
      },
    ],
    projects: [
      {
        id: createId("proj"),
        title: "FitTrack App",
        period: "2024",
        details: "Mobile fitness application focused on healthy habits and accessible activity tracking.",
      },
      {
        id: createId("proj"),
        title: "EduPlatform",
        period: "2023",
        details: "Learning platform for students and teachers with improved navigation and content clarity.",
      },
    ],
    achievements: [
      {
        id: createId("achievement"),
        title: "Accessibility first",
        details: "Led inclusive interface reviews and helped improve focus states, contrast, and keyboard flows.",
      },
    ],
    volunteer: [
      {
        id: createId("volunteer"),
        role: "Mentor",
        organization: "Design Community",
        period: "2022 - Present",
        details: "Mentor junior designers on portfolio building and accessible interface design.",
      },
    ],
  };
}

function normalizeCvState(value: unknown): CvFormState {
  const defaults = createDefaultState();
  const data = (value && typeof value === "object" ? value : {}) as Partial<CvFormState>;

  return {
    ...defaults,
    ...data,
    fullName: typeof data.fullName === "string" ? data.fullName : defaults.fullName,
    title: typeof data.title === "string" ? data.title : defaults.title,
    headline: typeof data.headline === "string" ? data.headline : defaults.headline,
    email: typeof data.email === "string" ? data.email : defaults.email,
    phone: typeof data.phone === "string" ? data.phone : defaults.phone,
    address: typeof data.address === "string" ? data.address : defaults.address,
    website: typeof data.website === "string" ? data.website : defaults.website,
    linkedin: typeof data.linkedin === "string" ? data.linkedin : defaults.linkedin,
    github: typeof data.github === "string" ? data.github : defaults.github,
    summary: typeof data.summary === "string" ? data.summary : defaults.summary,
    objective: typeof data.objective === "string" ? data.objective : defaults.objective,
    skills: typeof data.skills === "string" ? data.skills : defaults.skills,
    languages: typeof data.languages === "string" ? data.languages : defaults.languages,
    certifications: typeof data.certifications === "string" ? data.certifications : defaults.certifications,
    template:
      data.template === "classic" || data.template === "modern" || data.template === "sidebar" || data.template === "creative"
        ? data.template
        : defaults.template,
    colorThemeId: typeof data.colorThemeId === "string" ? data.colorThemeId : defaults.colorThemeId,
    experiences: Array.isArray(data.experiences) ? data.experiences : defaults.experiences,
    education: Array.isArray(data.education) ? data.education : defaults.education,
    projects: Array.isArray(data.projects) ? data.projects : defaults.projects,
    achievements: Array.isArray(data.achievements) ? data.achievements : defaults.achievements,
    volunteer: Array.isArray(data.volunteer) ? data.volunteer : defaults.volunteer,
  };
}

function parseList(value: string | undefined | null) {
  return (value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safe = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  return {
    r: parseInt(safe.slice(0, 2), 16) / 255,
    g: parseInt(safe.slice(2, 4), 16) / 255,
    b: parseInt(safe.slice(4, 6), 16) / 255,
  };
}

function splitTextForPdf(text: string, fontSize: number, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [];
  }

  const averageCharWidth = fontSize * 0.52;
  const maxChars = Math.max(12, Math.floor(maxWidth / averageCharWidth));
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > maxChars) {
      lines.push(remaining.slice(0, maxChars - 1) + "-");
      remaining = remaining.slice(maxChars - 1);
    }
    current = remaining;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function hasValue(value: string) {
  return value.trim().length > 0;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CV";
}

function getStepCompletion(cv: CvFormState): Record<CvStepId, boolean> {
  const profileComplete = [cv.fullName, cv.title, cv.email, cv.address].every(hasValue);
  const experienceComplete = cv.experiences.some((item) => [item.role, item.company, item.details].every(hasValue));
  const educationComplete = cv.education.some((item) => [item.diploma, item.school].every(hasValue));
  const skillsComplete = hasValue(cv.skills) && hasValue(cv.languages);
  const projectsComplete = cv.projects.some((item) => hasValue(item.title) && hasValue(item.details));
  const extrasComplete =
    hasValue(cv.headline) ||
    hasValue(cv.objective) ||
    cv.achievements.some((item) => hasValue(item.title) || hasValue(item.details)) ||
    cv.volunteer.some((item) => hasValue(item.role) || hasValue(item.organization) || hasValue(item.details));
  const reviewComplete = hasValue(cv.template) && hasValue(cv.colorThemeId);

  return {
    profile: profileComplete,
    experience: experienceComplete,
    education: educationComplete,
    skills: skillsComplete,
    projects: projectsComplete,
    extras: extrasComplete,
    review: reviewComplete,
  };
}

function sectionTitle(title: string, theme: CvTheme) {
  return `<h2 style="margin:0 0 12px;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;color:${theme.primary};border-bottom:2px solid ${theme.accent};padding-bottom:6px;">${escapeHtml(title)}</h2>`;
}

function buildCvHtml(cv: CvFormState, theme: CvTheme) {
  const skills = parseList(cv.skills);
  const languages = parseList(cv.languages);
  const certifications = parseList(cv.certifications);
  const experiences = cv.experiences.filter((item) => item.role || item.company || item.details);
  const education = cv.education.filter((item) => item.diploma || item.school || item.details);
  const projects = cv.projects.filter((item) => item.title || item.details);
  const achievements = cv.achievements.filter((item) => item.title || item.details);
  const volunteer = cv.volunteer.filter((item) => item.role || item.organization || item.details);
  const isSidebarTemplate = cv.template === "sidebar";
  const effectiveTemplate = cv.template === "creative" ? "modern" : cv.template;
  const titleColor = isSidebarTemplate ? "#ffffff" : theme.primary;
  const mutedColor = isSidebarTemplate ? "rgba(255,255,255,0.72)" : "#334155";
  const accentColor = theme.accent;
  const lineColor = isSidebarTemplate ? "rgba(255,255,255,0.12)" : "rgba(109, 42, 149, 0.12)";
  const sidebarBackground = isSidebarTemplate
    ? "linear-gradient(180deg, #1a1630 0%, #101521 100%)"
    : theme.surface;
  const sidebarInitials = getInitials(cv.fullName || "CV");
  const contactItems = [cv.email, cv.phone, cv.address, cv.website, cv.linkedin]
    .filter(Boolean)
    .map((item) => `<div style="display:flex;align-items:center;gap:8px;"><span style="width:6px;height:6px;border-radius:999px;background:${isSidebarTemplate ? "rgba(255,255,255,0.7)" : theme.accent};flex:none;"></span><span>${escapeHtml(item)}</span></div>`)
    .join("");

  const header = isSidebarTemplate
    ? ""
    : `
    <header style="padding:0 0 10px;background:${effectiveTemplate === "classic" ? "#fff" : theme.surface};border-bottom:1px solid rgba(109,42,149,0.12);">
      <h1 style="margin:0;color:${theme.primary};font-size:32px;line-height:1.05;">${escapeHtml(cv.fullName || "Votre nom")}</h1>
      <p style="margin:8px 0 0;color:#475569;font-size:16px;">${escapeHtml(cv.title || "Titre professionnel")}</p>
      ${cv.headline ? `<p style="margin:8px 0 0;color:${theme.accent};font-size:13px;font-weight:600;">${escapeHtml(cv.headline)}</p>` : ""}
      <p style="margin:12px 0 0;color:#64748b;font-size:13px;">${[cv.email, cv.phone, cv.address, cv.website, cv.linkedin, cv.github].filter(Boolean).map(escapeHtml).join(" | ")}</p>
    </header>
  `;

  const summary = cv.summary
    ? `<section>${sectionTitle("Professional Summary", theme)}<p style="margin:0;color:${mutedColor};line-height:1.7;">${escapeHtml(cv.summary)}</p></section>`
    : "";

  const objective = cv.objective
    ? `<section>${sectionTitle("Career Objective", theme)}<p style="margin:0;color:${mutedColor};line-height:1.7;">${escapeHtml(cv.objective)}</p></section>`
    : "";

  const expHtml = experiences.length
    ? `<section>${sectionTitle("Experience", theme)}${experiences
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:${titleColor};font-size:16px;">${escapeHtml(item.role || "Role")}</strong>
                <span style="color:${accentColor};font-weight:600;">${escapeHtml(item.company || "Company")}</span>
              </div>
              <span style="color:${isSidebarTemplate ? "rgba(255,255,255,0.58)" : "#64748b"};font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:${mutedColor};line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const eduHtml = education.length
    ? `<section>${sectionTitle("Education", theme)}${education
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:${titleColor};font-size:16px;">${escapeHtml(item.diploma || "Diploma")}</strong>
                <span style="color:${accentColor};font-weight:600;">${escapeHtml(item.school || "School")}</span>
              </div>
              <span style="color:${isSidebarTemplate ? "rgba(255,255,255,0.58)" : "#64748b"};font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:${mutedColor};line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const projectHtml = projects.length
    ? `<section>${sectionTitle("Projects", theme)}${projects
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <strong style="display:block;color:${titleColor};font-size:16px;">${escapeHtml(item.title || "Project")}</strong>
              <span style="color:${isSidebarTemplate ? "rgba(255,255,255,0.58)" : "#64748b"};font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:${mutedColor};line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const achievementHtml = achievements.length
    ? `<section>${sectionTitle("Achievements", theme)}${achievements
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <strong style="display:block;color:${titleColor};font-size:16px;">${escapeHtml(item.title || "Achievement")}</strong>
            <p style="margin:8px 0 0;color:${mutedColor};line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const volunteerHtml = volunteer.length
    ? `<section>${sectionTitle("Volunteer", theme)}${volunteer
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:${titleColor};font-size:16px;">${escapeHtml(item.role || "Role")}</strong>
                <span style="color:${accentColor};font-weight:600;">${escapeHtml(item.organization || "Organization")}</span>
              </div>
              <span style="color:${isSidebarTemplate ? "rgba(255,255,255,0.58)" : "#64748b"};font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:${mutedColor};line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const sidebarLists = [
    skills.length
      ? `<section>${isSidebarTemplate ? `<h2 style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${titleColor};border-bottom:1px solid ${lineColor};padding-bottom:8px;">Compétences</h2>` : sectionTitle("Skills", theme)}<ul style="margin:0;padding-left:18px;color:${isSidebarTemplate ? "rgba(255,255,255,0.82)" : "#334155"};line-height:1.8;font-size:13px;">${skills.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : "",
    languages.length
      ? `<section>${isSidebarTemplate ? `<h2 style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${titleColor};border-bottom:1px solid ${lineColor};padding-bottom:8px;">Langues</h2>` : sectionTitle("Languages", theme)}<ul style="margin:0;padding-left:18px;color:${isSidebarTemplate ? "rgba(255,255,255,0.82)" : "#334155"};line-height:1.8;font-size:13px;">${languages.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : "",
    certifications.length
      ? `<section>${isSidebarTemplate ? `<h2 style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${titleColor};border-bottom:1px solid ${lineColor};padding-bottom:8px;">Certifications</h2>` : sectionTitle("Certifications", theme)}<ul style="margin:0;padding-left:18px;color:${isSidebarTemplate ? "rgba(255,255,255,0.82)" : "#334155"};line-height:1.8;font-size:13px;">${certifications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
      : "",
  ].join("");

  const mainSections = [summary, objective, expHtml, eduHtml, projectHtml, achievementHtml, volunteerHtml].join("");

  const content =
    isSidebarTemplate
      ? `
      <div style="display:grid;grid-template-columns:168px 1fr;min-height:900px;background:#fff;">
        <aside style="background:${sidebarBackground};padding:22px 18px;display:flex;flex-direction:column;gap:18px;color:#fff;">
          <div style="padding-bottom:18px;border-bottom:1px solid ${lineColor};display:grid;gap:12px;">
            <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));display:grid;place-items:center;color:#fff;font-size:19px;font-weight:700;letter-spacing:0.04em;">${escapeHtml(sidebarInitials)}</div>
            <div style="display:grid;gap:4px;">
              <strong style="color:#fff;font-size:17px;line-height:1.08;">${escapeHtml(cv.fullName || "Votre nom")}</strong>
              <span style="color:rgba(255,255,255,0.74);font-size:12px;font-weight:600;">${escapeHtml(cv.title || "Titre professionnel")}</span>
            </div>
            ${cv.headline ? `<p style="margin:0;color:rgba(255,255,255,0.72);font-size:12px;line-height:1.55;">${escapeHtml(cv.headline)}</p>` : ""}
            <div style="display:grid;gap:8px;font-size:11px;line-height:1.5;color:rgba(255,255,255,0.74);">${contactItems}</div>
          </div>
          ${sidebarLists}
        </aside>
        <main style="padding:26px 30px;display:flex;flex-direction:column;gap:24px;background:#fff;">${mainSections}</main>
      </div>`
      : `
      <main style="padding:28px 32px;display:grid;grid-template-columns:${effectiveTemplate === "modern" ? "1.4fr 0.8fr" : "1fr"};gap:28px;background:#fff;">
        <div style="display:flex;flex-direction:column;gap:26px;">${header}${mainSections}</div>
        ${effectiveTemplate === "modern" ? `<aside style="display:flex;flex-direction:column;gap:24px;">${sidebarLists}</aside>` : ""}
      </main>`;

  return `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(cv.fullName || "CV")}</title>
    <style>
      html, body { margin:0; padding:0; overflow:hidden; background:#e2e8f0; font-family: Geist, sans-serif; color:#1f1839; }
      .page { width:210mm; min-height:297mm; margin:24px auto; background:#fff; box-shadow:0 20px 40px rgba(15,23,42,0.12); }
      * { box-sizing:border-box; }
      @media print {
        body { background:#fff; }
        .page { width:auto; min-height:auto; margin:0; box-shadow:none; }
      }
    </style>
  </head>
  <body>
    <div class="page">${header}${content}</div>
    <script>window.onload = () => { window.focus(); };</script>
  </body>
  </html>`;
}

function buildCvPdfBlob(cv: CvFormState, theme: CvTheme) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 44;
  const headerHeight = 92;
  const contentWidth = pageWidth - margin * 2;
  const themeRgb = hexToRgb(theme.primary);
  const accentRgb = hexToRgb(theme.accent);
  const mutedRgb = { r: 0.29, g: 0.33, b: 0.38 };
  const darkRgb = { r: 0.07, g: 0.09, b: 0.12 };
  const pages: string[] = [];
  let currentPage = "";
  let y = pageHeight - margin;

  const beginPage = () => {
    currentPage = [
      `${themeRgb.r.toFixed(3)} ${themeRgb.g.toFixed(3)} ${themeRgb.b.toFixed(3)} rg`,
      `0 ${pageHeight - headerHeight} ${pageWidth} ${headerHeight} re f`,
      "BT",
      "/F2 24 Tf",
      "1 1 1 rg",
      `1 0 0 1 ${margin} ${pageHeight - 54} Tm`,
      `(${escapePdfText(cv.fullName || "Your Name")}) Tj`,
      "ET",
      "BT",
      "/F1 12 Tf",
      "1 1 1 rg",
      `1 0 0 1 ${margin} ${pageHeight - 74} Tm`,
      `(${escapePdfText([cv.title, cv.email, cv.phone].filter(Boolean).join(" | ") || "Professional Title")}) Tj`,
      "ET",
    ].join("\n");
    y = pageHeight - headerHeight - 28;
  };

  const pushPage = () => {
    pages.push(currentPage);
    currentPage = "";
  };

  const ensureSpace = (heightNeeded: number) => {
    if (!currentPage) {
      beginPage();
      return;
    }

    if (y - heightNeeded < margin) {
      pushPage();
      beginPage();
    }
  };

  const addTextLine = (text: string, options?: { size?: number; font?: "F1" | "F2"; color?: { r: number; g: number; b: number }; x?: number }) => {
    const size = options?.size ?? 11;
    const font = options?.font ?? "F1";
    const color = options?.color ?? darkRgb;
    const x = options?.x ?? margin;

    ensureSpace(size + 8);
    currentPage += `\nBT\n/${font} ${size} Tf\n${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)} rg\n1 0 0 1 ${x} ${y} Tm\n(${escapePdfText(text)}) Tj\nET`;
    y -= size + 6;
  };

  const addWrappedParagraph = (text: string, options?: { size?: number; x?: number; width?: number; color?: { r: number; g: number; b: number } }) => {
    const size = options?.size ?? 11;
    const x = options?.x ?? margin;
    const width = options?.width ?? contentWidth;
    const color = options?.color ?? mutedRgb;
    const lines = splitTextForPdf(text, size, width);

    for (const line of lines) {
      addTextLine(line, { size, font: "F1", color, x });
    }
  };

  const addSection = (title: string) => {
    ensureSpace(28);
    y -= 4;
    addTextLine(title.toUpperCase(), { size: 13, font: "F2", color: accentRgb });
    currentPage += `\n${accentRgb.r.toFixed(3)} ${accentRgb.g.toFixed(3)} ${accentRgb.b.toFixed(3)} RG\n${margin} ${y + 2} ${contentWidth} 0 l S`;
    y -= 6;
  };

  beginPage();

  const headerMeta = [cv.address, cv.website, cv.linkedin, cv.github].filter(Boolean).join(" | ");
  if (headerMeta) {
    addTextLine(headerMeta, { size: 10, color: mutedRgb });
    y -= 4;
  }

  if (cv.summary.trim()) {
    addSection("Professional Summary");
    addWrappedParagraph(cv.summary);
    y -= 4;
  }

  if (cv.objective.trim()) {
    addSection("Career Objective");
    addWrappedParagraph(cv.objective);
    y -= 4;
  }

  const experiences = cv.experiences.filter((item) => item.role || item.company || item.details);
  if (experiences.length) {
    addSection("Experience");
    for (const item of experiences) {
      addTextLine(`${item.role || "Role"}${item.company ? ` - ${item.company}` : ""}`, { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const education = cv.education.filter((item) => item.diploma || item.school || item.details);
  if (education.length) {
    addSection("Education");
    for (const item of education) {
      addTextLine(`${item.diploma || "Diploma"}${item.school ? ` - ${item.school}` : ""}`, { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const projects = cv.projects.filter((item) => item.title || item.details);
  if (projects.length) {
    addSection("Projects");
    for (const item of projects) {
      addTextLine(item.title || "Project", { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const achievements = cv.achievements.filter((item) => item.title || item.details);
  if (achievements.length) {
    addSection("Achievements");
    for (const item of achievements) {
      addTextLine(item.title || "Achievement", { size: 12, font: "F2", color: darkRgb });
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const volunteer = cv.volunteer.filter((item) => item.role || item.organization || item.details);
  if (volunteer.length) {
    addSection("Volunteer");
    for (const item of volunteer) {
      addTextLine(`${item.role || "Role"}${item.organization ? ` - ${item.organization}` : ""}`, { size: 12, font: "F2", color: darkRgb });
      if (item.period) {
        addTextLine(item.period, { size: 10, color: accentRgb });
      }
      if (item.details) {
        addWrappedParagraph(item.details);
      }
      y -= 4;
    }
  }

  const listSections = [
    { title: "Skills", items: parseList(cv.skills) },
    { title: "Languages", items: parseList(cv.languages) },
    { title: "Certifications", items: parseList(cv.certifications) },
  ];

  for (const section of listSections) {
    if (!section.items.length) {
      continue;
    }

    addSection(section.title);
    for (const item of section.items) {
      addWrappedParagraph(`- ${item}`);
    }
    y -= 4;
  }

  if (currentPage) {
    pushPage();
  }

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const contentIds = pages.map((page) =>
    addObject(`<< /Length ${page.length} >>\nstream\n${page}\nendstream`),
  );
  const pageIds = contentIds.map((contentId) =>
    addObject(`<< /Type /Page /Parent PAGES_REF 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`),
  );
  const pagesId = addObject(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const resolvedObjects = objects.map((content) => content.replaceAll("PAGES_REF", String(pagesId)));
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  resolvedObjects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${resolvedObjects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${resolvedObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export default function CandidateCvPage() {
  const [cv, setCv] = useState<CvFormState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [activeStep, setActiveStep] = useState<CvStepId>("profile");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isSaved, setIsSaved] = useState(true);
  const [previewFrameHeight, setPreviewFrameHeight] = useState(1120);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [tourOpen, setTourOpen] = useState(true);
  const [tourRect, setTourRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [tourCardPos, setTourCardPos] = useState<{ top: number; left: number }>({ top: 88, left: 88 });
  const previousStepCompletionRef = useRef<Record<CvStepId, boolean> | null>(null);

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === cv.colorThemeId) ?? themes[0],
    [cv.colorThemeId],
  );
  const stepCompletion = useMemo(() => getStepCompletion(cv), [cv]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const nextCv = saved ? normalizeCvState(JSON.parse(saved)) : createDefaultState();
      setCv(nextCv);
      setPreviewHtml(buildCvHtml(nextCv, themes.find((theme) => theme.id === nextCv.colorThemeId) ?? themes[0]));
    } catch {
      const fallbackCv = createDefaultState();
      setCv(fallbackCv);
      setPreviewHtml(buildCvHtml(fallbackCv, themes[0]));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviewHtml(buildCvHtml(cv, activeTheme));
      setIsSaved(false);
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [activeTheme, cv, hydrated]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  const updateField = <K extends keyof CvFormState>(key: K, value: CvFormState[K]) => {
    setCv((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    setIsSaved(true);
    setMessage("Draft saved.");
  };

  const downloadPdf = () => {
    const blob = buildCvPdfBlob(cv, activeTheme);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(cv.fullName || "candidate-cv").trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    setMessage("CV downloaded.");
  };

  const previewInNewTab = () => {
    const previewBlob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const previewUrl = window.URL.createObjectURL(previewBlob);
    const win = window.open(previewUrl, "_blank");

    if (!win) {
      window.URL.revokeObjectURL(previewUrl);
      setMessage("Popup blocked. Use the live preview panel on the right.");
      return;
    }

    window.setTimeout(() => {
      window.URL.revokeObjectURL(previewUrl);
    }, 1000);
  };

  const syncPreviewFrameHeight = useCallback(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;

    try {
      const doc = frame.contentDocument;
      if (!doc) return;

      const body = doc.body;
      const root = doc.documentElement;
      const page = doc.querySelector(".page") as HTMLElement | null;

      const contentHeight = Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
        page?.scrollHeight || 0,
        page?.offsetHeight || 0,
      );

      if (contentHeight > 0) {
        setPreviewFrameHeight(contentHeight);
      }
    } catch {}
  }, []);

  const stepIndex = CV_STEPS.findIndex((step) => step.id === activeStep);
  const activeStepContent = STEP_CONTENT[activeStep];
  const completedCount = CV_STEPS.filter((step) => stepCompletion[step.id]).length;
  const isCurrentStepComplete = stepCompletion[activeStep];
  const activeTourStep =
    CV_BUILDER_TOUR_STEPS.find((step) => step.stepId === activeStep) ?? CV_BUILDER_TOUR_STEPS[0];
  const tourStepIndex = Math.max(0, CV_STEPS.findIndex((step) => step.id === activeStep));
  const previewFrameHeightPx = Math.max(900, previewFrameHeight);
  const previewFrameStyle = {
    "--preview-frame-height": `${previewFrameHeightPx}px`,
  } as CSSProperties;

  const updateExperienceField = (id: string, key: keyof CvExperience, value: string) => {
    setCv((current) => ({
      ...current,
      experiences: current.experiences.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateEducationField = (id: string, key: keyof CvEducation, value: string) => {
    setCv((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateProjectField = (id: string, key: keyof CvProject, value: string) => {
    setCv((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateAchievementField = (id: string, key: keyof CvAchievement, value: string) => {
    setCv((current) => ({
      ...current,
      achievements: current.achievements.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateVolunteerField = (id: string, key: keyof CvVolunteer, value: string) => {
    setCv((current) => ({
      ...current,
      volunteer: current.volunteer.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const addExperience = () =>
    setCv((current) => ({
      ...current,
      experiences: [...current.experiences, { id: createId("exp"), role: "", company: "", period: "", details: "" }],
    }));

  const addEducation = () =>
    setCv((current) => ({
      ...current,
      education: [...current.education, { id: createId("edu"), diploma: "", school: "", period: "", details: "" }],
    }));

  const addProject = () =>
    setCv((current) => ({
      ...current,
      projects: [...current.projects, { id: createId("proj"), title: "", period: "", details: "" }],
    }));

  const addAchievement = () =>
    setCv((current) => ({
      ...current,
      achievements: [...current.achievements, { id: createId("achievement"), title: "", details: "" }],
    }));

  const addVolunteer = () =>
    setCv((current) => ({
      ...current,
      volunteer: [...current.volunteer, { id: createId("volunteer"), role: "", organization: "", period: "", details: "" }],
    }));

  const removeExperience = (id: string) =>
    setCv((current) => ({
      ...current,
      experiences: current.experiences.length > 1 ? current.experiences.filter((item) => item.id !== id) : current.experiences,
    }));

  const removeEducation = (id: string) =>
    setCv((current) => ({
      ...current,
      education: current.education.length > 1 ? current.education.filter((item) => item.id !== id) : current.education,
    }));

  const removeProject = (id: string) =>
    setCv((current) => ({
      ...current,
      projects: current.projects.length > 1 ? current.projects.filter((item) => item.id !== id) : current.projects,
    }));

  const removeAchievement = (id: string) =>
    setCv((current) => ({
      ...current,
      achievements: current.achievements.length > 1 ? current.achievements.filter((item) => item.id !== id) : current.achievements,
    }));

  const removeVolunteer = (id: string) =>
    setCv((current) => ({
      ...current,
      volunteer: current.volunteer.length > 1 ? current.volunteer.filter((item) => item.id !== id) : current.volunteer,
    }));

  useEffect(() => {
    const id = window.setTimeout(syncPreviewFrameHeight, 120);
    return () => window.clearTimeout(id);
  }, [previewHtml, syncPreviewFrameHeight]);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => setTourOpen(true), 240);
    return () => window.clearTimeout(id);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setTourOpen(true);
  }, [activeStep, hydrated]);

  useEffect(() => {
    if (!tourOpen) {
      setTourRect(null);
      return;
    }

    const computeTourPosition = () => {
      const target = document.getElementById(activeTourStep.targetId);
      if (!target) {
        setTourRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const spotlightPadding = 8;
      const spotlight = {
        top: rect.top + window.scrollY - spotlightPadding,
        left: rect.left + window.scrollX - spotlightPadding,
        width: rect.width + spotlightPadding * 2,
        height: rect.height + spotlightPadding * 2,
      };
      setTourRect(spotlight);

      const cardWidth = 340;
      const cardHeight = 228;
      const viewportTop = window.scrollY;
      const viewportLeft = window.scrollX;
      const viewportRight = viewportLeft + window.innerWidth;
      const viewportBottom = viewportTop + window.innerHeight;
      const gap = 16;

      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + gap;

      if (left + cardWidth > viewportRight - 12) {
        left = viewportRight - cardWidth - 12;
      }
      if (left < viewportLeft + 12) {
        left = viewportLeft + 12;
      }

      if (top + cardHeight > viewportBottom - 12) {
        top = rect.top + window.scrollY - cardHeight - gap;
      }
      if (top < viewportTop + 12) {
        top = viewportTop + 12;
      }

      setTourCardPos({ top, left });
    };

    computeTourPosition();
    window.addEventListener("resize", computeTourPosition);
    window.addEventListener("scroll", computeTourPosition, { passive: true });

    return () => {
      window.removeEventListener("resize", computeTourPosition);
      window.removeEventListener("scroll", computeTourPosition);
    };
  }, [activeTourStep, tourOpen]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const previous = previousStepCompletionRef.current;
    if (!previous) {
      previousStepCompletionRef.current = stepCompletion;
      return;
    }

    const justCompleted = !previous[activeStep] && stepCompletion[activeStep];
    previousStepCompletionRef.current = stepCompletion;

    if (!justCompleted) {
      return;
    }

    const currentIndex = CV_STEPS.findIndex((step) => step.id === activeStep);
    if (currentIndex < 0 || currentIndex >= CV_STEPS.length - 1) {
      return;
    }

    const nextStep = CV_STEPS[currentIndex + 1];
    window.setTimeout(() => {
      setActiveStep(nextStep.id);
      setTourOpen(true);
    }, 220);
  }, [activeStep, hydrated, stepCompletion]);

  const closeTour = useCallback(() => {
    setTourOpen(false);
  }, []);

  if (!hydrated) {
    return <div className="p-6 text-sm text-slate-600">Chargement de l&apos;espace CV...</div>;
  }

  return (
    <main className="cvb" aria-label="Espace CV">
      <div className="cvb__frame">
        {message ? (
          <div className="cvb__toast" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        <section className="cvb__content" data-saved={isSaved ? "true" : "false"}>
            <header className="cvb__header">
              <div className="cvb__header-actions">
                <button type="button" className="cvb__action cvb__action--ghost" onClick={previewInNewTab}>
                  <Eye size={16} strokeWidth={2.1} />
                  <span>Aperçu</span>
                </button>
                <button type="button" className="cvb__action cvb__action--ghost" onClick={() => setActiveStep("review")}>
                  <Sparkles size={16} strokeWidth={2.1} />
                  <span>Conseils IA</span>
                  <span className="cvb__dot" aria-hidden="true" />
                </button>
                <button type="button" className="cvb__action cvb__action--primary" onClick={downloadPdf}>
                  <Download size={16} strokeWidth={2.1} />
                  <span>Télécharger le CV</span>
                  <ChevronDown size={15} strokeWidth={2.3} />
                </button>
              </div>
            </header>

            <nav id="cvb-guide-stepper" className="cvb__stepper" aria-label="Step progress">
              {CV_STEPS.map((step, index) => {
                const isActive = step.id === activeStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    className="cvb__stepper-item"
                    onClick={() => setActiveStep(step.id)}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span className={`cvb__circle ${isActive ? "is-active" : ""}`}>{index + 1}</span>
                    <span>{step.title}</span>
                    {index < CV_STEPS.length - 1 ? <span className="cvb__line" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </nav>

            <div className="cvb__main-grid">
              <section className="cvb__form-card" aria-labelledby="personal-info-title">
                <div className="cvb__form-head">
                  <span className="cvb__form-icon" aria-hidden="true">{activeStepContent.icon}</span>
                  <div>
                    <h2 id="personal-info-title">{activeStepContent.title}</h2>
                    <p>{activeStepContent.description}</p>
                  </div>
                  <span className="cvb__step-chip">Step {stepIndex + 1} of {CV_STEPS.length}</span>
                </div>

                <div className="cvb__guide-inline" role="status" aria-live="polite">
                  <strong>
                    Progression: {completedCount}/{CV_STEPS.length}
                  </strong>
                  <span>
                    {isCurrentStepComplete
                      ? "Etape complete. Passage automatique a l etape suivante."
                      : "Remplissez les champs essentiels de cette etape pour debloquer la suite."}
                  </span>
                </div>

                {activeStep === "profile" ? (
                  <div id="cvb-guide-active-fields" className="cvb__fields">
                    <Field label="Prénom et nom" required>
                      <input type="text" value={cv.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
                    </Field>
                    <Field label="Titre professionnel" required>
                      <input type="text" value={cv.title} onChange={(event) => updateField("title", event.target.value)} />
                    </Field>
                    <Field label="Email" required>
                      <input type="email" value={cv.email} onChange={(event) => updateField("email", event.target.value)} />
                    </Field>
                    <Field label="Téléphone">
                      <input type="text" value={cv.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    </Field>
                    <Field label="Localisation" required>
                      <input type="text" value={cv.address} onChange={(event) => updateField("address", event.target.value)} />
                    </Field>
                    <Field label="LinkedIn">
                      <input type="text" value={cv.linkedin} onChange={(event) => updateField("linkedin", event.target.value)} />
                    </Field>
                    <Field label="À propos de vous" className="is-wide">
                      <textarea rows={5} value={cv.summary} onChange={(event) => updateField("summary", event.target.value)} />
                    </Field>
                  </div>
                ) : null}

                {activeStep === "experience" ? (
                  <div id="cvb-guide-active-fields" className="cvb__item-stack">
                    {cv.experiences.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Expérience {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeExperience(item.id)}>Supprimer</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Poste">
                            <input type="text" value={item.role} onChange={(event) => updateExperienceField(item.id, "role", event.target.value)} />
                          </Field>
                          <Field label="Entreprise">
                            <input type="text" value={item.company} onChange={(event) => updateExperienceField(item.id, "company", event.target.value)} />
                          </Field>
                          <Field label="Période">
                            <input type="text" value={item.period} onChange={(event) => updateExperienceField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Détails" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateExperienceField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addExperience}>+ Ajouter une expérience</button>
                  </div>
                ) : null}

                {activeStep === "education" ? (
                  <div id="cvb-guide-active-fields" className="cvb__item-stack">
                    {cv.education.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Formation {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeEducation(item.id)}>Supprimer</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Diplôme">
                            <input type="text" value={item.diploma} onChange={(event) => updateEducationField(item.id, "diploma", event.target.value)} />
                          </Field>
                          <Field label="École">
                            <input type="text" value={item.school} onChange={(event) => updateEducationField(item.id, "school", event.target.value)} />
                          </Field>
                          <Field label="Période">
                            <input type="text" value={item.period} onChange={(event) => updateEducationField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Détails" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateEducationField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addEducation}>+ Ajouter une formation</button>
                  </div>
                ) : null}

                {activeStep === "skills" ? (
                  <div id="cvb-guide-active-fields" className="cvb__fields">
                    <Field label="Compétences (une par ligne)" className="is-wide">
                      <textarea rows={6} value={cv.skills} onChange={(event) => updateField("skills", event.target.value)} />
                    </Field>
                    <Field label="Langues (une par ligne)" className="is-wide">
                      <textarea rows={4} value={cv.languages} onChange={(event) => updateField("languages", event.target.value)} />
                    </Field>
                    <Field label="Certifications (une par ligne)" className="is-wide">
                      <textarea rows={4} value={cv.certifications} onChange={(event) => updateField("certifications", event.target.value)} />
                    </Field>
                  </div>
                ) : null}

                {activeStep === "projects" ? (
                  <div id="cvb-guide-active-fields" className="cvb__item-stack">
                    {cv.projects.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Projet {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeProject(item.id)}>Supprimer</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Titre">
                            <input type="text" value={item.title} onChange={(event) => updateProjectField(item.id, "title", event.target.value)} />
                          </Field>
                          <Field label="Période">
                            <input type="text" value={item.period} onChange={(event) => updateProjectField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Détails" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateProjectField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addProject}>+ Ajouter un projet</button>
                  </div>
                ) : null}

                {activeStep === "extras" ? (
                  <div id="cvb-guide-active-fields" className="cvb__item-stack">
                    <div className="cvb__fields">
                      <Field label="Accroche" className="is-wide">
                        <input type="text" value={cv.headline} onChange={(event) => updateField("headline", event.target.value)} />
                      </Field>
                      <Field label="Site web">
                        <input type="text" value={cv.website} onChange={(event) => updateField("website", event.target.value)} />
                      </Field>
                      <Field label="GitHub">
                        <input type="text" value={cv.github} onChange={(event) => updateField("github", event.target.value)} />
                      </Field>
                      <Field label="Objectif de carrière" className="is-wide">
                        <textarea rows={4} value={cv.objective} onChange={(event) => updateField("objective", event.target.value)} />
                      </Field>
                    </div>

                    {cv.achievements.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Réalisation {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeAchievement(item.id)}>Supprimer</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Titre">
                            <input type="text" value={item.title} onChange={(event) => updateAchievementField(item.id, "title", event.target.value)} />
                          </Field>
                          <Field label="Détails" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateAchievementField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addAchievement}>+ Ajouter une réalisation</button>

                    {cv.volunteer.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Bénévolat {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeVolunteer(item.id)}>Supprimer</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Rôle">
                            <input type="text" value={item.role} onChange={(event) => updateVolunteerField(item.id, "role", event.target.value)} />
                          </Field>
                          <Field label="Organisation">
                            <input type="text" value={item.organization} onChange={(event) => updateVolunteerField(item.id, "organization", event.target.value)} />
                          </Field>
                          <Field label="Période">
                            <input type="text" value={item.period} onChange={(event) => updateVolunteerField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Détails" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateVolunteerField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addVolunteer}>+ Ajouter un bénévolat</button>
                  </div>
                ) : null}

                {activeStep === "review" ? (
                  <div id="cvb-guide-active-fields" className="cvb__item-stack">
                    <div className="cvb__fields">
                      <Field label="Modèle">
                        <select value={cv.template} onChange={(event) => updateField("template", event.target.value as CvTemplate)}>
                          <option value="classic">Classique</option>
                          <option value="modern">Minimaliste</option>
                          <option value="sidebar">Moderne</option>
                          <option value="creative">Créatif</option>
                        </select>
                      </Field>
                      <Field label="Thème">
                        <select value={cv.colorThemeId} onChange={(event) => updateField("colorThemeId", event.target.value)}>
                          {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="cvb__review-grid">
                      <div><strong>Profil</strong><span>{cv.fullName || "Nom manquant"}</span></div>
                      <div><strong>Expériences</strong><span>{cv.experiences.length}</span></div>
                      <div><strong>Formations</strong><span>{cv.education.length}</span></div>
                      <div><strong>Projets</strong><span>{cv.projects.length}</span></div>
                      <div><strong>Réalisations</strong><span>{cv.achievements.length}</span></div>
                      <div><strong>Bénévolat</strong><span>{cv.volunteer.length}</span></div>
                    </div>
                  </div>
                ) : null}

                <div className="cvb__tip" role="note" aria-label="Tip">
                  <strong>Conseil</strong>
                  <p>{activeStepContent.tip}</p>
                </div>

                <div id="cvb-guide-actions" className="cvb__form-actions">
                  <button type="button" className="cvb__ghost" onClick={saveDraft}>
                    Enregistrer et quitter
                  </button>
                  <button
                    type="button"
                    className="cvb__primary"
                    onClick={() => {
                      saveDraft();
                      const next = CV_STEPS[Math.min(CV_STEPS.length - 1, stepIndex + 1)];
                      setActiveStep(next.id);
                    }}
                  >
                    Enregistrer et continuer
                  </button>
                </div>
              </section>

              <aside id="cvb-guide-preview" className="cvb__preview" aria-label="CV preview">
                <div className="cvb__preview-head">
                  <h3>Aperçu du CV</h3>
                  <div className="cvb__toggle" role="group" aria-label="Preview mode">
                    <button
                      type="button"
                      className={previewMode === "desktop" ? "is-active" : ""}
                      onClick={() => setPreviewMode("desktop")}
                      aria-label="Desktop preview"
                    >
                      🖥
                    </button>
                    <button
                      type="button"
                      className={previewMode === "mobile" ? "is-active" : ""}
                      onClick={() => setPreviewMode("mobile")}
                      aria-label="Mobile preview"
                    >
                      📱
                    </button>
                  </div>
                </div>

                <div
                  className={`cvb__preview-box ${previewMode === "mobile" ? "is-mobile" : ""}`}
                  style={previewFrameStyle}
                >
                  <div className="cvb__preview-viewport" aria-label="Miniature du CV">
                    <div className="cvb__preview-stage">
                      <div className="cvb__preview-paper">
                        <iframe
                          ref={previewFrameRef}
                          title="Live CV preview"
                          srcDoc={previewHtml}
                          className="cvb__preview-iframe"
                          onLoad={syncPreviewFrameHeight}
                          scrolling="no"
                          style={{ height: `${previewFrameHeightPx}px` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="cvb__preview-note">Aperçu en direct. Votre CV s’adapte au modèle et aux réglages.</p>
              </aside>
            </div>

            <section className="cvb__templates" aria-labelledby="cvb-templates-title">
              <div className="cvb__templates-head">
                <div>
                  <h2 id="cvb-templates-title">Choisir un modèle</h2>
                </div>
                <button type="button" className="cvb__templates-link">
                  Voir tous les modèles
                </button>
              </div>

              <div className="cvb__template-grid">
                {templateCards.map((card) => {
                  const isActive = cv.template === card.id;

                  return (
                    <button
                      key={card.id}
                      type="button"
                      className={`cvb__template-card${isActive ? " is-active" : ""}`}
                      onClick={() => updateField("template", card.id)}
                    >
                      <div className="cvb__template-thumb" aria-hidden="true">
                        <span className="cvb__template-thumb-sidebar" style={{ background: card.accent }} />
                        <span className="cvb__template-thumb-paper">
                          <span className="cvb__template-thumb-line is-title" />
                          <span className="cvb__template-thumb-line" />
                          <span className="cvb__template-thumb-line is-short" />
                          <span className="cvb__template-thumb-line" />
                        </span>
                        {isActive ? <span className="cvb__template-check">✓</span> : null}
                      </div>
                      <div className="cvb__template-copy">
                        <strong>{card.title}</strong>
                        <span>{card.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
        </section>
      </div>

      {tourOpen && tourRect ? (
        <div className="cvb__tour-overlay" role="dialog" aria-modal="true" aria-label="Guide CV">
          <div
            className="cvb__tour-spotlight"
            style={{
              top: `${tourRect.top}px`,
              left: `${tourRect.left}px`,
              width: `${tourRect.width}px`,
              height: `${tourRect.height}px`,
            }}
          />
          <aside className="cvb__tour-card" style={{ top: `${tourCardPos.top}px`, left: `${tourCardPos.left}px` }}>
            <div className="cvb__tour-card-head">
              <span className="cvb__tour-icon" aria-hidden="true">{activeTourStep.icon}</span>
              <span className="cvb__tour-counter">
                {tourStepIndex + 1}/{CV_STEPS.length}
              </span>
              <button type="button" className="cvb__tour-close" onClick={closeTour} aria-label="Fermer le guide">
                ✕
              </button>
            </div>
            <h3>{activeTourStep.title}</h3>
            <p>{activeTourStep.description}</p>
            <div className="cvb__tour-tip">{activeTourStep.tip}</div>
            <div className="cvb__tour-actions">
              <button type="button" className="cvb__primary" onClick={closeTour}>
                Masquer
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <style jsx>{`
        .cvb {
          min-height: 100vh;
          background: #fbf9ff;
          color: #1f1839;
          font-family: var(--app-body);
          padding: 18px;
        }

        .cvb__frame {
          max-width: 1560px;
          margin: 0 auto;
        }

        .cvb__toast {
          margin-bottom: 14px;
          background: #ffffff;
          border: 1px solid #e4daf4;
          border-radius: 12px;
          padding: 10px 14px;
          color: #5d3487;
          font-size: 0.92rem;
        }

        .cvb__content {
          background: #ffffff;
          border: 1px solid #e8e0f6;
          border-radius: 22px;
          padding: 20px;
          display: grid;
          gap: 18px;
          box-shadow: 0 18px 40px rgba(42, 25, 71, 0.05);
        }

        .cvb__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #eee8f8;
          padding-bottom: 16px;
        }

        .cvb__header h1 {
          margin: 0;
          font-size: 2.1rem;
          line-height: 1.05;
          font-weight: 800;
        }

        .cvb__header p {
          margin: 8px 0 0;
          color: #6f678c;
          font-size: 0.94rem;
        }

        .cvb__header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .cvb__action {
          min-height: 42px;
          border-radius: 14px;
          padding: 0 14px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .cvb__action--ghost {
          background: #ffffff;
          border-color: #e5ddf0;
          color: #2a1d3d;
          box-shadow: none;
        }

        .cvb__action--primary {
          background: #4a154b;
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(74, 21, 75, 0.14);
        }

        .cvb__action--ghost:hover,
        .cvb__action--primary:hover {
          border-color: transparent;
        }

        .cvb__action--ghost:hover {
          background: #f8f5fc;
          border-color: #e5ddf0;
        }

        .cvb__action--primary:hover {
          background: #5b1a5e;
        }

        .cvb__action--primary:active {
          background: #3a103a;
        }

        .cvb__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--app-primary);
          flex: none;
        }

        .cvb__save-state {
          padding: 8px 10px;
          border-radius: 999px;
          background: #f4efff;
          color: #6d2a95;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .cvb__save-state.is-saved {
          background: #ebf8f1;
          color: #1f8b5f;
        }

        .cvb__ghost,
        .cvb__primary {
          min-height: 40px;
          border-radius: 12px;
          padding: 0 14px;
          font-weight: 700;
          font-size: 0.87rem;
          border: 1px solid transparent;
        }

        .cvb__ghost {
          border-color: #e5ddf0;
          background: #ffffff;
          color: #2a1d3d;
          box-shadow: none;
        }

        .cvb__primary {
          background: #4a154b;
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(74, 21, 75, 0.14);
        }

        .cvb__ghost:hover,
        .cvb__primary:hover {
          border-color: transparent;
        }

        .cvb__ghost:hover {
          background: #f8f5fc;
          border-color: #e5ddf0;
        }

        .cvb__primary:hover {
          background: #5b1a5e;
        }

        .cvb__primary:active {
          background: #3a103a;
        }

        .cvb__stepper {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .cvb__stepper-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          font-size: 0.8rem;
          color: #5e557b;
          border: 0;
          background: transparent;
          padding: 2px 0;
          cursor: pointer;
          text-align: left;
          font-weight: 600;
        }

        .cvb__stepper-item[aria-current="step"] {
          color: #3d2a68;
        }

        .cvb__circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid #d6caee;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 0.75rem;
          background: #fff;
        }

        .cvb__circle.is-active {
          background: var(--app-primary);
          color: #fff;
          border-color: var(--app-primary);
        }

        .cvb__line {
          width: 28px;
          height: 1px;
          background: #dcd2f1;
          margin-left: 2px;
        }

        .cvb__main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(420px, 460px);
          gap: 20px;
          align-items: start;
        }

        .cvb__form-card,
        .cvb__preview {
          background: #fff;
          border: 1px solid #ebe6f2;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 10px 28px rgba(31, 24, 57, 0.05);
        }

        .cvb__form-head {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 14px;
        }

        .cvb__guide-inline {
          border-bottom: 1px solid #f0edf5;
          padding: 0 0 14px;
          margin-bottom: 16px;
          display: grid;
          gap: 4px;
        }

        .cvb__guide-inline strong {
          font-size: 0.82rem;
          color: #4c2d79;
        }

        .cvb__guide-inline span {
          font-size: 0.8rem;
          color: #6f638f;
        }

        .cvb__form-icon {
          width: 42px;
          height: 42px;
          border-radius: 0;
          background: transparent;
          color: #6d2a95;
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .cvb__form-head h2 {
          margin: 0;
          font-size: 1.26rem;
          line-height: 1.15;
        }

        .cvb__form-head p {
          margin: 4px 0 0;
          color: #726991;
          font-size: 0.86rem;
          line-height: 1.4;
        }

        .cvb__step-chip {
          background: transparent;
          color: #6d2a95;
          border-radius: 0;
          padding: 0;
          font-size: 0.76rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .cvb__fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .cvb__item-stack {
          display: grid;
          gap: 0;
        }

        .cvb__item-card {
          border: 0;
          border-bottom: 1px solid #f0edf5;
          border-radius: 0;
          padding: 0 0 16px;
          margin-bottom: 16px;
          background: transparent;
          display: grid;
          gap: 12px;
        }

        .cvb__item-card:last-child {
          margin-bottom: 0;
        }

        .cvb__item-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .cvb__item-card-head strong {
          font-size: 0.9rem;
          color: #3f305f;
        }

        .cvb__add {
          justify-self: start;
        }

        .cvb__remove {
          border: 1px solid var(--app-primary);
          background: var(--app-primary);
          color: #fff;
          border-radius: 10px;
          min-height: 32px;
          padding: 0 10px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .cvb__review-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .cvb__review-grid > div {
          border: 0;
          border-bottom: 1px solid #f0edf5;
          background: transparent;
          border-radius: 0;
          padding: 0 0 10px;
          display: grid;
          gap: 4px;
        }

        .cvb__review-grid strong {
          font-size: 0.82rem;
          color: #5c4f7f;
        }

        .cvb__review-grid span {
          font-size: 0.95rem;
          font-weight: 700;
          color: #2b1f4f;
        }

        .cvb__tip {
          margin-top: 14px;
          border: 0;
          border-top: 1px solid #f0edf5;
          background: transparent;
          border-radius: 0;
          padding: 12px 0 0;
        }

        .cvb__tip strong {
          display: block;
          color: #5f2f87;
          font-size: 0.86rem;
        }

        .cvb__tip p {
          margin: 4px 0 0;
          color: #6f668f;
          font-size: 0.83rem;
          line-height: 1.5;
        }

        .cvb__form-actions {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .cvb__preview {
          position: sticky;
          top: 14px;
          display: grid;
          gap: 10px;
          align-self: start;
        }

        .cvb__preview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .cvb__preview-head h3 {
          margin: 0;
          font-size: 1.06rem;
        }

        .cvb__toggle {
          display: inline-flex;
          border: 1px solid #decff5;
          border-radius: 12px;
          padding: 3px;
          gap: 2px;
          background: #fff;
        }

        .cvb__toggle button {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 0;
          background: transparent;
          color: var(--app-primary);
          font-weight: 700;
          display: grid;
          place-items: center;
        }

        .cvb__toggle button.is-active {
          background: var(--app-primary);
          color: #fff;
        }

        .cvb__preview-box {
          --preview-paper-width: 794px;
          --preview-scale: 0.52;
          background: #f8f7fa;
          border: 0;
          border-radius: 10px;
          padding: 18px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .cvb__preview-box.is-mobile {
          --preview-scale: 0.45;
        }

        .cvb__preview-viewport {
          width: min(100%, calc(var(--preview-paper-width) * var(--preview-scale)));
          height: min(640px, max(380px, calc(var(--preview-frame-height) * var(--preview-scale))));
          overflow: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }

        .cvb__preview-stage {
          position: relative;
          width: calc(var(--preview-paper-width) * var(--preview-scale));
          height: calc(var(--preview-frame-height) * var(--preview-scale));
        }

        .cvb__preview-paper {
          position: absolute;
          top: 0;
          left: 0;
          width: var(--preview-paper-width);
          height: var(--preview-frame-height);
          background: #fff;
          border: 1px solid #ece8f6;
          border-radius: 8px;
          box-shadow: 0 18px 42px rgba(26, 17, 48, 0.16), 0 4px 10px rgba(26, 17, 48, 0.1);
          overflow: hidden;
          transform: scale(var(--preview-scale));
          transform-origin: top left;
        }

        .cvb__preview-iframe {
          width: 100%;
          min-height: 100%;
          border: 0;
          background: #fff;
          display: block;
        }

        .cvb__preview-note {
          margin: 0;
          color: #746c90;
          font-size: 0.8rem;
          line-height: 1.45;
        }

        .cvb__templates {
          background: #fff;
          border: 1px solid #ebe2f8;
          border-radius: 20px;
          padding: 18px;
          display: grid;
          gap: 14px;
          box-shadow: 0 18px 40px rgba(42, 25, 71, 0.04);
        }

        .cvb__templates-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cvb__templates-head h2 {
          margin: 0;
          font-size: 1rem;
          color: #1f1839;
        }

        .cvb__templates-link {
          border: 1px solid var(--app-primary);
          border-radius: 12px;
          background: var(--app-primary);
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          min-height: 38px;
          padding: 0 12px;
          box-shadow: 0 14px 28px -16px rgba(var(--app-primary-rgb), 0.85);
        }

        .cvb__remove:hover,
        .cvb__templates-link:hover {
          background: var(--app-primary-hover);
          border-color: var(--app-primary-hover);
        }

        .cvb__template-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .cvb__template-card {
          border: 1px solid #e6ddf4;
          background: #fff;
          border-radius: 16px;
          padding: 12px;
          display: grid;
          gap: 10px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .cvb__template-card:hover {
          transform: translateY(-1px);
          border-color: #ceb9ea;
          box-shadow: 0 14px 32px rgba(49, 25, 84, 0.08);
        }

        .cvb__template-card.is-active {
          border-color: var(--app-primary);
          box-shadow: 0 16px 34px rgba(var(--app-primary-rgb), 0.14);
        }

        .cvb__template-thumb {
          position: relative;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 10px;
          align-items: stretch;
          min-height: 96px;
          padding: 10px;
          border-radius: 14px;
          background: linear-gradient(180deg, #fbf8ff 0%, #f2eefb 100%);
          overflow: hidden;
        }

        .cvb__template-thumb-sidebar {
          border-radius: 12px;
        }

        .cvb__template-thumb-paper {
          display: grid;
          align-content: start;
          gap: 6px;
          padding: 2px 0;
        }

        .cvb__template-thumb-line {
          height: 6px;
          border-radius: 999px;
          background: rgba(68, 43, 102, 0.14);
        }

        .cvb__template-thumb-line.is-title {
          width: 78%;
          margin-bottom: 2px;
        }

        .cvb__template-thumb-line.is-short {
          width: 52%;
        }

        .cvb__template-check {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: var(--app-primary);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 0.75rem;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(var(--app-primary-rgb), 0.22);
        }

        .cvb__template-copy {
          display: grid;
          gap: 3px;
        }

        .cvb__template-copy strong {
          color: #1f1839;
          font-size: 0.92rem;
        }

        .cvb__template-copy span {
          color: #6f678c;
          font-size: 0.8rem;
        }

        .cvb__tour-overlay {
          position: fixed;
          inset: 0;
          z-index: 90;
          pointer-events: none;
        }

        .cvb__tour-spotlight {
          position: absolute;
          border-radius: 14px;
          border: 2px solid rgba(189, 153, 247, 0.95);
          box-shadow: 0 0 0 9999px rgba(22, 13, 40, 0.28);
          pointer-events: none;
        }

        .cvb__tour-card {
          position: absolute;
          width: min(340px, calc(100vw - 24px));
          border-radius: 16px;
          border: 1px solid #e7dcfb;
          background: #ffffff;
          box-shadow: 0 22px 48px rgba(32, 18, 58, 0.24);
          padding: 14px;
          display: grid;
          gap: 10px;
          pointer-events: auto;
        }

        .cvb__tour-card-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cvb__tour-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #f3eaff;
          color: #632d94;
          font-weight: 700;
          display: grid;
          place-items: center;
          font-size: 0.8rem;
        }

        .cvb__tour-counter {
          font-size: 0.76rem;
          color: #6c5a90;
          font-weight: 700;
        }

        .cvb__tour-close {
          margin-left: auto;
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid #dfd1f7;
          background: #fff;
          color: #5c2f88;
          font-size: 0;
          font-weight: 700;
          line-height: 1;
          display: grid;
          place-items: center;
        }

        .cvb__tour-close::before {
          content: "X";
          font-size: 1rem;
          line-height: 1;
        }

        .cvb__tour-card h3 {
          margin: 0;
          font-size: 1rem;
          color: #2c1f50;
        }

        .cvb__tour-card p {
          margin: 0;
          color: #6c628a;
          font-size: 0.86rem;
          line-height: 1.5;
        }

        .cvb__tour-tip {
          border-radius: 11px;
          border: 1px solid #eee2ff;
          background: #f8f3ff;
          color: #5f5281;
          font-size: 0.79rem;
          line-height: 1.45;
          padding: 8px 10px;
        }

        .cvb__tour-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        :global(.cvb button:focus-visible),
        :global(.cvb input:focus-visible),
        :global(.cvb textarea:focus-visible) {
          outline: none;
          box-shadow: 0 0 0 2px rgba(109, 42, 149, 0.3), 0 0 0 5px rgba(109, 42, 149, 0.1);
        }

        @media (max-width: 980px) {
          .cvb__main-grid {
            grid-template-columns: 1fr;
          }

          .cvb__template-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cvb__preview {
            position: static;
            order: 2;
          }

          .cvb__form-card {
            order: 1;
          }

          .cvb__preview-box {
            --preview-scale: 0.52;
          }

          .cvb__preview-box.is-mobile {
            --preview-scale: 0.44;
          }
        }

        @media (max-width: 760px) {
          .cvb {
            padding: 10px;
          }

          .cvb__content {
            padding: 12px;
          }

          .cvb__header {
            flex-direction: column;
            align-items: stretch;
          }

          .cvb__header-actions {
            justify-content: flex-start;
          }

          .cvb__action {
            width: 100%;
            justify-content: center;
          }

          .cvb__fields {
            grid-template-columns: 1fr;
          }

          .cvb__review-grid {
            grid-template-columns: 1fr;
          }

          .cvb__preview-box {
            --preview-scale: 0.44;
            padding: 14px 10px;
          }

          .cvb__preview-box.is-mobile {
            --preview-scale: 0.4;
          }

          .cvb__preview-viewport {
            height: min(540px, max(340px, calc(var(--preview-frame-height) * var(--preview-scale))));
          }

          .cvb__form-head {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .cvb__step-chip {
            grid-column: 1 / -1;
            justify-self: start;
          }

          .cvb__tour-card {
            width: calc(100vw - 20px);
          }

          .cvb__templates {
            padding: 14px;
          }
        }
      `}</style>
    </main>
  );
}

type StepMeta = {
  id: CvStepId;
  title: string;
};

const CV_STEPS: StepMeta[] = [
  { id: "profile", title: "Identité" },
  { id: "experience", title: "Expérience" },
  { id: "education", title: "Formation" },
  { id: "skills", title: "Compétences" },
  { id: "projects", title: "Projets" },
  { id: "extras", title: "Extras" },
  { id: "review", title: "Finalisation" },
];

const STEP_CONTENT: Record<CvStepId, { icon: string; title: string; description: string; tip: string }> = {
  profile: {
    icon: "ID",
    title: "Identité professionnelle",
    description: "Vos informations principales apparaissent en haut de votre CV.",
    tip: "Un résumé court et clair aide les recruteurs à comprendre votre profil en quelques secondes.",
  },
  experience: {
    icon: "EX",
    title: "Expérience",
    description: "Ajoutez vos expériences professionnelles avec des résultats concrets.",
    tip: "Utilisez des verbes d’action et des résultats mesurables dès que possible.",
  },
  education: {
    icon: "ED",
    title: "Formation",
    description: "Présentez vos diplômes et votre parcours académique de façon claire.",
    tip: "Gardez en premier la formation la plus récente ou la plus pertinente.",
  },
  skills: {
    icon: "SK",
    title: "Compétences",
    description: "Listez vos compétences, langues et certifications de manière lisible.",
    tip: "Privilégiez des compétences précises plutôt que des formulations génériques.",
  },
  projects: {
    icon: "PR",
    title: "Projets",
    description: "Mettez en avant les projets qui illustrent vos points forts.",
    tip: "Choisissez surtout les projets en lien avec les postes visés.",
  },
  extras: {
    icon: "EX+",
    title: "Extras",
    description: "Ajoutez des réalisations, du bénévolat ou une accroche complémentaire.",
    tip: "Ces sections peuvent vraiment faire la différence entre deux profils proches.",
  },
  review: {
    icon: "RV",
    title: "Finalisation",
    description: "Vérifiez la structure du CV et choisissez le modèle avant export.",
    tip: "Utilisez l’aperçu et l’export seulement après avoir vérifié toutes les sections.",
  },
};

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`cvb__field ${className || ""}`.trim()}>
      <span className="cvb__field-label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children}
      <style jsx>{`
        .cvb__field {
          display: grid;
          gap: 6px;
        }

        .cvb__field-label {
          font-size: 0.84rem;
          color: #514873;
          font-weight: 600;
        }

        .cvb__field.is-wide {
          grid-column: 1 / -1;
        }

        :global(.cvb__field input),
        :global(.cvb__field textarea),
        :global(.cvb__field select) {
          width: 100%;
          border: 1px solid #e0d5f3;
          border-radius: 12px;
          min-height: 42px;
          padding: 10px 12px;
          font-size: 0.92rem;
          color: #1f1839;
          background: #fff;
        }

        :global(.cvb__field textarea) {
          min-height: 126px;
          resize: vertical;
        }
      `}</style>
    </label>
  );
}
