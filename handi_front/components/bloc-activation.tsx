"use client";

import { useEffect, useState } from "react";

export function BlocActivation({ token }: { token: string | null }) {
  const [etat, setEtat] = useState<"succes" | "erreur">("succes");
  const [message, setMessage] = useState("Account activation by email is no longer required.");

  useEffect(() => {
    if (token) {
      setEtat("succes");
      setMessage("Your account is already active. You can sign in directly.");
      return;
    }
    setEtat("erreur");
    setMessage("Activation token not found. Sign in directly with your email and password.");
  }, [token]);

  return (
    <p className={`message ${etat === "erreur" ? "message-erreur" : "message-info"}`}>
      {message}
    </p>
  );
}
