"use client";

import { useEffect, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type Question = { id?: string; texte: string; type: "texte" | "choix"; options: string[] };
type Test = { id: string; titre: string; id_offre: string; created_at?: string };

function Page() {
  const [offres, setOffres] = useState<{ id_offre: string; titre: string }[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [titre, setTitre] = useState("");
  const [offre, setOffre] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ texte: "", type: "texte", options: [] }]);
  const [resultats, setResultats] = useState<any[]>([]);
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
      const data = await res.json();
      if (res.ok && data.donnees?.offres) {
        setOffres(data.donnees.offres.map((offreItem: any) => ({ id_offre: offreItem.id_offre ?? offreItem.id, titre: offreItem.titre })));
      }
    } catch {}
  };

  const chargerTests = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/tests-entretien/entreprise"));
      const data = await res.json();
      if (res.ok) setTests(data.donnees || []);
    } catch (e: any) {
      setErreur(e.message);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to create the test.");

      setMessage("Interview test created.");
      setTitre("");
      setOffre("");
      setQuestions([{ texte: "", type: "texte", options: [] }]);
      void chargerTests();
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  const chargerResultats = async (id: string) => {
    try {
      setSelectedTest(id);
      const res = await authenticatedFetch(construireUrlApi(`/api/tests-entretien/entreprise/${id}/resultats`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load results.");
      setResultats(data.donnees || []);
    } catch (e: any) {
      setErreur(e.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Interview tests</h1>
      {message && <div className="text-green-700 text-sm">{message}</div>}
      {erreur && <div className="text-red-700 text-sm">{erreur}</div>}

      <div className="bg-white rounded shadow p-4 space-y-4">
        <h2 className="text-xl font-semibold">Create a test</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Role</label>
            <select value={offre} onChange={(event) => setOffre(event.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select a role</option>
              {offres.map((offreItem) => (
                <option key={offreItem.id_offre} value={offreItem.id_offre}>
                  {offreItem.titre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Title</label>
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
                <option value="texte">Text response</option>
                <option value="choix">Multiple choice</option>
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
                    + Add option
                  </button>
                </div>
              )}
            </div>
          ))}

          <button onClick={ajouterQuestion} className="text-sm text-blue-600">
            + Add question
          </button>
        </div>

        <button onClick={creerTest} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save test
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 space-y-4">
        <h2 className="text-xl font-semibold">Existing tests</h2>
        <div className="divide-y">
          {tests.map((test) => (
            <div key={test.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{test.titre}</div>
                <div className="text-gray-500 text-sm">Role: {test.id_offre}</div>
              </div>
              <button onClick={() => chargerResultats(test.id)} className="text-sm text-blue-600">
                View results
              </button>
            </div>
          ))}
        </div>

        {selectedTest && (
          <div>
            <h3 className="font-semibold mt-2 mb-1">Results</h3>
            <div className="text-sm text-gray-600 mb-2">Test {selectedTest}</div>
            <div className="space-y-2">
              {resultats.length === 0 && <div className="text-gray-500 text-sm">No results yet.</div>}
              {resultats.map((resultat) => (
                <div key={resultat.id} className="border rounded p-2 text-sm">
                  <div>Score: {resultat.score ?? "n/a"}</div>
                  <div>Candidate: {resultat.id_candidat}</div>
                  <div>Date: {resultat.created_at ? new Date(resultat.created_at).toLocaleString("en-US") : ""}</div>
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
