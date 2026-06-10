"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/layout";
import { useSupervisionQuery } from "@/components/supervision/use-supervision-query";
import { SupervisedCompaniesMapResponse } from "@/lib/supervision";

function buildMapsQuery(company?: { company_name: string; address: string; region: string } | null, fallbackRegion?: string | null) {
  if (company) {
    return `${company.company_name}, ${company.address || company.region}, Tunisie`;
  }

  return `${fallbackRegion || "Tunisie"}, Tunisie`;
}

function buildEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=11&output=embed`;
}

export function RegionalCompaniesMap() {
  const { t } = useI18n();
  const companiesResource = useSupervisionQuery<SupervisedCompaniesMapResponse>("/companies-map");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedDelegation, setSelectedDelegation] = useState<string>("");

  const companies = useMemo(() => companiesResource.data?.companies ?? [], [companiesResource.data]);
  const delegations = useMemo(
    () =>
      Array.from(new Set(companies.map((company) => company.region).filter((region): region is string => Boolean(region)))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [companies],
  );
  const delegationFilter = selectedDelegation || companiesResource.data?.scope.region || "";
  const filteredCompanies = useMemo(
    () =>
      delegationFilter
        ? companies.filter((company) => company.region === delegationFilter)
        : companies,
    [companies, delegationFilter],
  );

  const selectedCompany = useMemo(
    () => filteredCompanies.find((company) => company.company_id === selectedCompanyId) ?? filteredCompanies[0] ?? null,
    [filteredCompanies, selectedCompanyId],
  );

  useEffect(() => {
    if (selectedCompanyId && !filteredCompanies.some((company) => company.company_id === selectedCompanyId)) {
      setSelectedCompanyId(null);
    }
  }, [filteredCompanies, selectedCompanyId]);

  useEffect(() => {
    if (!selectedDelegation && companiesResource.data?.scope.region) {
      setSelectedDelegation(companiesResource.data.scope.region);
    }
  }, [companiesResource.data?.scope.region, selectedDelegation]);

  if (companiesResource.loading) {
    return (
      <LoadingState
        title={t("supervision.map.loadingTitle")}
        description={t("supervision.map.loadingDescription")}
      />
    );
  }

  if (companiesResource.error || !companiesResource.data) {
    return (
      <EmptyState
        title={t("supervision.map.unavailableTitle")}
        description={t("supervision.map.unavailableDescription")}
      />
    );
  }

  const mapQuery = buildMapsQuery(selectedCompany, delegationFilter || companiesResource.data.scope.region);
  const embedUrl = buildEmbedUrl(mapQuery);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("supervision.map.title")}</h2>
            <p className="text-sm text-gray-600">
              {t("supervision.map.description")}
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {t("supervision.map.visibleCompanies", { count: filteredCompanies.length })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700" htmlFor="delegation-filter">
            Delegation
          </label>
          <select
            id="delegation-filter"
            className="champ-select w-full max-w-xs"
            value={selectedDelegation}
            onChange={(event) => {
              setSelectedDelegation(event.target.value);
              setSelectedCompanyId(null);
            }}
          >
            <option value="">Toutes les delegations</option>
            {delegations.map((delegation) => (
              <option key={delegation} value={delegation}>
                {delegation}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          <iframe
            title="Carte des entreprises"
            src={embedUrl}
            className="h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <p className="text-xs text-gray-500">
          {t("supervision.map.footnote")}
        </p>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("supervision.map.regionCompaniesTitle")}</h2>
          <p className="text-sm text-gray-600">
            {t("supervision.map.regionCompaniesDescription")}
          </p>
        </div>

        {filteredCompanies.length === 0 ? (
          <p className="text-sm text-gray-600">{t("supervision.map.noRegionCompanies")}</p>
        ) : (
          <div className="space-y-3">
            {filteredCompanies.map((company) => {
              const active = company.company_id === selectedCompany?.company_id;
              return (
                <button
                  key={company.company_id}
                  type="button"
                  onClick={() => setSelectedCompanyId(company.company_id)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left transition",
                    active ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{company.company_name}</p>
                      <p className="text-sm text-gray-500">{company.region}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {company.address || t("supervision.map.missingAddress")}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-600">
                      <p>{t("supervision.map.offers", { count: company.offers_count })}</p>
                      <p>{t("supervision.map.applications", { count: company.applications_count })}</p>
                      <p>{t("supervision.map.recruited", { count: company.hired_count })}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
