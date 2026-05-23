"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  helperItems?: { title: string; text: string }[];
  backHref?: string;
  backLabel?: string;
  layout?: "split" | "centered";
}

export function AuthShell({
  badge,
  title,
  description,
  children,
  helperItems,
  backHref = "/",
  backLabel,
  layout = "split",
}: AuthShellProps) {
  const isCentered = layout === "centered";
  const { t } = useI18n();
  const resolvedHelperItems = helperItems ?? [
    {
      title: t("authShell.helperItems.talentFirstTitle"),
      text: t("authShell.helperItems.talentFirstText"),
    },
    {
      title: t("authShell.helperItems.employerSupportTitle"),
      text: t("authShell.helperItems.employerSupportText"),
    },
    {
      title: t("authShell.helperItems.accessibilityTitle"),
      text: t("authShell.helperItems.accessibilityText"),
    },
  ];
  const resolvedBackLabel = backLabel || t("authShell.backToLanding");

  return (
    <main className="app-theme">
      <section className={isCentered ? "auth-shell auth-shell-centered" : "auth-shell"}>
        {isCentered ? null : (
          <aside className="auth-aside">
            <Link href={backHref} className="brand-pill">
                  <span className="brand-mark" aria-hidden="true" />
                  <span className="brand-copy">
                    <strong>HandiTalents</strong>
                    <span>{t("common.brandTagline")}</span>
                  </span>
                </Link>

            <p className="badge">{badge}</p>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-description">{description}</p>

            <div className="auth-list">
              {resolvedHelperItems.map((item) => (
                <div key={item.title} className="auth-list-item">
                  <span className="auth-check" aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <Card className={isCentered ? "auth-panel auth-panel-centered" : "auth-panel"} padding="lg">
          <div className="stack-lg">
            {isCentered ? (
              <div className="auth-panel-utility">
                <Link href={backHref} className="brand-pill">
                  <span className="brand-mark" aria-hidden="true" />
                  <span className="brand-copy">
                    <strong>HandiTalents</strong>
                    <span>{t("common.brandTagline")}</span>
                  </span>
                </Link>
                <ButtonLink href={backHref} variant="ghost" size="sm">
                  {resolvedBackLabel}
                </ButtonLink>
              </div>
            ) : (
              <ButtonLink href={backHref} variant="ghost" size="sm">
                {resolvedBackLabel}
              </ButtonLink>
            )}
            {children}
          </div>
        </Card>
      </section>
    </main>
  );
}

interface PageHeaderProps {
  badge: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tone?: "default" | "dark";
}

export function PageHeader({ badge, title, description, actions, tone = "default" }: PageHeaderProps) {
  if (tone === "dark") {
    return (
      <section className="page-header-card">
        <div className="page-header-copy">
          <p className="badge">{badge}</p>
          <h1 className="page-title page-title-sm">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </section>
    );
  }

  return (
    <header className="page-header">
      <div className="page-header-copy">
        <p className="badge">{badge}</p>
        <h1 className="page-title page-title-sm">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <p className="texte-secondaire stat-card-hint">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="empty-state" padding="lg">
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="page-header-actions empty-state-action">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <div className="loading-state" aria-busy="true" aria-live="polite">
      <div className="loading-state-skeleton" aria-hidden="true">
        <div className="loading-state-skeleton-line loading-state-skeleton-line-lg" />
        <div className="loading-state-skeleton-line loading-state-skeleton-line-md" />
        <div className="loading-state-skeleton-grid">
          <div className="loading-state-skeleton-card" />
          <div className="loading-state-skeleton-card" />
          <div className="loading-state-skeleton-card" />
        </div>
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
