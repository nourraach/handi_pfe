"use client";

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

interface QuestionEditorProps {
  question: Question;
  questionIndex: number;
  onModifier: (question: Partial<Question>) => void;
  onSupprimer: () => void;
  onAjouterOption: () => void;
  onModifierOption: (optionIndex: number, option: Partial<Option>) => void;
  onSupprimerOption: (optionIndex: number) => void;
}

export function QuestionEditor({
  question,
  questionIndex,
  onModifier,
  onSupprimer,
  onAjouterOption,
  onModifierOption,
  onSupprimerOption,
}: QuestionEditorProps) {
  const typesQuestions = [
    { value: "choix_multiple", label: "Choix multiple" },
    { value: "vrai_faux", label: "Vrai / Faux" },
    { value: "echelle_likert", label: "Échelle de Likert (1-5)" },
    { value: "texte_libre", label: "Texte libre" },
  ];

  const genererOptionsVraiFaux = () => {
    const options: Option[] = [
      {
        texte_option: "Vrai",
        est_correcte: true,
        score_option: question.score_question,
        ordre: 1,
      },
      {
        texte_option: "Faux",
        est_correcte: false,
        score_option: 0,
        ordre: 2,
      },
    ];
    onModifier({ options });
  };

  const genererOptionsLikert = () => {
    const options: Option[] = [
      { texte_option: "1 - Pas du tout d'accord", est_correcte: false, score_option: 1, ordre: 1 },
      { texte_option: "2 - Pas d'accord", est_correcte: false, score_option: 2, ordre: 2 },
      { texte_option: "3 - Neutre", est_correcte: false, score_option: 3, ordre: 3 },
      { texte_option: "4 - D'accord", est_correcte: false, score_option: 4, ordre: 4 },
      { texte_option: "5 - Tout à fait d'accord", est_correcte: false, score_option: 5, ordre: 5 },
    ];
    onModifier({ options });
  };

  const handleTypeChange = (nouveauType: string) => {
    onModifier({ type_question: nouveauType as Question["type_question"] });

    if (nouveauType === "vrai_faux") {
      genererOptionsVraiFaux();
    } else if (nouveauType === "echelle_likert") {
      genererOptionsLikert();
    } else if (nouveauType === "texte_libre") {
      onModifier({ options: [] });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-4">
        <h5 className="font-medium text-gray-900">Question {questionIndex + 1}</h5>
        <button onClick={onSupprimer} className="text-red-600 hover:text-red-800 text-sm">
          Supprimer
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu de la question *</label>
          <textarea
            value={question.contenu_question}
            onChange={(event) => onModifier({ contenu_question: event.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rédigez votre question..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de question</label>
            <select
              value={question.type_question}
              onChange={(event) => handleTypeChange(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {typesQuestions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score maximum</label>
            <input
              type="number"
              value={question.score_question}
              onChange={(event) => onModifier({ score_question: parseInt(event.target.value, 10) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={question.obligatoire}
                onChange={(event) => onModifier({ obligatoire: event.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Question obligatoire</span>
            </label>
          </div>
        </div>

        {["choix_multiple", "vrai_faux", "echelle_likert"].includes(question.type_question) && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Options de réponse</label>
              {question.type_question === "choix_multiple" && (
                <button onClick={onAjouterOption} className="text-sm text-blue-600 hover:text-blue-800">
                  Ajouter une option
                </button>
              )}
            </div>

            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2 bg-white p-2 rounded border">
                  <input
                    type="text"
                    value={option.texte_option}
                    onChange={(event) => onModifierOption(optionIndex, { texte_option: event.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Texte de l'option"
                    disabled={question.type_question === "echelle_likert"}
                  />

                  {question.type_question !== "echelle_likert" && (
                    <>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={option.est_correcte}
                          onChange={(event) => onModifierOption(optionIndex, { est_correcte: event.target.checked })}
                          className="mr-1"
                        />
                        Correcte
                      </label>

                      <input
                        type="number"
                        value={option.score_option}
                        onChange={(event) => onModifierOption(optionIndex, { score_option: parseInt(event.target.value, 10) || 0 })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Score"
                        min="0"
                      />
                    </>
                  )}

                  {question.type_question === "choix_multiple" && (
                    <button onClick={() => onSupprimerOption(optionIndex)} className="text-red-600 hover:text-red-800 text-sm">
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>

            {question.type_question === "vrai_faux" && question.options.length === 0 && (
              <button onClick={genererOptionsVraiFaux} className="text-sm text-blue-600 hover:text-blue-800">
                Générer les options Vrai / Faux
              </button>
            )}
          </div>
        )}

        {question.type_question === "texte_libre" && (
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              Les questions à texte libre reçoivent automatiquement le score complet ({question.score_question} points). Vous pouvez
              ajuster la notation manuellement plus tard si nécessaire.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
