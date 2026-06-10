"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type Resultat = {
  resultat: {
    id_resultat: string;
    score_obtenu?: string;
    pourcentage?: string;
    est_visible?: boolean;
    date_passage?: string;
  };
  test: { titre: string };
};

type ResultatApiItem = Partial<Resultat["resultat"]> & {
  id?: string;
  resultat?: Partial<Resultat["resultat"]> & { id?: string };
  test?: Partial<Resultat["test"]>;
};

type ResultatsPayload = {
  donnees?: { resultats?: ResultatApiItem[] } | ResultatApiItem[];
  resultats?: ResultatApiItem[];
  message?: string;
};

const normaliserResultats = (payload: ResultatsPayload): Resultat[] => {
  const donnees = payload?.donnees;
  const brut = Array.isArray(donnees)
    ? donnees
    : donnees && Array.isArray(donnees.resultats)
      ? donnees.resultats
      : Array.isArray(payload?.resultats)
        ? payload.resultats
        : [];

  return brut.map((item, index) => {
    const resultat = item?.resultat ?? item ?? {};
    return {
      resultat: {
        id_resultat: resultat.id_resultat ?? resultat.id ?? `resultat-${index}`,
        score_obtenu: resultat.score_obtenu,
        pourcentage: resultat.pourcentage,
        est_visible: resultat.est_visible,
        date_passage: resultat.date_passage,
      },
      test: {
        titre: item?.test?.titre ?? "Test",
      },
    };
  });
};

export function TestsPsychologiquesCandidatsSimple() {
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    void charger();
  }, []);

  const charger = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/tests-psychologiques/candidat/mes-resultats"));
      const data: ResultatsPayload = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load your results.");
      setResultats(normaliserResultats(data));
      setErreur(null);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to load your results.");
    }
  };

  const toggleVisibilite = async (id: string, actuel?: boolean) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      setErreur("Cannot update visibility: result not yet saved on server.");
      return;
    }

    try {
      setMessage(null);
      const res = await authenticatedFetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/resultats/${id}/visibilite`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ est_visible: !actuel }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to update visibility.");
      setMessage("Visibility updated.");
      await charger();
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to update visibility.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-3">
      <h2 className="text-2xl font-semibold">Psychological assessments</h2>
      {message && <div className="text-green-700 text-sm">{message}</div>}
      {erreur && <div className="text-red-700 text-sm">{erreur}</div>}

      <div className="divide-y">
        {resultats.map((resultatItem) => (
          <div key={resultatItem.resultat.id_resultat} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{resultatItem.test?.titre || "Test"}</div>
              <div className="text-gray-500 text-sm">
                Score:{" "}
                {resultatItem.resultat.pourcentage
                  ? `${resultatItem.resultat.pourcentage}%`
                  : resultatItem.resultat.score_obtenu || "-"}
                {" • "}
                Taken on{" "}
                {resultatItem.resultat.date_passage
                  ? new Date(resultatItem.resultat.date_passage).toLocaleDateString("en-US")
                  : "-"}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!resultatItem.resultat.est_visible}
                onChange={() =>
                  toggleVisibilite(resultatItem.resultat.id_resultat, resultatItem.resultat.est_visible)
                }
              />
              Visible to recruiters
            </label>
          </div>
        ))}
        {resultats.length === 0 && <div className="text-gray-500 text-sm py-2">No results yet.</div>}
      </div>
    </div>
  );
}
