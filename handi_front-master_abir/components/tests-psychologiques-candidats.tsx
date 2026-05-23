"use client";

import { useState, useEffect } from "react";
import { construireUrlApi } from "@/lib/config";
import { PassageTest } from "./passage-test";

interface TestDisponible {
  id_test: string;
  titre: string;
  description: string;
  type_test: string;
  duree_minutes: number;
  date_fin_validite: string;
  instructions: string;
  deja_passe: boolean;
  peut_passer: boolean;
}

interface ResultatTest {
  id_resultat: string;
  test: {
    id_test: string;
    titre: string;
    type_test: string;
    score_total: number;
  };
  score_obtenu: number;
  pourcentage: number;
  temps_passe_minutes: number;
  date_passage: string;
  est_visible: boolean;
  peut_modifier_visibilite: boolean;
}

export function TestsPsychologiquesCandidats() {
  const [testsDisponibles, setTestsDisponibles] = useState<TestDisponible[]>([]);
  const [mesResultats, setMesResultats] = useState<ResultatTest[]>([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ongletActif, setOngletActif] = useState<'disponibles' | 'resultats'>('disponibles');
  const [testEnCours, setTestEnCours] = useState<any>(null);
  const [modePassage, setModePassage] = useState(false);

  useEffect(() => {
    chargerTestsDisponibles();
    chargerMesResultats();
  }, []);

  const chargerTestsDisponibles = async () => {
    try {
      console.log("📝 Chargement des tests disponibles...");
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi("/api/tests-psychologiques/candidat/tests-disponibles"),
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestsDisponibles(data.donnees.tests || []);
        console.log("✅ Tests disponibles chargés:", data.donnees.tests?.length || 0);
      } else if (response.status === 404) {
        console.warn("⚠️ [TESTS] API 404 - Utilisation de données de test");
        
        // Données de test en attendant l'implémentation backend
        const testsTest = [
          {
            id_test: "test_1",
            titre: "Test de Personnalité",
            description: "Évaluez vos traits de personnalité",
            type_test: "personnalite",
            duree_minutes: 15,
            date_fin_validite: "2024-12-31T23:59:59Z",
            instructions: "Répondez honnêtement à toutes les questions",
            deja_passe: false,
            peut_passer: true
          },
          {
            id_test: "test_2", 
            titre: "Test d'Aptitudes Cognitives",
            description: "Mesurez vos capacités de raisonnement",
            type_test: "competences",
            duree_minutes: 25,
            date_fin_validite: "2024-12-31T23:59:59Z",
            instructions: "Concentrez-vous et prenez votre temps",
            deja_passe: true,
            peut_passer: false
          }
        ];
        
        setTestsDisponibles(testsTest);
        setErreur("Mode test - APIs backend non implémentées");
      } else {
        console.error("❌ Erreur lors du chargement des tests:", response.status);
        setErreur("Erreur lors du chargement des tests disponibles");
      }
    } catch (error) {
      console.error("💥 Erreur de connexion:", error);
      setErreur("Erreur de connexion - Mode hors ligne");
      
      // Données de secours
      const testsTest = [
        {
          id_test: "test_offline",
          titre: "Test de Personnalité (Hors ligne)",
          description: "Évaluez vos traits de personnalité",
          type_test: "personnalite",
          duree_minutes: 15,
          date_fin_validite: "2024-12-31T23:59:59Z",
          instructions: "Mode hors ligne - données de test",
          deja_passe: false,
          peut_passer: true
        }
      ];
      setTestsDisponibles(testsTest);
    } finally {
      setChargement(false);
    }
  };

  const chargerMesResultats = async () => {
    try {
      console.log("📊 Chargement des résultats...");
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi("/api/tests-psychologiques/candidat/mes-resultats"),
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Résultats reçus:", data);
        
        // Normalisation des données pour éviter les erreurs de type
        const resultatsNormalises = (data.donnees.resultats || []).map((resultat: any) => {
          const pourcentage = parseFloat(String(resultat.pourcentage || 0));
          const scoreObtenu = parseFloat(String(resultat.score_obtenu || 0));
          const tempsPasseMinutes = parseFloat(String(resultat.temps_passe_minutes || 0));
          const scoreTotal = parseFloat(String(resultat.test?.score_total || 0));

          return {
            ...resultat,
            pourcentage: isNaN(pourcentage) ? 0 : pourcentage,
            score_obtenu: isNaN(scoreObtenu) ? 0 : scoreObtenu,
            temps_passe_minutes: isNaN(tempsPasseMinutes) ? 0 : tempsPasseMinutes,
            test: {
              ...resultat.test,
              score_total: isNaN(scoreTotal) ? 0 : scoreTotal
            }
          };
        });
        
        setMesResultats(resultatsNormalises);
        console.log("📊 Nombre de résultats:", resultatsNormalises.length);
      } else if (response.status === 404) {
        console.warn("⚠️ [RÉSULTATS] API 404 - Utilisation de données de test");
        
        // Données de test en attendant l'implémentation backend
        const resultatsTest = [
          {
            id_resultat: "result_1",
            test: {
              id_test: "test_1",
              titre: "Test de Personnalité",
              type_test: "personnalite",
              score_total: 20
            },
            score_obtenu: 16,
            pourcentage: 80,
            temps_passe_minutes: 12,
            date_passage: "2024-03-15T10:30:00Z",
            est_visible: true,
            peut_modifier_visibilite: true
          },
          {
            id_resultat: "result_2",
            test: {
              id_test: "test_2",
              titre: "Test d'Aptitudes",
              type_test: "competences",
              score_total: 30
            },
            score_obtenu: 22,
            pourcentage: 73,
            temps_passe_minutes: 18,
            date_passage: "2024-03-10T14:15:00Z",
            est_visible: false,
            peut_modifier_visibilite: true
          }
        ];
        
        setMesResultats(resultatsTest);
        console.log("💾 [RÉSULTATS] Données de test chargées");
      } else {
        console.error("❌ Erreur lors du chargement des résultats:", response.status);
        setErreur("Erreur lors du chargement des résultats");
      }
    } catch (error) {
      console.error("💥 Erreur de connexion:", error);
      setErreur("Erreur de connexion - Mode hors ligne");
      
      // Données de secours
      const resultatsTest = [
        {
          id_resultat: "result_offline",
          test: {
            id_test: "test_offline",
            titre: "Test Hors ligne",
            type_test: "personnalite",
            score_total: 20
          },
          score_obtenu: 15,
          pourcentage: 75,
          temps_passe_minutes: 10,
          date_passage: new Date().toISOString(),
          est_visible: true,
          peut_modifier_visibilite: true
        }
      ];
      setMesResultats(resultatsTest);
    }
  };

  const commencerTest = async (idTest: string) => {
    try {
      console.log("🚀 Démarrage du test:", idTest);
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/tests/${idTest}/commencer`),
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestEnCours(data.donnees);
        setModePassage(true);
      } else if (response.status === 404) {
        console.warn("⚠️ [TEST] API 404 - Mode test avec données simulées");
        
        // Données de test pour le passage
        const testSimule = {
          id_test: idTest,
          titre: "Test Simulé",
          questions: [
            {
              id_question: "q1",
              texte: "Question de test 1",
              type: "choix_multiple",
              options: [
                { id_option: "opt1", texte: "Option A", est_correcte: true },
                { id_option: "opt2", texte: "Option B", est_correcte: false }
              ]
            }
          ],
          duree_minutes: 15,
          instructions: "Ceci est un test simulé en attendant l'implémentation backend"
        };
        
        setTestEnCours(testSimule);
        setModePassage(true);
        setErreur("Mode test - API backend non implémentée");
      } else {
        const resultat = await response.json();
        setErreur(resultat.message || "Erreur lors du démarrage du test");
      }
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      setErreur("Erreur de connexion - Mode test activé");
      
      // Mode hors ligne avec test simulé
      const testSimule = {
        id_test: idTest,
        titre: "Test Hors Ligne",
        questions: [
          {
            id_question: "q1",
            texte: "Question hors ligne",
            type: "choix_multiple",
            options: [
              { id_option: "opt1", texte: "Réponse A", est_correcte: true },
              { id_option: "opt2", texte: "Réponse B", est_correcte: false }
            ]
          }
        ],
        duree_minutes: 10,
        instructions: "Test en mode hors ligne"
      };
      
      setTestEnCours(testSimule);
      setModePassage(true);
    }
  };

  const changerVisibilite = async (idResultat: string, visible: boolean) => {
    try {
      const token = localStorage.getItem("token_auth");
      const response = await fetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/resultats/${idResultat}/visibilite`),
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ est_visible: visible })
        }
      );

      if (response.ok) {
        setMessage(`Résultat ${visible ? 'affiché' : 'masqué'} avec succès`);
        chargerMesResultats();
      } else if (response.status === 404) {
        console.warn("⚠️ [VISIBILITÉ] API 404 - Simulation locale");
        
        // Simulation locale de la modification
        setMesResultats(prev => prev.map(resultat => 
          resultat.id_resultat === idResultat 
            ? { ...resultat, est_visible: visible }
            : resultat
        ));
        setMessage(`Résultat ${visible ? 'affiché' : 'masqué'} (mode test)`);
      } else {
        const resultat = await response.json();
        setErreur(resultat.message || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      
      // Simulation locale en cas d'erreur
      setMesResultats(prev => prev.map(resultat => 
        resultat.id_resultat === idResultat 
          ? { ...resultat, est_visible: visible }
          : resultat
      ));
      setMessage(`Résultat ${visible ? 'affiché' : 'masqué'} (mode hors ligne)`);
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      soft_skills: "bg-blue-100 text-blue-800",
      personnalite: "bg-purple-100 text-purple-800",
      competences: "bg-orange-100 text-orange-800"
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getScoreColor = (pourcentage: number) => {
    const pct = isNaN(pourcentage) ? 0 : pourcentage;
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatPourcentage = (pourcentage: any) => {
    const pct = parseFloat(String(pourcentage));
    return isNaN(pct) ? "0.0" : pct.toFixed(1);
  };

  if (modePassage && testEnCours) {
    return (
      <PassageTest
        test={testEnCours}
        onTerminer={() => {
          console.log("🎯 Test terminé - début du processus de redirection");
          setModePassage(false);
          setTestEnCours(null);
          
          // Recharger les données
          console.log("🔄 Rechargement des tests disponibles...");
          chargerTestsDisponibles();
          
          console.log("🔄 Rechargement des résultats...");
          chargerMesResultats();
          
          setMessage("Test terminé avec succès !");
          
          // Basculer automatiquement vers l'onglet des résultats
          console.log("📊 Basculement vers l'onglet résultats");
          setOngletActif('resultats');
        }}
        onAnnuler={() => {
          setModePassage(false);
          setTestEnCours(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {message}
          <button onClick={() => setMessage(null)} className="float-right text-green-600 hover:text-green-800">×</button>
        </div>
      )}
      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {erreur}
          <button onClick={() => setErreur(null)} className="float-right text-red-600 hover:text-red-800">×</button>
        </div>
      )}

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setOngletActif('disponibles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                ongletActif === 'disponibles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tests Disponibles ({testsDisponibles.length})
            </button>
            <button
              onClick={() => setOngletActif('resultats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                ongletActif === 'resultats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mes Résultats ({mesResultats.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {chargement ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : ongletActif === 'disponibles' ? (
            <div className="space-y-4">
              {testsDisponibles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p>Aucun test disponible pour le moment</p>
                </div>
              ) : (
                testsDisponibles.map((test) => (
                  <div key={test.id_test} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{test.titre}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(test.type_test)}`}>
                            {test.type_test}
                          </span>
                          {test.deja_passe && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✓ Déjà passé
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{test.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>⏱️ {test.duree_minutes} minutes</span>
                          <span>📅 Valide jusqu'au {new Date(test.date_fin_validite).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {test.instructions && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">{test.instructions}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        {test.peut_passer ? (
                          <button
                            onClick={() => commencerTest(test.id_test)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            🚀 Commencer
                          </button>
                        ) : (
                          <div className="text-center">
                            <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md">
                              {test.deja_passe ? "Déjà passé" : "Non disponible"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {mesResultats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p>Aucun résultat pour le moment</p>
                  <p className="text-sm mt-2">Passez votre premier test pour voir vos résultats ici</p>
                </div>
              ) : (
                mesResultats.map((resultat) => (
                  <div key={resultat.id_resultat} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{resultat.test.titre}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(resultat.test.type_test)}`}>
                            {resultat.test.type_test}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            resultat.est_visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {resultat.est_visible ? '👁️ Visible' : '🙈 Masqué'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className={`text-2xl font-bold ${getScoreColor(parseFloat(String(resultat.pourcentage)))}`}>
                              {resultat.score_obtenu}/{resultat.test.score_total}
                            </div>
                            <div className="text-sm text-gray-600">Score</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className={`text-2xl font-bold ${getScoreColor(parseFloat(String(resultat.pourcentage)))}`}>
                              {formatPourcentage(resultat.pourcentage)}%
                            </div>
                            <div className="text-sm text-gray-600">Pourcentage</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">
                              {resultat.temps_passe_minutes}
                            </div>
                            <div className="text-sm text-gray-600">Minutes</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-700">
                              {new Date(resultat.date_passage).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="text-sm text-gray-600">Date</div>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className={`h-2 rounded-full ${
                              parseFloat(String(resultat.pourcentage)) >= 80 ? 'bg-green-500' :
                              parseFloat(String(resultat.pourcentage)) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, parseFloat(String(resultat.pourcentage))))}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="ml-6">
                        {resultat.peut_modifier_visibilite && (
                          <button
                            onClick={() => changerVisibilite(resultat.id_resultat, !resultat.est_visible)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              resultat.est_visible
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {resultat.est_visible ? '🙈 Masquer' : '👁️ Afficher'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}