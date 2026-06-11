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
        throw new Error(data.message || "Unable to load interview tests.");
      }
      setTests(Array.isArray(data.donnees) ? data.donnees : []);
      setErreur(null);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Unable to load interview tests.");
    } finally {
      setLoading(false);
    }
  };

  const chargerTest = async (id: string) => {
    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/tests-entretien/candidat/${id}`));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to load this test.");
      }
      setTestActif(data.donnees);
      setReponses({});
      setMessage(null);
      setErreur(null);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Unable to load this test.");
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
        throw new Error(data.message || "Unable to submit the test.");
      }

      setMessage("Interview test submitted successfully.");
      setTestActif(null);
      await chargerTests();
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Unable to submit the test.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState title="Loading interview tests" description="Preparing the next exercises attached to your recruitment journey." />
      </main>
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        badge="Interview tests"
        title="Practice focus, clarity, and confidence before the interview."
        description="Some companies add interview exercises to better understand your thinking, communication, or role-specific approach."
        actions={<Button variant="secondary" onClick={() => void chargerTests()}>Refresh</Button>}
      />

      {message ? <div className="message message-info">{message}</div> : null}
      {erreur ? <div className="message message-erreur">{erreur}</div> : null}

      <div className="surface-grid surface-grid-2">
        <Card padding="lg">
          <div className="stack-lg">
            <div className="candidate-section-title">
              <div>
                <h2>Available exercises</h2>
                <p>Select a test when you are ready to answer in a calm and focused setting.</p>
              </div>
            </div>

            {tests.length === 0 ? (
              <EmptyState title="No interview tests right now" description="When a company assigns an exercise, it will appear here." />
            ) : (
              <div className="list-stack">
                {tests.map((test) => (
                  <Card key={test.id} padding="md" interactive>
                    <div className="stack-lg">
                      <div>
                        <p className="badge">Exercise</p>
                        <strong style={{ display: "block", fontSize: "1.12rem" }}>{test.titre}</strong>
                        <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
                          Opportunity reference: {test.id_offre}
                        </p>
                      </div>
                      <div className="page-header-actions">
                        <Button onClick={() => void chargerTest(test.id)}>Start test</Button>
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
                  <p>Answer each question as clearly as possible. You can move at your own pace.</p>
                </div>
                <Button variant="ghost" onClick={() => setTestActif(null)} disabled={submitting}>
                  Close
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
                  Cancel
                </Button>
                <Button onClick={() => void soumettre()} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit answers"}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Open a test to begin"
              description="The selected exercise will appear here with a cleaner reading area and calmer answer flow."
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
