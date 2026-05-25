import { pool } from "../db";

function asInt(value: unknown): number {
  return Number.parseInt(String(value ?? 0), 10) || 0;
}

export type EnterpriseComplianceContextCompany = {
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
};

export type EnterpriseComplianceContextOffer = {
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
};

export type EnterpriseComplianceContextCandidate = {
  application_id: string;
  offer_id: string;
  statut: string;
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
};

export class EnterpriseReportingRepository {
  async getEnterpriseContextByUserId(userId: string) {
    const companyQuery = `
      SELECT
        e.id AS enterprise_id,
        e.id_utilisateur AS user_id,
        e.nom_entreprise AS company_name,
        u.nom AS legal_name,
        e.rne,
        e.patente,
        e.secteur_activite AS industry,
        COALESCE(e.site_web, e.url_site) AS website,
        u.addresse AS address,
        COALESCE(NULLIF(u.region, ''), u.addresse, '') AS region,
        e.nbr_employe AS workforce_total,
        e.nbr_employe_handicape AS disabled_employees,
        e.contact_rh_nom AS hr_contact_name,
        e.contact_rh_email AS hr_contact_email,
        e.contact_rh_telephone AS hr_contact_phone
      FROM entreprise e
      INNER JOIN utilisateur u ON u.id_utilisateur = e.id_utilisateur
      WHERE e.id_utilisateur = $1
      LIMIT 1
    `;

    const companyResult = await pool.query(companyQuery, [userId]);
    const companyRow = companyResult.rows[0];

    if (!companyRow) {
      return null;
    }

    const offerQuery = `
      SELECT
        o.id AS offer_id,
        o.titre AS offer_title,
        o.localisation,
        o.created_at,
        o.statut AS status,
        COALESCE(os.vues_count, 0) AS views_count,
        COUNT(c.id) AS applications_count,
        COUNT(CASE WHEN c.statut = 'shortlisted' THEN 1 END) AS shortlisted_count,
        COUNT(CASE WHEN c.statut = 'interview_scheduled' THEN 1 END) AS interview_scheduled_count,
        COUNT(CASE WHEN c.statut = 'accepted' THEN 1 END) AS hired_count
      FROM offre_emploi o
      LEFT JOIN offre_statistiques os ON os.id_offre = o.id
      LEFT JOIN candidature c ON c.id_offre = o.id
      WHERE o.id_entreprise = $1
      GROUP BY o.id, o.titre, o.localisation, o.created_at, o.statut, os.vues_count
      ORDER BY o.created_at DESC
    `;

    const candidateQuery = `
      SELECT
        c.id AS application_id,
        c.id_offre AS offer_id,
        c.statut,
        c.date_postulation,
        candidate_user.nom AS candidate_name,
        candidate_user.genre AS candidate_gender,
        candidate_user.addresse AS candidate_region,
        cand.age AS candidate_age,
        cand.type_handicap,
        cand.num_carte_handicap,
        cand.date_expiration_carte_handicap,
        cand.niveau_academique,
        cand.secteur,
        cand.formation,
        cand.handicap
      FROM candidature c
      INNER JOIN offre_emploi o ON o.id = c.id_offre
      INNER JOIN candidat cand ON cand.id = c.id_candidat
      INNER JOIN utilisateur candidate_user ON candidate_user.id_utilisateur = cand.id_utilisateur
      WHERE o.id_entreprise = $1
        AND c.statut IN ('shortlisted', 'interview_scheduled', 'accepted')
      ORDER BY c.date_postulation DESC
    `;

    const [offerResult, candidateResult] = await Promise.all([
      pool.query(offerQuery, [companyRow.enterprise_id]),
      pool.query(candidateQuery, [companyRow.enterprise_id]),
    ]);

    return {
      company: {
        ...companyRow,
        workforce_total: asInt(companyRow.workforce_total),
        disabled_employees: asInt(companyRow.disabled_employees),
      } as EnterpriseComplianceContextCompany,
      offers: offerResult.rows.map((row) => ({
        ...row,
        views_count: asInt(row.views_count),
        applications_count: asInt(row.applications_count),
        shortlisted_count: asInt(row.shortlisted_count),
        interview_scheduled_count: asInt(row.interview_scheduled_count),
        hired_count: asInt(row.hired_count),
      })) as EnterpriseComplianceContextOffer[],
      candidates: candidateResult.rows.map((row) => ({
        ...row,
        candidate_age: row.candidate_age === null || row.candidate_age === undefined ? null : asInt(row.candidate_age),
      })) as EnterpriseComplianceContextCandidate[],
    };
  }

  async listComplianceReportsByUserId(userId: string) {
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
        reviewer.nom AS reviewed_by_name
      FROM compliance_report cr
      INNER JOIN entreprise e ON e.id = cr.id_entreprise
      LEFT JOIN utilisateur reviewer ON reviewer.id_utilisateur = cr.reviewed_by_user_id
      WHERE e.id_utilisateur = $1
      ORDER BY cr.submitted_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map((row) => ({
      ...row,
      workforce_total: asInt(row.workforce_total),
      disabled_employees: asInt(row.disabled_employees),
      active_offers: asInt(row.active_offers),
      applications_count: asInt(row.applications_count),
      shortlisted_count: asInt(row.shortlisted_count),
      hired_count: asInt(row.hired_count),
      recommendations: Array.isArray(row.recommendations) ? row.recommendations : [],
    }));
  }

  async getComplianceReportByIdForUser(userId: string, reportId: string) {
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
        reviewer.nom AS reviewed_by_name
      FROM compliance_report cr
      INNER JOIN entreprise e ON e.id = cr.id_entreprise
      LEFT JOIN utilisateur reviewer ON reviewer.id_utilisateur = cr.reviewed_by_user_id
      WHERE e.id_utilisateur = $1 AND cr.id = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [userId, reportId]);
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      ...row,
      workforce_total: asInt(row.workforce_total),
      disabled_employees: asInt(row.disabled_employees),
      active_offers: asInt(row.active_offers),
      applications_count: asInt(row.applications_count),
      shortlisted_count: asInt(row.shortlisted_count),
      hired_count: asInt(row.hired_count),
      recommendations: Array.isArray(row.recommendations) ? row.recommendations : [],
      evidence_urls: Array.isArray(row.evidence_urls) ? row.evidence_urls : [],
    };
  }
}

