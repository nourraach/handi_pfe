"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TableauDemandesAdmin } from "@/components/tableau-demandes-admin";
import { UtilisateurConnecte } from "@/types/api";

export default function DemandesEnAttentePage() {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState<UtilisateurConnecte | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const utilisateurStr = localStorage.getItem("utilisateur_connecte");
    const token = localStorage.getItem("token_auth");

    if (!utilisateurStr || !token) {
      router.push("/connexion");
      return;
    }

    const utilisateurData = JSON.parse(utilisateurStr) as UtilisateurConnecte;

    if (utilisateurData.role !== "admin") {
      alert("Access denied. This page is reserved for administrators.");
      router.push("/");
      return;
    }

    setUtilisateur(utilisateurData);
    setChargement(false);
  }, [router]);

  if (chargement) {
    return (
      <main className="page-centree section-page">
        <p>Checking permissions...</p>
      </main>
    );
  }

  if (!utilisateur) {
    return null;
  }

  return (
    <main className="page-centree section-page">
      <header className="entete-page">
        <div>
          <p className="badge">Administration</p>
          <h1 style={{ margin: 0 }}>Pending requests</h1>
          <p className="texte-secondaire">
            Welcome back, {utilisateur.nom}. Review and approve new registration requests from this queue.
          </p>
        </div>
        <button
          className="bouton-secondaire"
          onClick={() => {
            localStorage.removeItem("token_auth");
            localStorage.removeItem("utilisateur_connecte");
            router.push("/connexion");
          }}
        >
          Sign out
        </button>
      </header>
      <TableauDemandesAdmin />
    </main>
  );
}
