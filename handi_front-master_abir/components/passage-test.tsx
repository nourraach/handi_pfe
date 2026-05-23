"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { construireUrlApi } from "@/lib/config";

interface Question {
  id_question: string;
  contenu_question: string;
  type_question: "choix_multiple" | "vrai_faux" | "echelle_likert" | "texte_libre";
  ordre: number;
  obligatoire: boolean;
  options: Option[];
}

interface Option {
  id_option: string;
  texte_option: string;
  ordre: number;
}

interface Test {
  id_test: string;
  titre: string;
  description: string;
  duree_minutes: number;
  instructions: string;
  questions: Question[];
}

interface PassageTestProps {
  test: Test;
  onTerminer: () => void;
  onAnnuler: () => void;
}

export function PassageTest({ test, onTerminer, onAnnuler }: PassageTestProps) {
  const questions = useMemo<Question[]>(() => {
    const source = Array.isArray(test.questions) ? test.questions : [];

    return source
      .filter((question): question is Question => Boolean(question?.id_question))
      .map((question, index) => ({
        ...question,
        ordre: Number.isFinite(Number(question.ordre)) ? Number(question.ordre) : index + 1,
        obligatoire: Boolean(question.obligatoire),
        options: Array.isArray(question.options)
          ? question.options
              .filter((option): option is Option => Boolean(option?.id_option))
              .map((option, optionIndex) => ({
                ...option,
                ordre: Number.isFinite(Number(option.ordre)) ? Number(option.ordre) : optionIndex + 1,
              }))
          : [],
      }))
      .sort((a, b) => a.ordre - b.ordre);
  }, [test.questions]);

  const totalQuestions = questions.length;
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [questionActuelle, setQuestionActuelle] = useState(0);
  const [tempsRestant, setTempsRestant] = useState(Math.max(60, Number(test.duree_minutes || 0) * 60));
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tempsDebut] = useState(Date.now());

  const formatTemps = (secondes: number) => {
    const minutes = Math.floor(secondes / 60);
    const secs = secondes % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const enregistrerReponse = (idQuestion: string, reponse: string) => {
    setReponses((prev) => ({
      ...prev,
      [idQuestion]: reponse,
    }));
  };

  const questionSuivante = () => {
    if (questionActuelle < totalQuestions - 1) {
      setQuestionActuelle((prev) => prev + 1);
    }
  };

  const questionPrecedente = () => {
    if (questionActuelle > 0) {
      setQuestionActuelle((prev) => prev - 1);
    }
  };

  const allerALaQuestion = (index: number) => {
    setQuestionActuelle(index);
  };

  const soumettreTest = useCallback(async () => {
    setChargement(true);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      const tempsPasseMinutes = Math.max(1, Math.round((Date.now() - tempsDebut) / (1000 * 60)));

      const reponsesFormatees = Object.entries(reponses).map(([idQuestion, reponse]) => {
        const question = questions.find((item) => item.id_question === idQuestion);

        if (question?.type_question === "texte_libre") {
          return {
            id_question: idQuestion,
            reponse_texte: reponse,
          };
        }

        return {
          id_question: idQuestion,
          id_option: reponse,
        };
      });

      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/tests/${test.id_test}/soumettre`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reponses: reponsesFormatees,
            temps_passe_minutes: tempsPasseMinutes,
          }),
        },
      );

      if (response.ok) {
        onTerminer();
      } else {
        const resultat = await response.json();
        setErreur(resultat.message || "Unable to submit the test.");
      }
    } catch {
      setErreur("Connection error.");
    } finally {
      setChargement(false);
    }
  }, [onTerminer, questions, reponses, tempsDebut, test.id_test]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTempsRestant((prev) => {
        if (prev <= 1) {
          void soumettreTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [soumettreTest]);

  const validerReponses = () => {
    const questionsObligatoires = questions.filter((question) => question.obligatoire);
    const reponsesManquantes = questionsObligatoires.filter((question) => !reponses[question.id_question]);

    if (reponsesManquantes.length > 0) {
      setErreur(
        `Please answer the required questions: ${reponsesManquantes.map((question) => question.ordre).join(", ")}`,
      );
      return false;
    }

    const tempsPasseMinutes = Math.max(1, Math.round((Date.now() - tempsDebut) / (1000 * 60)));
    if (tempsPasseMinutes <= 0) {
      setErreur("The recorded time is invalid. Please wait at least one minute before submitting.");
      return false;
    }

    return true;
  };

  const handleSoumettre = () => {
    if (validerReponses()) {
      if (confirm("Are you sure you want to submit this test? This action cannot be undone.")) {
        void soumettreTest();
      }
    }
  };

  const question = questions[questionActuelle];
  const progression = totalQuestions > 0 ? ((questionActuelle + 1) / totalQuestions) * 100 : 0;

  if (!question || totalQuestions === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900">{test.titre}</h1>
            <p className="text-sm text-gray-600 mt-3">
              This test has no valid questions available right now.
            </p>
            <button
              type="button"
              onClick={onAnnuler}
              className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{test.titre}</h1>
              <p className="text-sm text-gray-600">
                Question {questionActuelle + 1} of {totalQuestions}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-lg font-mono ${tempsRestant < 300 ? "text-red-600" : "text-gray-700"}`}>
                {formatTemps(tempsRestant)}
              </div>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to leave this test?")) {
                    onAnnuler();
                  }
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Leave test
              </button>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progression}%` }}></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
                <h3 className="font-medium text-gray-900 mb-3">Navigation</h3>
                <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                  {questions.map((item, index) => (
                    <button
                      key={item.id_question}
                      onClick={() => allerALaQuestion(index)}
                      className={`w-8 h-8 rounded text-sm font-medium ${
                        index === questionActuelle
                          ? "bg-blue-600 text-white"
                          : reponses[item.id_question]
                            ? "bg-green-100 text-green-800"
                            : item.obligatoire
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                    Answered
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                    Current
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-50 border border-red-200 rounded mr-2"></div>
                    Required
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                {erreur && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
                    {erreur}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-gray-500">Question {question.ordre}</span>
                    {question.obligatoire && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{question.contenu_question}</h2>
                </div>

                <div className="space-y-3">
                  {question.type_question === "texte_libre" ? (
                    <textarea
                      value={reponses[question.id_question] || ""}
                      onChange={(event) => enregistrerReponse(question.id_question, event.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type your answer..."
                    />
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id_option}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question_${question.id_question}`}
                            value={option.id_option}
                            checked={reponses[question.id_question] === option.id_option}
                            onChange={(event) => enregistrerReponse(question.id_question, event.target.value)}
                            className="mr-3"
                          />
                          <span className="text-gray-900">{option.texte_option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={questionPrecedente}
                    disabled={questionActuelle === 0}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="text-sm text-gray-500">
                    {Object.keys(reponses).length} / {totalQuestions} answers
                  </div>

                  {questionActuelle === totalQuestions - 1 ? (
                    <button
                      onClick={handleSoumettre}
                      disabled={chargement}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {chargement ? "Submitting..." : "Finish test"}
                    </button>
                  ) : (
                    <button onClick={questionSuivante} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
