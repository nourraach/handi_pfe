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
        throw new Error(data.message || "Unable to load notifications.");
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
      setErreur(error instanceof Error ? error.message : "Unable to load notifications.");
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
        throw new Error(data.message || "Unable to update notifications.");
      }

      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, lu } : item)),
      );
      setInfo(lu ? "Notification marked as read." : "Notification marked as unread.");
    } catch (error: unknown) {
      setErreur(error instanceof Error ? error.message : "Unable to update notifications.");
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
        label: notification.data?.cta?.label || "Voir mes questions d'entretien",
      };
    }

    if (isBienEtre) {
      const fallbackHref = notification.data?.id_entretien
        ? `/candidat/entretiens/${notification.data.id_entretien}/bien-etre`
        : "/candidat/entretiens";
      return {
        href: notification.data?.cta?.href || fallbackHref,
        label: notification.data?.cta?.label || "Ouvrir ma preparation 5 min",
      };
    }

    return { href: destinationEntretiens, label: "Open related section" };
  };

  return (
    <div className="app-page">
      <PageHeader
        badge="Notifications"
        title="Your latest updates, already organized."
        description="See platform alerts, interview news, and conversation activity in a single readable stream."
        actions={
          <>
            <Button variant="secondary" onClick={charger}>Refresh</Button>
            <ButtonLink href={destinationEntretiens}>Open related section</ButtonLink>
          </>
        }
      />

      {erreur ? <div className="message message-erreur">{erreur}</div> : null}
      {info ? <div className="message message-info">{info}</div> : null}

      {loading ? (
        <Card padding="lg">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true" />
            <strong>Loading notifications</strong>
            <p>We are retrieving your latest events.</p>
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When an application changes or an interview is scheduled, you will see it here."
          action={<ButtonLink href={destinationEntretiens}>Open related section</ButtonLink>}
        />
      ) : (
        <div className="list-stack">
          <Card tone="accent" padding="md">
            <div className="notification-meta">
              <div>
                <strong>{notifications.length} notifications loaded</strong>
                <p className="texte-secondaire" style={{ margin: "8px 0 0" }}>
                  Notifications are automatically marked as read when you open this page. You can still mark any item as unread.
                </p>
              </div>
              <span className="texte-secondaire">{nonLues} unread</span>
            </div>
          </Card>

          {notifications.map((notification) => {
            const action = construireActionNotification(notification);
            return (
            <Card key={notification.id} padding="lg">
              <div className="notification-item">
                <div className="notification-meta">
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`status-pill ${notification.lu ? "message-neutre" : "message-info"}`}>
                      {notification.lu ? "Read" : "Unread"}
                    </span>
                    <strong>{notification.titre}</strong>
                  </div>
                  <span className="texte-secondaire">
                    {new Date(notification.created_at).toLocaleString("en-US")}
                  </span>
                </div>

                <p style={{ margin: 0 }}>{notification.message}</p>

                {notification.data?.offre ? (
                  <div className="detail-box">
                    <strong>Related role</strong>
                    <p>{notification.data.offre}</p>
                    {notification.data.date_heure ? (
                      <p style={{ marginTop: 8 }}>
                        {new Date(notification.data.date_heure).toLocaleString("en-US")}
                      </p>
                    ) : null}
                    {notification.data.scheduled_for ? (
                      <p style={{ marginTop: 8 }}>
                        Scheduled for: {new Date(notification.data.scheduled_for).toLocaleString("en-US")}
                      </p>
                    ) : null}
                    {notification.data.motif ? <p style={{ marginTop: 8 }}>Reason: {notification.data.motif}</p> : null}
                  </div>
                ) : null}

                <div className="page-header-actions">
                  <Button
                    variant="secondary"
                    onClick={() => void changerEtatLecture(notification.id, !notification.lu)}
                  >
                    {notification.lu ? "Mark as unread" : "Mark as read"}
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

