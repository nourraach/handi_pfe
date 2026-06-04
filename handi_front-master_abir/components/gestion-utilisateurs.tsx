"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { TUNISIAN_GOVERNORATES, TUNISIAN_GOVERNORATE_OPTIONS } from "@/lib/tunisia-governorates";
import { ChevronDown, Mail, MapPin, Phone, User, UserPlus, UserRoundCog, X } from "lucide-react";

interface Utilisateur {
  id_utilisateur: string;
  nom: string;
  email: string;
  role: string;
  statut: string;
  telephone?: string;
  addresse?: string;
  region?: string;
  gouvernorat?: string;
  delegation?: string;
  created_at: string;
  updated_at: string;
}

interface FiltresUtilisateurs {
  role: string;
  statut: string;
}

const ROLE_STYLES: Record<string, string> = {
  admin: "border border-[rgba(138,99,210,0.22)] bg-[rgba(45,23,77,0.52)] text-[#e4d8f8]",
  entreprise: "border border-[rgba(138,99,210,0.18)] bg-[rgba(33,20,56,0.52)] text-[#d7c6f3]",
  candidat: "border border-[rgba(138,99,210,0.18)] bg-[rgba(40,24,66,0.52)] text-[#d9c9f4]",
  inspecteur: "border border-[rgba(138,99,210,0.26)] bg-[rgba(52,27,84,0.62)] text-[#eadfff]",
  aneti: "border border-[rgba(138,99,210,0.2)] bg-[rgba(36,22,60,0.58)] text-[#d8caf2]",
};

const STATUS_STYLES: Record<string, string> = {
  actif: "border border-[rgba(138,99,210,0.18)] bg-[rgba(35,22,58,0.56)] text-[#dfd2f7]",
  inactif: "border border-[rgba(255,255,255,0.08)] bg-[rgba(18,13,31,0.72)] text-[#b5acc8]",
  en_attente: "border border-[rgba(138,99,210,0.22)] bg-[rgba(52,27,84,0.6)] text-[#eadfff]",
  suspendu: "border border-[rgba(109,61,187,0.24)] bg-[rgba(44,23,72,0.66)] text-[#d9c5fb]",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  entreprise: "Entreprise",
  candidat: "Candidat",
  inspecteur: "Inspecteur",
  aneti: "ANETI",
};

const STATUS_LABELS: Record<string, string> = {
  actif: "Actif",
  inactif: "Inactif",
  en_attente: "En attente",
  suspendu: "Suspendu",
};

export function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [utilisateursFiltres, setUtilisateursFiltres] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtres, setFiltres] = useState<FiltresUtilisateurs>({
    role: "",
    statut: "",
  });
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<Utilisateur | null>(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [modeCreation, setModeCreation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUtilisateurs, setTotalUtilisateurs] = useState(0);
  const utilisateursParPage = 10;

  const chargerUtilisateurs = useCallback(async () => {
    setChargement(true);

    try {
      const token = localStorage.getItem("token_auth");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: utilisateursParPage.toString(),
        ...(filtres.role && { role: filtres.role }),
        ...(filtres.statut && { statut: filtres.statut }),
      });

      const response = await fetch(construireUrlApi(`/api/admin/utilisateurs?${params}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUtilisateurs(data.donnees.utilisateurs || []);
        setTotalPages(data.donnees.pagination?.totalPages || data.donnees.totalPages || 1);
        setTotalUtilisateurs(data.donnees.pagination?.total || data.donnees.total || 0);
        setErreur(null);
      } else {
        setErreur("Impossible de charger les utilisateurs.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    } finally {
      setChargement(false);
    }
  }, [filtres, page]);

  const appliquerRecherche = useCallback(() => {
    if (!recherche.trim()) {
      setUtilisateursFiltres(utilisateurs);
      return;
    }

    const terme = recherche.toLowerCase();
    const resultats = utilisateurs.filter((user) => {
      const roleLabel = getRoleLabel(user.role).toLowerCase();

      return (
        user.nom.toLowerCase().includes(terme) ||
        user.email.toLowerCase().includes(terme) ||
        user.role.toLowerCase().includes(terme) ||
        roleLabel.includes(terme)
      );
    });
    setUtilisateursFiltres(resultats);
  }, [recherche, utilisateurs]);

  useEffect(() => {
    void chargerUtilisateurs();
  }, [chargerUtilisateurs]);

  useEffect(() => {
    appliquerRecherche();
  }, [appliquerRecherche]);

  const creerUtilisateur = async (nouvelUtilisateur: Partial<Utilisateur>) => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi("/api/admin/utilisateurs"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nouvelUtilisateur),
      });

      const resultat = await response.json();

      if (response.ok) {
        setMessage(resultat.message || "Utilisateur cree avec succes.");
        setErreur(null);
        setModeCreation(false);
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Impossible de creer l'utilisateur.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    }
  };

  const modifierUtilisateur = async (utilisateurModifie: Utilisateur) => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${utilisateurModifie.id_utilisateur}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(utilisateurModifie),
      });

      const resultat = await response.json();

      if (response.ok) {
        setMessage(resultat.message || "Utilisateur mis a jour avec succes.");
        setErreur(null);
        setModeEdition(false);
        setUtilisateurSelectionne(null);
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Impossible de mettre a jour l'utilisateur.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    }
  };

  const supprimerUtilisateur = async (id: string) => {
    if (!confirm("Voulez-vous vraiment archiver cet utilisateur ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultat = await response.json();

      if (response.ok) {
        setMessage("Utilisateur archive avec succes.");
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Impossible d'archiver l'utilisateur.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    }
  };

  const changerStatut = async (id: string, nouveauStatut: string) => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${id}/statut`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      });

      const resultat = await response.json();

      if (response.ok) {
        setMessage(`Statut mis a jour : ${getStatusLabel(nouveauStatut)}.`);
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Impossible de modifier le statut.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    }
  };

  const resetMotDePasse = async (id: string) => {
    if (!confirm("Voulez-vous vraiment reinitialiser le mot de passe ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/${id}/reset-password`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultat = await response.json();

      if (response.ok) {
        setMessage(`Mot de passe reinitialise. Nouveau mot de passe : ${resultat.donnees.nouveauMotDePasse}`);
      } else {
        setErreur(resultat.message || "Impossible de reinitialiser le mot de passe.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    }
  };

  const exporterUtilisateurs = async () => {
    try {
      const token = localStorage.getItem("token_auth");
      const params = new URLSearchParams({
        ...(filtres.role && { role: filtres.role }),
        ...(filtres.statut && { statut: filtres.statut }),
      });

      const response = await fetch(construireUrlApi(`/api/admin/utilisateurs/export?${params}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
        setMessage("Export termine avec succes.");
      } else {
        setErreur("Impossible d'exporter les utilisateurs.");
      }
    } catch {
      setErreur("Erreur de connexion.");
    }
  };

  const getStatutBadge = (statut: string) => STATUS_STYLES[statut] || "bg-gray-100 text-gray-800";
  const getRoleBadge = (role: string) => ROLE_STYLES[role] || "bg-gray-100 text-gray-800";
  const getStatusLabel = (statut: string) => STATUS_LABELS[statut] || statut;
  const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

  const utilisateursAffiches = recherche ? utilisateursFiltres : utilisateurs;
  const filtresActifs = Boolean(recherche.trim() || filtres.role || filtres.statut);
  const usersVisibleCount = utilisateursAffiches.length;
  const usersLoadedCount = utilisateurs.length;
  const usersActiveCount = utilisateursAffiches.filter((user) => user.statut === "actif").length;
  const usersPendingCount = utilisateursAffiches.filter((user) => user.statut === "en_attente").length;
  const usersSuspendedCount = utilisateursAffiches.filter((user) => user.statut === "suspendu").length;
  const totalDisplayCount = totalUtilisateurs || usersLoadedCount || usersVisibleCount;

  return (
    <div className="admin-users-manager space-y-6">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {message}
          <button onClick={() => setMessage(null)} className="float-right text-green-600 hover:text-green-800">
            x
          </button>
        </div>
      )}

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {erreur}
          <button onClick={() => setErreur(null)} className="float-right text-red-600 hover:text-red-800">
            x
          </button>
        </div>
      )}

      <div className="admin-users-toolbar-shell rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gestion des utilisateurs</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setModeCreation(true)}
              className="inline-flex h-10 items-center rounded-full bg-purple-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-900"
            >
              Nouvel utilisateur
            </button>
            <button
              onClick={exporterUtilisateurs}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-purple-200 hover:text-purple-950"
            >
              Exporter
            </button>
            {filtresActifs ? (
              <button
                onClick={() => {
                  setRecherche("");
                  setFiltres({ role: "", statut: "" });
                  setPage(1);
                }}
                className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
              >
                Reinitialiser les filtres
              </button>
            ) : null}
          </div>
        </div>

        <div className="admin-users-toolbar-shell__filters mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_repeat(2,minmax(140px,1fr))]">
          <div className="admin-users-toolbar-shell__filter rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recherche</label>
            <input
              type="text"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Nom, e-mail, role..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="admin-users-toolbar-shell__filter rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Rôle</label>
            <select
              value={filtres.role}
              onChange={(event) => setFiltres((prev) => ({ ...prev, role: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            >
              <option value="">Tous les roles</option>
              <option value="candidat">Candidat</option>
              <option value="entreprise">Entreprise</option>
              <option value="admin">Admin</option>
              <option value="inspecteur">Inspecteur</option>
              <option value="aneti">ANETI</option>
            </select>
          </div>

          <div className="admin-users-toolbar-shell__filter rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Statut</label>
            <select
              value={filtres.statut}
              onChange={(event) => setFiltres((prev) => ({ ...prev, statut: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="en_attente">En attente</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>
        </div>

        <div className="admin-users-toolbar-shell__stats mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-white">
            Visibles {usersVisibleCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Charges {usersLoadedCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Actifs {usersActiveCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            En attente {usersPendingCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            Suspendus {usersSuspendedCount}
          </span>
          <span className="ml-auto text-xs font-medium text-slate-500">
            Total dans la plateforme : {totalDisplayCount}
          </span>
        </div>
      </div>

      <div className="admin-users-table-shell bg-white rounded-lg shadow-md overflow-hidden">

        {chargement ? (
          <div className="admin-users-loading p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-users-table min-w-full divide-y divide-gray-200">
              <thead className="admin-users-table-head bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cree le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="admin-users-table-body bg-white divide-y divide-gray-200">
                {utilisateursAffiches.map((utilisateur) => (
                  <tr key={utilisateur.id_utilisateur} className="admin-users-table-row hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <Link
                          href={`/admin/utilisateurs/${utilisateur.id_utilisateur}`}
                          className="text-sm font-medium text-[#4a154b] transition hover:text-[#5f1b60] hover:underline"
                        >
                          {utilisateur.nom}
                        </Link>
                        <div className="text-sm text-gray-500">{utilisateur.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(utilisateur.role)}`}>
                        {getRoleLabel(utilisateur.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadge(utilisateur.statut)}`}>
                        {getStatusLabel(utilisateur.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(utilisateur.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setUtilisateurSelectionne(utilisateur);
                          setModeEdition(true);
                        }}
                        className="inline-flex min-h-8 items-center rounded-md border border-[#d8caef] bg-[#f7f1ff] px-3 text-xs font-semibold text-[#4a154b] transition hover:border-[#bfa7e8] hover:bg-[#f0e6ff]"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => resetMotDePasse(utilisateur.id_utilisateur)}
                        className="inline-flex min-h-8 items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                      >
                        Reinitialiser le mot de passe
                      </button>
                      {utilisateur.statut === "actif" ? (
                        <button
                          onClick={() => changerStatut(utilisateur.id_utilisateur, "suspendu")}
                          className="inline-flex min-h-8 items-center rounded-md border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-800 transition hover:border-red-400 hover:bg-red-100"
                        >
                          Suspendre
                        </button>
                      ) : (
                        <button
                          onClick={() => changerStatut(utilisateur.id_utilisateur, "actif")}
                          className="inline-flex min-h-8 items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                        >
                          Activer
                        </button>
                      )}
                      <button
                        onClick={() => supprimerUtilisateur(utilisateur.id_utilisateur)}
                        className="inline-flex min-h-8 items-center rounded-md border border-orange-300 bg-orange-50 px-3 text-xs font-semibold text-orange-800 transition hover:border-orange-400 hover:bg-orange-100"
                      >
                        Archiver
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!recherche && totalPages > 1 && (
          <div className="admin-users-pagination px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} sur {totalPages} ({totalUtilisateurs} utilisateurs au total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Precedent
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {(modeCreation || modeEdition) && (
        <ModalUtilisateur
          utilisateur={utilisateurSelectionne}
          modeCreation={modeCreation}
          onSave={(utilisateur) => {
            if (modeCreation) {
              void creerUtilisateur(utilisateur);
              return;
            }

            if (!utilisateurSelectionne) {
              setErreur("Aucun utilisateur n'est actuellement selectionne pour la modification.");
              return;
            }

            void modifierUtilisateur({
              ...utilisateurSelectionne,
              ...utilisateur,
              id_utilisateur: utilisateurSelectionne.id_utilisateur,
            });
          }}
          onCancel={() => {
            setModeCreation(false);
            setModeEdition(false);
            setUtilisateurSelectionne(null);
          }}
        />
      )}
    </div>
  );
}

interface ModalUtilisateurProps {
  utilisateur: Utilisateur | null;
  modeCreation: boolean;
  onSave: (utilisateur: Partial<Utilisateur>) => void;
  onCancel: () => void;
}

function ModalUtilisateur({ utilisateur, modeCreation, onSave, onCancel }: ModalUtilisateurProps) {
  const [formData, setFormData] = useState({
    nom: utilisateur?.nom || "",
    email: utilisateur?.email || "",
    role: utilisateur?.role || "candidat",
    statut: utilisateur?.statut || "actif",
    telephone: utilisateur?.telephone || "",
    addresse: utilisateur?.addresse || "",
    gouvernorat: utilisateur?.gouvernorat || "",
    delegation: utilisateur?.delegation || utilisateur?.region || "",
  });

  const roleInterne = formData.role === "inspecteur";
  const roleInvitation = modeCreation && (formData.role === "inspecteur" || formData.role === "aneti");
  const delegationOptions =
    formData.gouvernorat && formData.gouvernorat in TUNISIAN_GOVERNORATES
      ? TUNISIAN_GOVERNORATES[formData.gouvernorat as keyof typeof TUNISIAN_GOVERNORATES]
      : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (roleInvitation) {
      const payload: Partial<Utilisateur> = { ...formData };
      delete payload.statut;
      onSave(payload);
      return;
    }
    onSave(formData);
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-[#ddd7ef] bg-white px-10 pr-4 text-[14px] text-[#1f173f] outline-none transition placeholder:text-[#7b7397] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed1f]";
  const selectClass =
    "h-11 w-full appearance-none rounded-xl border border-[#ddd7ef] bg-white px-10 pr-9 text-[14px] font-semibold text-[#1f173f] outline-none transition focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed1f]";

  return (
      <div
        className="admin-users-modal-backdrop fixed inset-0 z-[2200] flex items-center justify-center overflow-y-auto bg-[#1a122b]/45 p-4 backdrop-blur-[6px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-modal-title"
    >
      <div className="admin-users-modal-card flex max-h-[calc(100vh-2.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[16px] border border-[#ebe6f7] bg-white shadow-[0_28px_70px_rgba(31,18,49,0.24)]">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#efe6ff] text-[#6b35e6]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 id="admin-user-modal-title" className="text-[24px] font-semibold leading-[1.15] text-[#17113f]">
                {modeCreation ? "Creer un utilisateur" : "Modifier l'utilisateur"}
              </h3>
              <p className="mt-1 text-[16px] text-[#6b6488]">
                {modeCreation ? "Ajouter un nouvel utilisateur a la plateforme" : "Mettre a jour les informations de l'utilisateur"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#666083] transition hover:bg-[#f4efff]"
            aria-label="Fermer le formulaire utilisateur"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-5 border-t border-[#ebe6f7]" />

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-[#1e173e]">Nom</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(event) => setFormData((prev) => ({ ...prev, nom: event.target.value }))}
                    className={inputClass}
                    placeholder="Ex. Asma Bouazizi"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-[#1e173e]">E-mail</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                    className={inputClass}
                    placeholder="Ex. asma@handitalents.tn"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-[#1e173e]">Rôle</label>
                <div className="relative">
                  <UserRoundCog className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#6b35e6]" />
                  <select
                    value={formData.role}
                    onChange={(event) => {
                      const prochainRole = event.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        role: prochainRole,
                        ...(prochainRole === "inspecteur"
                          ? {}
                          : {
                              gouvernorat: "",
                              delegation: "",
                            }),
                      }));
                    }}
                    className={selectClass}
                  >
                    <option value="candidat">Candidat</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="admin">Admin</option>
                    <option value="inspecteur">Inspecteur</option>
                    <option value="aneti">ANETI</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                </div>
              </div>
            </div>

            {roleInvitation ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
                Le compte sera cree en attente d&apos;activation. Un email sera envoye pour definir le mot de passe et activer l&apos;acces.
              </div>
            ) : null}

            {roleInterne ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-[15px] font-semibold text-[#1e173e]">Gouvernorat</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                    <select
                      value={formData.gouvernorat}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          gouvernorat: event.target.value,
                          delegation: "",
                        }))
                      }
                      className={selectClass}
                      required={roleInterne}
                    >
                      <option value="">Selectionnez un gouvernorat</option>
                      {TUNISIAN_GOVERNORATE_OPTIONS.map((gouvernorat) => (
                        <option key={gouvernorat} value={gouvernorat}>
                          {gouvernorat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                  </div>
                </div>

                {formData.gouvernorat ? (
                  <div className="space-y-2">
                    <label className="block text-[15px] font-semibold text-[#1e173e]">Delegation</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                      <select
                        value={formData.delegation}
                        onChange={(event) => setFormData((prev) => ({ ...prev, delegation: event.target.value }))}
                        className={selectClass}
                        required={roleInterne}
                      >
                      <option value="">Selectionnez une delegation</option>
                        {delegationOptions.map((delegation) => (
                          <option key={delegation} value={delegation}>
                            {delegation}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                    </div>
                    <p className="text-xs text-slate-500">La delegation est obligatoire pour les comptes inspecteur.</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-[15px] font-semibold text-[#1e173e]">Telephone (optionnel)</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#5f587f]" />
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(event) => setFormData((prev) => ({ ...prev, telephone: event.target.value }))}
                      className={inputClass}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[15px] font-semibold text-[#1e173e]">Adresse (optionnelle)</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4.5 w-4.5 text-[#5f587f]" />
                    <textarea
                      value={formData.addresse}
                      onChange={(event) => setFormData((prev) => ({ ...prev, addresse: event.target.value }))}
                      rows={2}
                      className="w-full rounded-xl border border-[#ddd7ef] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1f173f] outline-none transition placeholder:text-[#7b7397] focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed1f]"
                      placeholder="Saisir l'adresse..."
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="admin-users-modal-footer flex flex-wrap justify-end gap-3 border-t border-[#ebe6f7] bg-white px-5 py-3.5">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#ddd7ef] bg-white px-6 text-[16px] font-semibold text-[#342b58] transition hover:bg-[#f8f5ff]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#3d0456] bg-[#3f005b] px-6 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(63,0,91,0.22)] transition hover:bg-[#320049]"
            >
              <UserPlus className="h-4 w-4" />
              {modeCreation ? "Creer l'utilisateur" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
