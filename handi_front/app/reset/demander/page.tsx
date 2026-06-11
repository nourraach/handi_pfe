"use client";

import { useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/ui/layout";

export default function DemanderResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = async () => {
    setLoading(true);
    setMessage(null);
    setErreur(null);

    try {
      const res = await fetch(construireUrlApi("/api/auth/demander-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setMessage(data.donnees?.token ? `Token demo: ${data.donnees.token}` : "If the account exists, a reset email or SMS has been sent.");
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Recovery flow"
      title="Request a password reset in the same clean visual system."
      description="A simple recovery step with the same buttons, spacing, and typography used throughout the updated platform."
    >
      <div className="stack-lg">
        <div>
          <h2 className="page-title page-title-sm">Reset your password</h2>
          <p className="page-description" style={{ margin: "12px 0 0" }}>
            Enter your email and we&apos;ll send a reset link or code if the account exists.
          </p>
        </div>

        <div className="bloc-principal stack-lg">
          <div className="groupe-champ">
            <label htmlFor="email-reset">Email</label>
            <input
              id="email-reset"
              type="email"
              className="champ"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button onClick={envoyer} disabled={loading || !email} fullWidth>
            {loading ? "Sending..." : "Send reset link"}
          </Button>

          {message ? <div className="message message-info">{message}</div> : null}
          {erreur ? <div className="message message-erreur">{erreur}</div> : null}
        </div>
      </div>
    </AuthShell>
  );
}
