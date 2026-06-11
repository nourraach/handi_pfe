"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/route-protegee";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";
import { authenticatedFetch, getUtilisateurConnecte } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type StatItem = { statut: string; count: number };

const trustedPartners = ["Inclusive Hiring Hub", "Career Bridge", "Access Talent", "Future Skills", "Open Work"];

const featureCards = [
  {
    title: "Accessible opportunity flow",
    text: "Move from discovery to application with calmer spacing, clearer reading paths, and less visual friction.",
  },
  {
    title: "Focused preparation tools",
    text: "Keep your CV, assessments, messages, and interviews close without feeling buried in administrative screens.",
  },
  {
    title: "Progress you can feel",
    text: "Your workspace highlights movement, not just numbers, so each next step feels purposeful and visible.",
  },
];

const quickLinks = [
  { title: "Browse jobs", text: "Explore fresh opportunities matched to your profile.", href: "/offres" },
  { title: "Applications", text: "Check where each candidature stands right now.", href: "/candidat/candidatures" },
  { title: "CV builder", text: "Polish your story before recruiters ask for it.", href: "/candidat/cv" },
  { title: "Messages", text: "Stay connected with companies and admins clearly.", href: "/messages" },
];

function CandidateWorkspacePage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const utilisateur = getUtilisateurConnecte();

  useEffect(() => {
    void charger();
  }, []);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(construireUrlApi("/api/candidatures/mes-statistiques"));
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to load your statistics.");
      }
      setStats(Array.isArray(data.donnees) ? data.donnees : []);
      setErreur(null);
    } catch (cause: unknown) {
      setErreur(cause instanceof Error ? cause.message : "Unable to load your statistics.");
    } finally {
      setLoading(false);
    }
  };

  const statsMap = useMemo(
    () =>
      stats.reduce<Record<string, number>>((acc, item) => {
        acc[item.statut] = Number(item.count) || 0;
        return acc;
      }, {}),
    [stats],
  );

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
  const pending = statsMap.pending || 0;
  const shortlisted = statsMap.shortlisted || 0;
  const accepted = statsMap.accepted || 0;
  const firstName = utilisateur?.nom?.split(" ")[0] || "ami";
  const hasNoApplications = total === 0;

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title="Chargement de votre espace"
          description="Preparation de vos opportunites et de votre progression."
        />
      </main>
    );
  }

  return (
    <div className="candidate-workspace-page" aria-live="polite">
      <section className="candidate-workspace-hero">
        <div className="candidate-workspace-copy">
          <p className="candidate-workspace-kicker">Candidate workspace</p>
          <h1>
            Build your next chapter
            <br />
            with clarity, confidence,
            <br />
            and momentum.
          </h1>
          <p className="candidate-workspace-intro">
            Welcome back, {firstName}. This workspace is designed to help you navigate jobs, applications, interviews,
            and preparation with a calmer and more inspiring rhythm.
          </p>

          <div className="candidate-workspace-actions">
            <ButtonLink href="/offres">Explore opportunities</ButtonLink>
            <ButtonLink href="/candidat/candidatures" variant="secondary">
              Open applications
            </ButtonLink>
          </div>

          <div className="candidate-workspace-trust">
            <div className="candidate-workspace-mini-avatars" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>Built for a more accessible, encouraging, and inclusive candidate journey.</p>
          </div>
        </div>

          <div className="candidate-workspace-visual">
          <div className="candidate-workspace-portrait">
            <div className="candidate-workspace-image-placeholder">
              Candidate journey
            </div>
          </div>

          <div className="candidate-workspace-floating candidate-workspace-floating-top">
            <strong>{shortlisted}</strong>
            <span>Shortlisted roles</span>
          </div>

          <div className="candidate-workspace-floating candidate-workspace-floating-bottom">
            <strong>{accepted}</strong>
            <span>Accepted outcomes</span>
          </div>
        </div>
      </section>

      <section className="candidate-workspace-partners">
        <p>Trusted across inclusive recruitment and candidate support ecosystems</p>
        <div className="candidate-workspace-partner-row">
          {trustedPartners.map((partner) => (
            <span key={partner}>{partner}</span>
          ))}
        </div>
      </section>

      {erreur ? <div className="message message-erreur" role="alert">{erreur}</div> : null}

      {hasNoApplications ? (
        <Card padding="lg" className="empty-state">
          <strong>Vous n&apos;avez pas encore postule</strong>
          <p>Explorez les offres et lancez votre premiere candidature pour demarrer votre parcours.</p>
          <div className="page-header-actions empty-state-action">
            <ButtonLink href="/offres">Explorer les offres</ButtonLink>
          </div>
        </Card>
      ) : null}

      <section className="candidate-workspace-stats">
        <Card padding="lg" interactive>
          <span>Total applications</span>
          <strong>{total}</strong>
          <p>Everything you have already put into motion.</p>
        </Card>
        <Card padding="lg" interactive>
          <span>Pending reviews</span>
          <strong>{pending}</strong>
          <p>Opportunities still being examined by employers.</p>
        </Card>
        <Card padding="lg" interactive>
          <span>Shortlisted</span>
          <strong>{shortlisted}</strong>
          <p>Roles where your profile is moving forward.</p>
        </Card>
        <Card padding="lg" interactive>
          <span>Accepted</span>
          <strong>{accepted}</strong>
          <p>Concrete progress already achieved in your journey.</p>
        </Card>
      </section>

      <section className="candidate-workspace-value">
        <div className="candidate-workspace-section-head">
          <p className="candidate-workspace-kicker">What sets this space apart</p>
          <h2>A workspace that feels more human, supportive, and beautifully structured.</h2>
        </div>

        <div className="candidate-workspace-feature-grid">
          {featureCards.map((item) => (
            <Card key={item.title} padding="lg" className="candidate-workspace-feature-card" interactive>
              <div className="candidate-workspace-feature-icon" aria-hidden="true" />
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="candidate-workspace-actions-grid">
        <div className="candidate-workspace-section-head">
          <p className="candidate-workspace-kicker">Quick actions</p>
          <h2>Move directly to the parts of the platform that matter most today.</h2>
        </div>

        <div className="candidate-workspace-link-grid">
          {quickLinks.map((item) => (
            <Card key={item.title} padding="lg" interactive>
              <div className="candidate-workspace-link-card">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <ButtonLink href={item.href} variant="secondary">
                  Open
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProtectedCandidateWorkspacePage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <CandidateWorkspacePage />
    </RouteProtegee>
  );
}
