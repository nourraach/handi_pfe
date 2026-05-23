import { NextFunction, Request, Response } from "express";
import { EnterpriseReportingService } from "../services/enterprise-reporting.service";
import { ErreurApi } from "../utils/erreur-api";
import { reponseSucces } from "../utils/reponse";

export class EnterpriseReportingController {
  constructor(private readonly service = new EnterpriseReportingService()) {}

  private getUtilisateur(requete: Request) {
    if (!requete.utilisateur) {
      throw new ErreurApi("Utilisateur non authentifie.", 401);
    }

    return requete.utilisateur;
  }

  getComplianceContext = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.getComplianceContext(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listReports = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.listReports(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  getReportDetail = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.getReportDetail(this.getUtilisateur(requete), String(requete.params.id));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  createReport = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.createReport(this.getUtilisateur(requete), requete.body);
      return reponseSucces(reponse, 201, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };
}

