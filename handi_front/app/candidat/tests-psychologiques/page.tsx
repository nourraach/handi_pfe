"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PassageTest } from "@/components/passage-test";
import { RouteProtegee } from "@/components/route-protegee";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type TestDisponible = {
  id_test: string;
  titre: string;
  description?: string;
  type_test?: string;
  duree_minutes?: number;
  instructions?: string;
  deja_passe?: boolean;
  peut_passer?: boolean;
  prochain_passage_le?: string | null;
  blocage_6mois?: boolean;
};

type Resultat = {
  id_resultat: string;
  score_obtenu?: number | string;
  pourcentage?: number | string;
  est_visible?: boolean;
  date_passage?: string;
  temps_passe_minutes?: number;
  peut_modifier_visibilite?: boolean;
  test?: {
    id_test?: string;
    titre?: string;
    type_test?: string;
  };
};

type TestEnCours = {
  id_test: string;
  titre: string;
  description: string;
  duree_minutes: number;
  instructions: string;
  questions: Array<{
    id_question: string;
    contenu_question: string;
    type_question: "choix_multiple" | "vrai_faux" | "echelle_likert" | "texte_libre";
    ordre: number;
    obligatoire: boolean;
    options: Array<{
      id_option: string;
      texte_option: string;
      ordre: number;
    }>;
  }>;
};

type FilterKey = "all" | "pending" | "in_progress" | "completed";
type Difficulty = "easy" | "medium" | "hard";
type IconName =
  | "users"
  | "code"
  | "chart"
  | "brain"
  | "spark"
  | "clock"
  | "accessibility"
  | "calendar"
  | "check"
  | "eye"
  | "eyeOff"
  | "bookmark"
  | "question"
  | "search"
  | "star"
  | "filter"
  | "more";

type EnhancedTest = TestDisponible & {
  duration: number;
  difficulty: Difficulty;
  recommended: boolean;
  accessible: boolean;
  icon: IconName;
  summary: string;
  blockedUntilLabel?: string | null;
};

type EnhancedResult = Resultat & {
  score: number;
  title: string;
  dateLabel: string;
  timeSpent: number;
  difficulty: Difficulty;
  passed: boolean;
  visible: boolean;
};

const TESTS_PER_PAGE = 12;

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function inferDifficulty(title: string, type: string, duration: number): Difficulty {
  const source = `${title} ${type}`.toLowerCase();

  if (
    source.includes("technical") ||
    source.includes("aptitude") ||
    source.includes("cogn") ||
    source.includes("logic") ||
    duration >= 28
  ) {
    return "hard";
  }

  if (
    source.includes("soft") ||
    source.includes("person") ||
    source.includes("communication") ||
    duration <= 18
  ) {
    return "easy";
  }

  return "medium";
}

function describeTest(
  test: TestDisponible,
  fallbackSummary: string,
  technicalSummary: string,
  personalitySummary: string,
  cognitiveSummary: string,
  softSummary: string,
) {
  const title = (test.titre || "").toLowerCase();
  const type = (test.type_test || "").toLowerCase();

  if (title.includes("soft") || title.includes("communication")) {
    return {
      icon: "users" as const,
      summary: test.description || softSummary,
    };
  }

  if (title.includes("technical") || title.includes("aptitude") || type.includes("compet")) {
    return {
      icon: "code" as const,
      summary: test.description || technicalSummary,
    };
  }

  if (title.includes("person")) {
    return {
      icon: "chart" as const,
      summary: test.description || personalitySummary,
    };
  }

  if (title.includes("cogn")) {
    return {
      icon: "brain" as const,
      summary: test.description || cognitiveSummary,
    };
  }

  return {
    icon: "spark" as const,
    summary: test.description || fallbackSummary,
  };
}

function getDifficultyClass(difficulty: Difficulty) {
  if (difficulty === "easy") return "is-easy";
  if (difficulty === "hard") return "is-hard";
  return "is-medium";
}

export default function TestsPsychologiquesCandidatPage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <CandidateAssessmentsPage />
    </RouteProtegee>
  );
}

function CandidateAssessmentsPage() {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testsDisponibles, setTestsDisponibles] = useState<TestDisponible[]>([]);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [testEnCours, setTestEnCours] = useState<TestEnCours | null>(null);
  const [testDemarrageId, setTestDemarrageId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [testsPage, setTestsPage] = useState(1);

  const activeLocale = String(locale);
  const localeCode = activeLocale === "ar" ? "ar-TN" : activeLocale === "en" ? "en-US" : "fr-FR";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeCode, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [localeCode],
  );

  const filters: Array<{ key: FilterKey; label: string }> = useMemo(
    () => [
      { key: "all", label: "Tous" },
      { key: "pending", label: "A passer" },
      { key: "in_progress", label: "En cours" },
      { key: "completed", label: "Terminés" },
    ],
    [],
  );

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);

      const [testsRes, resultsRes] = await Promise.all([
        authenticatedFetch(construireUrlApi("/api/tests-psychologiques/candidat/tests-disponibles")),
        authenticatedFetch(construireUrlApi("/api/tests-psychologiques/candidat/mes-resultats")),
      ]);

      const testsData = await testsRes.json().catch(() => ({}));
      const resultsData = await resultsRes.json().catch(() => ({}));

      if (!testsRes.ok && !resultsRes.ok) {
        throw new Error(
          testsData.message || resultsData.message || t("assessments.candidate.loadError"),
        );
      }

      setTestsDisponibles(Array.isArray(testsData?.donnees?.tests) ? testsData.donnees.tests : []);
      setResultats(Array.isArray(resultsData?.donnees?.resultats) ? resultsData.donnees.resultats : []);
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : t("assessments.candidate.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const tests = useMemo<EnhancedTest[]>(() => {
    return testsDisponibles.map((test) => {
      const duration = toNumber(test.duree_minutes) || 20;
      const difficulty = inferDifficulty(test.titre || "", test.type_test || "", duration);
      const description = describeTest(
        test,
        t("assessments.candidate.dashboard.fallbackSummary"),
        t("assessments.candidate.dashboard.technicalSummary"),
        t("assessments.candidate.dashboard.personalitySummary"),
        t("assessments.candidate.dashboard.cognitiveSummary"),
        t("assessments.candidate.dashboard.softSummary"),
      );

      return {
        ...test,
        duration,
        difficulty,
        recommended: !test.deja_passe && difficulty !== "hard",
        accessible: true,
        icon: description.icon,
        summary: description.summary,
        blockedUntilLabel: test.prochain_passage_le
          ? dateFormatter.format(new Date(test.prochain_passage_le))
          : null,
      };
    });
  }, [dateFormatter, t, testsDisponibles]);

  const results = useMemo<EnhancedResult[]>(() => {
    return resultats
      .map((item) => {
        const score =
          toNumber(item.pourcentage) > 0
            ? clampPercent(toNumber(item.pourcentage))
            : clampPercent(toNumber(item.score_obtenu));
        const duration = toNumber(item.temps_passe_minutes);
        const difficulty = inferDifficulty(
          item.test?.titre || "",
          item.test?.type_test || "",
          duration || 20,
        );

        return {
          ...item,
          score,
          title: item.test?.titre || t("assessments.candidate.dashboard.resultFallbackTitle"),
          dateLabel: item.date_passage
            ? dateFormatter.format(new Date(item.date_passage))
            : t("assessments.candidate.dashboard.recentlyCompleted"),
          timeSpent: duration || 1,
          difficulty,
          passed: score >= 50,
          visible: Boolean(item.est_visible),
        };
      })
      .sort((a, b) => {
        const first = a.date_passage ? new Date(a.date_passage).getTime() : 0;
        const second = b.date_passage ? new Date(b.date_passage).getTime() : 0;
        return second - first;
      });
  }, [dateFormatter, resultats, t]);

  const latestResultByTestId = useMemo(() => {
    const map = new Map<string, EnhancedResult>();
    for (const result of results) {
      const testId = result.test?.id_test;
      if (!testId || map.has(testId)) continue;
      map.set(testId, result);
    }
    return map;
  }, [results]);

  const latestSoftSkillsResult = useMemo(() => {
    return results.find((result) => (result.test?.type_test || "").toLowerCase() === "soft_skills") || null;
  }, [results]);

  const changerVisibiliteScoreProfil = async () => {
    if (!latestSoftSkillsResult?.id_resultat) return;
    try {
      setErreur(null);
      setMessage(null);
      const response = await authenticatedFetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/resultats/${latestSoftSkillsResult.id_resultat}/visibilite`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ est_visible: !latestSoftSkillsResult.visible }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de modifier la visibilite du score.");
      }
      setResultats((current) =>
        current.map((item) =>
          item.id_resultat === latestSoftSkillsResult.id_resultat
            ? { ...item, est_visible: !latestSoftSkillsResult.visible }
            : item,
        ),
      );
      setMessage(!latestSoftSkillsResult.visible ? "Score soft skills affiche sur le profil." : "Score soft skills masque sur le profil.");
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de modifier la visibilite du score.");
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const haystack = `${test.titre || ""} ${test.summary || ""} ${test.description || ""} ${test.type_test || ""}`.toLowerCase();
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const hasCompleted = Boolean(latestResultByTestId.get(test.id_test) || test.deja_passe);
      const isInProgress = testDemarrageId === test.id_test;
      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
      if (activeFilter === "pending") return !hasCompleted && !isInProgress;
      if (activeFilter === "in_progress") return isInProgress;
      if (activeFilter === "completed") return hasCompleted;
      return true;
    });
  }, [activeFilter, latestResultByTestId, searchQuery, testDemarrageId, tests]);
  const testsTotalPages = Math.max(1, Math.ceil(filteredTests.length / TESTS_PER_PAGE));
  const currentTestsPage = Math.min(testsPage, testsTotalPages);
  const visibleTests = useMemo(() => {
    const start = (currentTestsPage - 1) * TESTS_PER_PAGE;
    return filteredTests.slice(start, start + TESTS_PER_PAGE);
  }, [currentTestsPage, filteredTests]);

  useEffect(() => {
    setTestsPage(1);
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    setTestsPage((current) => Math.min(current, testsTotalPages));
  }, [testsTotalPages]);

  const commencerTest = async (idTest: string) => {
    try {
      setErreur(null);
      setMessage(null);
      setTestDemarrageId(idTest);

      const response = await authenticatedFetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/tests/${idTest}/commencer`),
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || t("assessments.candidate.dashboard.startError"));
      }

      const donnees = data?.donnees;
      if (!donnees?.id_test) {
        throw new Error(t("assessments.candidate.dashboard.startError"));
      }

      setTestEnCours({
        id_test: donnees.id_test,
        titre: donnees.titre || "",
        description: donnees.description || "",
        duree_minutes: Number(donnees.duree_minutes || 0),
        instructions: donnees.instructions || "",
        questions: Array.isArray(donnees.questions) ? donnees.questions : [],
      });
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : t("assessments.candidate.dashboard.startError"));
    } finally {
      setTestDemarrageId(null);
    }
  };

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title={t("assessments.candidate.loadingTitle")}
          description={t("assessments.candidate.loadingDescription")}
        />
      </main>
    );
  }

  if (testEnCours) {
    return (
      <PassageTest
        test={testEnCours}
        onTerminer={() => {
          setTestEnCours(null);
          setMessage(t("assessments.candidate.dashboard.completedMessage"));
          void charger();
        }}
        onAnnuler={() => {
          setTestEnCours(null);
        }}
      />
    );
  }

  return (
    <div className="tests-page">
      <div className="tests-page__frame">
        {erreur ? <div className="tests-page__message tests-page__message--error">{erreur}</div> : null}
        {message ? <div className="tests-page__message tests-page__message--info">{message}</div> : null}

        <section className="tests-page__single-card">
          <div className="tests-page__toolbar">
            <div className="tests-page__filters" role="tablist" aria-label={t("assessments.candidate.dashboard.filtersLabel")}>
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`tests-page__filter ${activeFilter === filter.key ? "is-active" : ""}`}
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={activeFilter === filter.key}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="tests-page__toolbar-actions">
              <label className="tests-page__search" aria-label="Rechercher un test">
                <AppIcon name="search" size={14} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher un test..."
                />
              </label>
            </div>
          </div>

          {latestSoftSkillsResult ? (
            <div className="tests-page__visibility">
              <div className="tests-page__visibility-icon">
                <AppIcon name={latestSoftSkillsResult.visible ? "eye" : "eyeOff"} size={20} />
              </div>
              <div className="tests-page__visibility-copy">
                <strong>
                  Score soft skills: {latestSoftSkillsResult.score}%
                </strong>
                <p>
                  {latestSoftSkillsResult.visible
                    ? "Ce score est actuellement affiche sur votre profil."
                    : "Ce score est actuellement masque sur votre profil."}
                </p>
              </div>
              <button
                type="button"
                className="tests-page__ghost"
                onClick={() => void changerVisibiliteScoreProfil()}
              >
                <AppIcon name={latestSoftSkillsResult.visible ? "eyeOff" : "eye"} size={14} />
                {latestSoftSkillsResult.visible ? "Masquer du profil" : "Afficher sur profil"}
              </button>
            </div>
          ) : null}

          {filteredTests.length === 0 ? (
            <div className="tests-page__empty">
              <strong>{t("assessments.candidate.dashboard.emptyTestsTitle")}</strong>
              <p>{t("assessments.candidate.dashboard.emptyTestsDescription")}</p>
            </div>
          ) : (
            <>
              <div className="tests-page__list tests-page__list--single">
                {visibleTests.map((test) => (
                  <TestCard
                    key={test.id_test}
                    test={test}
                    isStarting={testDemarrageId === test.id_test}
                    result={latestResultByTestId.get(test.id_test)}
                    canStart={Boolean(test.peut_passer)}
                    onStart={() => void commencerTest(test.id_test)}
                  />
                ))}
              </div>

              {testsTotalPages > 1 ? (
                <Pagination
                  page={currentTestsPage}
                  totalPages={testsTotalPages}
                  onChange={setTestsPage}
                  t={t}
                  ariaLabel={t("assessments.candidate.dashboard.testsPaginationLabel")}
                />
              ) : null}
            </>
          )}
        </section>
      </div>

      <style jsx>{`
        .tests-page {
          min-height: 100%;
          background: transparent;
          padding: 6px 8px 20px;
          color: #1c1637;
        }

        .tests-page__frame {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .tests-page__message {
          border-radius: 14px;
          padding: 11px 13px;
          font-size: 0.92rem;
          font-weight: 600;
        }

        .tests-page__message--error {
          background: #fff0f3;
          border: 1px solid #f7ccd8;
          color: #b5405b;
        }

        .tests-page__message--info {
          background: #f2ecff;
          border: 1px solid #dbceff;
          color: #643aaf;
        }

        .tests-page__single-card {
          background: transparent;
          border: 0;
          border-radius: 0;
          padding: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tests-page__toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: nowrap;
        }

        .tests-page__toolbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .tests-page__list--single {
          gap: 10px;
        }

        .tests-page__search {
          min-width: 250px;
          border: 1px solid #e4dcf6;
          border-radius: 12px;
          background: #fff;
          color: #8577ac;
          min-height: 40px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .tests-page__search input {
          border: 0;
          background: transparent;
          width: 100%;
          font-size: 0.84rem;
          color: #5f4f8b;
          outline: none;
        }

        .tests-page__search input::placeholder {
          color: #8f83b3;
        }

        .tests-page__link {
          border: 0;
          background: transparent;
          color: #6637b6;
          font-weight: 700;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .tests-page__filters {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          min-width: 0;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .tests-page__filter {
          border: 1px solid #e2ddf3;
          border-radius: 999px;
          background: #fff;
          color: #5b5376;
          min-height: 34px;
          padding: 0 14px;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .tests-page__filter.is-active {
          color: #fff;
          border-color: var(--app-primary);
          background: var(--app-primary);
          box-shadow: 0 14px 28px -16px rgba(var(--app-primary-rgb), 0.85);
        }

        .tests-page__all-tests {
          width: 100%;
          border: 1px solid #e4dcf6;
          background: #f6f2ff;
          color: #3f2a77;
          border-radius: 12px;
          min-height: 44px;
          font-size: 0.95rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .tests-page__list {
          display: grid;
          gap: 12px;
          align-content: start;
          flex: 1 1 auto;
        }

        .tests-page__empty {
          border: 1px dashed #d9d1ef;
          background: #faf8ff;
          border-radius: 18px;
          padding: 18px;
          display: grid;
          gap: 8px;
          justify-items: start;
        }

        .tests-page__empty p {
          margin: 0;
          color: #676084;
        }

        .tests-page__empty--results {
          min-height: 100%;
          justify-content: center;
          justify-items: center;
          text-align: center;
          border-style: solid;
          border-color: #e3dcf3;
          background: linear-gradient(180deg, #fcfbff 0%, #f8f5ff 100%);
        }

        .tests-page__empty-illustration {
          position: relative;
          width: 180px;
          height: 160px;
          margin-bottom: 8px;
        }

        .tests-page__empty-glow {
          position: absolute;
          inset: 14px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(151, 120, 240, 0.22), transparent 70%);
        }

        .tests-page__empty-card {
          position: absolute;
          left: 44px;
          top: 44px;
          width: 92px;
          height: 92px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          color: #6c46ce;
          border: 1px solid #e0d5f7;
          background: linear-gradient(140deg, #ffffff, #f3ecff);
          box-shadow: 0 14px 28px rgba(110, 64, 190, 0.16);
        }

        .tests-page__empty-magnifier {
          position: absolute;
          right: 34px;
          top: 26px;
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          color: #6442c4;
          background: #f1e8ff;
          border: 1px solid #e0d5f7;
        }

        .tests-page__btn--primary-inline {
          margin-top: 4px;
          border: 0;
          padding: 0 18px;
          background: linear-gradient(135deg, #5d2fd2, #7f5de8);
          color: white;
          box-shadow: 0 12px 26px rgba(101, 65, 201, 0.28);
        }

        .tests-page__empty-help {
          margin-top: 2px;
          font-size: 0.82rem;
          color: #7a6b9b;
        }

        .tests-page__empty-help button {
          border: 0;
          background: transparent;
          color: #5f34ba;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        .tests-page__visibility {
          border: 1px solid #e8e3f6;
          border-radius: 16px;
          padding: 14px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          background: #fbfaff;
        }

        .tests-page__visibility-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #efe8ff;
          color: #6d2a95;
          display: grid;
          place-items: center;
        }

        .tests-page__visibility-copy {
          min-width: 0;
        }

        .tests-page__visibility-copy strong {
          display: block;
          font-size: 0.96rem;
        }

        .tests-page__visibility-copy p {
          margin: 4px 0 0;
          color: #686086;
          font-size: 0.88rem;
        }

        .tests-page__ghost {
          border-radius: 12px;
          border: 1px solid #d8cdf8;
          color: #6d2a95;
          background: #fff;
          min-height: 40px;
          padding: 0 14px;
          font-weight: 700;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .tests-page :global(button) {
          cursor: pointer;
        }

        .tests-page :global(button:focus-visible) {
          outline: none;
          box-shadow: 0 0 0 2px rgba(109, 42, 149, 0.2), 0 0 0 5px rgba(109, 42, 149, 0.08);
        }

        @media (max-width: 760px) {
          .tests-page {
            padding: 12px;
          }

          .tests-page__toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .tests-page__toolbar-actions {
            margin-left: 0;
            width: 100%;
          }

          .tests-page__search {
            min-width: 0;
            width: 100%;
          }

          .tests-page__ghost {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
  t,
  ariaLabel,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  ariaLabel: string;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav className="page-pagination" aria-label={ariaLabel}>
      <button
        type="button"
        className="page-pagination__btn page-pagination__btn--arrow"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t("assessments.candidate.dashboard.pagination.previous")}
      >
        ‹
      </button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={`page-pagination__btn ${item === page ? "is-active" : ""}`}
          onClick={() => onChange(item)}
          aria-label={t("assessments.candidate.dashboard.pagination.page", { value: item })}
          aria-current={item === page ? "page" : undefined}
        >
          {item}
        </button>
      ))}

      <button
        type="button"
        className="page-pagination__btn page-pagination__btn--arrow"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t("assessments.candidate.dashboard.pagination.next")}
      >
        ›
      </button>

      <style jsx>{`
        .page-pagination {
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
          justify-content: center;
          align-items: center;
        }

        .page-pagination__btn {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 1px solid #ded3f2;
          background: #fff;
          color: #4f4474;
          font-size: 1.35rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .page-pagination__btn.is-active {
          background: #3a0a54;
          border-color: #3a0a54;
          color: #fff;
          box-shadow: 0 10px 24px rgba(58, 10, 84, 0.24);
        }

        .page-pagination__btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </nav>
  );
}

function TestCard({
  test,
  isStarting,
  result,
  canStart,
  onStart,
}: {
  test: EnhancedTest;
  isStarting: boolean;
  result?: EnhancedResult;
  canStart: boolean;
  onStart: () => void;
}) {
  const difficultyLabel = test.difficulty === "hard" ? "Difficile" : test.difficulty === "easy" ? "Facile" : "Moyen";
  const isCompleted = Boolean(result || test.deja_passe);
  const isInProgress = isStarting;
  const progress = isInProgress ? 45 : 0;
  const isBlockedByWindow = !canStart && !isCompleted;

  return (
    <article className="test-card">
      <div className="test-card__icon">
        <AppIcon name={test.icon} size={26} />
      </div>

      <div className="test-card__main">
        <h3>{test.titre}</h3>
        <p>{test.summary}</p>
      </div>

      <div className="test-card__meta">
        <span className={`test-card__pill ${getDifficultyClass(test.difficulty)}`}>
          <AppIcon name="chart" size={12} />
          {difficultyLabel}
        </span>
        <span className="test-card__duration">
          <AppIcon name="clock" size={12} />
          {test.duration} min
        </span>
      </div>

      <div className="test-card__status-column">
        {isCompleted ? (
          <>
            <span className="test-card__status-badge is-completed">Terminé</span>
            <strong>{result?.score ?? 0}%</strong>
            <small>{result?.dateLabel ? `Terminé le ${result.dateLabel}` : "Terminé"}</small>
          </>
        ) : isBlockedByWindow ? (
          <>
            <span className="test-card__status-badge is-pending">En attente</span>
            <small>
              {test.blockedUntilLabel
                ? `Disponible le ${test.blockedUntilLabel}`
                : "Disponible apres la fenetre de 6 mois"}
            </small>
          </>
        ) : isInProgress ? (
          <>
            <span className="test-card__status-badge is-progress">En cours</span>
            <div className="test-card__progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>{progress}%</small>
          </>
        ) : (
          <span className="test-card__status-badge is-pending">A passer</span>
        )}
      </div>

      <div className="test-card__action">
        <button
          type="button"
          className={`test-card__btn ${isCompleted ? "test-card__btn--ghost" : ""}`}
          disabled={isStarting || isBlockedByWindow}
          onClick={isCompleted || isBlockedByWindow ? undefined : onStart}
        >
          {isStarting
            ? "Chargement..."
            : isCompleted
              ? "Voir les resultats"
              : isBlockedByWindow
                ? "Indisponible (6 mois)"
              : isInProgress
                  ? "Continuer le test"
                  : "Commencer le test"}
        </button>
      </div>

      <style jsx>{`
        .test-card {
          border: 1px solid #e8e2f7;
          border-radius: 18px;
          background: #fff;
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 64px minmax(220px, 1.5fr) 130px 170px 190px;
          gap: 12px;
          align-items: center;
        }

        .test-card__icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f4ecff, #eef1ff);
          color: #5f39bd;
          display: grid;
          place-items: center;
        }

        .test-card__main h3 {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.2;
          color: #25184d;
        }

        .test-card__main p {
          margin: 6px 0 0;
          color: #6b618e;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .test-card__meta {
          display: grid;
          gap: 8px;
        }

        .test-card__pill,
        .test-card__duration {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #6d6391;
        }

        .test-card__status-column {
          display: grid;
          gap: 7px;
          justify-items: start;
        }

        .test-card__status-badge {
          border-radius: 999px;
          min-height: 24px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .test-card__status-badge.is-completed {
          background: #e7faed;
          color: #188651;
        }

        .test-card__status-badge.is-progress {
          background: #e9efff;
          color: #365fcb;
        }

        .test-card__status-badge.is-pending {
          background: #f3ecff;
          color: #6c44c5;
        }

        .test-card__status-column strong {
          color: #1ba25a;
          font-size: 1.85rem;
          line-height: 1;
        }

        .test-card__status-column small {
          color: #7a6fa0;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .test-card__progress {
          width: 100%;
          max-width: 120px;
          height: 6px;
          border-radius: 999px;
          background: #e1d8f7;
          overflow: hidden;
        }

        .test-card__progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--app-primary);
        }

        .test-card__action {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .test-card__btn {
          border: 1px solid var(--app-primary);
          border-radius: 10px;
          min-height: 38px;
          padding: 0 14px;
          background: var(--app-primary);
          color: #fff;
          font-size: 0.86rem;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 14px 28px -16px rgba(var(--app-primary-rgb), 0.85);
        }

        .test-card__btn:hover {
          background: var(--app-primary-hover);
          border-color: var(--app-primary-hover);
        }

        .test-card__btn--ghost {
          background: var(--app-primary);
          color: #fff;
          border: 1px solid var(--app-primary);
        }

        @media (max-width: 1180px) {
          .test-card {
            grid-template-columns: 56px minmax(0, 1fr) auto;
          }

          .test-card__meta,
          .test-card__status-column {
            grid-column: 2;
          }

          .test-card__action {
            grid-column: 3;
            grid-row: 1 / span 3;
            align-self: center;
          }
        }

        @media (max-width: 760px) {
          .test-card {
            grid-template-columns: 1fr;
          }

          .test-card__action {
            grid-column: auto;
            grid-row: auto;
            justify-content: flex-start;
          }
        }
      `}</style>
    </article>
  );
}

function AppIcon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="3" />
          <path d="M20 8v6" />
          <path d="M23 11h-6" />
        </svg>
      );
    case "code":
      return (
        <svg {...props}>
          <path d="m8 9-4 3 4 3" />
          <path d="m16 9 4 3-4 3" />
          <path d="m14 5-4 14" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M4 20h16" />
          <path d="M8 17V9" />
          <path d="M12 17V5" />
          <path d="M16 17v-7" />
        </svg>
      );
    case "brain":
      return (
        <svg {...props}>
          <path d="M8 5a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5 3 3 0 0 0 3 5h1" />
          <path d="M16 5a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5 3 3 0 0 1-3 5h-1" />
          <path d="M12 4v16" />
          <path d="M10 8H8" />
          <path d="M10 12H7" />
          <path d="M10 16H8" />
          <path d="M14 8h2" />
          <path d="M14 12h3" />
          <path d="M14 16h2" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Z" />
          <path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "accessibility":
      return (
        <svg {...props}>
          <circle cx="12" cy="4" r="2" />
          <path d="M5 9h14" />
          <path d="m12 9-3 5" />
          <path d="m12 9 3 5" />
          <path d="m12 9 1 11" />
          <path d="m12 9-1 11" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "eyeOff":
      return (
        <svg {...props}>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
          <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.1" />
          <path d="M6 6.8A18 18 0 0 0 2 12s3.5 7 10 7c1.7 0 3.1-.4 4.3-1" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...props}>
          <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1Z" />
        </svg>
      );
    case "question":
      return (
        <svg {...props}>
          <path d="M12 18h.01" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.6.63-1.3 1.08-1.8 1.8-.2.3-.3.64-.3 1" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "star":
      return (
        <svg {...props}>
          <path d="m12 3 2.2 4.5 4.9.7-3.6 3.5.9 4.9L12 14.2 7.6 16.6l.9-4.9L4.9 8.2l4.9-.7L12 3Z" />
        </svg>
      );
    case "filter":
      return (
        <svg {...props}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );
    case "more":
      return (
        <svg {...props}>
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
        </svg>
      );
    default:
      return null;
  }
}
