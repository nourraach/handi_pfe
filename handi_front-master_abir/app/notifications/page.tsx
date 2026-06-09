"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/layout";
import { authenticatedFetch } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import { useAuth } from "@/hooks/useAuth";

type NotificationItem = {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
  data?: {
    id_entretien?: string;
    id_candidature?: string;
    id_offre?: string;
    offre?: string;
    date_heure?: string;
    motif?: string | null;
    category?: string;
    scheduled_for?: string;
    cta?: {
      label?: string;
      href?: string;
    };
  } | null;
};

type NotificationsPayload = {
  message?: string;
  donnees?: NotificationItem[];
};

function formatDateFr(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function normaliserTexteNotification(value: string) {
  return value
    .replace(/Application update/gi, "Mise à jour de candidature")
    .replace(/Interview scheduled/gi, "Entretien planifié")
    .replace(/Your interview preparation is ready/gi, "Votre préparation d'entretien est prête")
    .replace(/Related role/gi, "Offre concernée")
    .replace(/Scheduled for/gi, "Prévu le")
    .replace(/Reason/gi, "Motif")
    .replace(/Mise a jour de candidature/gi, "Mise à jour de candidature")
    .replace(/Entretien planifie/gi, "Entretien planifié")
    .replace(/Votre preparation d'entretien est prete/gi, "Votre préparation d'entretien est prête")
    .replace(/n'a pas ete retenue/gi, "n'a pas été retenue")
    .replace(/a ete preselectionnee/gi, "a été présélectionnée")
    .replace(/a ete recue/gi, "a été reçue")
    .replace(/en cours d'etude/gi, "en cours d'étude")
    .replace(/a ete planifie/gi, "a été planifié")
    .replace(/preparation d'entretien/gi, "préparation d'entretien")
    .replace(/personnalisees/gi, "personnalisées")
    .replace(/disponibles/gi, "disponibles")
    .replace(/offre/gi, "offre");
}

function normaliserLibelleAction(value?: string) {
  const label = value?.trim();
  if (!label) {
    return "";
  }

  const normalized = label.toLowerCase();
  if (normalized.includes("questions") || normalized.includes("preparation")) {
    return "Voir mes questions d'entretien";
  }
  if (normalized.includes("wellbeing") || normalized.includes("5 min")) {
    return "Ouvrir ma préparation 5 min";
  }
  if (normalized.includes("open")) {
    return "Ouvrir la section liée";
  }
  return normaliserTexteNotification(label);
}

export default function NotificationsPageProtegee() {
  return (
    <AuthenticatedWorkspace rolesAutorises={["admin", "candidat", "entreprise", "inspecteur", "aneti"]}>
      <NotificationsPage />
    </AuthenticatedWorkspace>
  );
}

function NotificationsPage() {
  const { utilisateur } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const destinationEntretiens =
    utilisateur?.role === "entreprise"
      ? "/entreprise/entretiens"
      : utilisateur?.role === "admin"
        ? "/admin/entretiens"
        : utilisateur?.role === "inspecteur" || utilisateur?.role === "aneti"
          ? "/supervision"
          : "/candidat/entretiens";

  const charger = async () => {
    try {
      setLoading(true);
      setErreur(null);
      const response = await authenticatedFetch(construireUrlApi("/api/notifications?limit=100"));
      const data: NotificationsPayload = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les notifications.");
      }

      const items = Array.isArray(data.donnees) ? data.donnees : [];
      setNotifications(items);

      const unreadIds = items.filter((item) => !item.lu).map((item) => item.id);
      if (unreadIds.length > 0) {
        await authenticatedFetch(construireUrlApi("/api/notifications/marquer-lu"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_ids: unreadIds }),
        });
        setNotifications((current) => current.map((item) => ({ ...item, lu: true })));
        window.dispatchEvent(new CustomEvent("notifications-marked-read"));
      }
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void charger();
  }, []);

  const nonLues = useMemo(() => notifications.filter((item) => !item.lu).length, [notifications]);

  const changerEtatLecture = async (notificationId: string, lu: boolean) => {
    try {
      setErreur(null);
      setInfo(null);
      const route = lu ? "/api/notifications/marquer-lu" : "/api/notifications/marquer-non-lu";
      const response = await authenticatedFetch(construireUrlApi(route), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Impossible de mettre à jour les notifications.");
      }

      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, lu } : item)),
      );
      setInfo(lu ? "Notification marquée comme lue." : "Notification marquée comme non lue.");
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Impossible de mettre à jour les notifications.");
    }
  };

  const construireActionNotification = (notification: NotificationItem) => {
    const isBienEtre =
      notification.type === "bien_etre_entretien" || notification.data?.category === "interview_wellbeing_prompt";
    const isInterviewPrep =
      notification.type === "interview_prep_ready" || notification.data?.category === "interview_prep_ready";

    if (isInterviewPrep) {
      const fallbackHref = notification.data?.id_candidature
        ? `/candidat/candidatures/${notification.data.id_candidature}/preparation-entretien`
        : "/candidat/candidatures";
      return {
        href: notification.data?.cta?.href || fallbackHref,
        label: normaliserLibelleAction(notification.data?.cta?.label) || "Voir mes questions d'entretien",
      };
    }

    if (isBienEtre) {
      const fallbackHref = notification.data?.id_entretien
        ? `/candidat/entretiens/${notification.data.id_entretien}/bien-etre`
        : "/candidat/entretiens";
      return {
        href: notification.data?.cta?.href || fallbackHref,
        label: normaliserLibelleAction(notification.data?.cta?.label) || "Ouvrir ma préparation 5 min",
      };
    }

    return { href: destinationEntretiens, label: "Ouvrir la section liée" };
  };

  return (
    <div className="app-page">
      <PageHeader
        badge="Notifications"
        title="Vos dernières mises à jour, déjà organisées."
        description="Consultez les alertes, les nouvelles d'entretien et l'activité des échanges dans un flux clair et lisible."
        actions={
          <>
            <ButtonLink href={destinationEntretiens}>Ouvrir la section liée</ButtonLink>
          </>
        }
      />

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}
      {info ? <div className="message message-info">{info}</div> : null}

      {loading ? (
        <Card padding="lg">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <strong>Chargement des notifications</strong>
            <p>Nous récupérons vos derniers événements.</p>
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Aucune notification pour le moment"
          description="Lorsqu'une candidature évolue ou qu'un entretien est programmé, vous le verrez ici."
          action={<ButtonLink href={destinationEntretiens}>Ouvrir la section liée</ButtonLink>}
        />
      ) : (
        <div className="list-stack">
          <Card tone="accent" padding="md">
            <div className="notification-meta">
              <div>
                <strong>{notifications.length} notifications chargées</strong>
                <p className="texte-secondaire" style={{ margin: "8px 0 0" }}>
                  Les notifications sont automatiquement marquées comme lues lorsque vous ouvrez cette page. Vous pouvez toujours en marquer une comme non lue.
                </p>
              </div>
              <span className="texte-secondaire">{nonLues} non lue(s)</span>
            </div>
          </Card>

          {notifications.map((notification) => {
            const action = construireActionNotification(notification);
            const titre = normaliserTexteNotification(notification.titre);
            const message = normaliserTexteNotification(notification.message);
            return (
            <Card key={notification.id} padding="lg">
              <div className="notification-item">
                <div className="notification-meta">
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`status-pill ${notification.lu ? "message-neutre" : "message-info"}`}>
                      {notification.lu ? "Lue" : "Non lue"}
                    </span>
                    <strong>{titre}</strong>
                  </div>
                  <span className="texte-secondaire">
                    {formatDateFr(notification.created_at)}
                  </span>
                </div>

                <p style={{ margin: 0 }}>{message}</p>

                {notification.data?.offre ? (
                  <div className="detail-box">
                    <strong>Offre concernée</strong>
                    <p>{notification.data.offre}</p>
                    {notification.data.date_heure ? (
                      <p style={{ marginTop: 8 }}>
                        {formatDateFr(notification.data.date_heure)}
                      </p>
                    ) : null}
                    {notification.data.scheduled_for ? (
                      <p style={{ marginTop: 8 }}>
                        Prévu le : {formatDateFr(notification.data.scheduled_for)}
                      </p>
                    ) : null}
                    {notification.data.motif ? <p style={{ marginTop: 8 }}>Motif : {notification.data.motif}</p> : null}
                  </div>
                ) : null}

                <div className="page-header-actions">
                  <Button
                    variant="secondary"
                    onClick={() => void changerEtatLecture(notification.id, !notification.lu)}
                  >
                    {notification.lu ? "Marquer comme non lue" : "Marquer comme lue"}
                  </Button>
                  <ButtonLink href={action.href} variant="ghost">
                    {action.label}
                  </ButtonLink>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

