"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CvTemplate = "classic" | "modern" | "sidebar";

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

const themes: CvTheme[] = [
  { id: "handitalents", name: "HandiTalents", primary: "#2f2458", surface: "#f3edff", accent: "#6d2a95" },
  { id: "midnight", name: "Midnight", primary: "#1f2a44", surface: "#eef2ff", accent: "#5669ff" },
  { id: "emerald", name: "Emerald", primary: "#184f46", surface: "#eefaf6", accent: "#2aa889" },
  { id: "sunrise", name: "Sunrise", primary: "#7f3d2f", surface: "#fff4ee", accent: "#ee7b4c" },
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
      "Passionate UX/UI Designer with 4+ years of experience creating accessible, user-centered digital products. I love solving problems with empathy and creating meaningful experiences.",
    objective: "I am looking for a full-time position.",
    skills: "UI Design\nUX Research\nFigma\nPrototyping\nAccessibility\nUser Testing",
    languages: "French - Native\nEnglish - Native",
    certifications: "Google UX Design Professional Certificate - 2023\nAccessibility Fundamentals - 2022",
    template: "sidebar",
    colorThemeId: "handitalents",
    experiences: [
      {
        id: createId("exp"),
        role: "UX/UI Designer",
        company: "Webelite Agency",
        period: "2021 - Present",
        details:
          "Designed and prototyped accessible web and mobile interfaces, collaborated with developers, and tested improvements with users.",
      },
      {
        id: createId("exp"),
        role: "Junior UX Designer",
        company: "Digital House",
        period: "2019 - 2021",
        details:
          "Supported design systems, prepared wireframes, and contributed to research and usability sessions.",
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
    template: data.template === "classic" || data.template === "modern" || data.template === "sidebar" ? data.template : defaults.template,
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

  const header = `
    <header style="padding:28px 32px;background:${cv.template === "classic" ? "#fff" : theme.surface};border-bottom:3px solid ${theme.accent};">
      <h1 style="margin:0;color:${theme.primary};font-size:34px;">${escapeHtml(cv.fullName || "Your Name")}</h1>
      <p style="margin:8px 0 0;color:#334155;font-size:18px;">${escapeHtml(cv.title || "Professional Title")}</p>
      ${cv.headline ? `<p style="margin:8px 0 0;color:${theme.accent};font-size:14px;font-weight:600;">${escapeHtml(cv.headline)}</p>` : ""}
      <p style="margin:14px 0 0;color:#475569;font-size:14px;">${[cv.email, cv.phone, cv.address, cv.website, cv.linkedin, cv.github].filter(Boolean).map(escapeHtml).join(" | ")}</p>
    </header>
  `;

  const summary = cv.summary
    ? `<section>${sectionTitle("Professional Summary", theme)}<p style="margin:0;color:#334155;line-height:1.7;">${escapeHtml(cv.summary)}</p></section>`
    : "";

  const objective = cv.objective
    ? `<section>${sectionTitle("Career Objective", theme)}<p style="margin:0;color:#334155;line-height:1.7;">${escapeHtml(cv.objective)}</p></section>`
    : "";

  const expHtml = experiences.length
    ? `<section>${sectionTitle("Experience", theme)}${experiences
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <div>
                <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.role || "Role")}</strong>
                <span style="color:${theme.accent};font-weight:600;">${escapeHtml(item.company || "Company")}</span>
              </div>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
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
                <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.diploma || "Diploma")}</strong>
                <span style="color:${theme.accent};font-weight:600;">${escapeHtml(item.school || "School")}</span>
              </div>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
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
              <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.title || "Project")}</strong>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const achievementHtml = achievements.length
    ? `<section>${sectionTitle("Achievements", theme)}${achievements
        .map(
          (item) => `
          <article style="margin-bottom:16px;">
            <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.title || "Achievement")}</strong>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
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
                <strong style="display:block;color:#0f172a;font-size:16px;">${escapeHtml(item.role || "Role")}</strong>
                <span style="color:${theme.accent};font-weight:600;">${escapeHtml(item.organization || "Organization")}</span>
              </div>
              <span style="color:#64748b;font-size:13px;white-space:nowrap;">${escapeHtml(item.period)}</span>
            </div>
            <p style="margin:8px 0 0;color:#334155;line-height:1.7;">${escapeHtml(item.details)}</p>
          </article>`,
        )
        .join("")}</section>`
    : "";

  const sidebarLists = [
    skills.length ? `<section>${sectionTitle("Skills", theme)}<ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${skills.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "",
    languages.length ? `<section>${sectionTitle("Languages", theme)}<ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${languages.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "",
    certifications.length ? `<section>${sectionTitle("Certifications", theme)}<ul style="margin:0;padding-left:18px;color:#334155;line-height:1.8;">${certifications.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "",
  ].join("");

  const mainSections = [summary, objective, expHtml, eduHtml, projectHtml, achievementHtml, volunteerHtml].join("");

  const content =
    cv.template === "sidebar"
      ? `
      <div style="display:grid;grid-template-columns:250px 1fr;min-height:900px;">
        <aside style="background:${theme.surface};padding:28px 24px;display:flex;flex-direction:column;gap:24px;">${sidebarLists}</aside>
        <main style="padding:28px 32px;display:flex;flex-direction:column;gap:26px;">${mainSections}</main>
      </div>`
      : `
      <main style="padding:28px 32px;display:grid;grid-template-columns:${cv.template === "modern" ? "1.4fr 0.8fr" : "1fr"};gap:28px;">
        <div style="display:flex;flex-direction:column;gap:26px;">${mainSections}</div>
        ${cv.template === "modern" ? `<aside style="display:flex;flex-direction:column;gap:24px;">${sidebarLists}</aside>` : ""}
      </main>`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(cv.fullName || "CV")}</title>
    <style>
      html, body { margin:0; padding:0; overflow:hidden; background:#e2e8f0; font-family: Georgia, "Times New Roman", serif; }
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
      addWrappedParagraph(`• ${item}`);
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

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === cv.colorThemeId) ?? themes[0],
    [cv.colorThemeId],
  );

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

  if (!hydrated) {
    return <div className="p-6 text-sm text-slate-600">Loading CV builder...</div>;
  }

  return (
    <main className="cvb" aria-label="CV Builder Workspace">
      <div className="cvb__frame">
        {message ? (
          <div className="cvb__toast" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        <section className="cvb__content">
            <header className="cvb__header">
              <div>
                <h1>CV Builder</h1>
                <p>Create a professional CV that highlights your strengths.</p>
              </div>

              <div className="cvb__header-actions">
                <span className={`cvb__save-state ${isSaved ? "is-saved" : ""}`}>
                  {isSaved ? "Saved" : "Draft changes"}
                </span>
                <button type="button" className="cvb__ghost" onClick={previewInNewTab}>
                  Preview
                </button>
                <button type="button" className="cvb__primary" onClick={downloadPdf}>
                  Download CV
                </button>
              </div>
            </header>

            <nav className="cvb__stepper" aria-label="Step progress">
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

                {activeStep === "profile" ? (
                  <div className="cvb__fields">
                    <Field label="Full name" required>
                      <input type="text" value={cv.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
                    </Field>
                    <Field label="Professional title" required>
                      <input type="text" value={cv.title} onChange={(event) => updateField("title", event.target.value)} />
                    </Field>
                    <Field label="Email" required>
                      <input type="email" value={cv.email} onChange={(event) => updateField("email", event.target.value)} />
                    </Field>
                    <Field label="Phone">
                      <input type="text" value={cv.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    </Field>
                    <Field label="Location" required>
                      <input type="text" value={cv.address} onChange={(event) => updateField("address", event.target.value)} />
                    </Field>
                    <Field label="LinkedIn">
                      <input type="text" value={cv.linkedin} onChange={(event) => updateField("linkedin", event.target.value)} />
                    </Field>
                    <Field label="About you" className="is-wide">
                      <textarea rows={5} value={cv.summary} onChange={(event) => updateField("summary", event.target.value)} />
                    </Field>
                  </div>
                ) : null}

                {activeStep === "experience" ? (
                  <div className="cvb__item-stack">
                    {cv.experiences.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Experience {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeExperience(item.id)}>Remove</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Role">
                            <input type="text" value={item.role} onChange={(event) => updateExperienceField(item.id, "role", event.target.value)} />
                          </Field>
                          <Field label="Company">
                            <input type="text" value={item.company} onChange={(event) => updateExperienceField(item.id, "company", event.target.value)} />
                          </Field>
                          <Field label="Period">
                            <input type="text" value={item.period} onChange={(event) => updateExperienceField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Details" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateExperienceField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addExperience}>+ Add experience</button>
                  </div>
                ) : null}

                {activeStep === "education" ? (
                  <div className="cvb__item-stack">
                    {cv.education.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Education {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeEducation(item.id)}>Remove</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Diploma">
                            <input type="text" value={item.diploma} onChange={(event) => updateEducationField(item.id, "diploma", event.target.value)} />
                          </Field>
                          <Field label="School">
                            <input type="text" value={item.school} onChange={(event) => updateEducationField(item.id, "school", event.target.value)} />
                          </Field>
                          <Field label="Period">
                            <input type="text" value={item.period} onChange={(event) => updateEducationField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Details" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateEducationField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addEducation}>+ Add education</button>
                  </div>
                ) : null}

                {activeStep === "skills" ? (
                  <div className="cvb__fields">
                    <Field label="Skills (one per line)" className="is-wide">
                      <textarea rows={6} value={cv.skills} onChange={(event) => updateField("skills", event.target.value)} />
                    </Field>
                    <Field label="Languages (one per line)" className="is-wide">
                      <textarea rows={4} value={cv.languages} onChange={(event) => updateField("languages", event.target.value)} />
                    </Field>
                    <Field label="Certifications (one per line)" className="is-wide">
                      <textarea rows={4} value={cv.certifications} onChange={(event) => updateField("certifications", event.target.value)} />
                    </Field>
                  </div>
                ) : null}

                {activeStep === "projects" ? (
                  <div className="cvb__item-stack">
                    {cv.projects.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Project {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeProject(item.id)}>Remove</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Title">
                            <input type="text" value={item.title} onChange={(event) => updateProjectField(item.id, "title", event.target.value)} />
                          </Field>
                          <Field label="Period">
                            <input type="text" value={item.period} onChange={(event) => updateProjectField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Details" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateProjectField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addProject}>+ Add project</button>
                  </div>
                ) : null}

                {activeStep === "extras" ? (
                  <div className="cvb__item-stack">
                    <div className="cvb__fields">
                      <Field label="Headline" className="is-wide">
                        <input type="text" value={cv.headline} onChange={(event) => updateField("headline", event.target.value)} />
                      </Field>
                      <Field label="Website">
                        <input type="text" value={cv.website} onChange={(event) => updateField("website", event.target.value)} />
                      </Field>
                      <Field label="GitHub">
                        <input type="text" value={cv.github} onChange={(event) => updateField("github", event.target.value)} />
                      </Field>
                      <Field label="Career objective" className="is-wide">
                        <textarea rows={4} value={cv.objective} onChange={(event) => updateField("objective", event.target.value)} />
                      </Field>
                    </div>

                    {cv.achievements.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Achievement {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeAchievement(item.id)}>Remove</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Title">
                            <input type="text" value={item.title} onChange={(event) => updateAchievementField(item.id, "title", event.target.value)} />
                          </Field>
                          <Field label="Details" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateAchievementField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addAchievement}>+ Add achievement</button>

                    {cv.volunteer.map((item, index) => (
                      <div key={item.id} className="cvb__item-card">
                        <div className="cvb__item-card-head">
                          <strong>Volunteer {index + 1}</strong>
                          <button type="button" className="cvb__remove" onClick={() => removeVolunteer(item.id)}>Remove</button>
                        </div>
                        <div className="cvb__fields">
                          <Field label="Role">
                            <input type="text" value={item.role} onChange={(event) => updateVolunteerField(item.id, "role", event.target.value)} />
                          </Field>
                          <Field label="Organization">
                            <input type="text" value={item.organization} onChange={(event) => updateVolunteerField(item.id, "organization", event.target.value)} />
                          </Field>
                          <Field label="Period">
                            <input type="text" value={item.period} onChange={(event) => updateVolunteerField(item.id, "period", event.target.value)} />
                          </Field>
                          <Field label="Details" className="is-wide">
                            <textarea rows={4} value={item.details} onChange={(event) => updateVolunteerField(item.id, "details", event.target.value)} />
                          </Field>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cvb__ghost cvb__add" onClick={addVolunteer}>+ Add volunteer</button>
                  </div>
                ) : null}

                {activeStep === "review" ? (
                  <div className="cvb__item-stack">
                    <div className="cvb__fields">
                      <Field label="Template">
                        <select value={cv.template} onChange={(event) => updateField("template", event.target.value as CvTemplate)}>
                          <option value="classic">Classic</option>
                          <option value="modern">Modern</option>
                          <option value="sidebar">Sidebar</option>
                        </select>
                      </Field>
                      <Field label="Theme">
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
                      <div><strong>Profile</strong><span>{cv.fullName || "Missing name"}</span></div>
                      <div><strong>Experience entries</strong><span>{cv.experiences.length}</span></div>
                      <div><strong>Education entries</strong><span>{cv.education.length}</span></div>
                      <div><strong>Project entries</strong><span>{cv.projects.length}</span></div>
                      <div><strong>Achievements</strong><span>{cv.achievements.length}</span></div>
                      <div><strong>Volunteer</strong><span>{cv.volunteer.length}</span></div>
                    </div>
                  </div>
                ) : null}

                <div className="cvb__tip" role="note" aria-label="Tip">
                  <strong>Tip</strong>
                  <p>{activeStepContent.tip}</p>
                </div>

                <div className="cvb__form-actions">
                  <button type="button" className="cvb__ghost" onClick={saveDraft}>
                    Save and exit
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
                    Save and continue
                  </button>
                </div>
              </section>

              <aside className="cvb__preview" aria-label="CV preview">
                <div className="cvb__preview-head">
                  <h3>CV Preview</h3>
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

                <div className={`cvb__preview-box ${previewMode === "mobile" ? "is-mobile" : ""}`}>
                  <div className="cvb__preview-paper">
                    <iframe
                      ref={previewFrameRef}
                      title="Live CV preview"
                      srcDoc={previewHtml}
                      className="cvb__preview-iframe"
                      onLoad={syncPreviewFrameHeight}
                      scrolling="no"
                      style={{ height: `${previewFrameHeight}px` }}
                    />
                  </div>
                </div>

                <p className="cvb__preview-note">This is a preview. Your CV adapts to template and settings.</p>
              </aside>
            </div>
        </section>
      </div>

      <style jsx>{`
        .cvb {
          min-height: 100vh;
          background: #f8f6fb;
          color: #1f1839;
          font-family: Inter, Poppins, "Segoe UI", sans-serif;
          padding: 20px;
        }

        .cvb__frame {
          max-width: 1600px;
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
          border-radius: 18px;
          padding: 18px;
          display: grid;
          gap: 16px;
        }

        .cvb__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #eee8f8;
          padding-bottom: 12px;
        }

        .cvb__header h1 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.05;
        }

        .cvb__header p {
          margin: 6px 0 0;
          color: #6f678c;
          font-size: 0.95rem;
        }

        .cvb__header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
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
          font-size: 0.88rem;
          border: 1px solid transparent;
        }

        .cvb__ghost {
          border-color: #ddcff6;
          background: #fff;
          color: #6d2a95;
        }

        .cvb__primary {
          background: #6d2a95;
          color: #fff;
        }

        .cvb__stepper {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .cvb__stepper-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          font-size: 0.82rem;
          color: #5e557b;
          border: 0;
          background: transparent;
          padding: 2px 0;
          cursor: pointer;
          text-align: left;
        }

        .cvb__stepper-item[aria-current="step"] {
          color: #3d2a68;
        }

        .cvb__circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid #d6caee;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 0.75rem;
          background: #fff;
        }

        .cvb__circle.is-active {
          background: #6d2a95;
          color: #fff;
          border-color: #6d2a95;
        }

        .cvb__line {
          width: 28px;
          height: 1px;
          background: #dcd2f1;
          margin-left: 2px;
        }

        .cvb__main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 14px;
          align-items: start;
        }

        .cvb__form-card,
        .cvb__preview {
          background: #fff;
          border: 1px solid #ece3f8;
          border-radius: 18px;
          padding: 16px;
        }

        .cvb__form-head {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 14px;
        }

        .cvb__form-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #f3ebff;
          color: #6d2a95;
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .cvb__form-head h2 {
          margin: 0;
          font-size: 1.3rem;
        }

        .cvb__form-head p {
          margin: 4px 0 0;
          color: #726991;
          font-size: 0.86rem;
          line-height: 1.4;
        }

        .cvb__step-chip {
          background: #f4edff;
          color: #6d2a95;
          border-radius: 999px;
          padding: 6px 10px;
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
          gap: 12px;
        }

        .cvb__item-card {
          border: 1px solid #ece3f8;
          border-radius: 14px;
          padding: 12px;
          background: #fcfaff;
          display: grid;
          gap: 10px;
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
          border: 1px solid #eadffb;
          background: #fff;
          color: #6d2a95;
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
          border: 1px solid #ebe2f8;
          background: #fff;
          border-radius: 12px;
          padding: 10px;
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
          border: 1px solid #e9ddfb;
          background: #f7f2ff;
          border-radius: 14px;
          padding: 12px;
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
          font-size: 1.1rem;
        }

        .cvb__toggle {
          display: inline-flex;
          border: 1px solid #decff5;
          border-radius: 10px;
          padding: 2px;
          gap: 2px;
        }

        .cvb__toggle button {
          min-width: 30px;
          min-height: 28px;
          border-radius: 8px;
          border: 0;
          background: transparent;
          color: #6d2a95;
          font-weight: 700;
        }

        .cvb__toggle button.is-active {
          background: #6d2a95;
          color: #fff;
        }

        .cvb__preview-box {
          background: #f8f6fb;
          border: 1px solid #e6ddf4;
          border-radius: 14px;
          padding: 14px;
          height: min(78vh, 980px);
          overflow: auto;
          display: grid;
          place-items: start center;
        }

        .cvb__preview-paper {
          width: min(100%, 780px);
          background: #fff;
          border: 1px solid #ece8f6;
          border-radius: 8px;
          box-shadow: 0 12px 28px rgba(26, 17, 48, 0.12);
          overflow: hidden;
        }

        .cvb__preview-iframe {
          width: 100%;
          min-height: 100%;
          border: 0;
          background: #fff;
          display: block;
        }

        .cvb__preview-box.is-mobile {
          place-items: start center;
        }

        .cvb__preview-note {
          margin: 0;
          color: #746c90;
          font-size: 0.8rem;
          line-height: 1.45;
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

          .cvb__preview {
            position: static;
          }

          .cvb__preview-box {
            height: min(70vh, 760px);
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

          .cvb__fields {
            grid-template-columns: 1fr;
          }

          .cvb__review-grid {
            grid-template-columns: 1fr;
          }

          .cvb__form-head {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .cvb__step-chip {
            grid-column: 1 / -1;
            justify-self: start;
          }
        }
      `}</style>
    </main>
  );
}

type CvStepId = "profile" | "experience" | "education" | "skills" | "projects" | "extras" | "review";

type StepMeta = {
  id: CvStepId;
  title: string;
};

const CV_STEPS: StepMeta[] = [
  { id: "profile", title: "Profile" },
  { id: "experience", title: "Experience" },
  { id: "education", title: "Education" },
  { id: "skills", title: "Skills" },
  { id: "projects", title: "Projects" },
  { id: "extras", title: "Extras" },
  { id: "review", title: "Review" },
];

const STEP_CONTENT: Record<CvStepId, { icon: string; title: string; description: string; tip: string }> = {
  profile: {
    icon: "PI",
    title: "Personal information",
    description: "Add your personal details. This information appears at the top of your CV.",
    tip: "A short summary (2-3 lines) helps recruiters quickly understand who you are and what you do.",
  },
  experience: {
    icon: "EX",
    title: "Experience",
    description: "List your professional experience with concrete impact and responsibilities.",
    tip: "Use action verbs and measurable outcomes whenever possible.",
  },
  education: {
    icon: "ED",
    title: "Education",
    description: "Show your education background, diplomas, and key learning highlights.",
    tip: "Keep the most relevant and recent education first.",
  },
  skills: {
    icon: "SK",
    title: "Skills and competencies",
    description: "Add your core skills, languages, and certifications in a clear format.",
    tip: "Prefer concise and specific skills over generic statements.",
  },
  projects: {
    icon: "PR",
    title: "Projects",
    description: "Highlight projects that demonstrate your strengths and problem-solving.",
    tip: "Focus on projects that align with your target roles.",
  },
  extras: {
    icon: "EX+",
    title: "Extras",
    description: "Add achievements, volunteer experience, and extra professional details.",
    tip: "These sections can differentiate you from similar profiles.",
  },
  review: {
    icon: "RV",
    title: "Review and settings",
    description: "Check your CV structure and choose template/theme before exporting.",
    tip: "Use preview and export only after checking all sections.",
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
