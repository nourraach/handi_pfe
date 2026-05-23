"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/layout";
import "./cv-builder.css";

// Types
type CvTemplate = "classic" | "modern" | "creative" | "minimal";

type CvTheme = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
};

type CvSection = {
  id: string;
  type: 'experience' | 'education' | 'project' | 'achievement' | 'volunteer';
  title: string;
  subtitle?: string;
  period?: string;
  description: string;
  location?: string;
  skills?: string[];
};

type CvFormState = {
  // Personal Info
  fullName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  linkedin: string;
  
  // Content
  summary: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  
  // Sections
  sections: CvSection[];
  
  // Style
  template: CvTemplate;
  themeId: string;
  
  // Settings
  showPhoto: boolean;
  photoUrl?: string;
};

// Enhanced themes with better color palettes
const themes: CvTheme[] = [
  {
    id: "professional",
    name: "Professional Blue",
    primary: "#1e40af",
    secondary: "#3b82f6", 
    accent: "#60a5fa",
    surface: "#eff6ff",
    text: "#1f2937"
  },
  {
    id: "elegant",
    name: "Elegant Gray",
    primary: "#374151",
    secondary: "#6b7280",
    accent: "#9ca3af", 
    surface: "#f9fafb",
    text: "#111827"
  },
  {
    id: "creative",
    name: "Creative Purple",
    primary: "#7c3aed",
    secondary: "#a855f7",
    accent: "#c084fc",
    surface: "#faf5ff", 
    text: "#1f2937"
  },
  {
    id: "modern",
    name: "Modern Teal",
    primary: "#0d9488",
    secondary: "#14b8a6",
    accent: "#5eead4",
    surface: "#f0fdfa",
    text: "#1f2937"
  }
];

const STORAGE_KEY = "handi_cv_builder_v2";

// Utility functions
function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSection(type: CvSection['type']): CvSection {
  return {
    id: createId(type),
    type,
    title: "",
    subtitle: "",
    period: "",
    description: "",
    location: "",
    skills: []
  };
}
function createDefaultState(): CvFormState {
  return {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    linkedin: "",
    summary: "",
    skills: [],
    languages: [],
    certifications: [],
    sections: [],
    template: "modern",
    themeId: "professional",
    showPhoto: false,
    photoUrl: ""
  };
}

// Fixed escaping functions to prevent "&&..." issues
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function escapePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Enhanced CV HTML builder with better styling
function buildCvHtml(cv: CvFormState, theme: CvTheme): string {
  const styles = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: ${theme.text};
        background: #f8fafc;
      }
      .cv-container {
        max-width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }
      .cv-header {
        background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
        color: white;
        padding: 2rem;
        position: relative;
      }
      .cv-header::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100px;
        height: 100px;
        background: ${theme.accent};
        opacity: 0.2;
        border-radius: 50%;
        transform: translate(30px, -30px);
      }
      .header-content {
        position: relative;
        z-index: 1;
      }
      .name {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        letter-spacing: -0.025em;
      }
      .title {
        font-size: 1.25rem;
        opacity: 0.9;
        margin-bottom: 1rem;
        font-weight: 400;
      }
      .contact-info {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.9rem;
        opacity: 0.9;
      }
      .contact-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .cv-body {
        display: grid;
        grid-template-columns: ${cv.template === 'sidebar' ? '1fr 2fr' : '1fr'};
        gap: 2rem;
        padding: 2rem;
      }
      .section {
        margin-bottom: 2rem;
      }
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: ${theme.primary};
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid ${theme.accent};
        position: relative;
      }
      .section-title::before {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 30px;
        height: 2px;
        background: ${theme.primary};
      }
      .section-item {
        margin-bottom: 1.5rem;
        padding-left: 1rem;
        border-left: 3px solid ${theme.surface};
        position: relative;
      }
      .section-item::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 0.5rem;
        width: 9px;
        height: 9px;
        background: ${theme.accent};
        border-radius: 50%;
      }
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .item-title {
        font-weight: 600;
        color: ${theme.text};
        font-size: 1.1rem;
      }
      .item-subtitle {
        color: ${theme.secondary};
        font-weight: 500;
      }
      .item-period {
        color: ${theme.secondary};
        font-size: 0.9rem;
        font-weight: 500;
        background: ${theme.surface};
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
      }
      .item-description {
        color: ${theme.text};
        margin-top: 0.5rem;
        line-height: 1.7;
      }
      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.5rem;
      }
      .skill-tag {
        background: ${theme.surface};
        color: ${theme.primary};
        padding: 0.5rem 1rem;
        border-radius: 1.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        text-align: center;
        border: 1px solid ${theme.accent};
      }
      .summary {
        background: ${theme.surface};
        padding: 1.5rem;
        border-radius: 0.75rem;
        border-left: 4px solid ${theme.primary};
        font-style: italic;
        line-height: 1.8;
      }
      @media print {
        body { background: white; }
        .cv-container { box-shadow: none; }
      }
    </style>
  `;

  const header = `
    <div class="cv-header">
      <div class="header-content">
        <h1 class="name">${escapeHtml(cv.fullName || "Your Name")}</h1>
        <p class="title">${escapeHtml(cv.title || "Professional Title")}</p>
        <div class="contact-info">
          ${cv.email ? `<div class="contact-item">📧 ${escapeHtml(cv.email)}</div>` : ''}
          ${cv.phone ? `<div class="contact-item">📱 ${escapeHtml(cv.phone)}</div>` : ''}
          ${cv.address ? `<div class="contact-item">📍 ${escapeHtml(cv.address)}</div>` : ''}
          ${cv.website ? `<div class="contact-item">🌐 ${escapeHtml(cv.website)}</div>` : ''}
          ${cv.linkedin ? `<div class="contact-item">💼 ${escapeHtml(cv.linkedin)}</div>` : ''}
        </div>
      </div>
    </div>
  `;

  const summary = cv.summary ? `
    <div class="section">
      <h2 class="section-title">Professional Summary</h2>
      <div class="summary">${escapeHtml(cv.summary)}</div>
    </div>
  ` : '';

  const sectionsHtml = cv.sections.map(section => `
    <div class="section-item">
      <div class="item-header">
        <div>
          <div class="item-title">${escapeHtml(section.title)}</div>
          ${section.subtitle ? `<div class="item-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
        </div>
        ${section.period ? `<div class="item-period">${escapeHtml(section.period)}</div>` : ''}
      </div>
      ${section.description ? `<div class="item-description">${escapeHtml(section.description)}</div>` : ''}
    </div>
  `).join('');

  const experienceHtml = cv.sections.filter(s => s.type === 'experience').length > 0 ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${cv.sections.filter(s => s.type === 'experience').map(section => `
        <div class="section-item">
          <div class="item-header">
            <div>
              <div class="item-title">${escapeHtml(section.title)}</div>
              ${section.subtitle ? `<div class="item-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
            </div>
            ${section.period ? `<div class="item-period">${escapeHtml(section.period)}</div>` : ''}
          </div>
          ${section.description ? `<div class="item-description">${escapeHtml(section.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const educationHtml = cv.sections.filter(s => s.type === 'education').length > 0 ? `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${cv.sections.filter(s => s.type === 'education').map(section => `
        <div class="section-item">
          <div class="item-header">
            <div>
              <div class="item-title">${escapeHtml(section.title)}</div>
              ${section.subtitle ? `<div class="item-subtitle">${escapeHtml(section.subtitle)}</div>` : ''}
            </div>
            ${section.period ? `<div class="item-period">${escapeHtml(section.period)}</div>` : ''}
          </div>
          ${section.description ? `<div class="item-description">${escapeHtml(section.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const skillsHtml = cv.skills.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      <div class="skills-grid">
        ${cv.skills.map(skill => `<div class="skill-tag">${escapeHtml(skill)}</div>`).join('')}
      </div>
    </div>
  ` : '';

  const languagesHtml = cv.languages.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Languages</h2>
      <div class="skills-grid">
        ${cv.languages.map(lang => `<div class="skill-tag">${escapeHtml(lang)}</div>`).join('')}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(cv.fullName || 'CV')}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      ${styles}
    </head>
    <body>
      <div class="cv-container">
        ${header}
        <div class="cv-body">
          <div class="main-content">
            ${summary}
            ${experienceHtml}
            ${educationHtml}
          </div>
          ${cv.template === 'sidebar' ? `
            <div class="sidebar">
              ${skillsHtml}
              ${languagesHtml}
            </div>
          ` : `
            ${skillsHtml}
            ${languagesHtml}
          `}
        </div>
      </div>
    </body>
    </html>
  `;
}
// Enhanced PDF generation with better text handling
function generatePdfBlob(cv: CvFormState, theme: CvTheme): Blob {
  // Simple PDF generation - for production, consider using jsPDF or similar
  const htmlContent = buildCvHtml(cv, theme);
  
  // Create a clean text version for PDF
  const textContent = `
${cv.fullName || 'Your Name'}
${cv.title || 'Professional Title'}

Contact Information:
${cv.email ? `Email: ${cv.email}` : ''}
${cv.phone ? `Phone: ${cv.phone}` : ''}
${cv.address ? `Address: ${cv.address}` : ''}
${c">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CV Builder...</p>
        </div>
      </div>
    );
  } = (language: string) => {
    if (language.trim() && !cv.languages.includes(language.trim())) {
      setCv(prev => ({
        ...prev,
        languages: [...prev.languages, language.trim()]
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setCv(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center= (id: string) => {
    setCv(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !cv.skills.includes(skill.trim())) {
      setCv(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setCv(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addLanguagely!");
    setTimeout(() => setMessage(null), 3000);
  };

  const addSection = (type: CvSection['type']) => {
    const newSection = createSection(type);
    setCv(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (id: string, updates: Partial<CvSection>) => {
    setCv(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage("CV downloaded successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setMessage("Download failed. Please try again.");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetCv = () => {
    setCv(createDefaultState());
    setMessage("CV reset successful[cv, activeTheme]);

  useEffect(() => {
    if (!hydrated) return;
    
    const timeoutId = setTimeout(updatePreview, 300);
    return () => clearTimeout(timeoutId);
  }, [updatePreview, hydrated]);

  // Actions
  const downloadPdf = () => {
    try {
      const blob = generatePdfBlob(cv, activeTheme);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(cv.fullName || 'cv').toLowerCase().replace(/\s+/g, '-')}.html`;(() => {
      setPreviewHtml(html);
      setIsPreviewLoading(false);
    }, 150);
  }, etItem(STORAGE_KEY, JSON.stringify(cv));
    } catch (error) {
      console.warn('Failed to save CV data:', error);
    }
  }, [cv, hydrated]);

  // Get active theme
  const activeTheme = useMemo(
    () => themes.find(theme => theme.id === cv.themeId) || themes[0],
    [cv.themeId]
  );

  // Real-time preview with debouncing
  const updatePreview = useCallback(() => {
    setIsPreviewLoading(true);
    const html = buildCvHtml(cv, activeTheme);
    
    // Simulate processing time for smooth UX
    setTimeout setCv(parsedCv);
      }
    } catch (error) {
      console.warn('Failed to load saved CV data:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save data
  useEffect(() => {
    if (!hydrated) return;
    
    try {
      localStorage.suseState(false);

  // Load saved data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedCv = JSON.parse(saved);
       e<CvFormState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = ', ')}` : ''}
  `.trim();

  // For now, return HTML as blob - in production, use proper PDF library
  return new Blob([htmlContent], { type: 'text/html' });
}

// Main component
export default function CandidateCvPage() {
  const [cv, setCv] = useStat.period ? ` (${section.period})` : ''}
${section.description || ''}`
).join('\n\n')}
` : ''}

${cv.skills.length > 0 ? `Skills: ${cv.skills.join(', ')}` : ''}
${cv.languages.length > 0 ? `Languages: ${cv.languages.join(ns.filter(s => s.type === 'education').map(section => 
  `${section.title}${section.subtitle ? ` - ${section.subtitle}` : ''}${sectionv.sections.filter(s => s.type === 'education').length > 0 ? `
Education:
${cv.sectiotion.description || ''}`
).join('\n\n')}
` : ''}

${cubtitle}` : ''}${section.period ? ` (${section.period})` : ''}
${sec` : ''}

${cv.sections.filter(s => s.type === 'experience').length > 0 ? `
Experience:
${cv.sections.filter(s => s.type === 'experience').map(section => 
  `${section.title}${section.subtitle ? ` at ${section.sv.website ? `Website: ${cv.website}` : ''}

${cv.summary ? `Professional Summary:\n${cv.summary}\n
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        badge="CV Builder"
        title="Create Your Professional CV"
        description="Build a stunning CV with real-time preview and professional templates"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={resetCv}>
              Reset CV
            </Button>
            <Button onClick={downloadPdf} className="bg-blue-600 hover:bg-blue-700">
              Download CV
            </Button>
          </div>
        }
      />

      {message && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{message}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Template & Theme Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Style & Template</h3>
              
              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Template
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'modern', name: 'Modern', desc: 'Clean and professional' },
                    { id: 'creative', name: 'Creative', desc: 'Stand out design' },
                    { id: 'minimal', name: 'Minimal', desc: 'Simple and elegant' },
                    { id: 'classic', name: 'Classic', desc: 'Traditional layout' }
                  ].map(template => (
                    <button
                      key={template.id}
                      onClick={() => setCv(prev => ({ ...prev, template: template.id as CvTemplate }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        cv.template === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Color Theme
                </label>
                <div className="flex flex-wrap gap-3">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setCv(prev => ({ ...prev, themeId: theme.id }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        cv.themeId === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={cv.fullName}
                    onChange={(e) => setCv(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    value={cv.title}
                    onChange={(e) => setCv(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Software Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={cv.email}
                    onChange={(e) => setCv(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={cv.phone}
                    onChange={(e) => setCv(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={cv.address}
                    onChange={(e) => setCv(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={cv.website}
                    onChange={(e) => setCv(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={cv.linkedin}
                    onChange={(e) => setCv(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </Card>

            {/* Professional Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Professional Summary</h3>
              <textarea
                value={cv.summary}
                onChange={(e) => setCv(prev => ({ ...prev, summary: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write a compelling summary of your professional background and key achievements..."
              />
            </Card>

            {/* Skills */}
            <SkillsSection
              title="Skills"
              items={cv.skills}
              onAdd={addSkill}
              onRemove={removeSkill}
              placeholder="Add a skill (e.g., JavaScript, Project Management)"
            />

            {/* Languages */}
            <SkillsSection
              title="Languages"
              items={cv.languages}
              onAdd={addLanguage}
              onRemove={removeLanguage}
              placeholder="Add a language (e.g., English - Native, French - Intermediate)"
            />

            {/* Experience Section */}
            <SectionEditor
              title="Work Experience"
              type="experience"
              sections={cv.sections.filter(s => s.type === 'experience')}
              onAdd={() => addSection('experience')}
              onUpdate={updateSection}
              onRemove={removeSection}
            />

            {/* Education Section */}
            <SectionEditor
              title="Education"
              type="education"
              sections={cv.sections.filter(s => s.type === 'education')}
              onAdd={() => addSection('education')}
              onUpdate={updateSection}
              onRemove={removeSection}
            />
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Live Preview</h3>
                {isPreviewLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Updating...
                  </div>
                )}
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-white">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[800px] border-0"
                    title="CV Preview"
                  />
                ) : (
                  <div className="h-[800px] flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">📄</div>
                      <p className="text-gray-600">Start filling your information to see the preview</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
// Helper Components
function SkillsSection({ 
  title, 
  items, 
  onAdd, 
  onRemove, 
  placeholder 
}: {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
        <Button onClick={handleAdd} disabled={!inputValue.trim()}>
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </Card>
  );
}

function SectionEditor({
  title,
  type,
  sections,
  onAdd,
  onUpdate,
  onRemove
}: {
  title: string;
  type: CvSection['type'];
  sections: CvSection[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<CvSection>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={onAdd} variant="secondary">
          Add {title.slice(0, -1)}
        </Button>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {title.toLowerCase()} added yet. Click "Add {title.slice(0, -1)}" to get started.
          </div>
        ) : (
          sections.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {title.slice(0, -1)} #{index + 1}
                </h4>
                <Button
                  onClick={() => onRemove(section.id)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'experience' ? 'Job Title' : 
                     type === 'education' ? 'Degree/Program' : 'Title'} *
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => onUpdate(section.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={type === 'experience' ? 'Software Developer' : 
                               type === 'education' ? 'Bachelor of Computer Science' : 'Project Title'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'experience' ? 'Company' : 
                     type === 'education' ? 'Institution' : 'Organization'}
                  </label>
                  <input
                    type="text"
                    value={section.subtitle || ''}
                    onChange={(e) => onUpdate(section.id, { subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={type === 'experience' ? 'Company Name' : 
                               type === 'education' ? 'University Name' : 'Organization Name'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <input
                    type="text"
                    value={section.period || ''}
                    onChange={(e) => onUpdate(section.id, { period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jan 2020 - Present"
                  />
                </div>

                <div></div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={section.description}
                    onChange={(e) => onUpdate(section.id, { description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your responsibilities, achievements, and key contributions..."
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}