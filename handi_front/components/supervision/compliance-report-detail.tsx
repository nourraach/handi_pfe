"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { SupervisionShell } from "@/components/supervision/supervision-shell";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { ComplianceReportDetail, mutateSupervisionResource } from "@/lib/supervision";

export function ComplianceReportDetailView({ reportId }: { reportId: string }) {
  const report = useSupervisionQuery<ComplianceReportDetail>(`/reports/${reportId}`);
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (action: "validate" | "reject" | "recommend") => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (action === "validate") {
        await mutateSupervisionResource(`/reports/${reportId}/validate`, "POST", { comment });
        setMessage("Report validated successfully.");
      }

      if (action === "reject") {
        await mutateSupervisionResource(`/reports/${reportId}/reject`, "POST", { comment, recommendation });
        setMessage("Report rejected with recommendation.");
      }

      if (action === "recommend") {
        await mutateSupervisionResource(`/reports/${reportId}/recommendations`, "POST", { recommendation });
        setMessage("Recommendation added.");
      }

      setRecommendation("");
      await report.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete the requested review action.");
    } finally {
      setSaving(false);
    }
  };

  if (report.loading) {
    return <LoadingState title="Loading report detail" description="Retrieving compliance metrics, comments, and review history." />;
  }

  if (report.error || !report.data) {
    return <EmptyState title="Report unavailable" description={report.error || "The requested compliance report could not be loaded."} />;
  }

  const data = report.data;

  return (
    <SupervisionShell
      badge="Report Review"
      title={`Compliance review for ${data.company_name}`}
      description="Validate compliant reports, reject non-compliant ones with mandatory recommendations, and maintain an auditable recommendation trail."
    >
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 space-y-5">
          <div>
            <p className="text-sm text-gray-500">{data.company_region}</p>
            <h2 className="text-xl font-semibold text-gray-900">{data.summary}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Reporting period: {new Date(data.reporting_period_start).toLocaleDateString("en-GB")} to{" "}
              {new Date(data.reporting_period_end).toLocaleDateString("en-GB")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-sm text-gray-500">Workforce</p><strong className="text-2xl text-gray-900">{data.workforce_total}</strong></div>
            <div><p className="text-sm text-gray-500">Disabled employees</p><strong className="text-2xl text-gray-900">{data.disabled_employees}</strong></div>
            <div><p className="text-sm text-gray-500">Active offers</p><strong className="text-2xl text-gray-900">{data.active_offers}</strong></div>
            <div><p className="text-sm text-gray-500">Applications</p><strong className="text-2xl text-gray-900">{data.applications_count}</strong></div>
            <div><p className="text-sm text-gray-500">Shortlisted</p><strong className="text-2xl text-gray-900">{data.shortlisted_count}</strong></div>
            <div><p className="text-sm text-gray-500">Hired</p><strong className="text-2xl text-gray-900">{data.hired_count}</strong></div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Accommodation actions</h3>
            <p className="mt-2 text-sm text-gray-700">{data.accommodation_actions || "No accommodation notes were provided in this report."}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Recommendation history</h3>
            {data.recommendations.length === 0 ? (
              <p className="text-sm text-gray-600">No recommendations have been added yet.</p>
            ) : (
              data.recommendations.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-gray-900">{item.type === "rejection" ? "Rejection recommendation" : "Recommendation"}</strong>
                    <span className="text-xs uppercase tracking-wide text-gray-500">{item.author_role}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{item.text}</p>
                  <p className="mt-2 text-xs text-gray-500">{new Date(item.created_at).toLocaleString("en-GB")}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Review actions</h3>
            <p className="mt-1 text-sm text-gray-600">Rejecting a report requires a recommendation. Recommendations remain visible in the audit trail.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review comment</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Optional review comment for the company file."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
            <textarea
              value={recommendation}
              onChange={(event) => setRecommendation(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Mandatory for rejection, optional for standalone recommendations."
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button onClick={() => void submit("validate")} disabled={saving}>
              Validate report
            </Button>
            <Button variant="danger" onClick={() => void submit("reject")} disabled={saving}>
              Reject with recommendation
            </Button>
            <Button variant="secondary" onClick={() => void submit("recommend")} disabled={saving}>
              Add recommendation only
            </Button>
          </div>
        </Card>
      </div>
    </SupervisionShell>
  );
}
