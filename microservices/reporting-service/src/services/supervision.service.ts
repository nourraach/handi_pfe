import crypto from "crypto";
import { SupervisionRepository, SupervisionScope } from "../repositories/supervision.repository";
import { JwtPayloadUtilisateur } from "../types/authentification.types";
import { RoleUtilisateur } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";

export class SupervisionService {
  constructor(private readonly repository = new SupervisionRepository()) {}

  private buildScope(utilisateur: JwtPayloadUtilisateur): SupervisionScope {
    const scope: SupervisionScope = {
      role: utilisateur.role,
      region: utilisateur.region?.trim(),
      isInspector: utilisateur.role === RoleUtilisateur.INSPECTEUR,
      isAneti: utilisateur.role === RoleUtilisateur.ANETI,
    };

    if (scope.isInspector && !scope.region) {
      throw new ErreurApi("La region est obligatoire pour un inspecteur", 400);
    }

    return scope;
  }

  private assertSupervisionRole(utilisateur: JwtPayloadUtilisateur) {
    if (![RoleUtilisateur.ADMIN, RoleUtilisateur.INSPECTEUR, RoleUtilisateur.ANETI].includes(utilisateur.role)) {
      throw new ErreurApi("Acces interdit a la supervision", 403);
    }
  }

  private buildRecommendation(utilisateur: JwtPayloadUtilisateur, text: string, type: "general" | "rejection") {
    return {
      id: crypto.randomUUID(),
      text,
      type,
      author_user_id: utilisateur.id_utilisateur,
      author_role: utilisateur.role,
      created_at: new Date().toISOString(),
    };
  }

  private toPercent(value: number, total: number) {
    if (!total) {
      return 0;
    }

    return Math.round((value / total) * 10000) / 100;
  }

  private csvEscape(value: unknown) {
    const stringValue = String(value ?? "");
    if (!/[\",\n]/.test(stringValue)) {
      return stringValue;
    }

    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  private buildCsv(rows: Record<string, unknown>[]) {
    if (rows.length === 0) {
      return "dataset\nempty\n";
    }

    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );

    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((header) => this.csvEscape(row[header])).join(","));
    }

    return `${lines.join("\n")}\n`;
  }

  private buildExcelXml(rows: Record<string, unknown>[]) {
    const safeRows = rows.length > 0 ? rows : [{ dataset: "empty" }];
    const headers = Array.from(
      safeRows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>())
    );

    const escapeXml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const headerCells = headers.map((header) => `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`).join("");
    const dataRows = safeRows
      .map((row) => {
        const cells = headers
          .map((header) => `<Cell><Data ss:Type="String">${escapeXml(row[header])}</Data></Cell>`)
          .join("");
        return `<Row>${cells}</Row>`;
      })
      .join("");

    return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="supervision">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  async getOverview(utilisateur: JwtPayloadUtilisateur) {
    this.assertSupervisionRole(utilisateur);
    const scope = this.buildScope(utilisateur);
    const overview = await this.repository.getOverview(scope);

    return {
      message: "Vue d'ensemble de supervision recuperee avec succes",
      donnees: {
        scope: {
          role: scope.role,
          region: scope.region ?? null,
          visibility: scope.isInspector ? "territorial" : "national",
        },
        totals: overview,
        rates: {
          shortlist_rate: this.toPercent(overview.shortlisted_candidates, overview.total_applications),
          hiring_rate: this.toPercent(overview.hired_candidates, overview.total_applications),
          compliance_validation_rate: this.toPercent(overview.validated_reports, overview.total_reports),
          inclusion_rate: this.toPercent(overview.hired_candidates, overview.active_companies || overview.total_companies),
        },
      },
    };
  }

  async getPipeline(utilisateur: JwtPayloadUtilisateur) {
    this.assertSupervisionRole(utilisateur);
    const scope = this.buildScope(utilisateur);
    const byCompany = await this.repository.getPipeline(scope);

    const totals = byCompany.reduce(
      (acc, company) => {
        acc.offers_count += company.offers_count;
        acc.applications_count += company.applications_count;
        acc.shortlisted_count += company.shortlisted_count;
        acc.interviews_count += company.interviews_count;
        acc.hired_count += company.hired_count;
        acc.rejected_count += company.rejected_count;
        return acc;
      },
      {
        offers_count: 0,
        applications_count: 0,
        shortlisted_count: 0,
        interviews_count: 0,
        hired_count: 0,
        rejected_count: 0,
      }
    );

    return {
      message: "Pipeline de recrutement recupere avec succes",
      donnees: {
        totals,
        by_company: byCompany,
      },
    };
  }

  async listSupervisedEnterprises(utilisateur: JwtPayloadUtilisateur) {
    this.assertSupervisionRole(utilisateur);
    const scope = this.buildScope(utilisateur);
    const companies = await this.repository.listSupervisedEnterprises(scope);

    return {
      message: "Entreprises visibles sur la carte recuperees avec succes",
      donnees: {
        scope: {
          role: scope.role,
          region: scope.region ?? null,
          visibility: scope.isInspector ? "territorial" : "national",
        },
        companies,
      },
    };
  }

  async listReports(utilisateur: JwtPayloadUtilisateur, filters: { status?: string; companyId?: string }) {
    this.assertSupervisionRole(utilisateur);
    const reports = await this.repository.listReports(this.buildScope(utilisateur), filters);

    return {
      message: "Rapports de conformite recuperes avec succes",
      donnees: reports.map((report) => ({
        ...report,
        recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
      })),
    };
  }

  async getReportDetail(utilisateur: JwtPayloadUtilisateur, reportId: string) {
    this.assertSupervisionRole(utilisateur);
    const report = await this.repository.getReportById(this.buildScope(utilisateur), reportId);

    if (!report) {
      throw new ErreurApi("Rapport de conformite introuvable", 404);
    }

    return {
      message: "Detail du rapport recupere avec succes",
      donnees: {
        ...report,
        recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
      },
    };
  }

  async createReport(utilisateur: JwtPayloadUtilisateur, payload: Record<string, unknown>) {
    if (utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("Seules les entreprises peuvent soumettre un rapport", 403);
    }

    const summary = String(payload.summary ?? "").trim();
    if (!summary) {
      throw new ErreurApi("Le resume du rapport est obligatoire", 400);
    }

    const periodStart = new Date(String(payload.reporting_period_start ?? ""));
    const periodEnd = new Date(String(payload.reporting_period_end ?? ""));

    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      throw new ErreurApi("La periode du rapport est invalide", 400);
    }

    if (periodEnd < periodStart) {
      throw new ErreurApi("La fin de periode doit etre posterieure au debut", 400);
    }

    const enterprise = await this.repository.findEnterpriseByUserId(utilisateur.id_utilisateur);

    if (!enterprise) {
      throw new ErreurApi("Entreprise introuvable pour ce rapport", 404);
    }

    const created = await this.repository.createReport({
      id_entreprise: enterprise.id,
      submitted_by_user_id: utilisateur.id_utilisateur,
      region: String(enterprise.region || "National").trim() || "National",
      summary,
      reporting_period_start: periodStart,
      reporting_period_end: periodEnd,
      workforce_total: Number(payload.workforce_total ?? 0),
      disabled_employees: Number(payload.disabled_employees ?? 0),
      active_offers: Number(payload.active_offers ?? 0),
      applications_count: Number(payload.applications_count ?? 0),
      shortlisted_count: Number(payload.shortlisted_count ?? 0),
      hired_count: Number(payload.hired_count ?? 0),
      accommodation_actions: payload.accommodation_actions ? String(payload.accommodation_actions) : undefined,
      evidence_urls: Array.isArray(payload.evidence_urls) ? payload.evidence_urls.map((item) => String(item)) : [],
      recommendations: [],
    });

    return {
      message: "Rapport de conformite cree avec succes",
      donnees: created,
    };
  }

  async validateReport(utilisateur: JwtPayloadUtilisateur, reportId: string, payload: Record<string, unknown>) {
    this.assertSupervisionRole(utilisateur);
    const report = await this.repository.getReportById(this.buildScope(utilisateur), reportId);

    if (!report) {
      throw new ErreurApi("Rapport de conformite introuvable", 404);
    }

    const updated = await this.repository.updateReportReview(reportId, {
      status: "validated",
      reviewed_by_user_id: utilisateur.id_utilisateur,
      review_comment: payload.comment ? String(payload.comment) : null,
      last_recommendation: report.last_recommendation ?? null,
      recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
    });

    return {
      message: "Rapport valide avec succes",
      donnees: updated,
    };
  }

  async rejectReport(utilisateur: JwtPayloadUtilisateur, reportId: string, payload: Record<string, unknown>) {
    this.assertSupervisionRole(utilisateur);
    const recommendationText = String(payload.recommendation ?? "").trim();

    if (!recommendationText) {
      throw new ErreurApi("Une recommandation est obligatoire pour refuser un rapport", 400);
    }

    const report = await this.repository.getReportById(this.buildScope(utilisateur), reportId);
    if (!report) {
      throw new ErreurApi("Rapport de conformite introuvable", 404);
    }

    const recommendations = Array.isArray(report.recommendations) ? [...report.recommendations] : [];
    recommendations.push(this.buildRecommendation(utilisateur, recommendationText, "rejection"));

    const updated = await this.repository.updateReportReview(reportId, {
      status: "rejected",
      reviewed_by_user_id: utilisateur.id_utilisateur,
      review_comment: payload.comment ? String(payload.comment) : null,
      last_recommendation: recommendationText,
      recommendations,
    });

    return {
      message: "Rapport rejete avec succes",
      donnees: updated,
    };
  }

  async addRecommendation(utilisateur: JwtPayloadUtilisateur, reportId: string, payload: Record<string, unknown>) {
    this.assertSupervisionRole(utilisateur);
    const recommendationText = String(payload.recommendation ?? "").trim();

    if (!recommendationText) {
      throw new ErreurApi("Le texte de la recommandation est obligatoire", 400);
    }

    const report = await this.repository.getReportById(this.buildScope(utilisateur), reportId);
    if (!report) {
      throw new ErreurApi("Rapport de conformite introuvable", 404);
    }

    const recommendations = Array.isArray(report.recommendations) ? [...report.recommendations] : [];
    recommendations.push(this.buildRecommendation(utilisateur, recommendationText, "general"));

    const updated = await this.repository.updateRecommendations(reportId, {
      recommendations,
      last_recommendation: recommendationText,
    });

    return {
      message: "Recommandation ajoutee avec succes",
      donnees: updated,
    };
  }

  async listOffers(utilisateur: JwtPayloadUtilisateur) {
    this.assertSupervisionRole(utilisateur);
    const offers = await this.repository.listOffers(this.buildScope(utilisateur));

    return {
      message: "Performance des offres recuperee avec succes",
      donnees: offers,
    };
  }

  async listCandidates(utilisateur: JwtPayloadUtilisateur, requestedStage?: string) {
    this.assertSupervisionRole(utilisateur);
    const scope = this.buildScope(utilisateur);
    const statuses = scope.isInspector
      ? ["accepted"]
      : requestedStage === "shortlisted"
        ? ["shortlisted"]
        : requestedStage === "hired"
          ? ["accepted"]
          : ["shortlisted", "accepted"];

    const candidates = await this.repository.listVisibleCandidates(scope, statuses);

    return {
      message: "Candidats visibles recuperes avec succes",
      donnees: candidates.map((candidate) => ({
        candidate_reference: `CAND-${String(candidate.candidate_id).slice(0, 8).toUpperCase()}`,
        application_id: candidate.application_id,
        stage: candidate.statut === "accepted" ? "hired" : "shortlisted",
        company_name: candidate.company_name,
        offer_title: candidate.offer_title,
        region: candidate.region,
        applied_at: candidate.date_postulation,
        updated_at: candidate.updated_at,
      })),
    };
  }

  async exportDataset(utilisateur: JwtPayloadUtilisateur, dataset: string, format: string) {
    this.assertSupervisionRole(utilisateur);
    const rows = (await this.repository.getExportRows(this.buildScope(utilisateur), dataset)).map((row) => {
      if (dataset === "reports") {
        const reportRow = row as Record<string, unknown>;
        return {
          id: reportRow.id,
          company_name: reportRow.company_name,
          region: reportRow.region,
          status: reportRow.status,
          submitted_at: reportRow.submitted_at,
          reviewed_at: reportRow.reviewed_at,
          applications_count: reportRow.applications_count,
          shortlisted_count: reportRow.shortlisted_count,
          hired_count: reportRow.hired_count,
          last_recommendation: reportRow.last_recommendation,
        };
      }

      if (dataset === "candidates") {
        const candidateRow = row as Record<string, unknown>;
        return {
          candidate_reference: `CAND-${String(candidateRow.candidate_id).slice(0, 8).toUpperCase()}`,
          stage: candidateRow.statut === "accepted" ? "hired" : "shortlisted",
          company_name: candidateRow.company_name,
          offer_title: candidateRow.offer_title,
          region: candidateRow.region,
          applied_at: candidateRow.date_postulation,
          updated_at: candidateRow.updated_at,
        };
      }

      return row;
    });

    if (!["csv", "excel"].includes(format)) {
      throw new ErreurApi("Format d'export invalide", 400);
    }

    return format === "csv"
      ? {
          filename: `supervision_${dataset}_${new Date().toISOString().slice(0, 10)}.csv`,
          contentType: "text/csv",
          content: this.buildCsv(rows),
        }
      : {
          filename: `supervision_${dataset}_${new Date().toISOString().slice(0, 10)}.xml`,
          contentType: "application/vnd.ms-excel",
          content: this.buildExcelXml(rows),
        };
  }
}
