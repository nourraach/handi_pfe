import { NextFunction, Request, Response } from "express";
import { SupervisionService } from "../services/supervision.service";
import { canAccessReportingResource, ResourceType } from "../services/authorization.service";
import { sanitizeRecruitedCandidatesForInspector, RecruitedCandidateRaw } from "../services/data-sanitization.service";
import { logAuthorizationAttempt } from "../services/audit-logger.service";
import { ErreurApi } from "../utils/erreur-api";
import { reponseSucces } from "../utils/reponse";

export class SupervisionController {
  constructor(private readonly service = new SupervisionService()) {}

  private getUtilisateur(requete: Request) {
    if (!requete.utilisateur) {
      throw new ErreurApi("Utilisateur non authentifie", 401);
    }

    return requete.utilisateur;
  }

  /**
   * Parse authorization headers set by API Gateway
   */
  private getUserContext(requete: Request) {
    const userId = requete.headers["x-user-id"] as string;
    const userRole = requete.headers["x-user-role"] as string;
    const userEntityId = requete.headers["x-user-entity-id"] as string;
    const requestId = requete.headers["x-request-id"] as string;

    if (!userId || !userRole) {
      throw new ErreurApi("Context utilisateur manquant des headers", 401);
    }

    return { userId, userRole, userEntityId, requestId };
  }

  /**
   * Check authorization and log the attempt
   */
  private async checkAuthorizationAndLog(
    requete: Request,
    resourceType: ResourceType,
    resourceId?: string
  ): Promise<void> {
    const context = this.getUserContext(requete);
    const authResult = canAccessReportingResource(context.userRole, resourceType);

    // Log authorization attempt
    await logAuthorizationAttempt({
      requestId: context.requestId,
      userId: context.userId,
      userRole: context.userRole,
      serviceName: "reporting-service",
      actionType: `ACCESS_${resourceType}`,
      resourceType,
      resourceId,
      authorizationResult: authResult.allowed ? "ALLOWED" : "DENIED",
      denialReason: authResult.reason,
      httpMethod: requete.method,
      httpPath: requete.path,
      ipAddress: requete.ip,
      userAgent: requete.headers["user-agent"],
      additionalContext: {
        resourceType,
        resourceId,
      },
    });

    // Return 403 if authorization failed
    if (!authResult.allowed) {
      throw {
        statusCode: 403,
        message: authResult.reason || "Accès refusé",
        code: "AUTHZ_ROLE_FORBIDDEN",
      };
    }
  }

  getOverview = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS");
      const resultat = await this.service.getOverview(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  getPipeline = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS");
      const resultat = await this.service.getPipeline(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listSupervisedEnterprises = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "ENTERPRISE_LIST");
      const resultat = await this.service.listSupervisedEnterprises(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listReports = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS");
      const resultat = await this.service.listReports(this.getUtilisateur(requete), {
        status: requete.query.status as string | undefined,
        companyId: requete.query.companyId as string | undefined,
      });
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  getReportDetail = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS", String(requete.params.id));
      const resultat = await this.service.getReportDetail(this.getUtilisateur(requete), String(requete.params.id));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  getReportPdf = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS", String(requete.params.id));
      const resultat = await this.service.getReportPdf(this.getUtilisateur(requete), String(requete.params.id));
      reponse.setHeader("Content-Type", "application/pdf");
      reponse.setHeader("Content-Disposition", `attachment; filename="${resultat.filename}"`);
      return reponse.status(200).sendFile(resultat.filePath);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  createReport = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS");
      const resultat = await this.service.createReport(this.getUtilisateur(requete), requete.body);
      return reponseSucces(reponse, 201, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  validateReport = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS", String(requete.params.id));
      const resultat = await this.service.validateReport(this.getUtilisateur(requete), String(requete.params.id), requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  rejectReport = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS", String(requete.params.id));
      const resultat = await this.service.rejectReport(this.getUtilisateur(requete), String(requete.params.id), requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  addRecommendation = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS", String(requete.params.id));
      const resultat = await this.service.addRecommendation(this.getUtilisateur(requete), String(requete.params.id), requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listOffers = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "JOB_OFFERS");
      const resultat = await this.service.listOffers(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listCandidates = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "RECRUITED_CANDIDATES");
      const context = this.getUserContext(requete);
      const resultat = await this.service.listCandidates(this.getUtilisateur(requete), requete.query.stage as string | undefined);
      
      // Apply data sanitization for inspector requests
      // Note: The actual data structure may differ from RecruitedCandidateRaw interface
      // We apply best-effort sanitization for inspector role
      if (context.userRole === "inspecteur") {
        // Use generic sanitization since data structure may not match RecruitedCandidateRaw exactly
        const sanitizedData = Array.isArray(resultat.donnees)
          ? resultat.donnees.map((candidate: any) => ({
              id: candidate.candidate_reference || "unknown",
              firstName: candidate.candidate_name?.split(" ")[0] || "Unknown",
              jobTitle: candidate.offer_title || "N/A",
              recruitmentDate: candidate.updated_at || candidate.applied_at || new Date(),
              enterpriseName: candidate.company_name || "Unknown",
            }))
          : resultat.donnees;
        return reponseSucces(reponse, 200, resultat.message, sanitizedData);
      }
      
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  exportDataset = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      await this.checkAuthorizationAndLog(requete, "AGGREGATED_STATS");
      const dataset = String(requete.query.dataset || "statistics");
      const format = String(requete.query.format || "csv");
      const resultat = await this.service.exportDataset(this.getUtilisateur(requete), dataset, format);

      reponse.setHeader("Content-Type", resultat.contentType);
      reponse.setHeader("Content-Disposition", `attachment; filename="${resultat.filename}"`);
      return reponse.status(200).send(resultat.content);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}
