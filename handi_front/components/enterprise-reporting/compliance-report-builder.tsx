"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
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

function isVisiblePublicationChannel(channel: Pick<PublicationChannelForm, "key" | "label">) {
  const value = `${channel.key} ${channel.label}`.toLowerCase();
  return !value.includes("aneti");
}

function createDefaultOfferForms(context: EnterpriseComplianceContext) {
  return context.offers.reduce<Record<string, ComplianceOfferForm>>((acc, offer) => {
    acc[offer.offer_id] = {
      matching_candidates_count: String(offer.matching_candidates_count),
      publication_channels: offer.publication_channels
        .filter(isVisiblePublicationChannel)
        .map((channel) => ({
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

    for (const channel of offerForm.publication_channels.filter(isVisiblePublicationChannel)) {
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
    setMessage("Brouillon enregistré localement.");
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
    return <LoadingState title="Chargement du générateur de conformité" description="Préparation des données entreprise, des offres et des candidatures." />;
  }

  if (error && !context) {
    return <EmptyState title="Générateur de conformité indisponible" description={error} />;
  }

  if (!context || !payload) {
    return <EmptyState title="Aucun contexte disponible" description="Le générateur de rapport de conformité n'a pas pu être initialisé." />;
  }

  return (
    <main className="app-page compliance-builder">
      <section className="builder-hero">
        <div>
          <p>Rapport de conformité</p>
          <h1>Rapport de Conformite a la Loi n°41-2016</h1>
          <span>Verifier, completer, sauvegarder ou publier le rapport final.</span>
        </div>
        <div className="builder-actions">
          <ButtonLink href="/entreprise/reports-requests" variant="ghost">Retour</ButtonLink>
          <Button onClick={saveDraft} variant="secondary">Enregistrer le brouillon</Button>
          <Button onClick={() => downloadTextDocument(`${payload.summary || "compliance-report"}.txt`, generatedPreview)} variant="ghost">
            Text
          </Button>
          <Button onClick={() => downloadPdfDocument(`${payload.summary || "compliance-report"}.pdf`, generatedPreview)} variant="ghost">
            PDF
          </Button>
          <Button onClick={() => void submitReport()} disabled={saving}>
            {saving ? "Génération..." : "Générer"}
          </Button>
        </div>
      </section>

      {message ? <div className="message message-info">{message}</div> : null}
      {error ? <div className="message message-erreur">{error}</div> : null}

      <section className="builder-layout">
        <Card padding="md" className="settings-card">
          <div className="compact-head">
            <strong>Paramètres du rapport</strong>
            <p>Les données légales de l&apos;entreprise et les indicateurs de recrutement sont préremplis.</p>
          </div>

          <div className="form-grid">
            <div className="groupe-champ">
              <label htmlFor="summary">Titre du rapport</label>
              <input
                id="summary"
                className="champ"
                value={payload.summary}
                onChange={(event) => setPayload((current) => current ? { ...current, summary: event.target.value } : current)}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="period-start">Début de période</label>
              <input
                id="period-start"
                type="date"
                className="champ"
                value={payload.reporting_period_start}
                onChange={(event) => setPayload((current) => current ? { ...current, reporting_period_start: event.target.value } : current)}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="period-end">Fin de période</label>
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
              <strong>Employés en situation de handicap</strong>
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

          {context.offers.map((offer, offerIndex) => {
            const offerForm = payload.offer_forms[offer.offer_id];
            return (
              <details key={offer.offer_id} className="offer-accordion" open={offerIndex === 0}>
                <summary>
                  <span>
                    <strong>{offer.offer_title}</strong>
                    <small>{offer.localisation} - publie le {formatDate(offer.created_at)}</small>
                  </span>
                  <em>{offer.candidates.length} candidat{offer.candidates.length > 1 ? "s" : ""}</em>
                </summary>

                <div className="offer-accordion-body">
                <div className="form-grid compact-one">
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

                <div className="channel-grid">
                  {offerForm.publication_channels.filter(isVisiblePublicationChannel).map((channel) => (
                    <div key={channel.key} className="channel-card">
                      <div className="groupe-champ">
                        <label htmlFor={`${offer.offer_id}-${channel.key}-url`}>{channel.label} - lien</label>
                        <input
                          id={`${offer.offer_id}-${channel.key}-url`}
                          className="champ"
                          value={channel.url}
                          onChange={(event) =>
                            updateOfferForm(offer.offer_id, (current) => ({
                              ...current,
                              publication_channels: current.publication_channels.map((item) =>
                                item.key === channel.key ? { ...item, url: event.target.value } : item,
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {offer.candidates.length > 0 ? (
                  <div className="candidate-status-block">
                    <strong>Résultat des candidats convoqués</strong>
                    <div className="candidate-status-grid">
                      {offer.candidates.map((candidate) => (
                        <div key={candidate.application_id} className="candidate-status-row">
                          <span>{candidate.candidate_name}</span>
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
                            <option value="En cours d'evaluation">En cours d&apos;evaluation</option>
                            <option value="Entretien planifie">Entretien planifie</option>
                            <option value="Selectionne">Selectionne</option>
                            <option value="Recrute">Recrute</option>
                            <option value="Non retenu">Non retenu</option>
                          </select>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                </div>
              </details>
            );
          })}

          <div className="groupe-champ">
            <label htmlFor="evidence-urls">Liens de preuve complémentaires</label>
            <textarea
              id="evidence-urls"
              className="champ-zone"
              rows={4}
              placeholder="Un lien par ligne"
              value={payload.evidence_urls_text}
              onChange={(event) => setPayload((current) => current ? { ...current, evidence_urls_text: event.target.value } : current)}
            />
          </div>

          <div className="groupe-champ">
            <label htmlFor="notes">Notes complémentaires</label>
            <textarea
              id="notes"
              className="champ-zone"
              rows={6}
              placeholder="Ajoutez tout contexte complémentaire pour le rapport généré."
              value={payload.additional_notes}
              onChange={(event) => setPayload((current) => current ? { ...current, additional_notes: event.target.value } : current)}
            />
          </div>
        </Card>

        <Card padding="md" className="preview-card">
          <div className="compact-head">
            <strong>Aperçu généré</strong>
            <p>Généré à partir des données actuelles et de vos modifications.</p>
          </div>

          <div
            className="preview-box"
          >
            {generatedPreview}
          </div>
        </Card>
      </section>
      <style jsx>{`
        .compliance-builder {
          display: grid;
          gap: 14px;
        }

        .builder-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: 18px;
          padding: 16px 18px;
          background:
            linear-gradient(135deg, rgba(var(--app-primary-rgb), 0.06), rgba(var(--app-secondary-rgb), 0.16)),
            rgba(255,255,255,0.9);
          box-shadow: 0 14px 34px rgba(var(--app-primary-rgb), 0.07);
        }

        .builder-hero p,
        .builder-hero h1,
        .builder-hero span {
          margin: 0;
        }

        .builder-hero p {
          color: var(--app-primary);
          font-size: 0.74rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .builder-hero h1 {
          margin-top: 4px;
          color: var(--app-text);
          font-family: var(--app-heading);
          font-size: clamp(1.35rem, 2vw, 2rem);
          line-height: 1.1;
        }

        .builder-hero span {
          display: block;
          margin-top: 6px;
          color: var(--app-muted);
          font-size: 0.9rem;
        }

        .builder-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        .builder-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
          gap: 14px;
          align-items: start;
        }

        :global(.settings-card),
        :global(.preview-card) {
          border-radius: 18px !important;
          box-shadow: 0 12px 30px rgba(var(--app-primary-rgb), 0.06) !important;
        }

        :global(.preview-card) {
          position: sticky;
          top: 18px;
        }

        .compact-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .compact-head strong {
          color: var(--app-text);
          font-size: 1rem;
        }

        .compact-head p {
          max-width: 420px;
          margin: 0;
          color: var(--app-muted);
          font-size: 0.82rem;
          line-height: 1.35;
        }

        :global(.compliance-builder .form-grid) {
          gap: 10px !important;
        }

        :global(.compliance-builder .groupe-champ) {
          gap: 4px !important;
        }

        :global(.compliance-builder label) {
          font-size: 0.76rem !important;
        }

        :global(.compliance-builder .champ),
        :global(.compliance-builder .champ-select),
        :global(.compliance-builder .champ-zone) {
          min-height: 38px !important;
          border-radius: 12px !important;
          font-size: 0.86rem !important;
        }

        :global(.compliance-builder .champ-zone) {
          min-height: 86px !important;
        }

        :global(.compliance-builder .details-grid) {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 8px !important;
          margin-top: 10px !important;
        }

        :global(.compliance-builder .detail-box) {
          border-radius: 12px !important;
          padding: 10px 12px !important;
          background: rgba(var(--app-primary-rgb), 0.035) !important;
        }

        :global(.compliance-builder .detail-box strong) {
          font-size: 0.68rem !important;
        }

        :global(.compliance-builder .detail-box p) {
          margin-top: 4px !important;
          font-size: 0.95rem !important;
        }

        .offer-accordion {
          margin-top: 10px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: 14px;
          background: rgba(255,255,255,0.82);
          overflow: hidden;
        }

        .offer-accordion summary {
          cursor: pointer;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          list-style: none;
        }

        .offer-accordion summary::-webkit-details-marker {
          display: none;
        }

        .offer-accordion summary strong,
        .offer-accordion summary small {
          display: block;
        }

        .offer-accordion summary strong {
          color: var(--app-text);
          font-size: 0.94rem;
        }

        .offer-accordion summary small {
          margin-top: 3px;
          color: var(--app-muted);
          font-size: 0.74rem;
        }

        .offer-accordion summary em {
          border-radius: 999px;
          padding: 6px 10px;
          color: var(--app-primary);
          background: rgba(var(--app-primary-rgb), 0.07);
          font-size: 0.72rem;
          font-style: normal;
          font-weight: 900;
        }

        .offer-accordion-body {
          display: grid;
          gap: 12px;
          border-top: 1px solid rgba(var(--app-primary-rgb), 0.08);
          padding: 12px;
        }

        :global(.compact-one) {
          grid-template-columns: minmax(220px, 320px) !important;
        }

        .channel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .channel-card {
          display: grid;
          gap: 8px;
          border-radius: 12px;
          padding: 10px;
          background: rgba(var(--app-primary-rgb), 0.03);
        }

        .candidate-status-block {
          display: grid;
          gap: 8px;
        }

        .candidate-status-block > strong {
          font-size: 0.86rem;
        }

        .candidate-status-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .candidate-status-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(160px, 0.9fr);
          align-items: end;
          gap: 8px;
          border-radius: 12px;
          padding: 8px 10px;
          background: rgba(var(--app-primary-rgb), 0.03);
        }

        .candidate-status-row > span {
          color: var(--app-text);
          font-weight: 800;
          font-size: 0.82rem;
          padding-bottom: 10px;
        }

        .preview-box {
          white-space: pre-wrap;
          line-height: 1.48;
          font-size: 0.8rem;
          color: var(--app-text-soft);
          max-height: calc(100vh - 190px);
          overflow-y: auto;
          border: 1px solid var(--app-border);
          border-radius: 14px;
          padding: 14px;
          background: rgba(255,255,255,0.72);
        }

        @media (max-width: 1200px) {
          .builder-layout {
            grid-template-columns: 1fr;
          }

          :global(.preview-card) {
            position: static;
          }

          .preview-box {
            max-height: 420px;
          }
        }

        @media (max-width: 760px) {
          .builder-hero {
            grid-template-columns: 1fr;
          }

          .builder-actions {
            justify-content: flex-start;
          }

          :global(.compliance-builder .details-grid),
          .channel-grid,
          .channel-card,
          .candidate-status-grid,
          .candidate-status-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
