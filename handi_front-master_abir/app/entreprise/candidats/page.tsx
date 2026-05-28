"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type CandidatVisible = {
  id: string;
  nom: string;
  competences: string[];
  experience?: string | null;
  niveau_academique: string;
  secteur: string;
  disponibilite?: string | null;
  cv_url?: string | null;
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

function SectionCandidatsEntreprise() {
  const [candidats, setCandidats] = useState<CandidatVisible[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [competence, setCompetence] = useState("");

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
