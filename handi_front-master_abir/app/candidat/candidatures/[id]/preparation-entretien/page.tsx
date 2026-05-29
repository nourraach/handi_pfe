"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

/**
 * Feature 02 — Page de preparation d'entretien (predicteur de questions personnalise).
 * Affiche le dossier genere par l'IA (Gemini 2.0 Flash) lors du shortlist.
 */

type Categorie = "motivation" | "technique" | "comportementale" | "gap" | "secteur" | "handicap";
type Probabilite = "haute" | "moyenne";

interface InterviewQuestion {
  id: string;
  question: string;
  categorie: Categorie;
  probabilite: Probabilite;
  conseil_reponse: string;
  exemple_amorce: string;
  pieges_a_eviter: string[];
  competences_profil_a_mobiliser: string[];
}

interface HandicapBlock {
  titre: string;
  intro: string;
  questions: Array<{ question: string; conseil_reponse: string }>;
}

interface DossierView {
  status: "pending" | "processing" | "ready" | "failed" | "not_eligible";
  source: "gemini" | "fallback" | null;
  offre: { id: string; titre: string } | null;
  generated_at: string | null;
  can_regenerate: boolean;
  questions: InterviewQuestion[];
  handicap_block: HandicapBlock | null;
}

const CATEGORIE_LABELS: Record<Categorie, string> = {
  motivation: "Motivation",
  technique: "Technique",
  comportementale: "Comportementale",
  gap: "Competence a developper",
  secteur: "Secteur",
  handicap: "Handicap",
};

const CATEGORIE_COLORS: Record<Categorie, string> = {
  motivation: "bg-purple-100 text-purple-800",
  technique: "bg-blue-100 text-blue-800",
  comportementale: "bg-emerald-100 text-emerald-800",
  gap: "bg-amber-100 text-amber-800",
  secteur: "bg-indigo-100 text-indigo-800",
  handicap: "bg-rose-100 text-rose-800",
};

type SimulateurResultat = {
  score: number;
  verdict: string;
  points_forts: string[];
  axes_amelioration: string[];
};

const SIMULATEUR_MOTS_CLES: Record<Categorie, string[]> = {
  motivation: ["mission", "valeur", "projet", "entreprise", "poste", "equipe"],
  technique: ["outil", "technique", "projet", "probleme", "method", "solution", "resoudre"],
  comportementale: ["equipe", "communication", "organisation", "autonome", "collaboration", "adaptation"],
  gap: ["appris", "progress", "formation", "ameliore", "developpe", "renforce"],
  secteur: ["secteur", "marche", "client", "enjeu", "metier", "terrain"],
  handicap: ["amenagement", "accessibilite", "rythme", "adaptation", "besoin", "accompagnement"],
};

function normaliserTexte(texte: string) {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function PreparationEntretienPage() {
  const params = useParams<{ id: string }>();
  const idCandidature = Array.isArray(params.id) ? params.id[0] : params.id;

  const [dossier, setDossier] = useState<DossierView | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [simulateurQuestion, setSimulateurQuestion] = useState<InterviewQuestion | null>(null);
  const [simulateurReponse, setSimulateurReponse] = useState("");
  const [simulateurResultat, setSimulateurResultat] = useState<SimulateurResultat | null>(null);
  const [simulateurEnCours, setSimulateurEnCours] = useState(false);

  const charger = useCallback(async () => {
    if (!idCandidature) {
      setErreur("Identifiant de candidature manquant.");
      setLoading(false);
      return;
    }
    try {
      setErreur(null);
      const response = await authenticatedFetch(
        construireUrlApi(`/api/candidatures/${idCandidature}/interview-prep`),
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Impossible de charger le dossier.");
      }
      setDossier(data.donnees as DossierView);
    } catch (e: unknown) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [idCandidature]);

  useEffect(() => {
    void charger();
  }, [charger]);

  useEffect(() => {
    if (!simulateurQuestion) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [simulateurQuestion]);

  // Polling toutes les 10s tant que processing/pending
  useEffect(() => {
    if (!dossier) return;
    if (dossier.status !== "processing" && dossier.status !== "pending") return;
    const t = setInterval(() => {
      void charger();
    }, 10000);
    return () => clearInterval(t);
  }, [dossier, charger]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const regenerer = async () => {
    if (!idCandidature || regenerating) return;
    if (!confirm("Vous ne pouvez regenerer qu'une seule fois. Continuer ?")) return;
    try {
      setRegenerating(true);
      const response = await authenticatedFetch(
        construireUrlApi(`/api/candidatures/${idCandidature}/interview-prep/regenerate`),
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Echec de la regeneration.");
      setDossier(data.donnees as DossierView);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur regeneration");
    } finally {
      setRegenerating(false);
    }
  };

  const ouvrirSimulateur = (question: InterviewQuestion) => {
    setSimulateurQuestion(question);
    setSimulateurReponse("");
    setSimulateurResultat(null);
  };

  const fermerSimulateur = () => {
    setSimulateurQuestion(null);
    setSimulateurReponse("");
    setSimulateurResultat(null);
    setSimulateurEnCours(false);
  };

  const analyserReponse = () => {
    if (!simulateurQuestion) return;

    const reponse = simulateurReponse.trim();
    const reponseNormalisee = normaliserTexte(reponse);
    const motsCles = SIMULATEUR_MOTS_CLES[simulateurQuestion.categorie];

    const points_forts: string[] = [];
    const axes_amelioration: string[] = [];
    let score = 0;

    if (reponse.length >= 220) {
      score += 30;
      points_forts.push("Réponse suffisamment développée.");
    } else if (reponse.length >= 120) {
      score += 20;
      points_forts.push("Réponse de taille correcte.");
    } else if (reponse.length >= 40) {
      score += 10;
      axes_amelioration.push("Développez un peu plus votre réponse.");
    } else {
      axes_amelioration.push("La réponse est trop courte pour convaincre.");
    }

    const hits = motsCles.filter((mot) => reponseNormalisee.includes(mot)).length;
    if (hits >= 2) {
      score += 25;
      points_forts.push("Votre réponse reste bien reliée au thème de la question.");
    } else if (hits === 1) {
      score += 12;
      axes_amelioration.push("Reliez davantage votre réponse au contexte de l'entretien.");
    } else {
      axes_amelioration.push("Ajoutez des mots concrets liés au poste, à l'équipe ou au contexte.");
    }

    const presenceExemple = /exemple|projet|mission|stage|situation|concret|concretement/.test(reponseNormalisee);
    if (presenceExemple) {
      score += 25;
      points_forts.push("Vous utilisez un exemple ou un contexte concret.");
    } else {
      axes_amelioration.push("Ajoutez un exemple réel ou une situation vécue.");
    }

    const presenceValeur = /je|j ai|j\'ai|nous|mon|ma|mes/.test(reponseNormalisee);
    if (presenceValeur) {
      score += 10;
      points_forts.push("La réponse est formulée à la première personne, ce qui la rend plus naturelle.");
    } else {
      axes_amelioration.push("Formulez la réponse à partir de votre expérience personnelle.");
    }

    if (simulateurQuestion.categorie === "motivation" && /entreprise|mission|valeur|projet/.test(reponseNormalisee)) {
      score += 10;
    }
    if (simulateurQuestion.categorie === "technique" && /outil|solution|diagnostic|method|methode/.test(reponseNormalisee)) {
      score += 10;
    }
    if (simulateurQuestion.categorie === "comportementale" && /equipe|communication|collaboration|autonome/.test(reponseNormalisee)) {
      score += 10;
    }
    if (simulateurQuestion.categorie === "handicap" && /amenagement|accessibilite|rythme|adaptation/.test(reponseNormalisee)) {
      score += 10;
    }

    score = Math.min(100, score);

    let verdict = "Réponse à renforcer";
    if (score >= 85) verdict = "Très bon entraînement";
    else if (score >= 70) verdict = "Réponse solide";
    else if (score >= 50) verdict = "Réponse acceptable";

    setSimulateurResultat({ score, verdict, points_forts, axes_amelioration });
    setSimulateurEnCours(false);
  };

  // ---------------- Rendering ----------------

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <Card className="p-5">
          <p className="text-sm text-gray-600">Chargement de votre preparation...</p>
        </Card>
      </main>
    );
  }

  if (erreur) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-red-700">Erreur</h1>
          <p className="mt-2 text-gray-700">{erreur}</p>
          <div className="mt-4">
            <Button onClick={() => void charger()}>Reessayer</Button>
          </div>
        </Card>
      </main>
    );
  }

  if (!dossier) return null;

  if (dossier.status === "not_eligible") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Preparation non disponible</h1>
          <p className="mt-2 text-gray-700">
            Vous devez etre preselectionne(e) sur cette offre pour acceder au dossier de preparation.
          </p>
          <div className="mt-4">
            <Link href="/candidat/candidatures" className="text-blue-600 underline">
              Retour a mes candidatures
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (dossier.status === "pending" || dossier.status === "processing") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="p-6">
            <h1 className="text-2xl font-semibold">Preparation en cours</h1>
            <p className="mt-2 max-w-2xl text-gray-700">
              Votre dossier personnalise est en cours de generation. Vous serez notifie(e) des qu&apos;il sera pret.
              Cette page se mettra a jour automatiquement.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => void regenerer()} variant="secondary" size="sm" disabled={regenerating}>
                {regenerating ? "Lancement..." : "Lancer maintenant"}
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Actualisation toutes les 10 secondes
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Etat du dossier</p>
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="font-medium text-gray-900">Synchronisation automatique</p>
                  <p className="mt-1">Le backend relance la generation si le traitement a ete interrompu.</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="font-medium text-gray-900">Action manuelle</p>
                  <p className="mt-1">Vous pouvez forcer un redemarrage via le bouton ci-dessus.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (dossier.status === "failed") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-red-700">Echec de la generation</h1>
          <p className="mt-2 text-gray-700">
            La generation de votre dossier a echoue. Veuillez reessayer plus tard ou contacter le support.
          </p>
        </Card>
      </main>
    );
  }

  // Status = ready
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <header className="mb-6 rounded-3xl border border-gray-100 bg-white/85 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">Preparation d&apos;entretien personnalisee</h1>
                {dossier.offre && (
                  <p className="mt-1 text-gray-600">
                    Pour le poste : <span className="font-medium">{dossier.offre.titre}</span>
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                    Personnalise selon votre profil
                  </span>
                  {dossier.source === "fallback" && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Version generique (IA indisponible)
                    </span>
                  )}
                  {dossier.generated_at && (
                    <span className="text-xs text-gray-500">
                      Genere le {new Date(dossier.generated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  onClick={() => void regenerer()}
                  disabled={!dossier.can_regenerate || regenerating}
                  variant="secondary"
                >
                  {regenerating
                    ? "Regeneration..."
                    : dossier.can_regenerate
                      ? "Regenerer (1 fois max)"
                      : "Regeneration deja utilisee"}
                </Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-2" aria-label="Questions probables">
            {dossier.questions.map((q, idx) => {
              const isOpen = openIds.has(q.id);
              return (
                <Card key={q.id} className={isOpen ? "overflow-hidden p-0 lg:col-span-2" : "overflow-hidden p-0"}>
                  <button
                    type="button"
                    onClick={() => toggle(q.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-gray-50/80 sm:p-5"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400">Q{idx + 1}</span>
                        <span
                          className={"inline-flex rounded-full px-2 py-0.5 text-xs font-medium " + CATEGORIE_COLORS[q.categorie]}
                        >
                          {CATEGORIE_LABELS[q.categorie]}
                        </span>
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          Probabilite : {q.probabilite}
                        </span>
                      </div>
                      <p className="text-base font-medium leading-6 text-gray-900">{q.question}</p>
                    </div>
                    <span className="mt-1 shrink-0 text-gray-400" aria-hidden>
                      {isOpen ? "^" : "v"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-5">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                        <div>
                          <div className="mb-4">
                            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Conseil de reponse
                            </h3>
                            <p className="text-sm leading-6 text-gray-800">{q.conseil_reponse}</p>
                          </div>

                          {q.exemple_amorce && (
                            <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                                Exemple d&apos;amorce
                              </h3>
                              <p className="text-sm italic text-blue-900">{q.exemple_amorce}</p>
                            </div>
                          )}

                          {q.pieges_a_eviter.length > 0 && (
                            <div className="mb-4">
                              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Pieges a eviter
                              </h3>
                              <ul className="list-disc pl-5 text-sm text-gray-800">
                                {q.pieges_a_eviter.map((p, i) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {q.competences_profil_a_mobiliser.length > 0 && (
                            <div className="mb-1">
                              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Competences a mobiliser
                              </h3>
                              <div className="flex flex-wrap gap-1">
                                {q.competences_profil_a_mobiliser.map((c, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Actions rapides</p>
                          <p className="mt-2 text-sm text-gray-700">
                            Lancez l&apos;entrainement ou pre-remplissez le simulateur avec le conseil du dossier pour
                            gagner du temps.
                          </p>
                          <div className="mt-4 flex flex-col gap-2">
                            <Button onClick={() => ouvrirSimulateur(q)} className="w-full justify-center" size="sm">
                              &rarr; S&apos;entrainer sur cette question
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full justify-center"
                              onClick={() => {
                                setSimulateurQuestion(q);
                                setSimulateurReponse(q.conseil_reponse);
                                setSimulateurResultat(null);
                              }}
                            >
                              Pre-remplir le simulateur
                            </Button>
                          </div>
                        </aside>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </section>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Synthese rapide</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Questions</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{dossier.questions.length}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Source</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{dossier.source === "fallback" ? "Fallback" : "IA"}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Regeneration</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{dossier.can_regenerate ? "Possible" : "Utilisee"}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Statut</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Pret</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mode d&apos;emploi</p>
            <div className="mt-3 space-y-3 text-sm text-gray-700">
              <p>Ouvrez une question pour lire le conseil et les pieges a eviter.</p>
              <p>Lancez le simulateur depuis la carte ouverte pour tester votre reponse.</p>
              <p>Utilisez le pre-remplissage si vous voulez partir du conseil sans repartir de zero.</p>
            </div>
          </Card>

        </aside>
      </div>

      {simulateurQuestion ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="simulateur-title"
          onClick={fermerSimulateur}
        >
          <Card
            className="w-full max-w-3xl overflow-hidden p-0 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Simulateur d&apos;entretien</p>
                  <h2 id="simulateur-title" className="mt-1 text-xl font-semibold text-gray-900">
                    Entrainement sur la question
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={fermerSimulateur}
                  className="rounded-full px-3 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  Fermer
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-700">{simulateurQuestion.question}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIE_COLORS[simulateurQuestion.categorie]}`}>
                  {CATEGORIE_LABELS[simulateurQuestion.categorie]}
                </span>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  Probabilite : {simulateurQuestion.probabilite}
                </span>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[1.3fr_0.9fr]">
              <div className="border-r border-gray-200 p-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="simulateur-reponse">
                  Votre reponse
                </label>
                <textarea
                  id="simulateur-reponse"
                  value={simulateurReponse}
                  onChange={(event) => setSimulateurReponse(event.target.value)}
                  placeholder="Redigez votre reponse ici..."
                  className="min-h-56 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setSimulateurEnCours(true);
                      analyserReponse();
                    }}
                    disabled={simulateurEnCours || !simulateurReponse.trim()}
                    size="sm"
                  >
                    Analyser ma reponse
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setSimulateurReponse(simulateurQuestion.conseil_reponse)}>
                    Utiliser le conseil
                  </Button>
                  <Button variant="ghost" size="sm" onClick={fermerSimulateur}>
                    Fermer
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Conseil du dossier</p>
                <p className="mt-2 text-sm text-gray-800">{simulateurQuestion.conseil_reponse}</p>

                {simulateurQuestion.exemple_amorce ? (
                  <div className="mt-5 rounded-xl border border-purple-100 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Exemple d&apos;amorce</p>
                    <p className="mt-2 text-sm italic text-gray-700">{simulateurQuestion.exemple_amorce}</p>
                  </div>
                ) : null}

                {simulateurResultat ? (
                  <div className="mt-5 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resultat</p>
                        <p className="text-lg font-semibold text-gray-900">{simulateurResultat.verdict}</p>
                      </div>
                      <div className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
                        {simulateurResultat.score}/100
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Points forts</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {simulateurResultat.points_forts.length > 0 ? (
                          simulateurResultat.points_forts.map((point) => <li key={point}>{point}</li>)
                        ) : (
                          <li>Reponse en cours d&apos;evaluation.</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Axes d&apos;amelioration</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {simulateurResultat.axes_amelioration.length > 0 ? (
                          simulateurResultat.axes_amelioration.map((point) => <li key={point}>{point}</li>)
                        ) : (
                          <li>Très bonne structure globale.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                    Redigez une reponse puis lancez l&apos;analyse pour obtenir un retour immediat.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
