"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    void chargerTests();
  }, [page]);

  const chargerTests = async () => {
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
  };

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

      <div className="admin-header-card">
        <div className="header-content">
          <div className="header-info">
            <h2 className="header-title">Assessment Management</h2>
            <p className="header-subtitle">Create, manage and monitor psychological tests</p>
          </div>
          <button
            onClick={() => setModeCreation(true)}
            className="create-test-btn"
          >
            <span className="btn-icon">+</span>
            <span>New Test</span>
          </button>
        </div>
      </div>

      <div className="tests-grid-container">
        <div className="tests-header">
          <h3 className="tests-count">Psychological Tests ({tests.length})</h3>
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
              Create Test
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

        .admin-header-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(var(--app-secondary-rgb), 0.1));
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: var(--app-radius-lg);
          padding: 2rem;
          box-shadow: var(--app-shadow-soft);
          flex-shrink: 0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          font-family: var(--app-heading);
          color: var(--app-primary);
          font-weight: 700;
        }

        .header-subtitle {
          margin: 0;
          color: var(--app-text-soft);
          font-size: 1rem;
        }

        .create-test-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, var(--app-primary), var(--app-primary-hover));
          color: white;
          border: none;
          border-radius: var(--app-radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--app-shadow-soft);
        }

        .create-test-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--app-shadow);
        }

        .btn-icon {
          font-size: 1.2rem;
          font-weight: 300;
        }

        .tests-grid-container {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(var(--app-secondary-rgb), 0.05));
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: var(--app-radius-lg);
          padding: 1.5rem;
          box-shadow: var(--app-shadow-soft);
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }

        .tests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-shrink: 0;
        }

        .tests-count {
          margin: 0;
          font-size: 1.25rem;
          font-family: var(--app-heading);
          color: var(--app-primary);
          font-weight: 600;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .page-info {
          font-size: 0.9rem;
          color: var(--app-text-soft);
        }

        .pagination-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .pagination-btn {
          width: 2rem;
          height: 2rem;
          border: 1px solid rgba(var(--app-primary-rgb), 0.2);
          background: rgba(var(--app-secondary-rgb), 0.3);
          color: var(--app-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pagination-btn:hover:not(:disabled) {
          background: rgba(var(--app-secondary-rgb), 0.5);
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
          padding: 3rem;
          text-align: center;
        }

        .loading-spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid rgba(var(--app-primary-rgb), 0.1);
          border-top: 3px solid var(--app-primary);
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
          padding: 3rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          color: var(--app-primary);
          font-weight: 600;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
          color: var(--app-text-soft);
        }

        .empty-action-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, var(--app-primary), var(--app-primary-hover));
          color: white;
          border: none;
          border-radius: var(--app-radius-md);
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
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .test-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(var(--app-secondary-rgb), 0.08));
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: var(--app-radius-md);
          padding: 1.5rem;
          box-shadow: var(--app-shadow-soft);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .test-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--app-shadow);
          border-color: rgba(var(--app-primary-rgb), 0.2);
        }

        .test-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .test-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--app-primary);
          line-height: 1.3;
        }

        .test-description {
          margin: 0;
          font-size: 0.9rem;
          color: var(--app-text-soft);
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
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
          color: #059669;
        }

        .status-inactif {
          background: rgba(var(--app-muted), 0.1);
          color: var(--app-muted);
        }

        .status-brouillon {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
          color: #d97706;
        }

        .test-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .meta-item {
          text-align: center;
        }

        .meta-label {
          display: block;
          font-size: 0.7rem;
          color: var(--app-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .meta-value {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--app-primary);
        }

        .type-badge {
          display: block;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .type-soft_skills {
          background: rgba(59, 130, 246, 0.15);
          color: #2563eb;
        }

        .type-personnalite {
          background: rgba(var(--app-accent-rgb), 0.15);
          color: var(--app-accent);
        }

        .type-competences {
          background: rgba(249, 115, 22, 0.15);
          color: #ea580c;
        }

        .test-validity {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(var(--app-secondary-rgb), 0.1);
          border-radius: 12px;
        }

        .validity-item {
          text-align: center;
        }

        .validity-label {
          display: block;
          font-size: 0.7rem;
          color: var(--app-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .validity-date {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--app-primary);
        }

        .test-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .action-btn {
          flex: 1;
          min-width: 0;
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }

        .edit-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .stats-btn {
          background: rgba(34, 197, 94, 0.1);
          color: #059669;
        }

        .stats-btn:hover {
          background: rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        .activate-btn {
          background: rgba(34, 197, 94, 0.1);
          color: #059669;
        }

        .activate-btn:hover {
          background: rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        .deactivate-btn {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .deactivate-btn:hover {
          background: rgba(245, 158, 11, 0.2);
          transform: translateY(-1px);
        }

        .delete-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .tests-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .tests-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
        }

        @media (max-width: 640px) {
          .admin-tests-container {
            gap: 1rem;
          }

          .admin-header-card {
            padding: 1.5rem;
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