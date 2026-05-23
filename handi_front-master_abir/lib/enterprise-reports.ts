import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { ReponseApi } from "@/types/api";

export type EnterpriseDraftType = "compliance" | "transfer";

export interface EnterpriseDraftRecord<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: EnterpriseDraftType;
  title: string;
  updated_at: string;
  payload: T;
}

export interface EnterpriseComplianceCandidate {
  application_id: string;
  offer_id: string;
  statut: "shortlisted" | "interview_scheduled" | "accepted";
  date_postulation: string;
  candidate_name: string;
  candidate_gender: string | null;
  candidate_region: string | null;
  candidate_age: number | null;
  type_handicap: string | null;
  num_carte_handicap: string | null;
  date_expiration_carte_handicap: string | null;
  niveau_academique: string | null;
  secteur: string | null;
  formation: string | null;
  handicap: string | null;
}

export interface EnterprisePublicationChannel {
  key: string;
  label: string;
  default_label: string;
  url: string;
  screenshot_label: string;
}

export interface EnterpriseComplianceOffer {
  offer_id: string;
  offer_title: string;
  localisation: string;
  created_at: string;
  status: string;
  views_count: number;
  applications_count: number;
  shortlisted_count: number;
  interview_scheduled_count: number;
  hired_count: number;
  matching_candidates_count: number;
  publication_channels: EnterprisePublicationChannel[];
  candidates: EnterpriseComplianceCandidate[];
}

export interface EnterpriseComplianceContext {
  generated_at: string;
  company: {
    enterprise_id: string;
    user_id: string;
    company_name: string;
    legal_name: string;
    rne: string;
    patente: string;
    industry: string | null;
    website: string | null;
    address: string;
    region: string;
    workforce_total: number;
    disabled_employees: number;
    hr_contact_name: string | null;
    hr_contact_email: string | null;
    hr_contact_phone: string | null;
    required_reserved_positions: number;
    remaining_reserved_positions: number;
    legal_obligation_percentage: number;
  };
  totals: {
    active_offers: number;
    applications_count: number;
    shortlisted_count: number;
    interview_scheduled_count: number;
    hired_count: number;
    views_count: number;
  };
  offers: EnterpriseComplianceOffer[];
}

export interface EnterpriseGeneratedReportSummary {
  id: string;
  status: "submitted" | "validated" | "rejected";
  region: string;
  summary: string;
  reporting_period_start: string;
  reporting_period_end: string;
  submitted_at: string;
  reviewed_at?: string | null;
  review_comment?: string | null;
  last_recommendation?: string | null;
  workforce_total: number;
  disabled_employees: number;
  active_offers: number;
  applications_count: number;
  shortlisted_count: number;
  hired_count: number;
  company_id: string;
  company_name: string;
  reviewed_by_name?: string | null;
  recommendations: Array<{
    id: string;
    text: string;
    type: string;
    author_user_id: string;
    author_role: string;
    created_at: string;
  }>;
}

export interface EnterpriseGeneratedReportDetail extends EnterpriseGeneratedReportSummary {
  accommodation_actions?: string | null;
  evidence_urls?: string[] | null;
}

const DRAFTS_STORAGE_KEY = "handitalents_enterprise_drafts_v1";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ReponseApi<T> & { error?: string };
  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Unable to complete the request.");
  }

  return payload.donnees as T;
}

export async function fetchEnterpriseComplianceContext() {
  const response = await authenticatedFetch(construireUrlApi("/api/entreprise/reports-requests/context"));
  return parseJsonResponse<EnterpriseComplianceContext>(response);
}

export async function listEnterpriseGeneratedReports() {
  const response = await authenticatedFetch(construireUrlApi("/api/entreprise/reports-requests/reports"));
  return parseJsonResponse<EnterpriseGeneratedReportSummary[]>(response);
}

export async function getEnterpriseGeneratedReport(reportId: string) {
  const response = await authenticatedFetch(construireUrlApi(`/api/entreprise/reports-requests/reports/${reportId}`));
  return parseJsonResponse<EnterpriseGeneratedReportDetail>(response);
}

export async function createEnterpriseComplianceReport(body: Record<string, unknown>) {
  const response = await authenticatedFetch(construireUrlApi("/api/entreprise/reports-requests/reports"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<{ id: string; status: string; submitted_at: string }>(response);
}

function readDrafts(): EnterpriseDraftRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts: EnterpriseDraftRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

export function listEnterpriseDrafts() {
  return readDrafts().sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getEnterpriseDraft<T extends Record<string, unknown> = Record<string, unknown>>(draftId: string) {
  return (readDrafts().find((draft) => draft.id === draftId) as EnterpriseDraftRecord<T> | undefined) ?? null;
}

export function saveEnterpriseDraft<T extends Record<string, unknown> = Record<string, unknown>>(draft: EnterpriseDraftRecord<T>) {
  const drafts = readDrafts().filter((item) => item.id !== draft.id);
  drafts.unshift({
    ...draft,
    updated_at: draft.updated_at || new Date().toISOString(),
  });
  writeDrafts(drafts);
}

export function deleteEnterpriseDraft(draftId: string) {
  writeDrafts(readDrafts().filter((draft) => draft.id !== draftId));
}

export function downloadTextDocument(filename: string, content: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function sanitizePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\t/g, "    ")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapPdfLine(line: string, maxChars: number) {
  const compact = line.trim();
  if (!compact) {
    return [""];
  }

  const chunks: string[] = [];
  let remaining = compact;

  while (remaining.length > maxChars) {
    const splitAt = remaining.lastIndexOf(" ", maxChars);
    const index = splitAt > 0 ? splitAt : maxChars;
    chunks.push(remaining.slice(0, index).trimEnd());
    remaining = remaining.slice(index).trimStart();
  }

  chunks.push(remaining);
  return chunks;
}

function normalizeFilenameAsPdf(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "");
  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `${safeBase || "compliance-report"}.pdf`;
}

function buildSimplePdfFromText(content: string) {
  const encoder = new TextEncoder();
  const maxCharsPerLine = 95;
  const maxLinesPerPage = 48;
  const normalizedContent = (content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .flatMap((line) => wrapPdfLine(sanitizePdfText(line), maxCharsPerLine));
  const finalLines = normalizedContent.length > 0 ? normalizedContent : ["No content"];

  const pages: string[][] = [];
  for (let index = 0; index < finalLines.length; index += maxLinesPerPage) {
    pages.push(finalLines.slice(index, index + maxLinesPerPage));
  }

  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesId = addObject("");
  const pageIds: number[] = [];

  for (const pageLines of pages) {
    const pageContent = [
      "BT",
      "/F1 10 Tf",
      "50 800 Td",
      ...pageLines.map((line, lineIndex) => (lineIndex === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)),
      "ET",
    ].join("\n");
    const contentStream = `<< /Length ${encoder.encode(pageContent).length} >>\nstream\n${pageContent}\nendstream`;
    const contentId = addObject(contentStream);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((pageId) => `${pageId} 0 R`).join(" ")}] >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([encoder.encode(pdf)], { type: "application/pdf" });
}

export function downloadPdfDocument(filename: string, content: string) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = buildSimplePdfFromText(content);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = normalizeFilenameAsPdf(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
