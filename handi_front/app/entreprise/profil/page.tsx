"use client";

import { useEffect, useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { authenticatedFetch, getUtilisateurConnecte } from "@/lib/auth-utils";
import { RouteProtegee } from "@/components/route-protegee";

type ProfilEntreprise = {
  nom: string;
  telephone: string;
  addresse: string;
  nom_entreprise: string;
  patente: string;
  rne: string;
  site_web?: string;
  description?: string;
  secteur_activite?: string;
  taille_entreprise?: string;
  politique_handicap?: string;
  contact_rh_nom?: string;
  contact_rh_email?: string;
  contact_rh_telephone?: string;
  logo_url?: string;
  profil_publique?: boolean;
  patente_url?: string;
  rne_url?: string;
  subscription_pack?: string;
  subscription_status?: string;
  subscription_price_tnd?: number;
  subscription_cycle?: string;
  subscribed_at?: string | null;
};

type SubscriptionPack = {
  code: string;
  name: string;
  price_tnd: number;
  cycle: string;
  features: string[];
};

const DEFAULT_PACKS: SubscriptionPack[] = [
  {
    code: "essential",
    name: "Pack 1 - Essential",
    price_tnd: 4000,
    cycle: "yearly",
    features: [
      "Unlimited access to validated candidates",
      "Video CV viewing",
      "Direct contact via HandiTalents messaging",
      "Interview scheduling via the platform",
      "Conducting online interviews",
      "Up to 8 positions job posting publication",
      "Sharing job offers on HandiSuccess & HandiTalents social media",
      "Sharing job offers with ANETI",
      "Interview preparation training via ANETI",
    ],
  },
  {
    code: "advanced",
    name: "Pack 2 - Advanced Recruitment",
    price_tnd: 7000,
    cycle: "yearly",
    features: [
      "Unlimited access to validated candidates",
      "Video CV viewing",
      "Direct contact via HandiTalents messaging",
      "Interview scheduling via the platform",
      "Conducting online interviews",
      "Up to 18 positions job posting publication",
      "Sharing job offers on HandiSuccess & HandiTalents social media",
      "Sharing job offers with ANETI",
      "Interview preparation training via ANETI",
      "Automatic candidate shortlisting",
      "Job posting publication report",
      "Compliance report with Law No. 41 of 2016",
    ],
  },
  {
    code: "compliance",
    name: "Pack 3 - Compliance Inclusion",
    price_tnd: 12000,
    cycle: "yearly",
    features: [
      "Unlimited access to validated candidates",
      "Video CV viewing",
      "Direct contact via HandiTalents messaging",
      "Interview scheduling via the platform",
      "Conducting online interviews",
      "Job posting publication",
      "Sharing job offers on HandiSuccess & HandiTalents social media",
      "Sharing job offers with ANETI",
      "Interview preparation training via ANETI",
      "Smart candidate shortlisting",
      "Job posting publication report",
      "Compliance report with Law No. 41 of 2016",
      "Support in defining and adjusting job offers",
      "Legal assistance for compliance with Law No. 41 of 2016",
      "Account management and application compliance support",
    ],
  },
];

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function construireUrlFichier(path?: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  try {
    const origin = new URL(construireUrlApi("/api/sante")).origin;
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return path;
  }
}

function validerLogoEntreprise(file: File) {
  const mimeAutorises = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]);
  const tailleMax = 5 * 1024 * 1024;
  if (!mimeAutorises.has(file.type)) {
    throw new Error("Logo invalide. Formats autorises: PNG, JPG, WEBP ou SVG.");
  }
  if (file.size > tailleMax) {
    throw new Error("Logo trop volumineux. Taille maximale: 5 MB.");
  }
}

type Membre = {
  id: string;
  nom: string;
  email: string;
  role?: string;
  telephone?: string;
};

export default function ProfilEntreprisePageProtegee() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <ProfilEntreprisePage />
    </RouteProtegee>
  );
}

function ProfilEntreprisePage() {
  const [profil, setProfil] = useState<ProfilEntreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [nouveauMembre, setNouveauMembre] = useState<Membre>({
    id: "",
    nom: "",
    email: "",
    role: "",
    telephone: "",
  });
  const [patenteFile, setPatenteFile] = useState<File | null>(null);
  const [rneFile, setRneFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoActionLoading, setLogoActionLoading] = useState(false);
  const [availablePacks, setAvailablePacks] = useState<SubscriptionPack[]>([]);
  const [subscriptionSaving, setSubscriptionSaving] = useState<string | null>(null);

  useEffect(() => {
    void chargerProfil();
    void chargerMembres();
  }, []);

  const chargerProfil = async () => {
    try {
      setLoading(true);
      setErreur(null);
      const user = getUtilisateurConnecte();
      if (!user) throw new Error("Session expired.");

      const res = await authenticatedFetch(construireUrlApi(`/api/entreprises/profil/${user.id_utilisateur}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load the company profile.");

      const profilePayload = data.donnees || {};
      const utilisateur = profilePayload.utilisateur || profilePayload;
      const entreprise = profilePayload.entreprise || profilePayload;

      setProfil({
        nom: utilisateur?.nom || "",
        telephone: utilisateur?.telephone || "",
        addresse: utilisateur?.addresse || "",
        nom_entreprise: entreprise?.nom_entreprise || "",
        patente: entreprise?.patente || "",
        rne: entreprise?.rne || entreprise?.siret || "",
        patente_url: entreprise?.patente,
        rne_url: entreprise?.rne,
        site_web: entreprise?.site_web || entreprise?.url_site || "",
        description: entreprise?.description || "",
        secteur_activite: entreprise?.secteur_activite || "",
        taille_entreprise: entreprise?.taille_entreprise || "",
        politique_handicap: entreprise?.politique_handicap || "",
        contact_rh_nom: entreprise?.contact_rh_nom || "",
        contact_rh_email: entreprise?.contact_rh_email || "",
        contact_rh_telephone: entreprise?.contact_rh_telephone || "",
        logo_url: entreprise?.logo_url || "",
        profil_publique: entreprise?.profil_publique ?? false,
        subscription_pack: profilePayload.subscription_pack || entreprise?.subscription_pack || "",
        subscription_status: profilePayload.subscription_status || entreprise?.subscription_status || "inactive",
        subscription_price_tnd: profilePayload.subscription_price_tnd || entreprise?.subscription_price_tnd || 0,
        subscription_cycle: profilePayload.subscription_cycle || entreprise?.subscription_cycle || "yearly",
        subscribed_at: profilePayload.subscribed_at || entreprise?.subscribed_at || null,
      });
      setAvailablePacks(profilePayload.available_packs || DEFAULT_PACKS);
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to load the company profile."));
    } finally {
      setLoading(false);
    }
  };

  const chargerMembres = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/membres"));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load account members.");
      setMembres(data.donnees || []);
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to load account members."));
    }
  };

  const enregistrer = async () => {
    if (!profil) return;

    setMessage(null);
    setErreur(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/profil"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profil),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to save your changes.");
      setMessage("Profile updated successfully.");
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to save your changes."));
    }
  };

  const enregistrerDocuments = async ({ removeLogo = false }: { removeLogo?: boolean } = {}) => {
    try {
      setLogoActionLoading(true);
      if (!patenteFile && !rneFile && !logoFile && !removeLogo) {
        setErreur("Add a patente, RNE, or logo file before uploading.");
        return;
      }

      const formData = new FormData();
      if (patenteFile) formData.append("patente", patenteFile);
      if (rneFile) formData.append("rne", rneFile);
      if (logoFile) formData.append("logo", logoFile);
      if (removeLogo) formData.append("remove_logo", "true");

      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/profil/documents"), {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to upload the documents.");

      setMessage(removeLogo ? "Company logo removed." : "Documents updated.");
      setPatenteFile(null);
      setRneFile(null);
      setLogoFile(null);
      await chargerProfil();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to upload the documents."));
    } finally {
      setLogoActionLoading(false);
    }
  };

  const choisirPack = async (packCode: string) => {
    try {
      setSubscriptionSaving(packCode);
      setMessage(null);
      setErreur(null);

      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/profil/subscription"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_code: packCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to select this package.");

      setMessage("Package selected successfully.");
      await chargerProfil();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to select this package."));
    } finally {
      setSubscriptionSaving(null);
    }
  };

  const creerMembre = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprises/membres"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nouveauMembre, id: undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to add the member.");

      setNouveauMembre({ id: "", nom: "", email: "", role: "", telephone: "" });
      setMessage("Member added.");
      void chargerMembres();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to add the member."));
    }
  };

  const supprimerMembre = async (id: string) => {
    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/entreprises/membres/${id}`), {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(data.message || "Unable to delete the member.");
      }

      setMessage("Member removed.");
      void chargerMembres();
    } catch (error: unknown) {
      setErreur(getErrorMessage(error, "Unable to delete the member."));
    }
  };

  if (loading || !profil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading company profile...</p>
      </div>
    );
  }

  const input = (label: string, value: string, onChange: (v: string) => void, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company profile</h1>
          <p className="text-gray-600">Update your legal, contact, and hiring information.</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {profil.logo_url ? (
            <img
              src={construireUrlFichier(profil.logo_url)}
              alt="Logo entreprise"
              className="h-20 w-20 rounded-full border bg-white object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-white text-lg font-semibold text-slate-600">
              {profil.nom_entreprise?.slice(0, 1).toUpperCase() || "E"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Logo de profil entreprise</p>
            <p className="truncate text-base font-semibold text-slate-900">{profil.nom_entreprise || "Entreprise"}</p>
            <p className="text-xs text-slate-500">Visible dans le profil et les vues de l entreprise.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Representative name", profil.nom, (value) => setProfil({ ...profil, nom: value }))}
          {input("Phone", profil.telephone, (value) => setProfil({ ...profil, telephone: value }))}
          {input("Address", profil.addresse, (value) => setProfil({ ...profil, addresse: value }))}
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Inclusive subscription packages</h2>
            <p className="text-gray-600">Choose the package that matches your company needs. The payment process is intentionally not implemented yet.</p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p>Current package: <strong>{profil.subscription_pack || "No package selected"}</strong></p>
            <p>
              Status: {profil.subscription_status || "inactive"}
              {profil.subscription_price_tnd ? ` • ${profil.subscription_price_tnd.toLocaleString("fr-TN")} TND/${profil.subscription_cycle === "yearly" ? "year" : profil.subscription_cycle}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {availablePacks.map((pack) => {
              const isCurrent = profil.subscription_pack === pack.code;
              return (
                <div key={pack.code} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isCurrent ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"}`}>
                  <div className="border-b border-gray-100 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">{pack.name}</p>
                  </div>
                  <div className="bg-gray-50 px-5 py-4">
                    <p className="text-3xl font-bold text-gray-900">{pack.price_tnd.toLocaleString("fr-TN")} <span className="text-xl">TND</span></p>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">per year</p>
                  </div>
                  <div className="space-y-4 px-5 py-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      {pack.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span className="text-blue-600">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => choisirPack(pack.code)}
                      disabled={subscriptionSaving === pack.code}
                      className={`w-full rounded-full px-4 py-2 text-sm font-medium text-white transition ${isCurrent ? "bg-slate-700 hover:bg-slate-800" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-60`}
                    >
                      {subscriptionSaving === pack.code ? "Saving..." : isCurrent ? "Selected package" : "Choose this package"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Company name", profil.nom_entreprise, (value) => setProfil({ ...profil, nom_entreprise: value }))}
          {input("Website", profil.site_web || "", (value) => setProfil({ ...profil, site_web: value }))}
          {input("Patente", profil.patente, (value) => setProfil({ ...profil, patente: value }))}
          {input("RNE / SIRET", profil.rne, (value) => setProfil({ ...profil, rne: value }))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("Industry", profil.secteur_activite || "", (value) => setProfil({ ...profil, secteur_activite: value }))}
          {input("Company size", profil.taille_entreprise || "", (value) => setProfil({ ...profil, taille_entreprise: value }))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {input("HR contact name", profil.contact_rh_nom || "", (value) => setProfil({ ...profil, contact_rh_nom: value }))}
          {input("HR contact email", profil.contact_rh_email || "", (value) => setProfil({ ...profil, contact_rh_email: value }), "email")}
          {input("HR contact phone", profil.contact_rh_telephone || "", (value) => setProfil({ ...profil, contact_rh_telephone: value }))}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={profil.description || ""}
            onChange={(event) => setProfil({ ...profil, description: event.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!profil.profil_publique}
            onChange={(event) => setProfil({ ...profil, profil_publique: event.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-700">Public profile</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {message && <div className="text-green-700 text-sm">{message}</div>}
            {erreur && <div className="text-red-700 text-sm">{erreur}</div>}
          </div>
          <button onClick={enregistrer} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Save changes
          </button>
        </div>

        <div className="border-t pt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Documents (Patente / RNE / Logo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Patente (PDF/Image)</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setPatenteFile(event.target.files?.[0] || null)} />
              {profil.patente_url && (
                <a
                  className="text-blue-600 text-sm"
                  href={construireUrlFichier(profil.patente_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View current file
                </a>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">RNE / SIRET (PDF/Image)</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setRneFile(event.target.files?.[0] || null)} />
              {profil.rne_url && (
                <a
                  className="text-blue-600 text-sm"
                  href={construireUrlFichier(profil.rne_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View current file
                </a>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Logo entreprise (PNG/JPG/SVG)</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                onChange={(event) => {
                  const fichier = event.target.files?.[0] || null;
                  if (!fichier) {
                    setLogoFile(null);
                    return;
                  }
                  try {
                    validerLogoEntreprise(fichier);
                    setLogoFile(fichier);
                    setErreur(null);
                  } catch (error: unknown) {
                    setLogoFile(null);
                    setErreur(getErrorMessage(error, "Invalid company logo."));
                  }
                }}
              />
              {profil.logo_url && (
                <div className="mt-2">
                  <img
                    src={construireUrlFichier(profil.logo_url)}
                    alt="Logo actuel de l'entreprise"
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void enregistrerDocuments()}
              disabled={logoActionLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {logoActionLoading ? "Uploading..." : "Update documents"}
            </button>
            <button
              onClick={() => void enregistrerDocuments({ removeLogo: true })}
              disabled={logoActionLoading || !profil.logo_url}
              className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-60"
            >
              Remove logo
            </button>
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Account members</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {input("Name", nouveauMembre.nom, (value) => setNouveauMembre({ ...nouveauMembre, nom: value }))}
            {input("Email", nouveauMembre.email, (value) => setNouveauMembre({ ...nouveauMembre, email: value }), "email")}
            {input("Role", nouveauMembre.role || "", (value) => setNouveauMembre({ ...nouveauMembre, role: value }))}
            {input("Phone", nouveauMembre.telephone || "", (value) => setNouveauMembre({ ...nouveauMembre, telephone: value }))}
          </div>
          <button onClick={creerMembre} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            Add member
          </button>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {membres.map((membre) => (
                  <tr key={membre.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{membre.nom}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{membre.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{membre.role || "-"}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{membre.telephone || "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => supprimerMembre(membre.id)} className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
