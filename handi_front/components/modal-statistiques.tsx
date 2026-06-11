"use client";

import { useEffect, useState } from "react";
import { construireUrlApi } from "@/lib/config";

interface TestPsychologique {
  id_test: string;
  titre: string;
  description: string;
  type_test: string;
  duree_minutes: number;
  statut: string;
  score_total: number;
  date_debut_validite: string;
  date_fin_validite: string;
  created_at: string;
  createur: string;
}

interface Statistiques {
  test: {
    id_test: string;
    titre: string;
    type_test: string;
  };
  statistiques: {
    nombre_participants: number;
    score_moyen: number;
    score_min: number;
    score_max: number;
    taux_completion: number;
    temps_moyen_minutes: number;
  };
}

interface Resultat {
  id_resultat: string;
  candidat: {
    nom: string;
    email: string;
  };
  score_obtenu: number;
  pourcentage: number;
  temps_passe_minutes: number;
  date_passage: string;
  est_visible: boolean;
}

interface ModalStatistiquesProps {
  test: TestPsychologique;
  onClose: () => void;
}

export function ModalStatistiques({ test, onClose }: ModalStatistiquesProps) {
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ongletActif, setOngletActif] = useState<"stats" | "resultats">("stats");

  useEffect(() => {
    void Promise.all([chargerStatistiques(), chargerResultats()]);
  }, []);

  const chargerStatistiques = async () => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/admin/tests/${test.id_test}/statistiques`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStatistiques(data.donnees);
      } else {
        setErreur("Unable to load statistics.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const chargerResultats = async () => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/admin/tests/${test.id_test}/resultats`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setResultats(data.donnees.resultats || []);
      } else {
        setErreur("Unable to load results.");
      }
    } catch {
      setErreur("Connection error.");
    } finally {
      setChargement(false);
    }
  };

  const getScoreColor = (pourcentage: number) => {
    if (pourcentage >= 80) return "text-green-600";
    if (pourcentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const exporterResultats = () => {
    if (resultats.length === 0) return;

    const csvContent = [
      ["Name", "Email", "Score", "Percentage", "Time (min)", "Date", "Visible"],
      ...resultats.map((resultat) => [
        resultat.candidat.nom,
        resultat.candidat.email,
        resultat.score_obtenu.toString(),
        `${resultat.pourcentage.toFixed(2)}%`,
        resultat.temps_passe_minutes.toString(),
        new Date(resultat.date_passage).toLocaleDateString("en-US"),
        resultat.est_visible ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `results_${test.titre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Statistics - {test.titre}</h3>
              <p className="text-sm text-gray-600">Review results and performance for this assessment.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              x
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setOngletActif("stats")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                ongletActif === "stats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setOngletActif("resultats")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                ongletActif === "resultats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Results ({resultats.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {chargement ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : erreur ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">{erreur}</div>
          ) : ongletActif === "stats" && statistiques ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard tone="blue" value={statistiques.statistiques.nombre_participants} label="Participants" />
                <MetricCard
                  tone="green"
                  value={statistiques.statistiques.score_moyen.toFixed(1)}
                  label="Average score"
                  detail={`/ ${test.score_total} (${((statistiques.statistiques.score_moyen / test.score_total) * 100).toFixed(1)}%)`}
                />
                <MetricCard
                  tone="purple"
                  value={`${statistiques.statistiques.taux_completion.toFixed(1)}%`}
                  label="Completion rate"
                />
                <MetricCard
                  tone="orange"
                  value={statistiques.statistiques.temps_moyen_minutes}
                  label="Average time (min)"
                  detail={`/ ${test.duree_minutes} minutes allocated`}
                />
                <MetricCard tone="red" value={statistiques.statistiques.score_min} label="Minimum score" />
                <MetricCard tone="emerald" value={statistiques.statistiques.score_max} label="Maximum score" />
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Score distribution</h4>
                <div className="space-y-2">
                  {[
                    { range: "0-20%", count: resultats.filter((r) => r.pourcentage < 20).length, color: "bg-red-500" },
                    {
                      range: "20-40%",
                      count: resultats.filter((r) => r.pourcentage >= 20 && r.pourcentage < 40).length,
                      color: "bg-orange-500",
                    },
                    {
                      range: "40-60%",
                      count: resultats.filter((r) => r.pourcentage >= 40 && r.pourcentage < 60).length,
                      color: "bg-yellow-500",
                    },
                    {
                      range: "60-80%",
                      count: resultats.filter((r) => r.pourcentage >= 60 && r.pourcentage < 80).length,
                      color: "bg-blue-500",
                    },
                    { range: "80-100%", count: resultats.filter((r) => r.pourcentage >= 80).length, color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center">
                      <div className="w-16 text-sm text-gray-600">{item.range}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                        <div
                          className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2`}
                          style={{ width: `${resultats.length > 0 ? (item.count / resultats.length) * 100 : 0}%` }}
                        >
                          {item.count > 0 && <span className="text-white text-xs font-medium">{item.count}</span>}
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-gray-900">Detailed results ({resultats.length})</h4>
                <button
                  onClick={exporterResultats}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Export CSV
                </button>
              </div>

              {resultats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">Results</div>
                  <p>No results available for this test yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visibility
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resultats.map((resultat) => (
                        <tr key={resultat.id_resultat} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{resultat.candidat.nom}</div>
                              <div className="text-sm text-gray-500">{resultat.candidat.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {resultat.score_obtenu} / {test.score_total}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getScoreColor(resultat.pourcentage)}`}>
                              {resultat.pourcentage.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {resultat.temps_passe_minutes} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(resultat.date_passage).toLocaleDateString("en-US")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                resultat.est_visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {resultat.est_visible ? "Visible" : "Hidden"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  tone,
  value,
  label,
  detail,
}: {
  tone: "blue" | "green" | "purple" | "orange" | "red" | "emerald";
  value: string | number;
  label: string;
  detail?: string;
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 text-blue-800",
    green: "bg-green-50 text-green-600 text-green-800",
    purple: "bg-purple-50 text-purple-600 text-purple-800",
    orange: "bg-orange-50 text-orange-600 text-orange-800",
    red: "bg-red-50 text-red-600 text-red-800",
    emerald: "bg-emerald-50 text-emerald-600 text-emerald-800",
  }[tone].split(" ");

  return (
    <div className={`${styles[0]} rounded-lg p-6 text-center`}>
      <div className={`text-3xl font-bold ${styles[1]}`}>{value}</div>
      <div className={`font-medium ${styles[2]}`}>{label}</div>
      {detail ? <div className={`text-sm ${styles[1]}`}>{detail}</div> : null}
    </div>
  );
}
