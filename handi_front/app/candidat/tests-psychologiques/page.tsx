"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { triggerAccessibilityPanel } from "@/components/accessibility-widget";
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

type FilterKey = "all" | "recommended" | "short" | "easy" | "accessible";
type Difficulty = "easy" | "medium" | "hard";
type IconName = "users" | "code" | "chart" | "brain" | "spark" | "clock" | "accessibility" | "calendar" | "check" | "eye" | "eyeOff";

type EnhancedTest = TestDisponible & {
  duration: number;
  difficulty: Difficulty;
  recommended: boolean;
  accessible: boolean;
  icon: IconName;
  summary: string;
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

const RESULTAT_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TESTS_PER_PAGE = 4;
const RESULTS_PER_PAGE = 5;

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

function getScoreRingColor(score: number) {
  if (score >= 80) return "#6d2a95";
  if (score >= 50) return "#22a06b";
  return "#f59e0b";
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
  const [visibiliteResultatId, setVisibiliteResultatId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [testsPage, setTestsPage] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);

  const localeCode = locale === "ar" ? "ar-TN" : locale === "en" ? "en-US" : "fr-FR";
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
      { key: "all", label: t("assessments.candidate.dashboard.filters.all") },
      { key: "recommended", label: t("assessments.candidate.dashboard.filters.recommended") },
      { key: "short", label: t("assessments.candidate.dashboard.filters.short") },
      { key: "easy", label: t("assessments.candidate.dashboard.filters.easy") },
      { key: "accessible", label: t("assessments.candidate.dashboard.filters.accessible") },
    ],
    [t],
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
      };
    });
  }, [t, testsDisponibles]);

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

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      if (activeFilter === "recommended") return test.recommended;
      if (activeFilter === "short") return test.duration <= 20;
      if (activeFilter === "easy") return test.difficulty === "easy";
      if (activeFilter === "accessible") return test.accessible;
      return true;
    });
  }, [activeFilter, tests]);
  const testsTotalPages = Math.max(1, Math.ceil(filteredTests.length / TESTS_PER_PAGE));
  const resultsTotalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const currentTestsPage = Math.min(testsPage, testsTotalPages);
  const currentResultsPage = Math.min(resultsPage, resultsTotalPages);
  const visibleTests = useMemo(() => {
    const start = (currentTestsPage - 1) * TESTS_PER_PAGE;
    return filteredTests.slice(start, start + TESTS_PER_PAGE);
  }, [currentTestsPage, filteredTests]);
  const visibleResults = useMemo(() => {
    const start = (currentResultsPage - 1) * RESULTS_PER_PAGE;
    return results.slice(start, start + RESULTS_PER_PAGE);
  }, [currentResultsPage, results]);

  useEffect(() => {
    setTestsPage(1);
  }, [activeFilter]);

  useEffect(() => {
    setTestsPage((current) => Math.min(current, testsTotalPages));
  }, [testsTotalPages]);

  useEffect(() => {
    setResultsPage((current) => Math.min(current, resultsTotalPages));
  }, [resultsTotalPages]);

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

  const toggleVisibilite = async (id: string, actuel?: boolean) => {
    if (!RESULTAT_UUID_REGEX.test(id)) {
      setErreur(t("assessments.candidate.updateVisibilityError"));
      return;
    }

    try {
      setMessage(null);
      setErreur(null);
      setVisibiliteResultatId(id);

      const res = await authenticatedFetch(
        construireUrlApi(`/api/tests-psychologiques/candidat/resultats/${id}/visibilite`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ est_visible: !actuel }),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || t("assessments.candidate.updateVisibilityError"));
      }

      setResultats((current) =>
        current.map((item) =>
          item.id_resultat === id ? { ...item, est_visible: !actuel } : item,
        ),
      );
      setMessage(t("assessments.candidate.updatedVisibility"));
    } catch (error: unknown) {
      setErreur(
        error instanceof Error ? error.message : t("assessments.candidate.updateVisibilityError"),
      );
    } finally {
      setVisibiliteResultatId(null);
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
        <header className="tests-page__header">
          <div>
            <h1>{t("assessments.candidate.dashboard.title")}</h1>
            <p>{t("assessments.candidate.dashboard.subtitle")}</p>
            <span className="tests-page__underline" aria-hidden="true" />
          </div>

          <div className="tests-page__actions">
            <button
              type="button"
              className="tests-page__btn tests-page__btn--accessibility"
              onClick={() => triggerAccessibilityPanel("open")}
            >
              <AppIcon name="accessibility" size={16} />
              <span>{t("assessments.candidate.dashboard.accessibility")}</span>
            </button>
            <button
              type="button"
              className="tests-page__btn tests-page__btn--circle"
              aria-label={t("assessments.candidate.dashboard.help")}
            >
              ?
            </button>
            <button
              type="button"
              className="tests-page__btn tests-page__btn--avatar"
              aria-label={t("assessments.candidate.dashboard.profile")}
            >
              MD
            </button>
          </div>
        </header>

        {erreur ? <div className="tests-page__message tests-page__message--error">{erreur}</div> : null}
        {message ? <div className="tests-page__message tests-page__message--info">{message}</div> : null}

        <div className="tests-page__grid">
          <section className="tests-page__card tests-page__card--left">
            <div className="tests-page__card-head">
              <h2>{t("assessments.candidate.dashboard.availableTests")}</h2>
            </div>

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

            {filteredTests.length === 0 ? (
              <div className="tests-page__empty">
                <strong>{t("assessments.candidate.dashboard.emptyTestsTitle")}</strong>
                <p>{t("assessments.candidate.dashboard.emptyTestsDescription")}</p>
              </div>
            ) : (
              <>
                <div className="tests-page__list">
                  {visibleTests.map((test) => (
                    <TestCard
                      key={test.id_test}
                      test={test}
                      t={t}
                      isStarting={testDemarrageId === test.id_test}
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

          <aside className="tests-page__card">
            <div className="tests-page__card-head">
              <h2>{t("assessments.candidate.dashboard.myResults")}</h2>
            </div>

            {visibleResults.length === 0 ? (
              <div className="tests-page__empty">
                <strong>{t("assessments.candidate.dashboard.emptyResultsTitle")}</strong>
                <p>{t("assessments.candidate.dashboard.emptyResultsDescription")}</p>
              </div>
            ) : (
              <>
                <div className="tests-page__list">
                  {visibleResults.map((result) => (
                    <ResultCard
                      key={result.id_resultat}
                      result={result}
                      t={t}
                      isUpdating={visibiliteResultatId === result.id_resultat}
                      onToggleVisibility={() => void toggleVisibilite(result.id_resultat, result.visible)}
                    />
                  ))}
                </div>

                {resultsTotalPages > 1 ? (
                  <Pagination
                    page={currentResultsPage}
                    totalPages={resultsTotalPages}
                    onChange={setResultsPage}
                    t={t}
                    ariaLabel={t("assessments.candidate.dashboard.resultsPaginationLabel")}
                  />
                ) : null}
              </>
            )}

          </aside>
        </div>
      </div>

      <style jsx>{`
        .tests-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #fcfbff 0%, #f6f4fb 100%);
          padding: 24px;
          color: #1c1637;
        }

        .tests-page__frame {
          max-width: 1480px;
          margin: 0 auto;
          display: grid;
          gap: 20px;
        }

        .tests-page__header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .tests-page__header h1 {
          margin: 0;
          font-size: clamp(1.9rem, 2.5vw, 2.9rem);
          line-height: 1.1;
        }

        .tests-page__header p {
          margin: 12px 0 0;
          color: #655d81;
          font-size: 1.05rem;
        }

        .tests-page__underline {
          margin-top: 14px;
          display: block;
          width: 36px;
          height: 3px;
          border-radius: 999px;
          background: #6d2a95;
        }

        .tests-page__actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .tests-page__btn {
          border: 1px solid #e2ddf3;
          background: #fff;
          color: #4f4872;
          border-radius: 16px;
          min-height: 46px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .tests-page__btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(86, 48, 145, 0.12);
        }

        .tests-page__btn--accessibility {
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .tests-page__btn--circle {
          width: 46px;
        }

        .tests-page__btn--avatar {
          width: 46px;
          border-radius: 50%;
          color: #6d2a95;
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

        .tests-page__grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
          align-items: stretch;
        }

        .tests-page__card {
          background: #fff;
          border: 1px solid rgba(109, 42, 149, 0.1);
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 16px 44px rgba(80, 44, 133, 0.08);
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 680px;
          height: 100%;
        }

        .tests-page__card--left {
          gap: 16px;
        }

        .tests-page__card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .tests-page__card-head h2 {
          margin: 0;
          font-size: 1.85rem;
        }

        .tests-page__link {
          border: 0;
          background: transparent;
          color: #6637b6;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .tests-page__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tests-page__filter {
          border: 1px solid #e2ddf3;
          border-radius: 999px;
          background: #fff;
          color: #5b5376;
          min-height: 38px;
          padding: 0 16px;
          font-weight: 700;
        }

        .tests-page__filter.is-active {
          color: #fff;
          border-color: transparent;
          background: linear-gradient(135deg, #5528bd, #8b63df);
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
          padding: 16px;
          display: grid;
          gap: 6px;
        }

        .tests-page__empty p {
          margin: 0;
          color: #676084;
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
          padding: 0 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .tests-page :global(button) {
          cursor: pointer;
        }

        .tests-page :global(button:focus-visible) {
          outline: none;
          box-shadow: 0 0 0 2px rgba(109, 42, 149, 0.2), 0 0 0 5px rgba(109, 42, 149, 0.08);
        }

        @media (max-width: 1200px) {
          .tests-page__grid {
            grid-template-columns: 1fr;
          }

          .tests-page__card {
            min-height: auto;
          }
        }

        @media (max-width: 760px) {
          .tests-page {
            padding: 12px;
          }

          .tests-page__header {
            flex-direction: column;
            align-items: stretch;
          }

          .tests-page__actions {
            justify-content: flex-start;
          }

          .tests-page__card {
            padding: 14px;
          }

          .tests-page__visibility {
            grid-template-columns: 1fr;
          }

          .tests-page__ghost {
            width: 100%;
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
  t,
  isStarting,
  onStart,
}: {
  test: EnhancedTest;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  isStarting: boolean;
  onStart: () => void;
}) {
  const difficultyLabel = t(`assessments.candidate.dashboard.difficulty.${test.difficulty}`);

  return (
    <article className="test-card">
      <div className="test-card__icon">
        <AppIcon name={test.icon} size={26} />
      </div>

      <div className="test-card__main">
        <h3>{test.titre}</h3>
        <p>{test.summary}</p>
        <div className="test-card__meta">
          <span className={`test-card__pill ${getDifficultyClass(test.difficulty)}`}>
            {difficultyLabel}
          </span>
          <span className="test-card__duration">
            <AppIcon name="clock" size={14} />
            {t("assessments.candidate.dashboard.minutes", { value: test.duration })}
          </span>
        </div>
      </div>

      <div className="test-card__action">
        {test.peut_passer === false ? (
          <span className="test-card__status is-unavailable">
            {t("assessments.candidate.dashboard.status.unavailable")}
          </span>
        ) : test.deja_passe ? (
          <span className="test-card__status is-completed">
            {t("assessments.candidate.dashboard.status.completed")}
          </span>
        ) : (
          <button type="button" className="test-card__btn" disabled={isStarting} onClick={onStart}>
            {isStarting
              ? t("assessments.candidate.dashboard.starting")
              : t("assessments.candidate.dashboard.startTest")}
          </button>
        )}
      </div>

      <style jsx>{`
        .test-card {
          border: 1px solid #e6dff4;
          border-radius: 18px;
          background: #fff;
          padding: 14px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .test-card__icon {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(109, 42, 149, 0.08), rgba(171, 141, 246, 0.2));
          color: #6d2a95;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .test-card__main h3 {
          margin: 0;
          font-size: 1.36rem;
          line-height: 1.15;
        }

        .test-card__main p {
          margin: 8px 0;
          color: #5f587b;
          line-height: 1.45;
          font-size: 0.95rem;
        }

        .test-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .test-card__pill,
        .test-card__duration,
        .test-card__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          font-size: 0.79rem;
          font-weight: 700;
          min-height: 28px;
          padding: 0 10px;
        }

        .test-card__pill {
          background: #efe8ff;
          color: #6d2a95;
        }

        .test-card__pill.is-easy {
          background: #eaf9ef;
          color: #1f8f60;
        }

        .test-card__pill.is-hard {
          background: #fff0f1;
          color: #ba4158;
        }

        .test-card__duration {
          background: #f6f3ff;
          color: #665e84;
        }

        .test-card__action {
          display: flex;
          justify-content: flex-end;
          min-width: 152px;
        }

        .test-card__btn {
          border: 1px solid #c9b7f4;
          background: #fff;
          color: #5b2ab5;
          border-radius: 12px;
          min-height: 42px;
          padding: 0 16px;
          font-weight: 700;
          min-width: 138px;
        }

        .test-card__status {
          color: #5f587b;
          background: #f7f5fd;
        }

        .test-card__status.is-completed {
          color: #207b5a;
          background: #eaf9ef;
        }

        .test-card__status.is-unavailable {
          color: #9b3550;
          background: #fff2f5;
        }

        @media (max-width: 860px) {
          .test-card {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .test-card__action {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }
        }
      `}</style>
    </article>
  );
}

function ResultCard({
  result,
  t,
  isUpdating,
  onToggleVisibility,
}: {
  result: EnhancedResult;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  isUpdating: boolean;
  onToggleVisibility: () => void;
}) {
  const ringStyle = {
    ["--ring-value" as string]: `${result.score}`,
    ["--ring-color" as string]: getScoreRingColor(result.score),
  } as CSSProperties;

  const difficultyLabel = t(`assessments.candidate.dashboard.difficulty.${result.difficulty}`);
  const visibilityLabel = result.visible
    ? t("assessments.candidate.visible")
    : t("assessments.candidate.private");

  return (
    <article className="result-card">
      <div className="result-card__icon">
        <div className="result-card__ring" style={ringStyle}>
          <span>{result.score}%</span>
        </div>
      </div>

      <div className="result-card__main">
        <h3>{result.title}</h3>
        <p>{result.dateLabel}</p>
        <div className="result-card__meta">
          <span className="result-card__duration">
            <AppIcon name="clock" size={13} />
            {t("assessments.candidate.dashboard.minutes", { value: result.timeSpent })}
          </span>
          <span className={`result-card__pill ${getDifficultyClass(result.difficulty)}`}>{difficultyLabel}</span>
          <span className="result-card__pill">{visibilityLabel}</span>
        </div>
      </div>

      <div className="result-card__side">
        <span className={`result-card__status ${result.passed ? "is-passed" : "is-failed"}`}>
          {result.passed
            ? t("assessments.candidate.dashboard.status.passed")
            : t("assessments.candidate.dashboard.status.notPassed")}
        </span>
        <button
          type="button"
          className="result-card__visibility"
          onClick={onToggleVisibility}
          disabled={isUpdating || result.peut_modifier_visibilite === false}
        >
          <AppIcon name={result.visible ? "eye" : "eyeOff"} size={14} />
          <span>
            {isUpdating
              ? t("assessments.candidate.dashboard.updating")
              : t("assessments.candidate.dashboard.toggleVisibility")}
          </span>
        </button>
      </div>

      <style jsx>{`
        .result-card {
          border: 1px solid #e6dff4;
          border-radius: 18px;
          background: #fff;
          padding: 14px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .result-card__icon {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(109, 42, 149, 0.08), rgba(171, 141, 246, 0.2));
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .result-card__ring {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: conic-gradient(var(--ring-color) calc(var(--ring-value) * 1%), #ede7fb 0);
          display: grid;
          place-items: center;
          position: relative;
        }

        .result-card__ring::before {
          content: "";
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          background: #fff;
        }

        .result-card__ring span {
          position: relative;
          z-index: 1;
          font-size: 0.62rem;
          font-weight: 800;
          color: #2c2250;
        }

        .result-card__main h3 {
          margin: 0;
          font-size: 1.36rem;
          line-height: 1.15;
        }

        .result-card__main p {
          margin: 8px 0;
          color: #5f587b;
          line-height: 1.45;
          font-size: 0.95rem;
        }

        .result-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .result-card__pill,
        .result-card__duration,
        .result-card__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          font-size: 0.79rem;
          font-weight: 700;
          min-height: 28px;
          padding: 0 10px;
        }

        .result-card__pill {
          background: #efe8ff;
          color: #6d2a95;
        }

        .result-card__pill.is-easy {
          background: #eaf9ef;
          color: #1f8f60;
        }

        .result-card__pill.is-hard {
          background: #ffeef1;
          color: #b13a57;
        }

        .result-card__duration {
          background: #f4f0ff;
          color: #5e5483;
        }

        .result-card__side {
          display: grid;
          gap: 10px;
          justify-items: end;
        }

        .result-card__status {
          min-height: 28px;
          padding: 0 10px;
        }

        .result-card__status.is-passed {
          color: #1d8a5d;
          background: #eaf9ef;
        }

        .result-card__status.is-failed {
          color: #a73852;
          background: #fff0f4;
        }

        .result-card__visibility {
          border: 1px solid #d6c8f2;
          background: #fff;
          color: #5f4b87;
          border-radius: 12px;
          min-height: 38px;
          padding: 0 12px;
          font-size: 0.79rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .result-card__visibility:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 760px) {
          .result-card {
            grid-template-columns: 1fr;
            align-items: start;
          }

          .result-card__side {
            justify-items: start;
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
    default:
      return null;
  }
}
