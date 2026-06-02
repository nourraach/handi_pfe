"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { construireUrlApi } from "@/lib/config";
import { ReponseApi, UtilisateurConnecte } from "@/types/api";

export function FormulaireConnexion() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const soumettre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChargement(true);
    setMessage(null);
    setErreur(null);

    try {
      const reponse = await fetch(construireUrlApi("/api/auth/connexion"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, mdp }),
      });

      const resultat = (await reponse.json()) as ReponseApi<{
        token?: string;
        utilisateur?: UtilisateurConnecte;
      }>;

      if (!reponse.ok) {
        throw new Error(resultat.message ?? t("login.signInFailed"));
      }

      if (typeof window !== "undefined" && resultat.donnees?.token) {
        localStorage.setItem("token_auth", resultat.donnees.token);
        localStorage.setItem("utilisateur_connecte", JSON.stringify(resultat.donnees.utilisateur ?? null));

        const role = resultat.donnees.utilisateur?.role;
        const destination = role === "inspecteur" || role === "aneti" ? "/supervision" : "/home";

        setMessage(t("login.signInSuccess"));
        router.push(destination);
        return;
      }
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : t("login.unknownError"));
    } finally {
      setChargement(false);
    }
  };

  return (
    <form className="bloc-principal" onSubmit={soumettre}>
      <div className="grille-formulaire" style={{ gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
        <div className="groupe-champ">
          <label htmlFor="email">{t("login.email")}</label>
          <input
            id="email"
            className="champ"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="groupe-champ">
          <label htmlFor="mdp">{t("login.password")}</label>
          <input
            id="mdp"
            className="champ"
            type="password"
            value={mdp}
            onChange={(event) => setMdp(event.target.value)}
            required
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <button className="bouton-primaire ui-button-full" disabled={chargement} type="submit">
          {chargement ? t("login.signingIn") : t("login.signInButton")}
        </button>
      </div>
      {message ? <p className="message message-info">{message}</p> : null}
      {erreur ? <p className="message message-erreur">{erreur}</p> : null}
    </form>
  );
}

