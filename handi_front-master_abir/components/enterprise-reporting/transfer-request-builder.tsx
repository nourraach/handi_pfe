"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import {
  downloadTextDocument,
  fetchEnterpriseComplianceContext,
  getEnterpriseDraft,
  listEnterpriseGeneratedReports,
  saveEnterpriseDraft,
  type EnterpriseComplianceContext,
  type EnterpriseGeneratedReportSummary,
} from "@/lib/enterprise-reports";

type TransferDraftPayload = {
  title: string;
  recipient_name: string;
  recipient_department: string;
  related_report_id: string;
  request_reason: string;
  requested_action: string;
  preferred_timeline: string;
  legal_basis: string;
  additional_notes: string;
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

function buildInitialPayload(
  context: EnterpriseComplianceContext,
  reports: EnterpriseGeneratedReportSummary[],
): TransferDraftPayload {
  const latestReport = reports[0];
  const companyName = context.company.company_name;

  return {
    title: `Demande de transfert - ${companyName}`,
    recipient_name: "ANETI / autorite competente",
    recipient_department: context.company.region || "Delegation territoriale competente",
    related_report_id: latestReport?.id || "",
    request_reason: latestReport
      ? `Suite au rapport de conformite "${latestReport.summary}", notre entreprise souhaite formaliser une demande de transfert ou d'accompagnement pour accelerer la mise en conformite et la mobilisation des candidats concernes.`
      : `Notre entreprise souhaite formaliser une demande de transfert ou d'accompagnement afin de renforcer son recrutement inclusif et de se conformer a ses engagements.`,
    requested_action:
      "Nous sollicitons l'orientation des candidatures pertinentes, la coordination avec les partenaires territoriaux, et un accompagnement sur les suites administratives a engager.",
    preferred_timeline: "Sous 30 jours",
    legal_basis:
      "La presente demande s'inscrit dans le cadre de la loi n°41-2016 relative a l'inclusion professionnelle des personnes en situation de handicap.",
    additional_notes: "",
  };
}

function buildTransferRequestBody(
  context: EnterpriseComplianceContext,
  reports: EnterpriseGeneratedReportSummary[],
  payload: TransferDraftPayload,
) {
  const relatedReport = reports.find((report) => report.id === payload.related_report_id);

  const lines = [
    payload.title,
    "",
    `Entreprise : ${context.company.company_name}`,
    `RNE : ${context.company.rne || "non renseigne"}`,
    `Region : ${context.company.region || "non renseignee"}`,
    `Destinataire : ${payload.recipient_name}`,
    `Service / delegation : ${payload.recipient_department || "-"}`,
    `Date : ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    "Objet : Demande de transfert / accompagnement",
    "",
    "Madame, Monsieur,",
    "",
    payload.request_reason.trim(),
    "",
    payload.legal_basis.trim(),
    "",
    `Notre effectif actuel est de ${context.company.workforce_total} salarie(s), dont ${context.company.disabled_employees} collaborateur(s) en situation de handicap deja en poste.`,
    `Selon le calcul actuel, ${context.company.required_reserved_positions} poste(s) doivent etre reserves et ${context.company.remaining_reserved_positions} poste(s) restent a couvrir.`,
    "",
    "Action sollicitee :",
    payload.requested_action.trim(),
    "",
    `Delai souhaite : ${payload.preferred_timeline || "-"}`,
  ];

  if (relatedReport) {
    lines.push("");
    lines.push("Rapport de conformite de reference :");
    lines.push(`- Titre : ${relatedReport.summary}`);
    lines.push(`- Statut : ${relatedReport.status}`);
    lines.push(`- Periode : ${formatDate(relatedReport.reporting_period_start)} - ${formatDate(relatedReport.reporting_period_end)}`);
    lines.push(`- Date de soumission : ${formatDate(relatedReport.submitted_at)}`);
  }

  if (payload.additional_notes.trim()) {
    lines.push("");
    lines.push("Observations complementaires :");
    lines.push(payload.additional_notes.trim());
  }

  lines.push("");
  lines.push("Nous restons disponibles pour transmettre toute piece justificative utile et pour coordonner les prochaines etapes avec vos equipes.");
  lines.push("");
  lines.push("Cordialement,");
  lines.push(context.company.company_name);
  lines.push(context.company.hr_contact_name || "Contact RH non renseigne");
  lines.push(context.company.hr_contact_email || "-");
  lines.push(context.company.hr_contact_phone || "-");

  return lines.join("\n");
}

export function TransferRequestBuilder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get("draft");
  const hydrated = useRef(false);
  const [context, setContext] = useState<EnterpriseComplianceContext | null>(null);
  const [reports, setReports] = useState<EnterpriseGeneratedReportSummary[]>([]);
  const [payload, setPayload] = useState<TransferDraftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [contextResult, reportsResult] = await Promise.all([
          fetchEnterpriseComplianceContext(),
          listEnterpriseGeneratedReports(),
        ]);
        setContext(contextResult);
        setReports(reportsResult);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Impossible de charger le generateur de demande de transfert.");
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

    const savedDraft = draftId ? getEnterpriseDraft<TransferDraftPayload>(draftId) : null;
    setPayload(savedDraft?.payload ?? buildInitialPayload(context, reports));
    hydrated.current = true;
  }, [context, reports, draftId]);

  const saveDraft = () => {
    if (!payload) {
      return;
    }

    const finalDraftId = draftId || (typeof crypto !== "undefined" ? crypto.randomUUID() : `draft-${Date.now()}`);
    saveEnterpriseDraft<TransferDraftPayload>({
      id: finalDraftId,
      type: "transfer",
      title: payload.title || "Brouillon de demande de transfert",
      updated_at: new Date().toISOString(),
      payload,
    });

    setMessage("Brouillon de demande de transfert enregistré localement.");
    setError(null);

    if (!draftId) {
      router.replace(`/entreprise/reports-requests/transfer?draft=${finalDraftId}`);
    }
  };

  const generatedPreview = useMemo(() => {
    if (!context || !payload) {
      return "";
    }

    return buildTransferRequestBody(context, reports, payload);
  }, [context, payload, reports]);

  const generateTransferRequest = () => {
    if (!payload) {
      return;
    }

    downloadTextDocument(`${payload.title || "transfer-request"}.txt`, generatedPreview);
    setMessage("Demande de transfert générée sous forme de document téléchargeable.");
    setError(null);
  };

  if (loading) {
    return (
      <main className="app-page">
        <LoadingState title="Chargement du générateur de demande de transfert" description="Préparation du contexte entreprise et des derniers rapports de conformité." />
      </main>
    );
  }

  if (error && !context) {
    return (
      <main className="app-page">
        <EmptyState title="Demande de transfert indisponible" description={error} />
      </main>
    );
  }

  if (!context || !payload) {
    return (
      <main className="app-page">
        <EmptyState title="Aucun contexte disponible" description="Le générateur de demande de transfert n'a pas pu être initialisé." />
      </main>
    );
  }

  return (
    <main className="app-page transfer-builder">
      <section className="transfer-hero">
        <div>
          <p>Demande de transfert</p>
          <h1>Preparer la demande</h1>
          <span>Redigez, liez au rapport de conformite, puis exportez le document.</span>
        </div>
        <div className="builder-actions">
          <ButtonLink href="/entreprise/reports-requests" variant="ghost">Retour</ButtonLink>
          <Button onClick={saveDraft} variant="secondary">Enregistrer</Button>
          <Button onClick={generateTransferRequest}>Generer</Button>
        </div>
      </section>

      {message ? <div className="message message-info">{message}</div> : null}
      {error ? <div className="message message-erreur">{error}</div> : null}

      <section className="transfer-layout">
        <Card padding="md" className="transfer-form-card">
          <div className="compact-head">
            <div>
              <strong>Parametres</strong>
              <p>Contexte entreprise et destinataire de la demande.</p>
            </div>
            <div className="status-pill">{reports.length} rapport(s)</div>
          </div>

          <div className="metrics-row">
            <div className="metric-chip">
              <span>Entreprise</span>
              <strong>{context.company.company_name}</strong>
            </div>
            <div className="metric-chip">
              <span>RNE</span>
              <strong>{context.company.rne || "-"}</strong>
            </div>
            <div className="metric-chip">
              <span>Effectif</span>
              <strong>{context.company.workforce_total}</strong>
            </div>
            <div className="metric-chip">
              <span>Restants</span>
              <strong>{context.company.remaining_reserved_positions}</strong>
            </div>
          </div>

          <div className="form-grid form-grid-tight">
            <div className="groupe-champ">
              <label htmlFor="transfer-title">Titre de la demande</label>
              <input
                id="transfer-title"
                className="champ"
                value={payload.title}
                onChange={(event) => setPayload((current) => (current ? { ...current, title: event.target.value } : current))}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="recipient-name">Destinataire</label>
              <input
                id="recipient-name"
                className="champ"
                value={payload.recipient_name}
                onChange={(event) => setPayload((current) => (current ? { ...current, recipient_name: event.target.value } : current))}
              />
            </div>
          </div>

          <div className="form-grid form-grid-tight">
            <div className="groupe-champ">
              <label htmlFor="recipient-department">Service / délégation</label>
              <input
                id="recipient-department"
                className="champ"
                value={payload.recipient_department}
                onChange={(event) => setPayload((current) => (current ? { ...current, recipient_department: event.target.value } : current))}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="related-report">Rapport de conformité lié</label>
              <select
                id="related-report"
                className="champ-select"
                value={payload.related_report_id}
                onChange={(event) => setPayload((current) => (current ? { ...current, related_report_id: event.target.value } : current))}
              >
                <option value="">Aucun rapport lié</option>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.summary} - {formatDate(report.submitted_at)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="textareas-grid">
            <div className="groupe-champ">
              <label htmlFor="request-reason">Motif de la demande</label>
              <textarea
                id="request-reason"
                className="champ-zone"
                rows={4}
                value={payload.request_reason}
                onChange={(event) => setPayload((current) => (current ? { ...current, request_reason: event.target.value } : current))}
              />
            </div>

            <div className="groupe-champ">
              <label htmlFor="requested-action">Action demandée</label>
              <textarea
                id="requested-action"
                className="champ-zone"
                rows={4}
                value={payload.requested_action}
                onChange={(event) => setPayload((current) => (current ? { ...current, requested_action: event.target.value } : current))}
              />
            </div>
          </div>

          <div className="form-grid form-grid-tight">
            <div className="groupe-champ">
              <label htmlFor="timeline">Délai souhaité</label>
              <input
                id="timeline"
                className="champ"
                value={payload.preferred_timeline}
                onChange={(event) => setPayload((current) => (current ? { ...current, preferred_timeline: event.target.value } : current))}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="legal-basis">Base légale</label>
              <input
                id="legal-basis"
                className="champ"
                value={payload.legal_basis}
                onChange={(event) => setPayload((current) => (current ? { ...current, legal_basis: event.target.value } : current))}
              />
            </div>
          </div>

          <div className="groupe-champ">
            <label htmlFor="additional-notes">Notes complémentaires</label>
            <textarea
              id="additional-notes"
              className="champ-zone"
              rows={3}
              placeholder="Ajoutez tout détail devant apparaître dans la demande finale."
              value={payload.additional_notes}
              onChange={(event) => setPayload((current) => (current ? { ...current, additional_notes: event.target.value } : current))}
            />
          </div>
        </Card>

        <Card padding="md" className="transfer-preview-card">
          <div className="compact-head preview-head">
            <div>
              <strong>Apercu genere</strong>
              <p>Mis a jour automatiquement.</p>
            </div>
            <Button onClick={generateTransferRequest} variant="secondary">Exporter</Button>
          </div>

          <div className="preview-box">
            {generatedPreview}
          </div>
        </Card>
      </section>

      <style jsx>{`
        .transfer-builder {
          display: grid;
          gap: 14px;
        }

        .transfer-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          border: 1px solid rgba(var(--app-primary-rgb), 0.1);
          border-radius: 18px;
          padding: 16px 18px;
          background:
            linear-gradient(135deg, rgba(var(--app-primary-rgb), 0.06), rgba(var(--app-secondary-rgb), 0.14)),
            rgba(255,255,255,0.92);
          box-shadow: 0 14px 34px rgba(var(--app-primary-rgb), 0.07);
        }

        .transfer-hero p,
        .transfer-hero h1,
        .transfer-hero span {
          margin: 0;
        }

        .transfer-hero p {
          color: var(--app-primary);
          font-size: 0.74rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .transfer-hero h1 {
          margin-top: 4px;
          color: var(--app-text);
          font-family: var(--app-heading);
          font-size: clamp(1.35rem, 2vw, 2rem);
          line-height: 1.1;
        }

        .transfer-hero span {
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

        .transfer-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
          gap: 14px;
          align-items: start;
        }

        :global(.transfer-form-card),
        :global(.transfer-preview-card) {
          border-radius: 18px !important;
          box-shadow: 0 12px 30px rgba(var(--app-primary-rgb), 0.06) !important;
        }

        :global(.transfer-form-card) {
          display: grid;
          gap: 12px;
        }

        :global(.transfer-preview-card) {
          position: sticky;
          top: 18px;
          display: grid;
          gap: 12px;
        }

        .compact-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .compact-head strong {
          color: var(--app-text);
          font-size: 1rem;
        }

        .compact-head p {
          margin: 4px 0 0;
          color: var(--app-muted);
          font-size: 0.82rem;
          line-height: 1.35;
        }

        .status-pill {
          flex: 0 0 auto;
          border-radius: 999px;
          padding: 7px 11px;
          color: var(--app-primary);
          background: rgba(var(--app-primary-rgb), 0.08);
          font-size: 0.72rem;
          font-weight: 900;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .metric-chip {
          min-width: 0;
          border-radius: 13px;
          padding: 10px 12px;
          background: rgba(var(--app-primary-rgb), 0.04);
          border: 1px solid rgba(var(--app-primary-rgb), 0.08);
        }

        .metric-chip span,
        .metric-chip strong {
          display: block;
        }

        .metric-chip span {
          color: var(--app-muted);
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .metric-chip strong {
          margin-top: 4px;
          overflow: hidden;
          color: var(--app-text);
          font-size: 0.9rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .form-grid-tight,
        .textareas-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        :global(.transfer-builder .groupe-champ) {
          gap: 4px !important;
        }

        :global(.transfer-builder label) {
          color: var(--app-text);
          font-size: 0.76rem !important;
          font-weight: 850;
        }

        :global(.transfer-builder .champ),
        :global(.transfer-builder .champ-select),
        :global(.transfer-builder .champ-zone) {
          min-height: 38px !important;
          border-radius: 12px !important;
          font-size: 0.86rem !important;
        }

        :global(.transfer-builder .champ-zone) {
          min-height: 96px !important;
          line-height: 1.45 !important;
        }

        .preview-head {
          align-items: center;
        }

        .preview-box {
          white-space: pre-wrap;
          line-height: 1.48;
          font-size: 0.8rem;
          color: var(--app-text-soft);
          max-height: calc(100vh - 230px);
          overflow-y: auto;
          border: 1px solid var(--app-border);
          border-radius: 14px;
          padding: 14px;
          background: rgba(255,255,255,0.74);
        }

        @media (max-width: 1180px) {
          .transfer-layout {
            grid-template-columns: 1fr;
          }

          :global(.transfer-preview-card) {
            position: static;
          }

          .preview-box {
            max-height: 420px;
          }
        }

        @media (max-width: 760px) {
          .transfer-hero,
          .form-grid-tight,
          .textareas-grid,
          .metrics-row {
            grid-template-columns: 1fr;
          }

          .builder-actions {
            justify-content: flex-start;
          }

          .preview-head {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
