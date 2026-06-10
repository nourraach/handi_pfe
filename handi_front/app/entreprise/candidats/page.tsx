"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { Eye, X } from "lucide-react";

type CandidatVisible = {
  id: string;
  nom: string;
  competences: string[];
  experience?: string | null;
  niveau_academique: string;
  secteur: string;
  disponibilite?: string | null;
  cv_url?: string | null;
  video_cv_url?: string | null;
  photo_profil_url?: string | null;
  email?: string;
  telephone?: string;
};

type ApiPayload = {
  donnees?: {
    candidats?: CandidatVisible[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
  message?: string;
};

type PreviewKind = "image" | "pdf" | "video" | "unknown";
type MediaPreviewState = {
  open: boolean;
  title: string;
  kind: PreviewKind;
  url: string | null;
  loading: boolean;
  error: string | null;
};

function SectionCandidatsEntreprise() {
  const [candidats, setCandidats] = useState<CandidatVisible[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [competence, setCompetence] = useState("");
  const [preview, setPreview] = useState<MediaPreviewState>({
    open: false,
    title: "",
    kind: "unknown",
    url: null,
    loading: false,
    error: null,
  });

  const closePreview = () => {
    setPreview((current) => {
      if (current.url) URL.revokeObjectURL(current.url);
      return { open: false, title: "", kind: "unknown", url: null, loading: false, error: null };
    });
  };

  const openPreview = async (opts: { title: string; path: string; kindHint?: PreviewKind }) => {
    const url = /^https?:\/\//i.test(opts.path) ? opts.path : construireUrlApi(opts.path.startsWith("/") ? opts.path : `/${opts.path}`);
    setPreview({ open: true, title: opts.title, kind: opts.kindHint || "unknown", url: null, loading: true, error: null });
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!response.ok) throw new Error("Impossible d'ouvrir le fichier.");
      const blob = await response.blob();
      const contentType = (blob.type || response.headers.get("content-type") || "").toLowerCase();
      const kind: PreviewKind =
        opts.kindHint ||
        (contentType.includes("pdf")
          ? "pdf"
          : contentType.startsWith("image/")
            ? "image"
            : contentType.startsWith("video/")
              ? "video"
              : "unknown");
      const objectUrl = URL.createObjectURL(blob);
      setPreview({ open: true, title: opts.title, kind, url: objectUrl, loading: false, error: null });
    } catch (e: any) {
      setPreview((current) => ({ ...current, loading: false, error: e?.message || "Impossible d'ouvrir le fichier." }));
    }
  };

  const charger = async (pageCible = 1) => {
    setLoading(true);
    setErreur(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageCible));
      params.set("limit", "25");
      if (recherche.trim()) params.set("recherche", recherche.trim());
      if (competence.trim()) params.set("competence", competence.trim());

      const response = await authenticatedFetch(construireUrlApi(`/api/entreprise/candidats?${params.toString()}`));
      const data: ApiPayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les candidats.");
      }

      setCandidats(Array.isArray(data.donnees?.candidats) ? data.donnees?.candidats : []);
      setTotalPages(Number(data.donnees?.pagination?.total_pages || 1));
      setPage(pageCible);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger les candidats.");
      setCandidats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void charger(1);
  }, []);

  const hasFilters = useMemo(() => recherche.trim().length > 0 || competence.trim().length > 0, [recherche, competence]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Candidats disponibles</h1>
          <p className="text-sm text-gray-600">
            Cette vue affiche uniquement les informations autorisees (competences, experience, disponibilite).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Rechercher un candidat"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
            />
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Filtrer par competence"
              value={competence}
              onChange={(event) => setCompetence(event.target.value)}
            />
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md" onClick={() => void charger(1)}>
                Filtrer
              </button>
              <button
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md"
                onClick={() => {
                  setRecherche("");
                  setCompetence("");
                  void charger(1);
                }}
                disabled={!hasFilters}
              >
                Reinitialiser
              </button>
            </div>
          </div>
        </div>

        {loading ? <div className="text-center text-gray-600">Chargement...</div> : null}
        {erreur ? <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{erreur}</div> : null}

        {!loading && !erreur && candidats.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">Aucun candidat trouve.</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidats.map((candidat) => (
            <article key={candidat.id} className="bg-white rounded-xl shadow p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{candidat.nom}</h2>
                  <p className="text-sm text-gray-600">{candidat.niveau_academique} - {candidat.secteur}</p>
                </div>
                {candidat.photo_profil_url ? (
                  <img
                    src={construireUrlApi(candidat.photo_profil_url)}
                    alt={`Photo de ${candidat.nom}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : null}
              </div>

              <div className="text-sm text-gray-700">
                <strong>Competences:</strong> {candidat.competences?.length ? candidat.competences.join(", ") : "Non renseigne"}
              </div>
              <div className="text-sm text-gray-700">
                <strong>Experience:</strong> {candidat.experience || "Non renseignee"}
              </div>
              <div className="text-sm text-gray-700">
                <strong>Disponibilite:</strong> {candidat.disponibilite || "Non renseignee"}
              </div>

              {candidat.video_cv_url || candidat.cv_url ? (
                <div className="flex items-center gap-2 border-t pt-3">
                  {candidat.video_cv_url ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-900"
                      onClick={() => void openPreview({ title: `Video CV - ${candidat.nom}`, path: candidat.video_cv_url || "", kindHint: "video" })}
                    >
                      <Eye size={16} /> Voir video CV
                    </button>
                  ) : null}
                  {candidat.cv_url ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-900"
                      onClick={() => void openPreview({ title: `CV - ${candidat.nom}`, path: candidat.cv_url || "", kindHint: "pdf" })}
                    >
                      <Eye size={16} /> Voir CV
                    </button>
                  ) : null}
                </div>
              ) : null}

              {candidat.email || candidat.telephone ? (
                <div className="text-sm text-gray-700 border-t pt-3">
                  {candidat.email ? <div><strong>Email:</strong> {candidat.email}</div> : null}
                  {candidat.telephone ? <div><strong>Telephone:</strong> {candidat.telephone}</div> : null}
                </div>
              ) : (
                <div className="text-xs text-gray-500 border-t pt-3">
                  Les coordonnees de ce candidat ne sont pas visibles.
                </div>
              )}
            </article>
          ))}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-4 py-2 rounded-md bg-gray-100"
              onClick={() => void charger(page - 1)}
              disabled={page <= 1}
            >
              Precedent
            </button>
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
            <button
              className="px-4 py-2 rounded-md bg-gray-100"
              onClick={() => void charger(page + 1)}
              disabled={page >= totalPages}
            >
              Suivant
            </button>
          </div>
        ) : null}
      </div>

      {preview.open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(15, 23, 42, 0.52)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={closePreview}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "default" }}
          />
          <div
            style={{
              position: "relative",
              width: "min(100%, 900px)",
              maxHeight: "min(90vh, 860px)",
              overflow: "auto",
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 24px 64px rgba(15,23,42,0.24)",
              padding: 18,
            }}
            onContextMenu={(event) => event.preventDefault()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <strong style={{ color: "#2a1843" }}>{preview.title}</strong>
              <button
                type="button"
                aria-label="Close"
                onClick={closePreview}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(53, 6, 62, 0.18)",
                  display: "grid",
                  placeItems: "center",
                  background: "#fff",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {preview.loading ? <p>Chargement...</p> : null}
            {preview.error ? <p style={{ color: "#b42318" }}>{preview.error}</p> : null}
            {!preview.loading && !preview.error && preview.url ? (
              preview.kind === "video" ? (
                <video
                  src={preview.url}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  playsInline
                  style={{ width: "100%", borderRadius: 14 }}
                />
              ) : preview.kind === "pdf" ? (
                <iframe title={preview.title} src={preview.url} style={{ width: "100%", height: "70vh", border: 0, borderRadius: 14 }} />
              ) : (
                <img src={preview.url} alt={preview.title} style={{ width: "100%", borderRadius: 14 }} />
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function EntrepriseCandidatsPage() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <SectionCandidatsEntreprise />
    </RouteProtegee>
  );
}
