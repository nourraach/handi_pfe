"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { DemandeEnAttente, ReponseApi } from "@/types/api";

interface LigneDetail {
  label: string;
  value: string;
}

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
      profil_candidat: { competences: ["JavaScript", "Support client"], experience: "2 ans" },
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
      profil_entreprise: { secteur: "Telecom", taille: "50-200", contact_rh: "Marie Martin" },
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
    candidat: "Candidat",
    entreprise: "Entreprise",
    admin: "Administrateur",
    inspecteur: "Inspecteur",
    aneti: "ANETI",
  };

  return labels[role] ?? role;
}

function getStatusLabel(statut: string) {
  const labels: Record<string, string> = {
    en_attente: "En attente",
    actif: "Actif",
    inactif: "Inactif",
    suspendu: "Suspendu",
    refuse: "Refusé",
  };

  return labels[statut] ?? statut;
}

function formaterDate(valeur: string) {
  if (!valeur) return "-";
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return valeur;
  return new Intl.DateTimeFormat("fr-TN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function normaliserCle(cle: string) {
  return cle
    .replaceAll(".", " > ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (caractere) => caractere.toUpperCase());
}

function transformerValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "-";
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  if (typeof valeur === "number") return String(valeur);
  if (typeof valeur === "string") return valeur.trim() || "-";
  if (Array.isArray(valeur)) {
    const tableau = valeur
      .map((item) => (typeof item === "string" || typeof item === "number" ? String(item) : JSON.stringify(item)))
      .filter(Boolean);
    return tableau.length > 0 ? tableau.join(", ") : "-";
  }
  return JSON.stringify(valeur);
}

function aplatirObjet(objet: Record<string, unknown>, prefixe = ""): LigneDetail[] {
  const lignes: LigneDetail[] = [];

  Object.entries(objet).forEach(([cle, valeur]) => {
    const cleComposee = prefixe ? `${prefixe}.${cle}` : cle;

    if (valeur && typeof valeur === "object" && !Array.isArray(valeur)) {
      lignes.push(...aplatirObjet(valeur as Record<string, unknown>, cleComposee));
      return;
    }

    lignes.push({
      label: normaliserCle(cleComposee),
      value: transformerValeur(valeur),
    });
  });

  return lignes;
}

function lireChamp(objet: Record<string, unknown> | null | undefined, cle: string) {
  if (!objet) return "-";
  return transformerValeur(objet[cle]);
}

function construireDetailsEntreprise(demande: DemandeEnAttente) {
  const profil =
    demande.profil_entreprise && typeof demande.profil_entreprise === "object"
      ? demande.profil_entreprise
      : null;

  return [
    { label: "Id", value: lireChamp(profil, "id") },
    { label: "Id Utilisateur", value: demande.id_utilisateur || lireChamp(profil, "id_utilisateur") },
    { label: "Nom Entreprise", value: lireChamp(profil, "nom_entreprise") },
    { label: "Patente", value: lireChamp(profil, "patente") },
    { label: "Rne", value: lireChamp(profil, "rne") },
    { label: "Statut Validation", value: lireChamp(profil, "statut_validation") },
    { label: "Profil Publique", value: lireChamp(profil, "profil_publique") },
    { label: "Url Site", value: lireChamp(profil, "url_site") },
    { label: "Date Fondation", value: lireChamp(profil, "date_fondation") },
    { label: "Description", value: lireChamp(profil, "description") },
    { label: "Nbr Employe", value: lireChamp(profil, "nbr_employe") },
    { label: "Nbr Employe Handicape", value: lireChamp(profil, "nbr_employe_handicape") },
  ];
}

function construireDetailsDemande(demande: DemandeEnAttente) {
  const infosGenerales: LigneDetail[] = [
    { label: "Nom", value: demande.nom || "-" },
    { label: "Email", value: demande.email || "-" },
    { label: "Téléphone", value: demande.telephone || "-" },
    { label: "Adresse", value: demande.addresse || "-" },
    { label: "Rôle", value: getRoleLabel(demande.role) },
    { label: "Statut", value: getStatusLabel(demande.statut) },
    { label: "Créé le", value: formaterDate(demande.created_at) },
  ];

  const profilCandidat =
    demande.profil_candidat && typeof demande.profil_candidat === "object"
      ? aplatirObjet(demande.profil_candidat)
      : [];
  const profilEntreprise = demande.role === "entreprise" ? construireDetailsEntreprise(demande) : [];

  return { infosGenerales, profilCandidat, profilEntreprise };
}

export function TableauDemandesAdmin() {
  const [demandes, setDemandes] = useState<DemandeEnAttente[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [demandeOuverteId, setDemandeOuverteId] = useState<string | null>(null);
  const [demandeRefus, setDemandeRefus] = useState<DemandeEnAttente | null>(null);
  const [motifRefus, setMotifRefus] = useState("");
  const [soumissionRefus, setSoumissionRefus] = useState(false);

  const demandeOuverte = useMemo(
    () => demandes.find((demande) => demande.id_utilisateur === demandeOuverteId) ?? null,
    [demandes, demandeOuverteId],
  );

  const chargerDemandes = async () => {
    setChargement(true);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      if (!token) {
        throw new Error("Connectez-vous avec un compte administrateur pour charger les demandes en attente.");
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
          setErreur("Format de données invalide. Affichage des données de démonstration.");
          const fallback = lireDemandesLocales();
          setDemandes(fallback);
          return;
        }

        setDemandes(demandesNormalisees);
        return;
      }

      if (reponse.status === 404) {
        setErreur("L'API backend n'est pas encore disponible. Affichage des données de démonstration.");
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

      const resultat = await reponse.json().catch(() => ({ message: "Erreur inconnue." }));
      throw new Error((resultat as { message?: string }).message ?? "Impossible de charger les demandes en attente.");
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes("Sign in")) {
        setErreur(cause.message);
      } else {
        setErreur("Le backend est indisponible. Le mode hors ligne est activé.");
        setDemandes(lireDemandesLocales());
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    void chargerDemandes();
  }, []);

  const agir = async (id_utilisateur: string, action: "approuver" | "refuser", motif?: string) => {
    if (!id_utilisateur) {
      setErreur("Identifiant utilisateur manquant.");
      return;
    }

    try {
      const token = localStorage.getItem("token_auth");
      if (!token) {
        throw new Error("Jeton administrateur manquant.");
      }

      const corps = action === "refuser" ? JSON.stringify({ motif_refus: motif ?? "" }) : undefined;
      const reponse = await fetch(construireUrlApi(`/api/admin/${action}/${id_utilisateur}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(action === "refuser" ? { "Content-Type": "application/json" } : {}),
        },
        body: corps,
      });

      if (reponse.ok) {
        const resultat = await reponse.json().catch(() => ({}));
        setMessage(
          (resultat as { message?: string }).message ??
            (action === "approuver" ? "Request approved successfully." : "Request rejected successfully."),
        );
        setDemandeRefus(null);
        setMotifRefus("");
        setDemandeOuverteId(null);
        await chargerDemandes();
        return;
      }

      if (reponse.status === 404) {
        const demandesLocales = lireDemandesLocales().filter((item) => item.id_utilisateur !== id_utilisateur);
        ecrireDemandesLocales(demandesLocales);
        setMessage(
          action === "approuver"
            ? "Demande approuvée avec succès. (Mode local)"
            : "Demande refusée avec succès. (Mode local)",
        );
        setDemandeRefus(null);
        setMotifRefus("");
        setDemandeOuverteId(null);
        await chargerDemandes();
        return;
      }

      const resultat = await reponse.json().catch(() => ({ message: "Erreur inconnue." }));
      throw new Error((resultat as { message?: string }).message ?? "Cette action n'a pas pu être terminée.");
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes("token")) {
        setErreur(cause.message);
      } else {
        const demandesLocales = lireDemandesLocales().filter((item) => item.id_utilisateur !== id_utilisateur);
        ecrireDemandesLocales(demandesLocales);
        setMessage(
          action === "approuver"
            ? "Demande approuvée avec succès. (Mode hors ligne)"
            : "Demande refusée avec succès. (Mode hors ligne)",
        );
        setDemandeRefus(null);
        setMotifRefus("");
        setDemandeOuverteId(null);
        await chargerDemandes();
      }
    }
  };

  const confirmerRefus = async () => {
    if (!demandeRefus) return;
    const motifNormalise = motifRefus.trim();
    if (!motifNormalise) {
      setErreur("Veuillez saisir un motif de refus.");
      return;
    }
    setSoumissionRefus(true);
    setErreur(null);
    try {
      await agir(demandeRefus.id_utilisateur, "refuser", motifNormalise);
    } finally {
      setSoumissionRefus(false);
    }
  };

  if (chargement) {
    return <p className="message message-neutre">Chargement des demandes en attente...</p>;
  }

  const details = demandeOuverte ? construireDetailsDemande(demandeOuverte) : null;

  return (
    <div className="carte bloc-principal">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <p className="texte-secondaire" style={{ margin: 0 }}>
          Examinez chaque demande en attente et validez-la seulement après vérification complète des informations candidat ou entreprise.
        </p>
      </div>

      {message ? <p className="message message-info">{message}</p> : null}
      {erreur ? <p className="message message-erreur">{erreur}</p> : null}

      <table className="tableau">
        <thead>
          <tr>
            <th>Name</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!Array.isArray(demandes) || demandes.length === 0 ? (
            <tr>
              <td colSpan={5}>{!Array.isArray(demandes) ? "Erreur : données invalides." : "Aucune demande en attente."}</td>
            </tr>
          ) : (
            demandes.map((demande) => {
              const estOuvert = demandeOuverteId === demande.id_utilisateur;
              return (
                <Fragment key={demande.id_utilisateur}>
                  <tr>
                    <td>
                      <strong>{demande.nom}</strong>
                      <div className="texte-secondaire">{demande.telephone}</div>
                    </td>
                    <td>{demande.email}</td>
                    <td>{getRoleLabel(demande.role)}</td>
                    <td>{getStatusLabel(demande.statut)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="bouton-secondaire"
                          onClick={() => setDemandeOuverteId(estOuvert ? null : demande.id_utilisateur)}
                          type="button"
                        >
                          {estOuvert ? "Masquer les détails" : "Voir les détails"}
                        </button>
                        <button className="bouton-primaire" onClick={() => void agir(demande.id_utilisateur, "approuver")} type="button">
                          Approuver
                        </button>
                        <button
                          className="bouton-danger"
                          onClick={() => {
                            setDemandeRefus(demande);
                            setMotifRefus("");
                            setErreur(null);
                          }}
                          type="button"
                        >
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                  {estOuvert && details ? (
                    <tr>
                      <td colSpan={5} style={{ background: "#fcfbff" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
                          <div style={{ border: "1px solid #e5dcfb", borderRadius: 10, padding: 10 }}>
                            <h4 style={{ margin: "0 0 6px 0" }}>Informations générales</h4>
                            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.55 }}>
                              {details.infosGenerales.map((item) => (
                                <li key={item.label}>
                                  <strong>{item.label}:</strong> {item.value}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {details.profilCandidat.length > 0 ? (
                            <div style={{ border: "1px solid #e5dcfb", borderRadius: 10, padding: 10 }}>
                              <h4 style={{ margin: "0 0 6px 0" }}>Profil candidat</h4>
                              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.55 }}>
                                {details.profilCandidat.map((item) => (
                                  <li key={`c-${item.label}`}>
                                    <strong>{item.label}:</strong> {item.value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {details.profilEntreprise.length > 0 ? (
                            <div style={{ border: "1px solid #e5dcfb", borderRadius: 10, padding: 10 }}>
                              <h4 style={{ margin: "0 0 6px 0" }}>Demande entreprise</h4>
                              <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.55 }}>
                                {details.profilEntreprise.map((item) => (
                                  <li key={`e-${item.label}`}>
                                    <strong>{item.label}:</strong> {item.value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {demandeRefus ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 2000,
            padding: 20,
          }}
        >
          <div style={{ width: "min(620px, 100%)", background: "#ffffff", borderRadius: 14, padding: 16, boxShadow: "0 20px 50px rgba(15, 23, 42, 0.3)" }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Reject request</h3>
            <p className="texte-secondaire" style={{ marginTop: 0 }}>
              The reason below will be sent by email to {demandeRefus.email}.
            </p>

            <label htmlFor="motif-refus" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Motif de refus
            </label>
            <textarea
              id="motif-refus"
              value={motifRefus}
              onChange={(event) => setMotifRefus(event.target.value)}
              placeholder="Exemple: dossier incomplet, informations incoherentes, pieces manquantes..."
              style={{
                width: "100%",
                minHeight: 120,
                borderRadius: 10,
                border: "1px solid #d8c9fb",
                padding: 10,
                fontSize: 14,
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="bouton-secondaire"
                onClick={() => {
                  if (soumissionRefus) return;
                  setDemandeRefus(null);
                  setMotifRefus("");
                }}
              >
                Cancel
              </button>
              <button type="button" className="bouton-danger" onClick={() => void confirmerRefus()} disabled={soumissionRefus}>
                {soumissionRefus ? "Sending..." : "Reject and send email"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
