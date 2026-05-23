import { NextFunction, Request, Response } from "express";
import { SupervisionService } from "../services/supervision.service";
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

  getOverview = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.getOverview(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  getPipeline = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.getPipeline(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listSupervisedEnterprises = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.listSupervisedEnterprises(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listReports = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
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

  validateReport = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.validateReport(this.getUtilisateur(requete), String(requete.params.id), requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  rejectReport = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.rejectReport(this.getUtilisateur(requete), String(requete.params.id), requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  addRecommendation = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.addRecommendation(this.getUtilisateur(requete), String(requete.params.id), requete.body);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listOffers = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.listOffers(this.getUtilisateur(requete));
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  listCandidates = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
      const resultat = await this.service.listCandidates(this.getUtilisateur(requete), requete.query.stage as string | undefined);
      return reponseSucces(reponse, 200, resultat.message, resultat.donnees);
    } catch (erreur) {
      return suivant(erreur);
    }
  };

  exportDataset = async (requete: Request, reponse: Response, suivant: NextFunction) => {
    try {
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
