"use client";

import { useCallback, useEffect, useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { TUNISIAN_GOVERNORATES, TUNISIAN_GOVERNORATE_OPTIONS } from "@/lib/tunisia-governorates";

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
  dateDebut: string;
  dateFin: string;
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  entreprise: "bg-blue-100 text-blue-800",
  candidat: "bg-green-100 text-green-800",
  inspecteur: "bg-purple-100 text-purple-800",
  aneti: "bg-indigo-100 text-indigo-800",
};

const STATUS_STYLES: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  inactif: "bg-gray-100 text-gray-800",
  en_attente: "bg-yellow-100 text-yellow-800",
  suspendu: "bg-red-100 text-red-800",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  entreprise: "Company",
  candidat: "Candidate",
  inspecteur: "Inspector",
  aneti: "ANETI",
};

const STATUS_LABELS: Record<string, string> = {
  actif: "Active",
  inactif: "Inactive",
  en_attente: "Pending",
  suspendu: "Suspended",
};

export function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [utilisateursFiltres, setUtilisateursFiltres] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtres, setFiltres] = useState<FiltresUtilisateurs>({
    role: "",
    statut: "",
    dateDebut: "",
    dateFin: "",
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
        ...(filtres.dateDebut && { dateDebut: filtres.dateDebut }),
        ...(filtres.dateFin && { dateFin: filtres.dateFin }),
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
        setErreur("Unable to load users.");
      }
    } catch {
      setErreur("Connection error.");
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
        setMessage(resultat.message || "User created successfully.");
        setErreur(null);
        setModeCreation(false);
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Unable to create the user.");
      }
    } catch {
      setErreur("Connection error.");
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
        setMessage(resultat.message || "User updated successfully.");
        setErreur(null);
        setModeEdition(false);
        setUtilisateurSelectionne(null);
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Unable to update the user.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const supprimerUtilisateur = async (id: string) => {
    if (!confirm("Are you sure you want to archive this user?")) {
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
        setMessage("User archived successfully.");
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Unable to archive the user.");
      }
    } catch {
      setErreur("Connection error.");
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
        setMessage(`Status changed to "${getStatusLabel(nouveauStatut)}".`);
        void chargerUtilisateurs();
      } else {
        setErreur(resultat.message || "Unable to change the status.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const resetMotDePasse = async (id: string) => {
    if (!confirm("Are you sure you want to reset the password?")) {
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
        setMessage(`Password reset. New password: ${resultat.donnees.nouveauMotDePasse}`);
      } else {
        setErreur(resultat.message || "Unable to reset the password.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const exporterUtilisateurs = async () => {
    try {
      const token = localStorage.getItem("token_auth");
      const params = new URLSearchParams({
        ...(filtres.role && { role: filtres.role }),
        ...(filtres.statut && { statut: filtres.statut }),
        ...(filtres.dateDebut && { dateDebut: filtres.dateDebut }),
        ...(filtres.dateFin && { dateFin: filtres.dateFin }),
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
        anchor.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
        setMessage("Export completed successfully.");
      } else {
        setErreur("Unable to export users.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const getStatutBadge = (statut: string) => STATUS_STYLES[statut] || "bg-gray-100 text-gray-800";
  const getRoleBadge = (role: string) => ROLE_STYLES[role] || "bg-gray-100 text-gray-800";
  const getStatusLabel = (statut: string) => STATUS_LABELS[statut] || statut;
  const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

  const utilisateursAffiches = recherche ? utilisateursFiltres : utilisateurs;
  const filtresActifs = Boolean(recherche.trim() || filtres.role || filtres.statut || filtres.dateDebut || filtres.dateFin);
  const usersVisibleCount = utilisateursAffiches.length;
  const usersLoadedCount = utilisateurs.length;
  const usersListCount = filtresActifs ? usersVisibleCount : usersLoadedCount;
  const usersActiveCount = utilisateursAffiches.filter((user) => user.statut === "actif").length;
  const usersPendingCount = utilisateursAffiches.filter((user) => user.statut === "en_attente").length;
  const usersSuspendedCount = utilisateursAffiches.filter((user) => user.statut === "suspendu").length;
  const totalDisplayCount = totalUtilisateurs || usersLoadedCount || usersVisibleCount;

  return (
    <div className="space-y-6">
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

      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User governance</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Search and manage platform users</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setModeCreation(true)}
              className="inline-flex h-10 items-center rounded-full bg-purple-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-900"
            >
              New
            </button>
            <button
              onClick={exporterUtilisateurs}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-purple-200 hover:text-purple-950"
            >
              Export
            </button>
            {filtresActifs ? (
              <button
                onClick={() => {
                  setRecherche("");
                  setFiltres({ role: "", statut: "", dateDebut: "", dateFin: "" });
                  setPage(1);
                }}
                className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(140px,1fr))]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
            <input
              type="text"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Name, email, role..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Role</label>
            <select
              value={filtres.role}
              onChange={(event) => setFiltres((prev) => ({ ...prev, role: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            >
              <option value="">All roles</option>
              <option value="candidat">Candidate</option>
              <option value="entreprise">Company</option>
              <option value="admin">Admin</option>
              <option value="inspecteur">Inspector</option>
              <option value="aneti">ANETI</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</label>
            <select
              value={filtres.statut}
              onChange={(event) => setFiltres((prev) => ({ ...prev, statut: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            >
              <option value="">All statuses</option>
              <option value="actif">Active</option>
              <option value="inactif">Inactive</option>
              <option value="en_attente">Pending</option>
              <option value="suspendu">Suspended</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Start date</label>
            <input
              type="date"
              value={filtres.dateDebut}
              onChange={(event) => setFiltres((prev) => ({ ...prev, dateDebut: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">End date</label>
            <input
              type="date"
              value={filtres.dateFin}
              onChange={(event) => setFiltres((prev) => ({ ...prev, dateFin: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-white">
            Visible {usersVisibleCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Loaded {usersLoadedCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Active {usersActiveCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Pending {usersPendingCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            Suspended {usersSuspendedCount}
          </span>
          <span className="ml-auto text-xs font-medium text-slate-500">
            Total in system: {totalDisplayCount}
          </span>
        </div>
      </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            User list ({usersListCount})
          </h3>
          </div>

        {chargement ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created on
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {utilisateursAffiches.map((utilisateur) => (
                  <tr key={utilisateur.id_utilisateur} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{utilisateur.nom}</div>
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
                      {new Date(utilisateur.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setUtilisateurSelectionne(utilisateur);
                          setModeEdition(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => resetMotDePasse(utilisateur.id_utilisateur)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Reset password
                      </button>
                      {utilisateur.statut === "actif" ? (
                        <button
                          onClick={() => changerStatut(utilisateur.id_utilisateur, "suspendu")}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => changerStatut(utilisateur.id_utilisateur, "actif")}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => supprimerUtilisateur(utilisateur.id_utilisateur)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!recherche && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages} ({totalUtilisateurs} users total)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
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
              setErreur("No user is currently selected for editing.");
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (roleInvitation) {
      const payload: Partial<Utilisateur> = { ...formData };
      delete payload.statut;
      onSave(payload);
      return;
    }
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-user-modal-title"
    >
      <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="admin-user-modal-title" className="text-lg font-semibold text-slate-950">
              {modeCreation ? "Create user" : "Edit user"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Complete the account details without leaving the admin workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-950"
            aria-label="Close user form"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(event) => setFormData((prev) => ({ ...prev, nom: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="candidat">Candidate</option>
              <option value="entreprise">Company</option>
              <option value="admin">Admin</option>
              <option value="inspecteur">Inspector</option>
              <option value="aneti">ANETI</option>
            </select>
          </div>

          {!roleInvitation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.statut}
                onChange={(event) => setFormData((prev) => ({ ...prev, statut: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="actif">Active</option>
                <option value="inactif">Inactive</option>
                <option value="en_attente">Pending</option>
                <option value="suspendu">Suspended</option>
              </select>
            </div>
          )}
          </div>

          {roleInvitation && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Le compte sera cree en attente d&apos;activation. Un email sera envoye pour definir le mot de passe et activer l&apos;acces.
            </div>
          )}

          {roleInterne ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gouvernorat</label>
                <select
                  value={formData.gouvernorat}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      gouvernorat: event.target.value,
                      delegation: "",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={roleInterne}
                >
                  <option value="">Selectionnez un gouvernorat</option>
                  {TUNISIAN_GOVERNORATE_OPTIONS.map((gouvernorat) => (
                    <option key={gouvernorat} value={gouvernorat}>
                      {gouvernorat}
                    </option>
                  ))}
                </select>
              </div>

              {formData.gouvernorat ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delegation</label>
                  <select
                    value={formData.delegation}
                    onChange={(event) => setFormData((prev) => ({ ...prev, delegation: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={roleInterne}
                  >
                    <option value="">Selectionnez une delegation</option>
                    {delegationOptions.map((delegation) => (
                      <option key={delegation} value={delegation}>
                        {delegation}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">La delegation est obligatoire pour les comptes Inspecteur.</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, telephone: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.addresse}
                  onChange={(event) => setFormData((prev) => ({ ...prev, addresse: event.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {modeCreation && !roleInvitation && (
            <div className="rounded-md border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-900">
              L&apos;admin ne definit plus le mot de passe ici. Un email securise sera envoye automatiquement afin que le nouvel utilisateur puisse le choisir.
            </div>
          )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.06)]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {modeCreation ? "Create" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
