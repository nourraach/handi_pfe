"use client";

import { useMemo } from "react";

export function BlocActivation({ token }: { token: string | null }) {
  const contenu = useMemo(
    () =>
      token
        ? {
            etat: "succes" as const,
            message: "Votre compte est déjà actif. Vous pouvez vous connecter directement.",
          }
        : {
            etat: "erreur" as const,
            message: "Jeton d'activation introuvable. Connectez-vous directement avec votre e-mail et votre mot de passe.",
          },
    [token],
  );

  return (
    <p className={`message ${contenu.etat === "erreur" ? "message-erreur" : "message-info"}`}>
      {contenu.message}
    </p>
  );
}
