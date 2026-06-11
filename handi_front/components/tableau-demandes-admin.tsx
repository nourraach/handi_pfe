"use client";

import { useEffect, useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { DemandeEnAttente, ReponseApi } from "@/types/api";

function lireDemandesLocales() {
  return JSON.parse(localStorage.getItem("demandes_test") || "[]") as DemandeEnAttente[];
}

function ecrireDemandesLocales(demandes: DemandeEnAttente[]) {
  localStorage.setItem("demandes_test", JSON.stringify(demandes));
}

function creerDemandesParDefaut(): DemandeEnAttente[] {
  return [
    {
      id_utilisateur: "test_1",
      nom: "Jean Dupont",
      email: "jean.dupont@test.com",
      role: "candidat",
      statut: "en_attente",
      telephone: "0123456789",
      addresse: "123 Test Street, Paris",
      profil_candidat: {} as any,
      profil_entreprise: null,
      created_at: "2024-03-15T10:00:00Z",
    },
    {
      id_utilisateur: "test_2",
      nom: "Marie Martin",
      email: "marie.martin@test.com",
      role: "entreprise",
      statut: "en_attente",
      telephone: "0987654321",
      addresse: "456 Demo Avenue, Lyon",
      profil_candidat: null,
      profil_entreprise: {} as any,
      created_at: "2024-03-16T14:30:00Z",
    },
  ];
}

function normaliserDemandes(resultat: ReponseApi<DemandeEnAttente[]> | Record<string, unknown>) {
  const donnees = "donnees" in resultat ? resultat.donnees : undefined;

  if (Array.isArray(donnees)) {
    return donnees as DemandeEnAttente[];
  }

  if (donnees && typeof donnees === "object") {
    const objet = donnees as Record<string, unknown>;
    if (Array.isArray(objet.demandes)) return objet.demandes as DemandeEnAttente[];
    if (Array.isArray(objet.data)) return objet.data as DemandeEnAttente[];

    const premierTableau = Object.values(objet).find(Array.isArray);
    if (premierTableau) {
      return premierTableau as DemandeEnAttente[];
    }
  }

  return null;
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    candidat: "Candidate",
    entreprise: "Company",
    admin: "Admin",
    inspecteur: "Inspector",
    aneti: "ANETI",
  };

  return labels[role] ?? role;
}

function getStatusLabel(statut: string) {
  const labels: Record<string, string> = {
    en_attente: "Pending",
    actif: "Active",
    inactif: "Inactive",
    suspendu: "Suspended",
  };

  return labels[statut] ?? statut;
}

export function TableauDemandesAdmin() {
  const [demandes, setDemandes] = useState<DemandeEnAttente[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const chargerDemandes = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      if (!token) {
        throw new Error("Sign in with an admin account to load pending requests.");
      }

      const reponse = await fetch(construireUrlApi("/api/admin/demandes-en-attente"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (reponse.ok) {
        const resultat = (await reponse.json()) as ReponseApi<DemandeEnAttente[]> | Record<string, unknown>;
        const demandesNormalisees = normaliserDemandes(resultat);

        if (!demandesNormalisees) {
          setErreur("Invalid data format. Showing test data instead.");
          const fallback = lireDemandesLocales();
          setDemandes(fallback);
          return;
        }

        setDemandes(demandesNormalisees);
        return;
      }

      if (reponse.status === 404) {
        setErreur("The backend API is not available yet. Showing test data instead.");
        const fallback = lireDemandesLocales();

        if (fallback.length === 0) {
          const donneesParDefaut = creerDemandesParDefaut();
          ecrireDemandesLocales(donneesParDefaut);
          setDemandes(donneesParDefaut);
        } else {
          setDemandes(fallback);
        }
        return;
      }

      const resultat = await reponse.json().catch(() => ({ message: "Unknown error." }));
      throw new Error((resultat as { message?: string }).message ?? "Unable to load pending requests.");
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes("Sign in")) {
        setErreur(cause.message);
      } else {
        setErreur("The backend is unavailable. Offline mode is active.");
        setDemandes(lireDemandesLocales());
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    void chargerDemandes();
  }, []);

  const agir = async (id_utilisateur: string, action: "approuver" | "refuser") => {
    if (!id_utilisateur) {
      setErreur("Missing user identifier.");
      return;
    }

    try {
      const token = localStorage.getItem("token_auth");
      if (!token) {
        throw new Error("Missing admin token.");
      }

      const reponse = await fetch(construireUrlApi(`/api/admin/${action}/${id_utilisateur}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (reponse.ok) {
        const resultat = await reponse.json().catch(() => ({}));
        setMessage(
          (resultat as { message?: string }).message ??
            (action === "approuver" ? "Request approved successfully." : "Request rejected successfully."),
        );
        await chargerDemandes();
        return;
      }

      if (reponse.status === 404) {
        const demandesLocales = lireDemandesLocales().filter((item) => item.id_utilisateur !== id_utilisateur);
        ecrireDemandesLocales(demandesLocales);
        setMessage(
          action === "approuver"
            ? "Request approved successfully. (Local mode)"
            : "Request rejected successfully. (Local mode)",
        );
        await chargerDemandes();
        return;
      }

      const resultat = await reponse.json().catch(() => ({ message: "Unknown error." }));
      throw new Error((resultat as { message?: string }).message ?? "This action could not be completed.");
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes("token")) {
        setErreur(cause.message);
      } else {
        const demandesLocales = lireDemandesLocales().filter((item) => item.id_utilisateur !== id_utilisateur);
        ecrireDemandesLocales(demandesLocales);
        setMessage(
          action === "approuver"
            ? "Request approved successfully. (Offline mode)"
            : "Request rejected successfully. (Offline mode)",
        );
        await chargerDemandes();
      }
    }
  };

  if (chargement) {
    return <p className="message message-neutre">Loading pending requests...</p>;
  }

  return (
    <div className="carte bloc-principal">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <p className="texte-secondaire" style={{ margin: 0 }}>
          This list shows accounts currently marked with the <strong>pending</strong> status.
        </p>
        <button className="bouton-secondaire" onClick={() => void chargerDemandes()} type="button">
          Refresh
        </button>
      </div>

      {message ? <p className="message message-info">{message}</p> : null}
      {erreur ? <p className="message message-erreur">{erreur}</p> : null}

      <table className="tableau">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!Array.isArray(demandes) || demandes.length === 0 ? (
            <tr>
              <td colSpan={5}>{!Array.isArray(demandes) ? "Error: invalid data." : "No pending requests."}</td>
            </tr>
          ) : (
            demandes.map((demande) => (
              <tr key={demande.id_utilisateur}>
                <td>
                  <strong>{demande.nom}</strong>
                  <div className="texte-secondaire">{demande.telephone}</div>
                </td>
                <td>{demande.email}</td>
                <td>{getRoleLabel(demande.role)}</td>
                <td>{getStatusLabel(demande.statut)}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="bouton-primaire" onClick={() => void agir(demande.id_utilisateur, "approuver")} type="button">
                      Approve
                    </button>
                    <button className="bouton-danger" onClick={() => void agir(demande.id_utilisateur, "refuser")} type="button">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
