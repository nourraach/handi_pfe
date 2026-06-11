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
      setMessage("Your password has been reset. You can sign in now.");
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Password reset"
      title="Choose a new password inside the same shared design system."
      description="Reset your access without leaving the clean SaaS-style experience now used across the whole product."
    >
      <div className="stack-lg">
        <div>
          <h2 className="page-title page-title-sm">Create a new password</h2>
          <p className="page-description" style={{ margin: "12px 0 0" }}>
            Paste your reset token and choose a strong password to finish the recovery flow.
          </p>
        </div>

        <div className="bloc-principal stack-lg">
          <div className="groupe-champ">
            <label htmlFor="token">Reset token</label>
            <input id="token" className="champ" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>

          <div className="groupe-champ">
            <label htmlFor="motdepasse">New password</label>
            <input
              id="motdepasse"
              type="password"
              className="champ"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
            />
          </div>

          <Button onClick={reset} disabled={loading || !token || !mdp} fullWidth>
            {loading ? "Saving..." : "Reset password"}
          </Button>

          {message ? <div className="message message-info">{message}</div> : null}
          {erreur ? <div className="message message-erreur">{erreur}</div> : null}
        </div>
      </div>
    </AuthShell>
  );
}
