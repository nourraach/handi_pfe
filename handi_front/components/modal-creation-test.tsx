"use client";

import { useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { QuestionEditor } from "./question-editor";

interface Question {
  contenu_question: string;
  type_question: "choix_multiple" | "vrai_faux" | "echelle_likert" | "texte_libre";
  score_question: number;
  ordre: number;
  obligatoire: boolean;
  options: Option[];
}

interface Option {
  texte_option: string;
  est_correcte: boolean;
  score_option: number;
  ordre: number;
}

interface ModalCreationTestProps {
  onSave: () => void;
  onCancel: () => void;
}

export function ModalCreationTest({ onSave, onCancel }: ModalCreationTestProps) {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    type_test: "soft_skills",
    duree_minutes: 30,
    date_debut_validite: new Date().toISOString().split("T")[0],
    date_fin_validite: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    instructions: "",
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [etapeActuelle, setEtapeActuelle] = useState(1);

  const ajouterQuestion = () => {
    const nouvelleQuestion: Question = {
      contenu_question: "",
      type_question: "choix_multiple",
      score_question: 10,
      ordre: questions.length + 1,
      obligatoire: true,
      options: [],
    };
    setQuestions([...questions, nouvelleQuestion]);
  };

  const modifierQuestion = (index: number, question: Partial<Question>) => {
    const nouvellesQuestions = [...questions];
    nouvellesQuestions[index] = { ...nouvellesQuestions[index], ...question };
    setQuestions(nouvellesQuestions);
  };

  const supprimerQuestion = (index: number) => {
    const nouvellesQuestions = questions.filter((_, i) => i !== index);
    nouvellesQuestions.forEach((question, i) => {
      question.ordre = i + 1;
    });
    setQuestions(nouvellesQuestions);
  };

  const ajouterOption = (questionIndex: number) => {
    const nouvellesQuestions = [...questions];
    const nouvelleOption: Option = {
      texte_option: "",
      est_correcte: false,
      score_option: 0,
      ordre: nouvellesQuestions[questionIndex].options.length + 1,
    };
    nouvellesQuestions[questionIndex].options.push(nouvelleOption);
    setQuestions(nouvellesQuestions);
  };

  const modifierOption = (questionIndex: number, optionIndex: number, option: Partial<Option>) => {
    const nouvellesQuestions = [...questions];
    nouvellesQuestions[questionIndex].options[optionIndex] = {
      ...nouvellesQuestions[questionIndex].options[optionIndex],
      ...option,
    };
    setQuestions(nouvellesQuestions);
  };

  const supprimerOption = (questionIndex: number, optionIndex: number) => {
    const nouvellesQuestions = [...questions];
    nouvellesQuestions[questionIndex].options = nouvellesQuestions[questionIndex].options.filter(
      (_, i) => i !== optionIndex,
    );
    nouvellesQuestions[questionIndex].options.forEach((option, i) => {
      option.ordre = i + 1;
    });
    setQuestions(nouvellesQuestions);
  };

  const validerEtape1 = () => {
    if (!formData.titre || !formData.description) {
      setErreur("The title and description are required.");
      return false;
    }
    if (new Date(formData.date_fin_validite) <= new Date(formData.date_debut_validite)) {
      setErreur("The end date must be later than the start date.");
      return false;
    }
    return true;
  };

  const validerEtape2 = () => {
    if (questions.length === 0) {
      setErreur("Add at least one question.");
      return false;
    }

    for (let i = 0; i < questions.length; i += 1) {
      const question = questions[i];
      if (!question.contenu_question) {
        setErreur(`Question ${i + 1} must include content.`);
        return false;
      }

      if (["choix_multiple", "vrai_faux"].includes(question.type_question)) {
        if (question.options.length === 0) {
          setErreur(`Question ${i + 1} must include at least one option.`);
          return false;
        }

        const optionsCorrectes = question.options.filter((option) => option.est_correcte);
        if (optionsCorrectes.length === 0) {
          setErreur(`Question ${i + 1} must include at least one correct option.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validerEtape2()) return;

    setChargement(true);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      const testData = {
        ...formData,
        date_debut_validite: new Date(formData.date_debut_validite).toISOString(),
        date_fin_validite: new Date(formData.date_fin_validite).toISOString(),
        questions,
      };

      const response = await fetch(construireUrlApi("/api/tests-psychologiques/admin/tests"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        onSave();
      } else {
        const resultat = await response.json();
        setErreur(resultat.message || "Unable to create the test.");
      }
    } catch {
      setErreur("Connection error.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Create a new test - Step {etapeActuelle}/2</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              x
            </button>
          </div>

          <div className="flex mt-4">
            <div className={`flex-1 h-2 rounded-l ${etapeActuelle >= 1 ? "bg-blue-600" : "bg-gray-200"}`}></div>
            <div className={`flex-1 h-2 rounded-r ${etapeActuelle >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>
          </div>
        </div>

        <div className="p-6">
          {erreur && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">{erreur}</div>}

          {etapeActuelle === 1 ? (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">General information</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test title</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(event) => setFormData((prev) => ({ ...prev, titre: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Example: Communication assessment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the goal of this test..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test type</label>
                  <select
                    value={formData.type_test}
                    onChange={(event) => setFormData((prev) => ({ ...prev, type_test: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="soft_skills">Soft skills</option>
                    <option value="personnalite">Personality</option>
                    <option value="competences">Skills</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duree_minutes}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, duree_minutes: parseInt(event.target.value, 10) }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="180"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                  <input
                    type="date"
                    value={formData.date_debut_validite}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, date_debut_validite: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                  <input
                    type="date"
                    value={formData.date_fin_validite}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, date_fin_validite: event.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(event) => setFormData((prev) => ({ ...prev, instructions: event.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instructions for candidates..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Test questions</h4>
                <button onClick={ajouterQuestion} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Add question
                </button>
              </div>

              {questions.map((question, questionIndex) => (
                <QuestionEditor
                  key={questionIndex}
                  question={question}
                  questionIndex={questionIndex}
                  onModifier={(q) => modifierQuestion(questionIndex, q)}
                  onSupprimer={() => supprimerQuestion(questionIndex)}
                  onAjouterOption={() => ajouterOption(questionIndex)}
                  onModifierOption={(optionIndex, option) => modifierOption(questionIndex, optionIndex, option)}
                  onSupprimerOption={(optionIndex) => supprimerOption(questionIndex, optionIndex)}
                />
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No questions added yet. Click "Add question" to begin.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {etapeActuelle === 2 && (
              <button
                onClick={() => setEtapeActuelle(1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Cancel
            </button>

            {etapeActuelle === 1 ? (
              <button
                onClick={() => {
                  if (validerEtape1()) {
                    setErreur(null);
                    setEtapeActuelle(2);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={chargement}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {chargement ? "Creating..." : "Create test"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
