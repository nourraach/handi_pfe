import { NextFunction, Request, Response } from "express";
import { ErreurApi } from "../utils/erreur-api";

export const gestionErreursMiddleware = (
  erreur: unknown,
  _requete: Request,
  reponse: Response,
  _suivant: NextFunction,
) => {
  if (erreur instanceof ErreurApi) {
    return reponse.status(erreur.statutHttp).json({
      message: erreur.message,
    });
  }

  console.error(erreur);

  return reponse.status(500).json({
    message: "Une erreur interne est survenue.",
  });
};
