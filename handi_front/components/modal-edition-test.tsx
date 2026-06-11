"use client";

import { useState } from "react";
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

interface ModalEditionTestProps {
  test: TestPsychologique;
  onSave: () => void;
  onCancel: () => void;
}

export function ModalEditionTest({ test, onSave, onCancel }: ModalEditionTestProps) {
  const [formData, setFormData] = useState({
    titre: test.titre,
    description: test.description,
    type_test: test.type_test,
    duree_minutes: test.duree_minutes,
    statut: test.statut,
    date_debut_validite: new Date(test.date_debut_validite).toISOString().split("T")[0],
    date_fin_validite: new Date(test.date_fin_validite).toISOString().split("T")[0],
    instructions: "",
  });

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (new Date(formData.date_fin_validite) <= new Date(formData.date_debut_validite)) {
      setErreur("The end date must be later than the start date.");
      return;
    }

    setChargement(true);
    setErreur(null);

    try {
      const token = localStorage.getItem("token_auth");
      const testData = {
        ...formData,
        date_debut_validite: new Date(formData.date_debut_validite).toISOString(),
        date_fin_validite: new Date(formData.date_fin_validite).toISOString(),
      };

      const response = await fetch(construireUrlApi(`/api/tests-psychologiques/admin/tests/${test.id_test}`), {
        method: "PUT",
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
        setErreur(resultat.message || "Unable to update the test.");
      }
    } catch {
      setErreur("Connection error.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Edit test</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              x
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {erreur && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">{erreur}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test title</label>
              <input
                type="text"
                value={formData.titre}
                onChange={(event) => setFormData((prev) => ({ ...prev, titre: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.statut}
                  onChange={(event) => setFormData((prev) => ({ ...prev, statut: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="actif">Active</option>
                  <option value="inactif">Inactive</option>
                  <option value="brouillon">Draft</option>
                </select>
              </div>
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
                required
              />
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
                  required
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
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={chargement}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {chargement ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
