// @ts-nocheck
import { Request, Response } from "express";
import { EntretienService } from "../services/entretien.service";
import { reponseSucces, reponseErreur } from "../utils/reponse";
import { asString } from "../utils/request-helpers";

export class EntretienController {
  private entretienService = new EntretienService();

  // POST /api/entretiens/planifier
  planifierEntretien = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const entretien = await this.entretienService.planifierEntretien(req.body, idEntreprise);
      return reponseSucces(res, 201, "Entretien planifié avec succès", entretien);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/entretiens/entreprise
  obtenirEntretiensEntreprise = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const entretiens = await this.entretienService.obtenirEntretiensEntreprise(idEntreprise);
      return reponseSucces(res, 200, "Entretiens récupérés avec succès", entretiens);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/entretiens/admin
  obtenirTousEntretiensAdmin = async (req: Request, res: Response) => {
    try {
      const role = req.utilisateur?.role;
      const region = req.utilisateur?.region?.trim();

      if (role === "inspecteur" && !region) {
        return reponseErreur(res, 400, "Region manquante pour l'inspecteur");
      }

      const entretiens = await this.entretienService.obtenirTousEntretiensAdmin(
        role === "inspecteur" ? region : undefined
      );
      return reponseSucces(res, 200, "Entretiens récupérés avec succès", entretiens);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // GET /api/entretiens/candidat
  obtenirMesEntretiens = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Accès réservé aux candidats");
      }

      const entretiens = await this.entretienService.obtenirEntretiensCandidat(idCandidat);
      return reponseSucces(res, 200, "Entretiens récupérés avec succès", entretiens);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // PUT /api/entretiens/:id
  modifierEntretien = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const entretien = await this.entretienService.modifierEntretien(asString(req.params.id), req.body, idEntreprise);
      return reponseSucces(res, 200, "Entretien modifié avec succès", entretien);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // POST /api/entretiens/:id/annuler
  annulerEntretien = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const { motif } = req.body;
      const entretien = await this.entretienService.annulerEntretien(asString(req.params.id), idEntreprise, motif);
      return reponseSucces(res, 200, "Entretien annulé avec succès", entretien);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // POST /api/entretiens/:id/confirmer
  confirmerEntretien = async (req: Request, res: Response) => {
    try {
      const idCandidat = req.utilisateur.candidat?.id;
      if (!idCandidat) {
        return reponseErreur(res, 403, "Accès réservé aux candidats");
      }

      const entretien = await this.entretienService.confirmerEntretien(asString(req.params.id), idCandidat);
      return reponseSucces(res, 200, "Entretien confirmé avec succès", entretien);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };

  // POST /api/entretiens/:id/terminer
  terminerEntretien = async (req: Request, res: Response) => {
    try {
      const idEntreprise = req.utilisateur.entreprise?.id;
      if (!idEntreprise) {
        return reponseErreur(res, 403, "Accès réservé aux entreprises");
      }

      const { notes } = req.body;
      const entretien = await this.entretienService.terminerEntretien(asString(req.params.id), idEntreprise, notes);
      return reponseSucces(res, 200, "Entretien terminé avec succès", entretien);
    } catch (error) {
      return reponseErreur(res, error.statusCode || 500, error.message);
    }
  };
}
