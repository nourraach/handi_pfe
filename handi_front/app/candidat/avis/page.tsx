"use client";

import { useEffect, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type CandidatureAcceptee = {
  candidature: { id: string; statut: string };
  entreprise?: { id?: string; nom?: string };
  offre?: { titre?: string };
};

type Avis = {
  id: string;
  nom_entreprise: string;
  note: number;
  commentaire: string;
  created_at: string;
};

function AvisCandidatContent() {
  const [candidatures, setCandidatures] = useState<CandidatureAcceptee[]>([]);
  const [mesAvis, setMesAvis] = useState<Avis[]>([]);
  const [idSelection, setIdSelection] = useState("");
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [resCandidatures, resAvis] = await Promise.all([
        authenticatedFetch(construireUrlApi("/api/candidatures/mes-candidatures")),
        authenticatedFetch(construireUrlApi("/api/avis-entreprises/mes-avis")),
      ]);

      const dataCandidatures = await resCandidatures.json().catch(() => ({}));
      const dataAvis = await resAvis.json().catch(() => ({}));

      if (!resCandidatures.ok) {
        throw new Error(dataCandidatures.message || "Impossible de charger vos candidatures.");
      }
      if (!resAvis.ok) {
        throw new Error(dataAvis.message || "Impossible de charger vos avis.");
      }

      const acceptees = Array.isArray(dataCandidatures.donnees)
        ? dataCandidatures.donnees.filter((item: CandidatureAcceptee) => item?.candidature?.statut === "accepted")
        : [];

      setCandidatures(acceptees);
      setMesAvis(Array.isArray(dataAvis.donnees) ? dataAvis.donnees : []);
      if (acceptees.length > 0 && !idSelection) {
        setIdSelection(acceptees[0].candidature.id);
      }
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void charger();
  }, []);

  const soumettreAvis = async () => {
    setMessage(null);
    setErreur(null);

    const candidature = candidatures.find((item) => item.candidature.id === idSelection);
    if (!candidature?.entreprise?.id) {
      setErreur("Selectionnez une candidature acceptee valide.");
      return;
    }

    try {
      const response = await authenticatedFetch(construireUrlApi("/api/avis-entreprises"), {
        method: "POST",
        body: JSON.stringify({
          id_entreprise: candidature.entreprise.id,
          id_candidature: candidature.candidature.id,
          note,
          commentaire,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible d'envoyer votre avis.");
      }

      setMessage("Votre avis a ete enregistre.");
      setCommentaire("");
      await charger();
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible d'envoyer votre avis.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Avis sur les entreprises</h1>
          <p className="text-sm text-gray-600">
            Vous pouvez laisser un avis (note + commentaire) apres une candidature acceptee.
          </p>
        </div>

        {loading ? <div className="text-center text-gray-600">Chargement...</div> : null}
        {erreur ? <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{erreur}</div> : null}
        {message ? <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">{message}</div> : null}

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Laisser un avis</h2>

          {candidatures.length === 0 ? (
            <p className="text-sm text-gray-600">Aucune candidature acceptee disponible pour laisser un avis.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="border rounded-md px-3 py-2 md:col-span-2"
                  value={idSelection}
                  onChange={(event) => setIdSelection(event.target.value)}
                >
                  {candidatures.map((item) => (
                    <option key={item.candidature.id} value={item.candidature.id}>
                      {(item.entreprise?.nom || "Entreprise")} - {(item.offre?.titre || "Offre")}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded-md px-3 py-2"
                  value={note}
                  onChange={(event) => setNote(Number(event.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((val) => (
                    <option key={val} value={val}>{val}/5</option>
                  ))}
                </select>
              </div>

              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={4}
                placeholder="Partagez votre experience (minimum 10 caracteres)."
                value={commentaire}
                onChange={(event) => setCommentaire(event.target.value)}
              />

              <button className="bg-blue-600 text-white px-4 py-2 rounded-md" onClick={() => void soumettreAvis()}>
                Envoyer mon avis
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Mes avis</h2>
          {mesAvis.length === 0 ? <p className="text-sm text-gray-600">Aucun avis publie pour le moment.</p> : null}
          <div className="space-y-3">
            {mesAvis.map((avis) => (
              <article key={avis.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>{avis.nom_entreprise}</strong>
                  <span>{avis.note}/5</span>
                </div>
                <p className="text-sm text-gray-700 mt-2">{avis.commentaire}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(avis.created_at).toLocaleDateString("fr-FR")}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidatAvisPage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <AvisCandidatContent />
    </RouteProtegee>
  );
}
