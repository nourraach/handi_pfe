"use client";

import { useState } from "react";
import { construireUrlApi } from "@/lib/config";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/ui/layout";

const ClientReset = dynamic(() => Promise.resolve(ResetInner), { ssr: false });

export default function ResetPage() {
  return <ClientReset />;
}

function ResetInner() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const tokenParam = params.get("token") || "";
  const [token, setToken] = useState(tokenParam);
  const [mdp, setMdp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const reset = async () => {
    setLoading(true);
    setMessage(null);
    setErreur(null);

    try {
      const res = await fetch(construireUrlApi("/api/auth/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nouveau_mdp: mdp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setMessage("Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.");
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Réinitialisation du mot de passe"
      title="Choisissez un nouveau mot de passe dans la même interface unifiée."
      description="Réinitialisez votre accès sans quitter l'expérience claire et cohérente désormais utilisée sur toute la plateforme."
    >
      <div className="stack-lg">
        <div>
          <h2 className="page-title page-title-sm">Créer un nouveau mot de passe</h2>
          <p className="page-description" style={{ margin: "12px 0 0" }}>
            Collez votre jeton de réinitialisation et choisissez un mot de passe robuste pour terminer la récupération.
          </p>
        </div>

        <div className="bloc-principal stack-lg">
          <div className="groupe-champ">
            <label htmlFor="token">Jeton de réinitialisation</label>
            <input id="token" className="champ" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>

          <div className="groupe-champ">
            <label htmlFor="motdepasse">Nouveau mot de passe</label>
            <input
              id="motdepasse"
              type="password"
              className="champ"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
            />
          </div>

          <Button onClick={reset} disabled={loading || !token || !mdp} fullWidth>
            {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
          </Button>

          {message ? <div className="message message-info">{message}</div> : null}
          {erreur ? <div className="message message-erreur">{erreur}</div> : null}
        </div>
      </div>
    </AuthShell>
  );
}
