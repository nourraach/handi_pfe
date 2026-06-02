"use client";

import { useCallback, useEffect, useState } from "react";
import { construireUrlApi } from "@/lib/config";
import { ModalCreationTest } from "./modal-creation-test";
import { ModalEditionTest } from "./modal-edition-test";
import { ModalStatistiques } from "./modal-statistiques";

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

export function GestionTestsPsychologiques() {
  const [tests, setTests] = useState<TestPsychologique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modeCreation, setModeCreation] = useState(false);
  const [testSelectionne, setTestSelectionne] = useState<TestPsychologique | null>(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [modeStatistiques, setModeStatistiques] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const testsParPage = 10;

  const chargerTests = useCallback(async () => {
    setChargement(true);

    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/admin/tests?page=${page}&limit=${testsParPage}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setTests(data.donnees.tests || []);
        setTotalPages(data.donnees.pagination?.totalPages || 1);
      } else {
        setErreur("Unable to load tests.");
      }
    } catch {
      setErreur("Connection error.");
    } finally {
      setChargement(false);
    }
  }, [page]);

  useEffect(() => {
    void chargerTests();
  }, [chargerTests]);

  const supprimerTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi(`/api/tests-psychologiques/admin/tests/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setMessage("Test deleted successfully.");
        await chargerTests();
      } else {
        const resultat = await response.json();
        setErreur(resultat.message || "Unable to delete the test.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const changerStatut = async (id: string, nouveauStatut: string) => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(construireUrlApi(`/api/tests-psychologiques/admin/tests/${id}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      });

      if (response.ok) {
        setMessage(`Test ${nouveauStatut === "actif" ? "activated" : "deactivated"} successfully.`);
        await chargerTests();
      } else {
        const resultat = await response.json();
        setErreur(resultat.message || "Unable to change the test status.");
      }
    } catch {
      setErreur("Connection error.");
    }
  };

  const traduireStatut = (statut: string) => {
    const labels: Record<string, string> = {
      actif: "Active",
      inactif: "Inactive",
      brouillon: "Draft",
    };
    return labels[statut] || statut;
  };

  const traduireType = (type: string) => {
    const labels: Record<string, string> = {
      soft_skills: "Soft skills",
      personnalite: "Personality",
      competences: "Skills",
    };
    return labels[type] || type;
  };

  return (
    <div className="admin-tests-container">
      {message && (
        <div className="message message-success">
          {message}
          <button onClick={() => setMessage(null)} className="message-close">×</button>
        </div>
      )}
      {erreur && (
        <div className="message message-error">
          {erreur}
          <button onClick={() => setErreur(null)} className="message-close">×</button>
        </div>
      )}

      <div className="tests-grid-container">
        <div className="tests-header">
          <div className="tests-header-copy">
            <h3 className="tests-count">Tests psychologiques</h3>
            <span className="tests-count-chip">{tests.length} test(s)</span>
          </div>
          <div className="tests-header-actions">
            <button type="button" onClick={() => setModeCreation(true)} className="create-test-btn">
              Créer un test
            </button>
            {totalPages > 1 && (
            <div className="pagination-controls">
              <span className="page-info">Page {page} of {totalPages}</span>
              <div className="pagination-buttons">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  ←
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="pagination-btn"
                >
                  →
                </button>
              </div>
            </div>
            )}
          </div>
        </div>

        {chargement ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No tests available</h3>
              <p>Create your first psychological test to get started</p>
              <button onClick={() => setModeCreation(true)} className="empty-action-btn">
              Créer un test
              </button>
            </div>
        ) : (
          <div className="tests-grid">
            {tests.map((test) => (
              <div key={test.id_test} className="test-card">
                <div className="test-card-header">
                  <div className="test-info">
                    <h4 className="test-title">{test.titre}</h4>
                    <p className="test-description">{test.description}</p>
                  </div>
                  <div className={`status-badge status-${test.statut}`}>
                    {traduireStatut(test.statut)}
                  </div>
                </div>

                <div className="test-meta">
                  <div className="meta-item">
                    <span className="meta-label">Type</span>
                    <span className={`type-badge type-${test.type_test}`}>
                      {traduireType(test.type_test)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Duration</span>
                    <span className="meta-value">{test.duree_minutes} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Max Score</span>
                    <span className="meta-value">{test.score_total}</span>
                  </div>
                </div>

                <div className="test-validity">
                  <div className="validity-item">
                    <span className="validity-label">Valid from</span>
                    <span className="validity-date">
                      {new Date(test.date_debut_validite).toLocaleDateString("en-US")}
                    </span>
                  </div>
                  <div className="validity-item">
                    <span className="validity-label">Valid until</span>
                    <span className="validity-date">
                      {new Date(test.date_fin_validite).toLocaleDateString("en-US")}
                    </span>
                  </div>
                </div>

                <div className="test-actions">
                  <button
                    onClick={() => {
                      setTestSelectionne(test);
                      setModeEdition(true);
                    }}
                    className="action-btn edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setTestSelectionne(test);
                      setModeStatistiques(true);
                    }}
                    className="action-btn stats-btn"
                  >
                    Stats
                  </button>
                  {test.statut === "actif" ? (
                    <button
                      onClick={() => void changerStatut(test.id_test, "inactif")}
                      className="action-btn deactivate-btn"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => void changerStatut(test.id_test, "actif")}
                      className="action-btn activate-btn"
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    onClick={() => void supprimerTest(test.id_test)} 
                    className="action-btn delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modeCreation && (
        <ModalCreationTest
          onSave={() => {
            setModeCreation(false);
            void chargerTests();
            setMessage("Test created successfully.");
          }}
          onCancel={() => setModeCreation(false)}
        />
      )}

      {modeEdition && testSelectionne && (
        <ModalEditionTest
          test={testSelectionne}
          onSave={() => {
            setModeEdition(false);
            setTestSelectionne(null);
            void chargerTests();
            setMessage("Test updated successfully.");
          }}
          onCancel={() => {
            setModeEdition(false);
            setTestSelectionne(null);
          }}
        />
      )}

      {modeStatistiques && testSelectionne && (
        <ModalStatistiques
          test={testSelectionne}
          onClose={() => {
            setModeStatistiques(false);
            setTestSelectionne(null);
          }}
        />
      )}

      <style jsx>{`
        .admin-tests-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-height: calc(100vh - 200px);
          overflow: hidden;
        }

        .message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-radius: var(--app-radius-md);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .message-success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
          color: #059669;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .message-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .message-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .message-close:hover {
          opacity: 1;
        }

        .tests-grid-container {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.022), transparent),
            rgba(18,13,31,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: var(--app-radius-lg);
          padding: 1.15rem;
          box-shadow: 0 24px 58px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }

        .tests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-shrink: 0;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .tests-header-copy {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .tests-header-actions {
          display: inline-flex;
          align-items: center;
          gap: 0.85rem;
          margin-left: auto;
          flex-wrap: wrap;
        }

        .tests-count {
          margin: 0;
          font-size: 1.1rem;
          font-family: var(--app-heading);
          color: #f3eefc;
          font-weight: 600;
        }

        .tests-count-chip {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(45,23,77,0.48);
          border: 1px solid rgba(138,99,210,0.18);
          color: #d8c8f1;
          font-size: 0.76rem;
          font-weight: 800;
        }

        .create-test-btn {
          min-height: 40px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0 14px;
          background: linear-gradient(135deg, #43236a, var(--admin-purple));
          color: #fff;
          font-size: 0.86rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 14px 34px rgba(45,23,77,0.26);
        }

        .create-test-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 38px rgba(45,23,77,0.32);
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .page-info {
          font-size: 0.9rem;
          color: rgba(216,208,255,0.66);
        }

        .pagination-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .pagination-btn {
          width: 2rem;
          height: 2rem;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(19,16,33,0.92);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pagination-btn:hover:not(:disabled) {
          background: rgba(45,23,77,0.72);
          transform: translateY(-1px);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(255,255,255,0.08);
          border-top: 3px solid var(--admin-glow);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.2rem;
          text-align: center;
          min-height: 320px;
          color: rgba(216,208,255,0.72);
        }

        .empty-icon {
          font-size: 2.6rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          color: #fff;
          font-weight: 600;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          color: rgba(216,208,255,0.66);
        }

        .empty-action-btn {
          padding: 0.7rem 1.35rem;
          background: linear-gradient(135deg, #43236a, var(--admin-purple));
          color: white;
          border: none;
          border-radius: 999px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--app-shadow);
        }

        .tests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .test-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.028), transparent),
            rgba(13,9,23,0.88);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: var(--app-radius-md);
          padding: 1.15rem;
          box-shadow: 0 24px 58px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.03);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .test-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 26px 64px rgba(0,0,0,0.38);
          border-color: rgba(138,99,210,0.24);
        }

        .test-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .test-title {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.28;
        }

        .test-description {
          margin: 0;
          font-size: 0.88rem;
          color: rgba(216,208,255,0.66);
          line-height: 1.4;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .status-actif {
          background: rgba(34,197,94,0.12);
          color: #80d8a0;
        }

        .status-inactif {
          background: rgba(255,255,255,0.06);
          color: rgba(216,208,255,0.72);
        }

        .status-brouillon {
          background: rgba(217,120,7,0.16);
          color: #f4bf73;
        }

        .test-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
        }

        .meta-item {
          text-align: center;
        }

        .meta-label {
          display: block;
          font-size: 0.7rem;
          color: rgba(216,208,255,0.58);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .meta-value {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
        }

        .type-badge {
          display: block;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .type-soft_skills {
          background: rgba(91,45,145,0.18);
          color: #d9c8f5;
        }

        .type-personnalite {
          background: rgba(109,61,187,0.18);
          color: #e4d8f8;
        }

        .type-competences {
          background: rgba(217,120,7,0.16);
          color: #f4bf73;
        }

        .test-validity {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          padding: 0.7rem;
          background: rgba(13,9,23,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
        }

        .validity-item {
          text-align: center;
        }

        .validity-label {
          display: block;
          font-size: 0.7rem;
          color: rgba(216,208,255,0.58);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .validity-date {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #fff;
        }

        .test-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .action-btn {
          flex: 1;
          min-width: 0;
          padding: 0.45rem 0.7rem;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(19,16,33,0.9);
          color: #fff;
        }

        .edit-btn {
          background: rgba(91,45,145,0.16);
          color: #d9c8f5;
        }

        .edit-btn:hover {
          background: rgba(91,45,145,0.3);
          transform: translateY(-1px);
        }

        .stats-btn {
          background: rgba(34,197,94,0.12);
          color: #80d8a0;
        }

        .stats-btn:hover {
          background: rgba(34,197,94,0.22);
          transform: translateY(-1px);
        }

        .activate-btn {
          background: rgba(34,197,94,0.12);
          color: #80d8a0;
        }

        .activate-btn:hover {
          background: rgba(34,197,94,0.22);
          transform: translateY(-1px);
        }

        .deactivate-btn {
          background: rgba(217,120,7,0.16);
          color: #f4bf73;
        }

        .deactivate-btn:hover {
          background: rgba(217,120,7,0.24);
          transform: translateY(-1px);
        }

        .delete-btn {
          background: rgba(217,47,88,0.12);
          color: #ff9cb4;
        }

        .delete-btn:hover {
          background: rgba(217,47,88,0.22);
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .tests-header {
            flex-direction: column;
            gap: 0.9rem;
            align-items: stretch;
          }

          .tests-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 0.9rem;
          }
        }

        @media (max-width: 640px) {
          .admin-tests-container {
            gap: 1rem;
          }

          .tests-grid-container {
            padding: 1rem;
          }

          .tests-grid {
            grid-template-columns: 1fr;
          }

          .test-meta {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .test-validity {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .test-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
