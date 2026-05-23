"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState, PageHeader } from "@/components/ui/layout";
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
      title: payload.title || "Transfer request draft",
      updated_at: new Date().toISOString(),
      payload,
    });

    setMessage("Transfer request draft saved locally.");
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
    setMessage("Transfer request generated as a downloadable document.");
    setError(null);
  };

  if (loading) {
    return (
      <main className="app-page">
        <LoadingState title="Loading transfer request builder" description="Preparing your company context and latest compliance reports." />
      </main>
    );
  }

  if (error && !context) {
    return (
      <main className="app-page">
        <EmptyState title="Transfer request unavailable" description={error} />
      </main>
    );
  }

  if (!context || !payload) {
    return (
      <main className="app-page">
        <EmptyState title="No context available" description="The transfer request builder could not be initialized." />
      </main>
    );
  }

  return (
    <main className="app-page">
      <PageHeader
        badge="Generate a transfer request"
        title="Prepare a formal transfer request"
        description="Link the request to a compliance report if needed, customize the legal narrative, and export the final document."
        actions={
          <div className="page-header-actions">
            <ButtonLink href="/entreprise/reports-requests" variant="ghost">Return Reports & Requests</ButtonLink>
            <Button onClick={saveDraft} variant="secondary">Save draft</Button>
            <Button onClick={generateTransferRequest}>Generate transfer request</Button>
          </div>
        }
      />

      {message ? <div className="message message-info">{message}</div> : null}
      {error ? <div className="message message-erreur">{error}</div> : null}

      <section className="split-grid">
        <Card padding="lg" className="stack-lg">
          <div>
            <strong style={{ fontSize: "1.1rem" }}>Request settings</strong>
            <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
              This builder uses your company context and optionally references one of your published compliance reports.
            </p>
          </div>

          <div className="form-grid">
            <div className="groupe-champ">
              <label htmlFor="transfer-title">Request title</label>
              <input
                id="transfer-title"
                className="champ"
                value={payload.title}
                onChange={(event) => setPayload((current) => (current ? { ...current, title: event.target.value } : current))}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="recipient-name">Recipient</label>
              <input
                id="recipient-name"
                className="champ"
                value={payload.recipient_name}
                onChange={(event) => setPayload((current) => (current ? { ...current, recipient_name: event.target.value } : current))}
              />
            </div>
            <div className="groupe-champ">
              <label htmlFor="recipient-department">Service / delegation</label>
              <input
                id="recipient-department"
                className="champ"
                value={payload.recipient_department}
                onChange={(event) => setPayload((current) => (current ? { ...current, recipient_department: event.target.value } : current))}
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
              <strong>Effectif</strong>
              <p>{context.company.workforce_total}</p>
            </div>
            <div className="detail-box">
              <strong>Postes restants</strong>
              <p>{context.company.remaining_reserved_positions}</p>
            </div>
          </div>

          <div className="groupe-champ">
            <label htmlFor="related-report">Related compliance report</label>
            <select
              id="related-report"
              className="champ-select"
              value={payload.related_report_id}
              onChange={(event) => setPayload((current) => (current ? { ...current, related_report_id: event.target.value } : current))}
            >
              <option value="">No linked report</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.summary} - {formatDate(report.submitted_at)}
                </option>
              ))}
            </select>
          </div>

          <div className="groupe-champ">
            <label htmlFor="request-reason">Request reason</label>
            <textarea
              id="request-reason"
              className="champ-zone"
              rows={6}
              value={payload.request_reason}
              onChange={(event) => setPayload((current) => (current ? { ...current, request_reason: event.target.value } : current))}
            />
          </div>

          <div className="groupe-champ">
            <label htmlFor="requested-action">Requested action</label>
            <textarea
              id="requested-action"
              className="champ-zone"
              rows={6}
              value={payload.requested_action}
              onChange={(event) => setPayload((current) => (current ? { ...current, requested_action: event.target.value } : current))}
            />
          </div>

          <div className="form-grid">
            <div className="groupe-champ">
              <label htmlFor="timeline">Preferred timeline</label>
              <input
                id="timeline"
                className="champ"
                value={payload.preferred_timeline}
                onChange={(event) => setPayload((current) => (current ? { ...current, preferred_timeline: event.target.value } : current))}
              />
            </div>
            <div className="groupe-champ" style={{ gridColumn: "span 2" }}>
              <label htmlFor="legal-basis">Legal basis</label>
              <input
                id="legal-basis"
                className="champ"
                value={payload.legal_basis}
                onChange={(event) => setPayload((current) => (current ? { ...current, legal_basis: event.target.value } : current))}
              />
            </div>
          </div>

          <div className="groupe-champ">
            <label htmlFor="additional-notes">Additional notes</label>
            <textarea
              id="additional-notes"
              className="champ-zone"
              rows={6}
              placeholder="Add any detail that should appear in the final request."
              value={payload.additional_notes}
              onChange={(event) => setPayload((current) => (current ? { ...current, additional_notes: event.target.value } : current))}
            />
          </div>
        </Card>

        <Card padding="lg" className="stack-lg">
          <div>
            <strong style={{ fontSize: "1.1rem" }}>Generated preview</strong>
            <p className="texte-secondaire" style={{ margin: "10px 0 0" }}>
              The request text updates live from the information you edit on the left.
            </p>
          </div>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              fontSize: "0.96rem",
              color: "var(--app-text-soft)",
              minHeight: "540px",
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
