"use client";

import { useEffect, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type Question = { id?: string; texte: string; type: "texte" | "choix"; options: string[] };
type Test = { id: string; titre: string; id_offre: string; created_at?: string };
type OffreItem = { id_offre?: string; id?: string; titre: string };
type ResultatTest = { id: string; score?: number | null; id_candidat?: string; created_at?: string };

function Page() {
  const [offres, setOffres] = useState<{ id_offre: string; titre: string }[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [titre, setTitre] = useState("");
  const [offre, setOffre] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ texte: "", type: "texte", options: [] }]);
  const [resultats, setResultats] = useState<ResultatTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    void chargerOffres();
    void chargerTests();
  }, []);

  const chargerOffres = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/entreprise/offres"));
      const data: { donnees?: { offres?: OffreItem[] } } = await res.json();
      if (res.ok && data.donnees?.offres) {
        setOffres(data.donnees.offres.map((offreItem) => ({ id_offre: offreItem.id_offre ?? offreItem.id ?? "", titre: offreItem.titre })));
      }
    } catch {}
  };

  const chargerTests = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/tests-entretien/entreprise"));
      const data: { donnees?: Test[] } = await res.json();
      if (res.ok) setTests(data.donnees || []);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger les tests.");
    }
  };

  const ajouterQuestion = () => setQuestions([...questions, { texte: "", type: "texte", options: [] }]);

  const changerQuestion = (index: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((question, currentIndex) => (currentIndex === index ? { ...question, ...patch } : question)));
  };

  const changerOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question, currentIndex) =>
        currentIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? value : option,
              ),
            }
          : question,
      ),
    );
  };

  const ajouterOption = (index: number) => {
    setQuestions((prev) =>
      prev.map((question, currentIndex) =>
        currentIndex === index ? { ...question, options: [...question.options, ""] } : question,
      ),
    );
  };

  const creerTest = async () => {
    setMessage(null);
    setErreur(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/tests-entretien/entreprise"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_offre: offre,
          titre,
          questions,
        }),
      });
      const data: { message?: string } = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible de créer le test.");

      setMessage("Test d'entretien créé.");
      setTitre("");
      setOffre("");
      setQuestions([{ texte: "", type: "texte", options: [] }]);
      void chargerTests();
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de créer le test.");
    }
  };

  const chargerResultats = async (id: string) => {
    try {
      setSelectedTest(id);
      const res = await authenticatedFetch(construireUrlApi(`/api/tests-entretien/entreprise/${id}/resultats`));
      const data: { donnees?: ResultatTest[]; message?: string } = await res.json();
      if (!res.ok) throw new Error(data.message || "Impossible de charger les résultats.");
      setResultats(data.donnees || []);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger les résultats.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tests d&apos;entretien</h1>
      {message && <div className="text-green-700 text-sm">{message}</div>}
      {erreur && <div className="text-red-700 text-sm">{erreur}</div>}

      <div className="bg-white rounded shadow p-4 space-y-4">
        <h2 className="text-xl font-semibold">Créer un test</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Offre</label>
            <select value={offre} onChange={(event) => setOffre(event.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Sélectionner une offre</option>
              {offres.map((offreItem) => (
                <option key={offreItem.id_offre} value={offreItem.id_offre}>
                  {offreItem.titre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Titre</label>
            <input value={titre} onChange={(event) => setTitre(event.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="border rounded p-3 space-y-2">
              <input
                value={question.texte}
                onChange={(event) => changerQuestion(index, { texte: event.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder={`Question ${index + 1}`}
              />
              <select
                value={question.type}
                onChange={(event) => changerQuestion(index, { type: event.target.value as Question["type"], options: [] })}
                className="border rounded px-3 py-2"
              >
                <option value="texte">Réponse libre</option>
                <option value="choix">Choix multiple</option>
              </select>

              {question.type === "choix" && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <input
                      key={optionIndex}
                      value={option}
                      onChange={(event) => changerOption(index, optionIndex, event.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                  ))}

                  <button onClick={() => ajouterOption(index)} className="text-sm text-blue-600">
                    + Ajouter une option
                  </button>
                </div>
              )}
            </div>
          ))}

          <button onClick={ajouterQuestion} className="text-sm text-blue-600">
            + Ajouter une question
          </button>
        </div>

        <button onClick={creerTest} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Enregistrer le test
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 space-y-4">
        <h2 className="text-xl font-semibold">Tests existants</h2>
        <div className="divide-y">
          {tests.map((test) => (
            <div key={test.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{test.titre}</div>
                <div className="text-gray-500 text-sm">Offre : {test.id_offre}</div>
              </div>
              <button onClick={() => chargerResultats(test.id)} className="text-sm text-blue-600">
                Voir les résultats
              </button>
            </div>
          ))}
        </div>

        {selectedTest && (
          <div>
            <h3 className="font-semibold mt-2 mb-1">Résultats</h3>
            <div className="text-sm text-gray-600 mb-2">Test {selectedTest}</div>
            <div className="space-y-2">
              {resultats.length === 0 && <div className="text-gray-500 text-sm">Aucun résultat pour le moment.</div>}
              {resultats.map((resultat) => (
                <div key={resultat.id} className="border rounded p-2 text-sm">
                  <div>Score : {resultat.score ?? "n/d"}</div>
                  <div>Candidat : {resultat.id_candidat}</div>
                  <div>Date : {resultat.created_at ? new Date(resultat.created_at).toLocaleString("fr-FR") : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Protegee() {
  return (
    <RouteProtegee rolesAutorises={["entreprise"]}>
      <Page />
    </RouteProtegee>
  );
}
