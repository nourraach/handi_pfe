import { Response } from "express";

// Helper that accepts either (status, message, data) or (status, data)
export function reponseSucces(reponse: Response, statutHttp: number, message: string, donnees?: unknown): Response;
export function reponseSucces(reponse: Response, donnees: unknown, message?: string): Response;
export function reponseSucces(
  reponse: Response,
  statutOuDonnees: number | unknown,
  messageOuDonnees?: string | unknown,
  donnees?: unknown
): Response {
  if (typeof statutOuDonnees === "number") {
    const statutHttp = statutOuDonnees;
    const message = typeof messageOuDonnees === "string" ? messageOuDonnees : "Succès";
    return reponse.status(statutHttp).json({
      message,
      donnees,
    });
  }

  const message = typeof messageOuDonnees === "string" ? messageOuDonnees : "Succès";
  return reponse.status(200).json({
    message,
    donnees: statutOuDonnees,
  });
}

export const reponseErreur = (reponse: Response, statutHttp: number, message: string) =>
  reponse.status(statutHttp).json({
    message,
    error: message,
  });
