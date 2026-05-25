import { pool } from "../db";
import { ErreurApi } from "../utils/erreur-api";

export interface SupervisionScope {
  role: string;
  region?: string;
  isInspector: boolean;
  isAneti: boolean;
}

export interface ComplianceReportInput {
  id_entreprise: string;
  submitted_by_user_id: string;
  region: string;
  summary: string;
  reporting_period_start: Date;
  reporting_period_end: Date;
  workforce_total: number;
  disabled_employees: number;
  active_offers: number;
  applications_count: number;
  shortlisted_count: number;
  hired_count: number;
  accommodation_actions?: string;
  evidence_urls?: string[];
  recommendations: unknown[];
}

export interface SupervisedEnterpriseMapRow {
  company_id: string;
  company_name: string;
  region: string;
  address: string;
  offers_count: number;
  applications_count: number;
  hired_count: number;
}

function asInt(value: unknown): number {
  return Number.parseInt(String(value ?? 0), 10) || 0;
}

export class SupervisionRepository {
  private buildScopeCondition(scope: SupervisionScope, params: unknown[], companyAlias = "company_user") {
    if (!scope.isInspector) {
      return "";
    }

    params.push(`%${scope.region || ""}%`);
    const index = params.length;
    return `LOWER(COALESCE(NULLIF(${companyAlias}.region, ''), ${companyAlias}.addresse, '')) LIKE LOWER($${index})`;
  }

  private buildWhere(conditions: string[]) {
    return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  }

  async findEnterpriseById(idEntreprise: string) {
    const query = `
      SELECT e.id, e.nom_entreprise, COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS region
      FROM entreprise e
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      WHERE e.id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [idEntreprise]);
    return result.rows[0] ?? null;
  }

  async findEnterpriseByUserId(userId: string) {
    const query = `
      SELECT e.id, e.nom_entreprise, COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS region
      FROM entreprise e
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      WHERE e.id_utilisateur = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] ?? null;
  }

  async getOverview(scope: SupervisionScope) {
    const params: unknown[] = [];
    const conditions: string[] = [];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const query = `
      SELECT
        COUNT(DISTINCT e.id) AS total_companies,
        COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN e.id END) AS active_companies,
        COUNT(DISTINCT o.id) AS total_offers,
        COUNT(DISTINCT c.id) AS total_applications,
        COUNT(DISTINCT CASE WHEN c.statut = 'shortlisted' THEN c.id END) AS shortlisted_candidates,
        COUNT(DISTINCT CASE WHEN c.statut = 'accepted' THEN c.id END) AS hired_candidates,
        COUNT(DISTINCT cr.id) AS total_reports,
        COUNT(DISTINCT CASE WHEN cr.status = 'submitted' THEN cr.id END) AS submitted_reports,
        COUNT(DISTINCT CASE WHEN cr.status = 'validated' THEN cr.id END) AS validated_reports,
        COUNT(DISTINCT CASE WHEN cr.status = 'rejected' THEN cr.id END) AS rejected_reports
      FROM entreprise e
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      LEFT JOIN offre_emploi o ON o.id_entreprise = e.id
      LEFT JOIN candidature c ON c.id_offre = o.id
      LEFT JOIN compliance_report cr ON cr.id_entreprise = e.id
      ${this.buildWhere(conditions)}
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0] ?? {};

    return {
      total_companies: asInt(row.total_companies),
      active_companies: asInt(row.active_companies),
      total_offers: asInt(row.total_offers),
      total_applications: asInt(row.total_applications),
      shortlisted_candidates: asInt(row.shortlisted_candidates),
      hired_candidates: asInt(row.hired_candidates),
      total_reports: asInt(row.total_reports),
      submitted_reports: asInt(row.submitted_reports),
      validated_reports: asInt(row.validated_reports),
      rejected_reports: asInt(row.rejected_reports),
    };
  }

  async getPipeline(scope: SupervisionScope) {
    const params: unknown[] = [];
    const conditions: string[] = [];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const query = `
      SELECT
        e.id AS company_id,
        e.nom_entreprise AS company_name,
        COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS region,
        COUNT(DISTINCT o.id) AS offers_count,
        COUNT(c.id) AS applications_count,
        COUNT(CASE WHEN c.statut = 'shortlisted' THEN 1 END) AS shortlisted_count,
        COUNT(CASE WHEN c.statut = 'interview_scheduled' THEN 1 END) AS interviews_count,
        COUNT(CASE WHEN c.statut = 'accepted' THEN 1 END) AS hired_count,
        COUNT(CASE WHEN c.statut = 'rejected' THEN 1 END) AS rejected_count
      FROM entreprise e
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      LEFT JOIN offre_emploi o ON o.id_entreprise = e.id
      LEFT JOIN candidature c ON c.id_offre = o.id
      ${this.buildWhere(conditions)}
      GROUP BY e.id, e.nom_entreprise, company_user.region, company_user.addresse
      ORDER BY hired_count DESC, shortlisted_count DESC, applications_count DESC, e.nom_entreprise ASC
    `;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      company_id: row.company_id,
      company_name: row.company_name,
      region: row.region,
      offers_count: asInt(row.offers_count),
      applications_count: asInt(row.applications_count),
      shortlisted_count: asInt(row.shortlisted_count),
      interviews_count: asInt(row.interviews_count),
      hired_count: asInt(row.hired_count),
      rejected_count: asInt(row.rejected_count),
    }));
  }

  async listSupervisedEnterprises(scope: SupervisionScope): Promise<SupervisedEnterpriseMapRow[]> {
    const params: unknown[] = [];
    const conditions: string[] = [];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const query = `
      SELECT
        e.id AS company_id,
        e.nom_entreprise AS company_name,
        COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS region,
        COALESCE(company_user.addresse, '') AS address,
        COUNT(DISTINCT o.id) AS offers_count,
        COUNT(c.id) AS applications_count,
        COUNT(CASE WHEN c.statut = 'accepted' THEN 1 END) AS hired_count
      FROM entreprise e
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      LEFT JOIN offre_emploi o ON o.id_entreprise = e.id
      LEFT JOIN candidature c ON c.id_offre = o.id
      ${this.buildWhere(conditions)}
      GROUP BY e.id, e.nom_entreprise, company_user.region, company_user.addresse
      ORDER BY e.nom_entreprise ASC
    `;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      company_id: row.company_id,
      company_name: row.company_name,
      region: row.region,
      address: row.address,
      offers_count: asInt(row.offers_count),
      applications_count: asInt(row.applications_count),
      hired_count: asInt(row.hired_count),
    }));
  }

  async listReports(scope: SupervisionScope, filters: { status?: string; companyId?: string }) {
    const params: unknown[] = [];
    const conditions: string[] = [];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`cr.status = $${params.length}`);
    }
    if (filters.companyId) {
      params.push(filters.companyId);
      conditions.push(`cr.id_entreprise = $${params.length}`);
    }

    const query = `
      SELECT
        cr.id,
        cr.status,
        cr.region,
        cr.summary,
        cr.reporting_period_start,
        cr.reporting_period_end,
        cr.submitted_at,
        cr.reviewed_at,
        cr.review_comment,
        cr.last_recommendation,
        cr.workforce_total,
        cr.disabled_employees,
        cr.active_offers,
        cr.applications_count,
        cr.shortlisted_count,
        cr.hired_count,
        cr.recommendations,
        e.id AS company_id,
        e.nom_entreprise AS company_name,
        COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS company_region,
        submitter.nom AS submitted_by_name,
        reviewer.nom AS reviewed_by_name
      FROM compliance_report cr
      INNER JOIN entreprise e ON e.id = cr.id_entreprise
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      INNER JOIN utilisateur submitter ON submitter.id_utilisateur = cr.submitted_by_user_id
      LEFT JOIN utilisateur reviewer ON reviewer.id_utilisateur = cr.reviewed_by_user_id
      ${this.buildWhere(conditions)}
      ORDER BY cr.submitted_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getReportById(scope: SupervisionScope, reportId: string) {
    const params: unknown[] = [reportId];
    const conditions: string[] = ["cr.id = $1"];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const query = `
      SELECT
        cr.id,
        cr.status,
        cr.region,
        cr.summary,
        cr.reporting_period_start,
        cr.reporting_period_end,
        cr.submitted_at,
        cr.reviewed_at,
        cr.review_comment,
        cr.last_recommendation,
        cr.workforce_total,
        cr.disabled_employees,
        cr.active_offers,
        cr.applications_count,
        cr.shortlisted_count,
        cr.hired_count,
        cr.accommodation_actions,
        cr.evidence_urls,
        cr.recommendations,
        e.id AS company_id,
        e.nom_entreprise AS company_name,
        COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS company_region,
        submitter.nom AS submitted_by_name,
        reviewer.nom AS reviewed_by_name
      FROM compliance_report cr
      INNER JOIN entreprise e ON e.id = cr.id_entreprise
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      INNER JOIN utilisateur submitter ON submitter.id_utilisateur = cr.submitted_by_user_id
      LEFT JOIN utilisateur reviewer ON reviewer.id_utilisateur = cr.reviewed_by_user_id
      ${this.buildWhere(conditions)}
      LIMIT 1
    `;

    const result = await pool.query(query, params);
    return result.rows[0] ?? null;
  }

  async createReport(input: ComplianceReportInput) {
    const query = `
      INSERT INTO compliance_report (
        id_entreprise,
        submitted_by_user_id,
        region,
        summary,
        reporting_period_start,
        reporting_period_end,
        workforce_total,
        disabled_employees,
        active_offers,
        applications_count,
        shortlisted_count,
        hired_count,
        accommodation_actions,
        evidence_urls,
        recommendations,
        submitted_at,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, NOW(), NOW(), NOW()
      )
      RETURNING id, status, submitted_at
    `;

    const result = await pool.query(query, [
      input.id_entreprise,
      input.submitted_by_user_id,
      input.region,
      input.summary,
      input.reporting_period_start,
      input.reporting_period_end,
      input.workforce_total,
      input.disabled_employees,
      input.active_offers,
      input.applications_count,
      input.shortlisted_count,
      input.hired_count,
      input.accommodation_actions ?? null,
      JSON.stringify(input.evidence_urls ?? []),
      JSON.stringify(input.recommendations ?? []),
    ]);

    return result.rows[0] ?? null;
  }

  async updateReportReview(reportId: string, payload: {
    status: string;
    reviewed_by_user_id: string;
    review_comment?: string | null;
    last_recommendation?: string | null;
    recommendations: unknown[];
  }) {
    const query = `
      UPDATE compliance_report
      SET
        status = $1,
        reviewed_by_user_id = $2,
        review_comment = $3,
        last_recommendation = $4,
        recommendations = $5::jsonb,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, status, reviewed_at, last_recommendation
    `;

    const result = await pool.query(query, [
      payload.status,
      payload.reviewed_by_user_id,
      payload.review_comment ?? null,
      payload.last_recommendation ?? null,
      JSON.stringify(payload.recommendations ?? []),
      reportId,
    ]);

    return result.rows[0] ?? null;
  }

  async updateRecommendations(reportId: string, payload: {
    recommendations: unknown[];
    last_recommendation?: string | null;
  }) {
    const query = `
      UPDATE compliance_report
      SET
        recommendations = $1::jsonb,
        last_recommendation = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, last_recommendation, updated_at
    `;

    const result = await pool.query(query, [
      JSON.stringify(payload.recommendations ?? []),
      payload.last_recommendation ?? null,
      reportId,
    ]);

    return result.rows[0] ?? null;
  }

  async listOffers(scope: SupervisionScope) {
    const params: unknown[] = [];
    const conditions: string[] = [];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const query = `
      SELECT
        o.id AS offer_id,
        o.titre AS offer_title,
        o.statut AS offer_status,
        o.localisation,
        o.type_poste,
        o.created_at,
        e.nom_entreprise AS company_name,
        COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS region,
        COALESCE(os.vues_count, 0) AS views_count,
        COUNT(c.id) AS applications_count,
        COUNT(CASE WHEN c.statut = 'shortlisted' THEN 1 END) AS shortlisted_count,
        COUNT(CASE WHEN c.statut = 'accepted' THEN 1 END) AS hired_count
      FROM offre_emploi o
      INNER JOIN entreprise e ON e.id = o.id_entreprise
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      LEFT JOIN offre_statistiques os ON os.id_offre = o.id
      LEFT JOIN candidature c ON c.id_offre = o.id
      ${this.buildWhere(conditions)}
      GROUP BY o.id, e.nom_entreprise, company_user.region, company_user.addresse, os.vues_count
      ORDER BY views_count DESC, hired_count DESC, applications_count DESC, o.created_at DESC
    `;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      offer_id: row.offer_id,
      offer_title: row.offer_title,
      offer_status: row.offer_status,
      localisation: row.localisation,
      type_poste: row.type_poste,
      created_at: row.created_at,
      company_name: row.company_name,
      region: row.region,
      views_count: asInt(row.views_count),
      applications_count: asInt(row.applications_count),
      shortlisted_count: asInt(row.shortlisted_count),
      hired_count: asInt(row.hired_count),
    }));
  }

  async listVisibleCandidates(scope: SupervisionScope, statuses: string[]) {
    const params: unknown[] = [statuses];
    const conditions: string[] = ["c.statut = ANY($1)"];
    const scopeCondition = this.buildScopeCondition(scope, params);

    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const query = `
      SELECT
        c.id AS application_id,
        cand.id AS candidate_id,
        c.statut,
        c.date_postulation,
        c.updated_at,
        e.nom_entreprise AS company_name,
        o.titre AS offer_title,
        COALESCE(NULLIF(company_user.region, ''), company_user.addresse, '') AS region
      FROM candidature c
      INNER JOIN candidat cand ON cand.id = c.id_candidat
      INNER JOIN offre_emploi o ON o.id = c.id_offre
      INNER JOIN entreprise e ON e.id = o.id_entreprise
      INNER JOIN utilisateur company_user ON company_user.id_utilisateur = e.id_utilisateur
      ${this.buildWhere(conditions)}
      ORDER BY c.updated_at DESC, c.date_postulation DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getExportRows(scope: SupervisionScope, dataset: string) {
    if (dataset === "offers") {
      return this.listOffers(scope);
    }

    if (dataset === "reports") {
      return this.listReports(scope, {});
    }

    if (dataset === "candidates") {
      const statuses = scope.isInspector ? ["accepted"] : ["shortlisted", "accepted"];
      return this.listVisibleCandidates(scope, statuses);
    }

    if (dataset === "statistics") {
      return this.getPipeline(scope);
    }

    throw new ErreurApi("Jeu de donnees d'export invalide", 400);
  }
}
