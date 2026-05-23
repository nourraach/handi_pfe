import { EnterpriseReportingRepository } from "../repositories/enterprise-reporting.repository";
import { JwtPayloadUtilisateur } from "../types/authentification.types";
import { RoleUtilisateur } from "../types/enums";
import { ErreurApi } from "../utils/erreur-api";
import { SupervisionService } from "./supervision.service";

const DEFAULT_PUBLICATION_CHANNELS = [
  {
    key: "handitalents_platform",
    label: "Publication sur la plateforme HandiTalents",
    default_label: "Capture HandiTalents",
  },
  {
    key: "aneti_platform",
    label: "Publication sur la plateforme de l'ANETI",
    default_label: "Capture ANETI",
  },
  {
    key: "handitalents_social",
    label: "Publication sur la page officielle de HandiTalents",
    default_label: "Capture HandiTalents Social",
  },
  {
    key: "handisuccess_social",
    label: "Publication sur la page officielle de HandiSuccess",
    default_label: "Capture HandiSuccess",
  },
  {
    key: "aneti_social",
    label: "Publication sur la page officielle de l'ANETI",
    default_label: "Capture ANETI Social",
  },
];

export class EnterpriseReportingService {
  constructor(
    private readonly repository = new EnterpriseReportingRepository(),
    private readonly supervisionService = new SupervisionService(),
  ) {}

  private assertEntreprise(utilisateur: JwtPayloadUtilisateur) {
    if (utilisateur.role !== RoleUtilisateur.ENTREPRISE) {
      throw new ErreurApi("Acces reserve aux entreprises.", 403);
    }
  }

  private calculateRequiredReservedPositions(workforceTotal: number) {
    if (workforceTotal <= 50) {
      return 0;
    }

    return Math.ceil(workforceTotal * 0.02);
  }

  async getComplianceContext(utilisateur: JwtPayloadUtilisateur) {
    this.assertEntreprise(utilisateur);
    const context = await this.repository.getEnterpriseContextByUserId(utilisateur.id_utilisateur);

    if (!context) {
      throw new ErreurApi("Entreprise introuvable pour cet utilisateur.", 404);
    }

    const offersWithCandidates = context.offers.map((offer) => ({
      ...offer,
      publication_channels: DEFAULT_PUBLICATION_CHANNELS.map((channel) => ({
        ...channel,
        url: "",
        screenshot_label: channel.default_label,
      })),
      candidates: context.candidates.filter((candidate) => candidate.offer_id === offer.offer_id),
      matching_candidates_count: offer.shortlisted_count + offer.interview_scheduled_count + offer.hired_count,
    }));

    const totals = offersWithCandidates.reduce(
      (acc, offer) => {
        acc.active_offers += offer.status === "active" ? 1 : 0;
        acc.applications_count += offer.applications_count;
        acc.shortlisted_count += offer.shortlisted_count;
        acc.interview_scheduled_count += offer.interview_scheduled_count;
        acc.hired_count += offer.hired_count;
        acc.views_count += offer.views_count;
        return acc;
      },
      {
        active_offers: 0,
        applications_count: 0,
        shortlisted_count: 0,
        interview_scheduled_count: 0,
        hired_count: 0,
        views_count: 0,
      },
    );

    const requiredReservedPositions = this.calculateRequiredReservedPositions(context.company.workforce_total);
    const remainingReservedPositions = Math.max(requiredReservedPositions - context.company.disabled_employees, 0);

    return {
      message: "Contexte du rapport de conformite recupere avec succes",
      donnees: {
        generated_at: new Date().toISOString(),
        company: {
          ...context.company,
          required_reserved_positions: requiredReservedPositions,
          remaining_reserved_positions: remainingReservedPositions,
          legal_obligation_percentage: 2,
        },
        totals,
        offers: offersWithCandidates,
      },
    };
  }

  async listReports(utilisateur: JwtPayloadUtilisateur) {
    this.assertEntreprise(utilisateur);
    const reports = await this.repository.listComplianceReportsByUserId(utilisateur.id_utilisateur);

    return {
      message: "Rapports de l'entreprise recuperes avec succes",
      donnees: reports,
    };
  }

  async getReportDetail(utilisateur: JwtPayloadUtilisateur, reportId: string) {
    this.assertEntreprise(utilisateur);
    const report = await this.repository.getComplianceReportByIdForUser(utilisateur.id_utilisateur, reportId);

    if (!report) {
      throw new ErreurApi("Rapport introuvable.", 404);
    }

    return {
      message: "Detail du rapport recupere avec succes",
      donnees: report,
    };
  }

  async createReport(utilisateur: JwtPayloadUtilisateur, payload: Record<string, unknown>) {
    this.assertEntreprise(utilisateur);

    const generatedBody = String(payload.generated_body ?? "").trim();
    const existingNotes = String(payload.accommodation_actions ?? "").trim();
    const mergedNotes = [
      generatedBody ? `Rapport genere:\n\n${generatedBody}` : "",
      existingNotes,
    ]
      .filter(Boolean)
      .join("\n\n");

    const finalPayload: Record<string, unknown> = {
      ...payload,
      accommodation_actions: mergedNotes || undefined,
    };

    return this.supervisionService.createReport(utilisateur, finalPayload);
  }
}

