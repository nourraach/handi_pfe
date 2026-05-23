import { Request, Response } from "express";
import { ErreurApi } from "../utils/erreur-api";
import { reponseErreur, reponseSucces } from "../utils/reponse";
import { asString } from "../utils/request-helpers";
import { interviewQuestionsService } from "../services/interview-questions/interview-questions.service";

/**
 * Feature 02 — Controller du predicteur de questions d'entretien.
 * Toutes les routes sont reservees au candidat proprietaire de la candidature.
 */

function extractError(err: unknown): { status: number; message: string } {
  if (err instanceof ErreurApi) return { status: err.statutHttp, message: err.message };
  if (err instanceof Error) return { status: 500, message: err.message };
  return { status: 500, message: "Erreur interne" };
}

export class InterviewPrepController {
  // GET /api/candidatures/:id/interview-prep
  getDossier = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur?.id_utilisateur;
      if (!idUtilisateur) return reponseErreur(res, 401, "Authentification requise");
      const idCandidature = asString(req.params.id);
      const dossier = await interviewQuestionsService.getDossier(idCandidature, idUtilisateur);
      return reponseSucces(res, 200, "Dossier recupere", dossier);
    } catch (err) {
      const { status, message } = extractError(err);
      return reponseErreur(res, status, message);
    }
  };

  // POST /api/candidatures/:id/interview-prep/regenerate
  regenerate = async (req: Request, res: Response) => {
    try {
      const idUtilisateur = req.utilisateur?.id_utilisateur;
      if (!idUtilisateur) return reponseErreur(res, 401, "Authentification requise");
      const idCandidature = asString(req.params.id);
      const dossier = await interviewQuestionsService.regenerate(idCandidature, idUtilisateur);
      return reponseSucces(res, 200, "Regeneration demarree", dossier);
    } catch (err) {
      const { status, message } = extractError(err);
      return reponseErreur(res, status, message);
    }
  };
}
