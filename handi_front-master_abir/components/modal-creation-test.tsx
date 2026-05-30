"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

const styles = `
  .test-create-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(26, 18, 43, 0.42);
    backdrop-filter: blur(8px);
  }

  .test-create-modal-card {
    width: min(980px, 100%);
    max-height: min(88vh, 980px);
    overflow: auto;
    border-radius: 20px;
    border: 1px solid #eee8f8;
    background: #ffffff;
    box-shadow: 0 28px 70px rgba(31, 18, 49, 0.24);
  }

  .test-create-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 28px 32px 18px;
    border-bottom: 1px solid #ece7f6;
  }

  .test-create-kicker {
    margin: 0 0 6px;
    color: #6b5b86;
    font-size: 0.84rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .test-create-title {
    margin: 0;
    color: #201338;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.12;
  }

  .test-create-subtitle {
    margin: 8px 0 0;
    color: #5a4a76;
    font-size: 1rem;
    line-height: 1.4;
  }

  .test-create-close {
    min-height: 48px;
    border-radius: 18px;
    border: 1px solid #d8cde9;
    padding: 0 18px;
    background: #f4eefb;
    color: #3d1a67;
    font-size: 1.02rem;
    font-weight: 800;
  }

  .test-create-progress {
    padding: 14px 32px 0;
    display: grid;
    gap: 8px;
  }

  .test-create-progress-track {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .test-create-progress-track span {
    height: 8px;
    border-radius: 999px;
    background: #e9e2f8;
  }

  .test-create-progress-track span.active {
    background: linear-gradient(135deg, #6f33ef, #4f28df);
  }

  .test-create-progress-label {
    color: #6a5a88;
    font-size: 0.84rem;
    font-weight: 700;
  }

  .test-create-modal-body {
    padding: 22px 32px 26px;
    display: grid;
    gap: 16px;
  }

  .test-create-error {
    border: 1px solid #f2c5c5;
    background: #fff2f2;
    color: #af2f2f;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 700;
    font-size: 0.92rem;
  }

  .test-create-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .test-create-field {
    display: grid;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #fbf9ff;
    border: 1px solid #eee8f8;
  }

  .test-create-field--full {
    grid-column: 1 / -1;
  }

  .test-create-field label {
    color: #201338;
    font-size: 0.94rem;
    font-weight: 800;
  }

  .test-create-field input,
  .test-create-field select,
  .test-create-field textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #ddd5ea;
    background: #fff;
    color: #201338;
    padding: 11px 14px;
    outline: none;
    font-size: 0.94rem;
    font-weight: 600;
  }

  .test-create-field input:focus,
  .test-create-field select:focus,
  .test-create-field textarea:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }

  .test-create-questions-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .test-create-questions-title {
    margin: 0;
    color: #201338;
    font-size: 1.08rem;
    font-weight: 800;
  }

  .test-create-btn {
    min-height: 44px;
    border-radius: 14px;
    border: 1px solid #ddd5ea;
    padding: 0 16px;
    font-size: 0.92rem;
    font-weight: 800;
    background: #ffffff;
    color: #2b1b4e;
    white-space: nowrap;
  }

  .test-create-btn--primary {
    border-color: #3d0456;
    color: #ffffff;
    background: #3f005b;
    box-shadow: 0 12px 24px rgba(63, 0, 91, 0.24);
  }

  .test-create-btn--soft {
    background: #f6f0ff;
    border-color: #eadfff;
    color: #6326ee;
  }

  .test-create-btn:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .test-create-empty {
    border: 1px dashed #d8cde9;
    border-radius: 14px;
    padding: 20px;
    color: #6a5a88;
    text-align: center;
    font-weight: 700;
    background: #fbf9ff;
  }

  .test-create-modal-footer {
    padding: 0 32px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .test-create-modal-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    align-items: center;
  }

  @media (max-width: 900px) {
    .test-create-modal-header,
    .test-create-progress,
    .test-create-modal-body,
    .test-create-modal-footer {
      padding-left: 18px;
      padding-right: 18px;
    }

    .test-create-title {
      font-size: 1.55rem;
    }

    .test-create-form-grid {
      grid-template-columns: 1fr;
    }
  }
`;

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  if (!isClient) return null;

  return createPortal(
    <div className="test-create-modal-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <style>{styles}</style>
      <section className="test-create-modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="test-create-modal-header">
          <div>
            <p className="test-create-kicker">Test creation</p>
            <h3 className="test-create-title">Create a psychological test</h3>
            <p className="test-create-subtitle">Step {etapeActuelle} of 2</p>
          </div>
          <button onClick={onCancel} className="test-create-close" type="button">
            Close
          </button>
        </header>

        <div className="test-create-progress">
          <div className="test-create-progress-track">
            <span className={etapeActuelle >= 1 ? "active" : ""}></span>
            <span className={etapeActuelle >= 2 ? "active" : ""}></span>
          </div>
          <span className="test-create-progress-label">
            {etapeActuelle === 1 ? "General information" : "Questions and scoring"}
          </span>
        </div>

        <div className="test-create-modal-body">
          {erreur ? <div className="test-create-error">{erreur}</div> : null}

          {etapeActuelle === 1 ? (
            <div className="test-create-form-grid">
              <div className="test-create-field">
                <label htmlFor="test-title">Test title</label>
                <input
                  id="test-title"
                  type="text"
                  value={formData.titre}
                  onChange={(event) => setFormData((prev) => ({ ...prev, titre: event.target.value }))}
                  placeholder="Example: Communication assessment"
                />
              </div>

              <div className="test-create-field">
                <label htmlFor="test-type">Test type</label>
                <select
                  id="test-type"
                  value={formData.type_test}
                  onChange={(event) => setFormData((prev) => ({ ...prev, type_test: event.target.value }))}
                >
                  <option value="soft_skills">Soft skills</option>
                  <option value="personnalite">Personality</option>
                  <option value="competences">Skills</option>
                </select>
              </div>

              <div className="test-create-field">
                <label htmlFor="test-duration">Duration (minutes)</label>
                <input
                  id="test-duration"
                  type="number"
                  value={formData.duree_minutes}
                  onChange={(event) => setFormData((prev) => ({ ...prev, duree_minutes: parseInt(event.target.value, 10) || 0 }))}
                  min="5"
                  max="180"
                />
              </div>

              <div className="test-create-field">
                <label htmlFor="test-start-date">Start date</label>
                <input
                  id="test-start-date"
                  type="date"
                  value={formData.date_debut_validite}
                  onChange={(event) => setFormData((prev) => ({ ...prev, date_debut_validite: event.target.value }))}
                />
              </div>

              <div className="test-create-field">
                <label htmlFor="test-end-date">End date</label>
                <input
                  id="test-end-date"
                  type="date"
                  value={formData.date_fin_validite}
                  onChange={(event) => setFormData((prev) => ({ ...prev, date_fin_validite: event.target.value }))}
                />
              </div>

              <div className="test-create-field test-create-field--full">
                <label htmlFor="test-description">Description</label>
                <textarea
                  id="test-description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  placeholder="Describe the goal of this test..."
                />
              </div>

              <div className="test-create-field test-create-field--full">
                <label htmlFor="test-instructions">Instructions</label>
                <textarea
                  id="test-instructions"
                  value={formData.instructions}
                  onChange={(event) => setFormData((prev) => ({ ...prev, instructions: event.target.value }))}
                  rows={4}
                  placeholder="Instructions for candidates..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="test-create-questions-top">
                <h4 className="test-create-questions-title">Test questions</h4>
                <button onClick={ajouterQuestion} className="test-create-btn test-create-btn--soft" type="button">
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

              {questions.length === 0 ? (
                <div className="test-create-empty">
                  No questions added yet. Click &quot;Add question&quot; to begin.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <footer className="test-create-modal-footer">
          <div>
            {etapeActuelle === 2 ? (
              <button onClick={() => setEtapeActuelle(1)} className="test-create-btn" type="button">
                Previous
              </button>
            ) : null}
          </div>

          <div className="test-create-modal-footer-actions">
            <button onClick={onCancel} className="test-create-btn" type="button">
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
                className="test-create-btn test-create-btn--primary"
                type="button"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={chargement}
                className="test-create-btn test-create-btn--primary"
                type="button"
              >
                {chargement ? "Creating..." : "Create test"}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
