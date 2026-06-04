"use client";

import { useEffect, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type Test = { id: string; titre: string; id_offre: string };
type Question = { id: string; texte: string; type: string; options?: string[] };

function CandidateInterviewTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [testActif, setTestActif] = useState<{ id: string; titre: string; questions: Question[] } | null>(null);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void chargerTests();
  }, []);

  const chargerTests = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(construireUrlApi("/api/tests-entretien/candidat"));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Impossible de charger les tests d'entretien.");
      }
      setTests(Array.isArray(data.donnees) ? data.donnees : []);
      setErreur(null);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger les tests d'entretien.");
    } finally {
      setLoading(false);
    }
  };

  const chargerTest = async (id: string) => {
    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/tests-entretien/candidat/${id}`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Impossible de charger ce test.");
      }
      setTestActif(data.donnees);
      setReponses({});
      setMessage(null);
      setErreur(null);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible de charger ce test.");
    }
  };

  const soumettre = async () => {
    if (!testActif) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await authenticatedFetch(construireUrlApi(`/api/tests-entretien/candidat/${testActif.id}/passer`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reponses: Object.entries(reponses).map(([id_question, valeur]) => ({
            id_question,
            reponse: valeur,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Impossible d'envoyer le test.");
      }

      setMessage("Test d'entretien envoyé avec succès.");
      setTestActif(null);
      await chargerTests();
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Impossible d'envoyer le test.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState title="Chargement des tests d'entretien" description="Préparation des prochains exercices liés à votre parcours de recrutement." />
      </main>
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        badge="Tests d'entretien"
        title="Préparez votre entretien avec plus de clarté et de confiance."
        description="Certaines entreprises ajoutent des exercices pour mieux comprendre votre raisonnement, votre communication ou votre approche du poste."
      />

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <div className="surface-grid surface-grid-2">
        <Card padding="lg">
          <div className="stack-lg">
            <div className="candidate-section-title">
              <div>
                <h2>Exercices disponibles</h2>
                <p>Sélectionnez un test quand vous êtes prêt à répondre dans un cadre calme et concentré.</p>
              </div>
            </div>

            {tests.length === 0 ? (
              <EmptyState title="Aucun test d'entretien pour le moment" description="Lorsqu'une entreprise vous attribuera un exercice, il apparaîtra ici." />
            ) : (
              <div className="list-stack">
                {tests.map((test) => (
                  <Card key={test.id} padding="md" interactive>
                    <div className="stack-lg">
                      <div>
                        <p className="badge">Exercice</p>
                        <strong style={{ display: "block", fontSize: "1.12rem" }}>{test.titre}</strong>
                        <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                          Référence de l&apos;offre : {test.id_offre}
                        </p>
                      </div>
                      <div className="page-header-actions">
                        <Button onClick={() => void chargerTest(test.id)}>Commencer le test</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          {testActif ? (
            <div className="stack-lg">
              <div className="candidate-section-title">
                <div>
                  <h2>{testActif.titre}</h2>
                  <p>Répondez à chaque question aussi clairement que possible. Vous pouvez avancer à votre rythme.</p>
                </div>
                <Button variant="ghost" onClick={() => setTestActif(null)} disabled={submitting} aria-label="Fermer">
                  ✕
                </Button>
              </div>

              <div className="list-stack">
                {testActif.questions?.map((question, index) => (
                  <Card key={question.id} padding="md">
                    <div className="stack-lg">
                      <div>
                        <p className="badge">Question {index + 1}</p>
                        <strong style={{ display: "block", fontSize: "1.05rem" }}>{question.texte}</strong>
                      </div>

                      {question.type === "choix" ? (
                        <div className="list-stack">
                          {question.options?.map((option) => (
                            <label key={option} className="detail-box" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                onChange={(event) =>
                                  setReponses((prev) => ({ ...prev, [question.id]: event.target.value }))
                                }
                                checked={reponses[question.id] === option}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="champ-zone"
                          rows={5}
                          value={reponses[question.id] || ""}
                          onChange={(event) =>
                            setReponses((prev) => ({ ...prev, [question.id]: event.target.value }))
                          }
                        />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="page-header-actions" style={{ justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={() => setTestActif(null)} disabled={submitting}>
                  Annuler
                </Button>
                <Button onClick={() => void soumettre()} disabled={submitting}>
                  {submitting ? "Envoi..." : "Envoyer les réponses"}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Ouvrez un test pour commencer"
              description="L'exercice sélectionné apparaîtra ici avec une zone de lecture claire et un parcours de réponse plus simple."
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ProtectedCandidateInterviewTestsPage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <CandidateInterviewTestsPage />
    </RouteProtegee>
  );
}
