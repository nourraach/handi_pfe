"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui/layout";
import {
  EnterpriseComplianceContext,
  createEnterpriseComplianceReport,
  fetchEnterpriseComplianceContext,
  getEnterpriseDraft,
  saveEnterpriseDraft,
  deleteEnterpriseDraft,
  downloadPdfDocument,
  downloadTextDocument,
} from "@/lib/enterprise-reports";

type PublicationChannelForm = {
  key: string;
  label: string;
  screenshot_label: string;
  url: string;
};

type ComplianceOfferForm = {
  matching_candidates_count: string;
  publication_channels: PublicationChannelForm[];
  candidate_results: Record<string, string>;
};

type ComplianceDraftPayload = {
  summary: string;
  reporting_period_start: string;
  reporting_period_end: string;
  additional_notes: string;
  evidence_urls_text: string;
  offer_forms: Record<string, ComplianceOfferForm>;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("fr-FR");
}

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDefaultPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    reporting_period_start: toDateInputValue(start),
    reporting_period_end: toDateInputValue(now),
  };
}

function buildDefaultSummary(context: EnterpriseComplianceContext) {
  const periodLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return `Rapport de conformite a la loi n°41-2016 - ${context.company.company_name} - ${periodLabel}`;
}

function createDefaultOfferForms(context: EnterpriseComplianceContext) {
  return context.offers.reduce<Record<string, ComplianceOfferForm>>((acc, offer) => {
    acc[offer.offer_id] = {
      matching_candidates_count: String(offer.matching_candidates_count),
      publication_channels: offer.publication_channels.map((channel) => ({
        key: channel.key,
        label: channel.label,
        screenshot_label: channel.screenshot_label,
        url: channel.url,
      })),
      candidate_results: offer.candidates.reduce<Record<string, string>>((resultMap, candidate) => {
        resultMap[candidate.application_id] =
          candidate.statut === "accepted"
            ? "Recrute"
            : candidate.statut === "interview_scheduled"
              ? "Entretien planifie"
              : "En cours d'evaluation";
        return resultMap;
      }, {}),
    };
    return acc;
  }, {});
}

function buildInitialPayload(context: EnterpriseComplianceContext): ComplianceDraftPayload {
  return {
    summary: buildDefaultSummary(context),
    ...getDefaultPeriod(),
    additional_notes: "",
    evidence_urls_text: "",
    offer_forms: createDefaultOfferForms(context),
  };
}

function mergePayloadWithContext(
  context: EnterpriseComplianceContext,
  saved?: ComplianceDraftPayload | null,
): ComplianceDraftPayload {
  const base = buildInitialPayload(context);
  if (!saved) {
    return base;
  }

  const mergedOfferForms = { ...base.offer_forms };
  for (const offer of context.offers) {
    const existing = saved.offer_forms?.[offer.offer_id];
    if (!existing) {
      continue;
    }

    mergedOfferForms[offer.offer_id] = {
      matching_candidates_count: existing.matching_candidates_count ?? mergedOfferForms[offer.offer_id].matching_candidates_count,
      publication_channels: mergedOfferForms[offer.offer_id].publication_channels.map((channel) => {
        const savedChannel = existing.publication_channels?.find((item) => item.key === channel.key);
        return savedChannel
          ? {
              ...channel,
              url: savedChannel.url ?? channel.url,
              screenshot_label: savedChannel.screenshot_label ?? channel.screenshot_label,
            }
          : channel;
      }),
      candidate_results: {
        ...mergedOfferForms[offer.offer_id].candidate_results,
        ...(existing.candidate_results ?? {}),
      },
    };
  }

  return {
    summary: saved.summary || base.summary,
    reporting_period_start: saved.reporting_period_start || base.reporting_period_start,
    reporting_period_end: saved.reporting_period_end || base.reporting_period_end,
    additional_notes: saved.additional_notes || "",
    evidence_urls_text: saved.evidence_urls_text || "",
    offer_forms: mergedOfferForms,
  };
}

function buildComplianceReportBody(context: EnterpriseComplianceContext, payload: ComplianceDraftPayload) {
  const totalReserved = context.company.required_reserved_positions;
  const alreadyDisabled = context.company.disabled_employees;
  const remaining = context.company.remaining_reserved_positions;

  const lines: string[] = [
    "Rapport de Conformite a la Loi n°41-2016",
    "",
    "1. Contexte juridique",
    "La loi n°41-2016, promulguee le 16 mai 2016, impose aux entreprises privees de plus de 50 salaries l'obligation de reserver au moins 2% de leurs postes d'emploi a des personnes en situation de handicap, dans le cadre de la promotion de leur inclusion professionnelle.",
    "",
    `Dans ce contexte, ${context.company.company_name}, enregistre au Registre National des entreprises sous le numero ${context.company.rne || "non renseigne"} et dont l'effectif actuel declare est de ${context.company.workforce_total} salaries, est tenue de reserver un minimum de ${totalReserved} postes a des personnes en situation de handicap, dont ${alreadyDisabled} collaborateurs handicapes sont deja en poste. Il reste donc ${remaining} poste(s) a reserver selon le calcul actuel.`,
    "",
    `${context.company.company_name} s'appuie sur la plateforme HandiTalents pour ses campagnes de recrutement inclusif et le suivi de ses obligations de conformite.`,
    "",
    "2. Publication d'offre d'emploi",
  ];

  if (context.offers.length === 0) {
    lines.push("Aucune offre d'emploi n'a ete rattachee a cette periode.");
  }

  context.offers.forEach((offer, index) => {
    const offerForm = payload.offer_forms[offer.offer_id];
    const matchingCount = Number.parseInt(offerForm?.matching_candidates_count || "0", 10) || 0;
    lines.push("");
    lines.push(`Offre d'emploi ${index + 1} : ${offer.offer_title} a ${offer.localisation} - ${formatDate(offer.created_at)} :`);
    lines.push(
      `Le ${formatDate(offer.created_at)}, ${context.company.company_name} a publie sur la plateforme HandiTalents 1 poste de ${offer.offer_title} a ${offer.localisation}.`,
    );
    lines.push("");
    lines.push("Canaux de publication :");

    for (const channel of offerForm.publication_channels) {
      lines.push(`- ${channel.label}`);
      lines.push(`  Lien de publication : ${channel.url || "non renseigne"}`);
      lines.push(`  Capture associee : ${channel.screenshot_label || "non renseignee"}`);
    }

    lines.push("");
    lines.push(`${offer.views_count} personnes ont clique sur le lien de candidature.`);
    lines.push(`${offer.applications_count} candidats ont postule, dont ${matchingCount} repondent aux criteres de ${context.company.company_name}.`);
    lines.push("");
    lines.push("Agence / Gouvernorat | Nombre de Postes | Nombre de Candidatures recues | Nombre de Candidatures conformes");
    lines.push(`${offer.localisation} | 1 | ${offer.applications_count} | ${matchingCount}`);
    lines.push("");

    if (offer.candidates.length === 0) {
      lines.push(`${context.company.company_name} n'a convoque aucun candidat pour cette offre sur la periode selectionnee.`);
    } else {
      lines.push(`${context.company.company_name} a convoque ${offer.candidates.length} candidat(s) pour entretien :`);
      lines.push("Nom et prenom | Sexe | Age | N° carte handicap | Date expiration | Gouvernorat | Nature handicap | Diplome obtenu | Specialite");
      for (const candidate of offer.candidates) {
        lines.push(
          `${candidate.candidate_name} | ${candidate.candidate_gender || "-"} | ${candidate.candidate_age ?? "-"} | ${candidate.num_carte_handicap || "-"} | ${formatDate(candidate.date_expiration_carte_handicap)} | ${candidate.candidate_region || "-"} | ${candidate.type_handicap || candidate.handicap || "-"} | ${candidate.niveau_academique || "-"} | ${candidate.formation || candidate.secteur || "-"}`,
        );
      }
      lines.push("");
      lines.push("Resultat des entretiens :");
      lines.push("Nom et prenom | Statut");
      for (const candidate of offer.candidates) {
        lines.push(`${candidate.candidate_name} | ${offerForm.candidate_results[candidate.application_id] || "En cours d'evaluation"}`);
      }
    }
  });

  lines.push("");
  lines.push("3. Position de l'entreprise au regard de la loi n°41-2016");
  lines.push(
    `Conformement aux dispositions de la loi n°41-2016, ${context.company.company_name} avec un effectif de ${context.company.workforce_total} salaries est tenue de reserver ${totalReserved} postes a des personnes en situation de handicap. A ce jour, ${context.company.company_name} compte deja ${alreadyDisabled} employe(s) en situation de handicap. Il reste donc ${remaining} poste(s) a reserver a cette categorie de candidats.`,
  );

  if (payload.additional_notes.trim()) {
    lines.push("");
    lines.push("4. Notes complementaires");
    lines.push(payload.additional_notes.trim());
  }

  return lines.join("\n");
}

export function ComplianceReportBuilder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get("draft");
  const [context, setContext] = useState<EnterpriseComplianceContext | null>(null);
  const [payload, setPayload] = useState<ComplianceDraftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchEnterpriseComplianceContext();
        setContext(result);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Impossible de charger le contexte du rapport.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!context || hydrated.current) {
      return;
    }

    const savedDraft = draftId ? getEnterpriseDraft<ComplianceDraftPayload>(draftId) : null;
    setPayload(mergePayloadWithContext(context, savedDraft?.payload ?? null));
    hydrated.current = true;
  }, [context, draftId]);

  const updateOfferForm = (offerId: string, updater: (current: ComplianceOfferForm) => ComplianceOfferForm) => {
    setPayload((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        offer_forms: {
          ...current.offer_forms,
          [offerId]: updater(current.offer_forms[offerId]),
        },
      };
    });
  };

  const saveDraft = () => {
    if (!payload || !context) {
      return;
    }

    const finalDraftId = draftId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `draft-${Date.now()}`);
    saveEnterpriseDraft<ComplianceDraftPayload>({
      id: finalDraftId,
      type: "compliance",
      title: payload.summary || buildDefaultSummary(context),
      updated_at: new Date().toISOString(),
      payload,
    });
    setMessage("Draft saved locally.");
    setError(null);

    if (!draftId) {
      router.replace(`/entreprise/reports-requests/compliance?draft=${finalDraftId}`);
    }
  };

  const submitReport = async () => {
    if (!payload || !context) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const generatedBody = buildComplianceReportBody(context, payload);
      const extraEvidence = payload.evidence_urls_text
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const publicationEvidence = Object.values(payload.offer_forms)
        .flatMap((offerForm) => offerForm.publication_channels.map((channel) => channel.url.trim()))
        .filter(Boolean);

      const result = await createEnterpriseComplianceReport({
        summary: payload.summary,
        reporting_period_start: payload.reporting_period_start,
        reporting_period_end: payload.reporting_period_end,
        workforce_total: context.company.workforce_total,
        disabled_employees: context.company.disabled_employees,
        active_offers: context.totals.active_offers,
        applications_count: context.totals.applications_count,
        shortlisted_count: context.totals.shortlisted_count,
        hired_count: context.totals.hired_count,
        accommodation_actions: payload.additional_notes,
        evidence_urls: [...publicationEvidence, ...extraEvidence],
        generated_body: generatedBody,
      });

      if (draftId) {
        deleteEnterpriseDraft(draftId);
      }

      router.push(`/entreprise/reports-requests/reports/${result.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de generer le rapport.");
    } finally {
      setSaving(false);
    }
  };

  const generatedPreview = useMemo(() => {
    if (!context || !payload) {
      return "";
    }

    return buildComplianceReportBody(context, payload);
  }, [context, payload]);

  if (loading) {
    return <LoadingState title="Loading compliance builder" description="Preparing company data, offers, and applications." />;
  }

  if (error && !context) {
    return <EmptyState title="Compliance builder unavailable" description={error} />;
  }

  if (!context || !payload) {
    return <EmptyState title="No context available" description="The compliance report builder could not be initialized." />;
  }

  return (
    <main className="app-page">
      <PageHeader
        badge="Generate the compliance report"
        title="Rapport de Conformite a la Loi n°41-2016"
        description="Remplissez les informations, verifiez la previsualisation, sauvegardez un brouillon si besoin, puis publiez le rapport final."
        actions={
          <div className="page-header-actions">
            <ButtonLink href="/entreprise/reports-requests" variant="ghost">Return Reports & Requests</ButtonLink>
            <Button onClick={saveDraft} variant="secondary">Save draft</Button>
            <Button onClick={() => downloadTextDocument(`${payload.summary || "compliance-report"}.txt`, generatedPreview)} variant="ghost">
              Download text
            </Button>
            <Button onClick={() => downloadPdfDocument(`${payload.summary || "compliance-report"}.pdf`, generatedPreview)} variant="ghost">
              Download PDF
            </Button>
            <Button onClick={() => void submitReport()} disabled={saving}>
              {saving ? "Generating..." : "Generate compliance report"}
            </Button>
          </div>
        }
      />

      {message ? <div className="message message-info">{message}</div> : null}
      {error ? <div className="message message-erreur">{error}</div> : null}

      <section className="split-grid">
        <Card padding="lg" className="stack-lg">
          <div>
            <strong style={{ fontSize: "1.1rem" }}>Report settings</strong>
            <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
              Legal company data and live hiring metrics are prefilled from the platform.
            </p>
          </div>

          <div className="form-grid">
            <div className="groupe-champ">
              <label htmlFor="summary">Report title</label>
              <input
                id="summary"
                className="champ"
                value={payload.summary}
                onChange={(event) => setPayload((current) => current ? { ...current, summary: event.target.value } : current)}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="period-start">Reporting period start</label>
              <input
                id="period-start"
                type="date"
                className="champ"
                value={payload.reporting_period_start}
                onChange={(event) => setPayload((current) => current ? { ...current, reporting_period_start: event.target.value } : current)}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="period-end">Reporting period end</label>
              <input
                id="period-end"
                type="date"
                className="champ"
                value={payload.reporting_period_end}
                onChange={(event) => setPayload((current) => current ? { ...current, reporting_period_end: event.target.value } : current)}
              />
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-box">
              <strong>Entreprise</strong>
              <p>{context.company.company_name}</p>
            </div>
            <div className="detail-box">
              <strong>RNE</strong>
              <p>{context.company.rne || "-"}</p>
            </div>
            <div className="detail-box">
              <strong>Effectif total</strong>
              <p>{context.company.workforce_total}</p>
            </div>
            <div className="detail-box">
              <strong>Employes handicapes</strong>
              <p>{context.company.disabled_employees}</p>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-box">
              <strong>Postes reserves minimum</strong>
              <p>{context.company.required_reserved_positions}</p>
            </div>
            <div className="detail-box">
              <strong>Postes restants</strong>
              <p>{context.company.remaining_reserved_positions}</p>
            </div>
            <div className="detail-box">
              <strong>Offres actives</strong>
              <p>{context.totals.active_offers}</p>
            </div>
            <div className="detail-box">
              <strong>Candidatures</strong>
              <p>{context.totals.applications_count}</p>
            </div>
          </div>

          {context.offers.map((offer) => {
            const offerForm = payload.offer_forms[offer.offer_id];
            return (
              <Card key={offer.offer_id} padding="md" className="stack-lg">
                <div>
                  <strong style={{ display: "block", fontSize: "1.05rem" }}>{offer.offer_title}</strong>
                  <p className="texte-secondaire" style={{ margin: "8px 0 0" }}>
                    {offer.localisation} - publie le {formatDate(offer.created_at)}
                  </p>
                </div>

                <div className="form-grid">
                  <div className="groupe-champ">
                    <label htmlFor={`matching-${offer.offer_id}`}>Nombre de candidatures conformes</label>
                    <input
                      id={`matching-${offer.offer_id}`}
                      className="champ"
                      type="number"
                      min="0"
                      value={offerForm.matching_candidates_count}
                      onChange={(event) =>
                        updateOfferForm(offer.offer_id, (current) => ({
                          ...current,
                          matching_candidates_count: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="stack-lg">
                  {offerForm.publication_channels.map((channel, index) => (
                    <div key={channel.key} className="form-grid">
                      <div className="groupe-champ">
                        <label htmlFor={`${offer.offer_id}-${channel.key}-url`}>{channel.label} - lien</label>
                        <input
                          id={`${offer.offer_id}-${channel.key}-url`}
                          className="champ"
                          value={channel.url}
                          onChange={(event) =>
                            updateOfferForm(offer.offer_id, (current) => ({
                              ...current,
                              publication_channels: current.publication_channels.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, url: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="groupe-champ">
                        <label htmlFor={`${offer.offer_id}-${channel.key}-capture`}>{channel.label} - capture</label>
                        <input
                          id={`${offer.offer_id}-${channel.key}-capture`}
                          className="champ"
                          value={channel.screenshot_label}
                          onChange={(event) =>
                            updateOfferForm(offer.offer_id, (current) => ({
                              ...current,
                              publication_channels: current.publication_channels.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, screenshot_label: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {offer.candidates.length > 0 ? (
                  <div className="stack-lg">
                    <strong>Resultat des candidats convoques</strong>
                    {offer.candidates.map((candidate) => (
                      <div key={candidate.application_id} className="form-grid">
                        <div className="groupe-champ">
                          <label>{candidate.candidate_name}</label>
                          <input className="champ" value={candidate.candidate_name} disabled />
                        </div>
                        <div className="groupe-champ">
                          <label htmlFor={`${candidate.application_id}-result`}>Statut dans le rapport</label>
                          <select
                            id={`${candidate.application_id}-result`}
                            className="champ-select"
                            value={offerForm.candidate_results[candidate.application_id] || "En cours d'evaluation"}
                            onChange={(event) =>
                              updateOfferForm(offer.offer_id, (current) => ({
                                ...current,
                                candidate_results: {
                                  ...current.candidate_results,
                                  [candidate.application_id]: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="En cours d'evaluation">En cours d'evaluation</option>
                            <option value="Entretien planifie">Entretien planifie</option>
                            <option value="Selectionne">Selectionne</option>
                            <option value="Recrute">Recrute</option>
                            <option value="Non retenu">Non retenu</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          })}

          <div className="groupe-champ">
            <label htmlFor="evidence-urls">Additional evidence URLs</label>
            <textarea
              id="evidence-urls"
              className="champ-zone"
              rows={4}
              placeholder="One URL per line"
              value={payload.evidence_urls_text}
              onChange={(event) => setPayload((current) => current ? { ...current, evidence_urls_text: event.target.value } : current)}
            />
          </div>

          <div className="groupe-champ">
            <label htmlFor="notes">Additional notes</label>
            <textarea
              id="notes"
              className="champ-zone"
              rows={6}
              placeholder="Add any complementary context for the generated report."
              value={payload.additional_notes}
              onChange={(event) => setPayload((current) => current ? { ...current, additional_notes: event.target.value } : current)}
            />
          </div>
        </Card>

        <Card padding="lg" className="stack-lg">
          <div>
            <strong style={{ fontSize: "1.1rem" }}>Generated preview</strong>
            <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
              This text is generated from the current data and the values you edit on the left.
            </p>
          </div>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              fontSize: "0.96rem",
              color: "var(--app-text-soft)",
              maxHeight: "75vh",
              overflowY: "auto",
              border: "1px solid var(--app-border)",
              borderRadius: "20px",
              padding: "20px",
              background: "rgba(255,255,255,0.7)",
            }}
          >
            {generatedPreview}
          </div>
        </Card>
      </section>
    </main>
  );
}
