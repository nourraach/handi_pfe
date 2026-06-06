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

const toFiniteNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return fallback;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
};

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
        const resultatsNormalises = Array.isArray(data.donnees?.resultats)
          ? data.donnees.resultats.map(
              (resultat: Resultat & { pourcentage?: unknown; score_obtenu?: unknown; temps_passe_minutes?: unknown }) => ({
                ...resultat,
                score_obtenu: toFiniteNumber(resultat.score_obtenu),
                pourcentage: toFiniteNumber(resultat.pourcentage),
                temps_passe_minutes: toFiniteNumber(resultat.temps_passe_minutes),
              }),
            )
          : [];
        setResultats(resultatsNormalises);
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
    if (pourcentage >= 80) return "text-emerald-300";
    if (pourcentage >= 60) return "text-amber-300";
    return "text-rose-300";
  };

  const exporterResultats = () => {
    if (resultats.length === 0) return;

    const csvContent = [
      ["Name", "Email", "Score", "Percentage", "Time (min)", "Date", "Visible"],
      ...resultats.map((resultat) => [
        resultat.candidat.nom,
        resultat.candidat.email,
        resultat.score_obtenu.toString(),
        `${toFiniteNumber(resultat.pourcentage).toFixed(2)}%`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[24px] border border-[#3a215f] bg-[#120b1f] text-white shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Statistics - {test.titre}</h3>
              <p className="text-sm text-white/60">Review results and performance for this assessment.</p>
            </div>
            <button onClick={onClose} className="text-white/50 transition hover:text-white" aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className="border-b border-white/10">
          <nav className="flex gap-4 px-6">
            <button
              onClick={() => setOngletActif("stats")}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition ${
                ongletActif === "stats"
                  ? "border-violet-400 text-white"
                  : "border-transparent text-white/55 hover:border-white/20 hover:text-white"
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setOngletActif("resultats")}
              className={`py-4 px-1 border-b-2 text-sm font-medium transition ${
                ongletActif === "resultats"
                  ? "border-violet-400 text-white"
                  : "border-transparent text-white/55 hover:border-white/20 hover:text-white"
              }`}
            >
              Results ({resultats.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {chargement ? (
            <div className="py-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-violet-400" />
              <p className="mt-3 text-white/65">Loading...</p>
            </div>
          ) : erreur ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-100">{erreur}</div>
          ) : ongletActif === "stats" && statistiques ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-6">
                <h4 className="mb-4 text-lg font-medium text-white">Score distribution</h4>
                <div className="space-y-3">
                  {[
                    { range: "0-20%", count: resultats.filter((r) => r.pourcentage < 20).length, color: "bg-rose-500" },
                    {
                      range: "20-40%",
                      count: resultats.filter((r) => r.pourcentage >= 20 && r.pourcentage < 40).length,
                      color: "bg-orange-500",
                    },
                    {
                      range: "40-60%",
                      count: resultats.filter((r) => r.pourcentage >= 40 && r.pourcentage < 60).length,
                      color: "bg-amber-500",
                    },
                    {
                      range: "60-80%",
                      count: resultats.filter((r) => r.pourcentage >= 60 && r.pourcentage < 80).length,
                      color: "bg-violet-500",
                    },
                    { range: "80-100%", count: resultats.filter((r) => r.pourcentage >= 80).length, color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center">
                      <div className="w-16 text-sm text-white/55">{item.range}</div>
                      <div className="mx-3 h-6 flex-1 rounded-full bg-white/10">
                        <div
                          className={`${item.color} flex h-6 items-center justify-end rounded-full pr-2`}
                          style={{ width: `${resultats.length > 0 ? (item.count / resultats.length) * 100 : 0}%` }}
                        >
                          {item.count > 0 && <span className="text-xs font-medium text-white">{item.count}</span>}
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm text-white/55">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-lg font-medium text-white">Detailed results ({resultats.length})</h4>
                <button
                  onClick={exporterResultats}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
                >
                  Export CSV
                </button>
              </div>

              {resultats.length === 0 ? (
                <div className="py-10 text-center text-white/55">
                  <div className="mb-4 text-4xl">Results</div>
                  <p>No results available for this test yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[20px] border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                          Candidate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                          Visibility
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-transparent">
                      {resultats.map((resultat) => (
                        <tr key={resultat.id_resultat} className="hover:bg-white/5">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-white">{resultat.candidat.nom}</div>
                              <div className="text-sm text-white/55">{resultat.candidat.email}</div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm font-medium text-white">
                              {resultat.score_obtenu} / {test.score_total}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className={`text-sm font-medium ${getScoreColor(toFiniteNumber(resultat.pourcentage))}`}>
                              {toFiniteNumber(resultat.pourcentage).toFixed(1)}%
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-white/55">
                            {resultat.temps_passe_minutes} min
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-white/55">
                            {new Date(resultat.date_passage).toLocaleDateString("en-US")}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                resultat.est_visible ? "bg-emerald-500/15 text-emerald-200" : "bg-white/10 text-white/70"
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

        <div className="flex justify-end border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 px-4 py-2 text-white/80 transition hover:bg-white/5"
            aria-label="Close"
          >
            ×
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
    blue: "bg-violet-500/12 text-violet-100 border-violet-400/20",
    green: "bg-emerald-500/12 text-emerald-100 border-emerald-400/20",
    purple: "bg-fuchsia-500/12 text-fuchsia-100 border-fuchsia-400/20",
    orange: "bg-amber-500/12 text-amber-100 border-amber-400/20",
    red: "bg-rose-500/12 text-rose-100 border-rose-400/20",
    emerald: "bg-cyan-500/12 text-cyan-100 border-cyan-400/20",
  }[tone].split(" ");

  return (
    <div className={`${styles[0]} rounded-[20px] border p-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.18)]`}>
      <div className={`text-3xl font-bold ${styles[1]}`}>{value}</div>
      <div className={`font-medium ${styles[1]}`}>{label}</div>
      {detail ? <div className={`text-sm ${styles[1]}`}>{detail}</div> : null}
    </div>
  );
}
