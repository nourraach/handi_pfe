import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { ReponseApi } from "@/types/api";

export interface SupervisionOverview {
  scope: {
    role: string;
    region: string | null;
    visibility: "territorial" | "national";
  };
  totals: {
    total_companies: number;
    active_companies: number;
    total_offers: number;
    total_applications: number;
    shortlisted_candidates: number;
    hired_candidates: number;
    total_reports: number;
    submitted_reports: number;
    validated_reports: number;
    rejected_reports: number;
  };
  rates: {
    shortlist_rate: number;
    hiring_rate: number;
    compliance_validation_rate: number;
    inclusion_rate: number;
  };
}

export interface PipelineCompany {
  company_id: string;
  company_name: string;
  region: string;
  offers_count: number;
  applications_count: number;
  shortlisted_count: number;
  interviews_count: number;
  hired_count: number;
  rejected_count: number;
}

export interface PipelineResponse {
  totals: {
    offers_count: number;
    applications_count: number;
    shortlisted_count: number;
    interviews_count: number;
    hired_count: number;
    rejected_count: number;
  };
  by_company: PipelineCompany[];
}

export interface SupervisedCompanyMapItem {
  company_id: string;
  company_name: string;
  region: string;
  address: string;
  offers_count: number;
  applications_count: number;
  hired_count: number;
}

export interface SupervisedCompaniesMapResponse {
  scope: {
    role: string;
    region: string | null;
    visibility: "territorial" | "national";
  };
  companies: SupervisedCompanyMapItem[];
}

export interface ComplianceRecommendation {
  id: string;
  text: string;
  type: "general" | "rejection";
  author_user_id: string;
  author_role: string;
  created_at: string;
}

export interface ComplianceReportSummary {
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
  company_region: string;
  submitted_by_name: string;
  reviewed_by_name?: string | null;
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceReportDetail extends ComplianceReportSummary {
  accommodation_actions?: string | null;
  evidence_urls?: string[] | null;
}

export interface OfferPerformance {
  offer_id: string;
  offer_title: string;
  offer_status: string;
  localisation: string;
  type_poste: string;
  created_at: string;
  company_name: string;
  region: string;
  views_count: number;
  applications_count: number;
  shortlisted_count: number;
  hired_count: number;
}

export interface VisibleCandidate {
  candidate_reference: string;
  application_id: string;
  stage: "shortlisted" | "hired";
  company_name: string;
  offer_title: string;
  region: string;
  applied_at: string;
  updated_at: string;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      "The supervision service returned a non-JSON response. Please check the API connection and your session.",
    );
  }

  let payload: (ReponseApi<T> & { error?: string }) | null = null;

  try {
    payload = JSON.parse(rawBody) as ReponseApi<T> & { error?: string };
  } catch {
    throw new Error("The supervision service returned invalid data. Please try again.");
  }

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Unable to complete the supervision request.");
  }

  return payload.donnees as T;
}

export async function fetchSupervisionResource<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(construireUrlApi(`/api/supervision${path}`), init);
  return parseJsonResponse<T>(response);
}

export async function mutateSupervisionResource<T>(path: string, method: "POST" | "PUT" | "PATCH", body?: unknown): Promise<T> {
  return fetchSupervisionResource<T>(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function downloadSupervisionExport(dataset: string, format: "csv" | "excel") {
  const response = await authenticatedFetch(construireUrlApi(`/api/supervision/export?dataset=${dataset}&format=${format}`));
  if (!response.ok) {
    throw new Error("Unable to export supervision data.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const fallback = `supervision_${dataset}.${format === "csv" ? "csv" : "xml"}`;
  const match = disposition?.match(/filename=\"?([^\";]+)\"?/i);
  const filename = match?.[1] || fallback;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
