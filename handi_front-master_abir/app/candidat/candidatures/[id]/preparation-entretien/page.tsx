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

export default function PreparationEntretienPage() {
  const params = useParams<{ id: string }>();
  const idCandidature = Array.isArray(params.id) ? params.id[0] : params.id;

  const [dossier, setDossier] = useState<DossierView | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState(false);

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

  // ---------------- Rendering ----------------

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-gray-600">Chargement de votre preparation...</p>
      </main>
    );
  }

  if (erreur) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
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
      <main className="mx-auto max-w-4xl px-4 py-10">
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
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Preparation en cours</h1>
          <p className="mt-2 text-gray-700">
            Votre dossier personnalise est en cours de generation. Vous serez notifie(e) des qu'il sera pret.
            Cette page se mettra a jour automatiquement.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Actualisation toutes les 10 secondes
          </div>
        </Card>
      </main>
    );
  }

  if (dossier.status === "failed") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Preparation d'entretien personnalisee</h1>
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
        <div className="mt-4 flex flex-wrap gap-2">
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
      </header>

      <section className="space-y-3" aria-label="Questions probables">
        {dossier.questions.map((q, idx) => {
          const isOpen = openIds.has(q.id);
          return (
            <Card key={q.id} className="overflow-hidden p-0">
              <button
                type="button"
                onClick={() => toggle(q.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">Q{idx + 1}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIE_COLORS[q.categorie]}`}
                    >
                      {CATEGORIE_LABELS[q.categorie]}
                    </span>
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Probabilite : {q.probabilite}
                    </span>
                  </div>
                  <p className="text-base font-medium text-gray-900">{q.question}</p>
                </div>
                <span className="mt-1 shrink-0 text-gray-400" aria-hidden>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="mb-4">
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Conseil de reponse
                    </h3>
                    <p className="text-sm text-gray-800">{q.conseil_reponse}</p>
                  </div>

                  {q.exemple_amorce && (
                    <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                        Exemple d'amorce
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
                    <div className="mb-4">
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

                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        alert("Le simulateur d'entretien sera disponible prochainement.")
                      }
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      → S'entrainer sur cette question
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </section>

      {dossier.handicap_block && (
        <section className="mt-8" aria-label="Section optionnelle handicap">
          <Card className="border-rose-100 bg-rose-50 p-5">
            <h2 className="text-lg font-semibold text-rose-900">{dossier.handicap_block.titre}</h2>
            {dossier.handicap_block.intro && (
              <p className="mt-2 text-sm text-rose-800">{dossier.handicap_block.intro}</p>
            )}
            <div className="mt-4 space-y-3">
              {dossier.handicap_block.questions.map((q, i) => (
                <div key={i} className="rounded-md bg-white p-4 ring-1 ring-rose-100">
                  <p className="font-medium text-gray-900">{q.question}</p>
                  <p className="mt-2 text-sm text-gray-700">{q.conseil_reponse}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </main>
  );
}
