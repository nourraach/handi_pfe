"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch, getAuthToken } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";

type Conversation = {
  id: string;
  created_at: string;
  participant_names?: string;
  last_message?: string | null;
  last_message_at?: string | null;
};

type Message = {
  id: string;
  id_utilisateur: string;
  role: string;
  contenu: string;
  created_at: string;
};

type RecipientRole = "admin" | "entreprise";

type Recipient = {
  id_utilisateur: string;
  nom: string;
  role: RecipientRole;
  email: string;
  subtitle?: string;
};

const READ_STATE_KEY = "candidate_message_read_state_v1";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M8 12h8M10.5 17h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 9.2a5 5 0 1 1 10 0v3.5l1.4 2.5H5.6L7 12.7V9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.3 18a1.9 1.9 0 0 0 3.4 0" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="18" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4 11.5 15.5-7-3.4 15-3.2-5.1L4 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AttachmentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 12.5l6.6-6.6a3 3 0 114.2 4.2L9.9 19.5a5 5 0 11-7.1-7.1l9.2-9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 14.5a4.6 4.6 0 007 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function EmptyChatIcon() {
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true">
      <defs>
        <linearGradient id="messages-empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8f60ff" />
          <stop offset="100%" stopColor="#35063E" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="74" fill="rgba(143, 96, 255, 0.08)" />
      <circle cx="62" cy="90" r="6" fill="rgba(143, 96, 255, 0.28)" />
      <circle cx="84" cy="62" r="4" fill="rgba(143, 96, 255, 0.22)" />
      <circle cx="178" cy="74" r="5" fill="rgba(143, 96, 255, 0.2)" />
      <circle cx="196" cy="110" r="4" fill="rgba(143, 96, 255, 0.16)" />
      <circle cx="172" cy="162" r="4.5" fill="rgba(143, 96, 255, 0.28)" />
      <path
        d="M120 66c-28.7 0-52 20.8-52 46.5 0 14.6 7.6 27.5 19.4 36l-6 22.5 23.6-12.3c4.8.9 9.8 1.4 15 1.4 28.7 0 52-20.8 52-46.6C172 86.8 148.7 66 120 66z"
        fill="url(#messages-empty-gradient)"
      />
      <circle cx="102" cy="112" r="7.6" fill="#fff" />
      <circle cx="120" cy="112" r="7.6" fill="#fff" />
      <circle cx="138" cy="112" r="7.6" fill="#fff" />
    </svg>
  );
}

export default function MessagesPageProtegee() {
  return (
    <AuthenticatedWorkspace rolesAutorises={["admin", "candidat", "entreprise", "inspecteur", "aneti"]}>
      <MessagesPage />
    </AuthenticatedWorkspace>
  );
}

function MessagesPage() {
  const { utilisateur } = useAuth();
  const { t, locale } = useI18n();
  const isCandidate = utilisateur?.role === "candidat";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientSuggestions, setRecipientSuggestions] = useState<Recipient[]>([]);
  const [adminContacts, setAdminContacts] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [newConversationMessage, setNewConversationMessage] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [readState, setReadState] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const stored = window.localStorage.getItem(READ_STATE_KEY);
      return stored ? (JSON.parse(stored) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const sseRef = useRef<EventSource | null>(null);

  const localeCode = locale === "ar" ? "ar-TN" : locale === "en" ? "en-US" : "fr-FR";
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeCode, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [localeCode],
  );

  useEffect(() => {
    if (!utilisateur) {
      return;
    }

    window.localStorage.setItem(READ_STATE_KEY, JSON.stringify(readState));
  }, [readState, utilisateur]);

  const formatTime = (value?: string | null) => (value ? timeFormatter.format(new Date(value)) : "");

  const translateRole = (role?: string | null) =>
    role ? t(`common.roles.${role}`) : t("messages.messagingSpace");

  const fermerComposeur = () => {
    setIsComposerOpen(false);
    setStatus(null);
  };

  const ouvrirComposeur = () => {
    setIsComposerOpen(true);
    setStatus(null);
  };

  const reinitialiserComposeur = () => {
    setRecipientQuery("");
    setRecipientSuggestions([]);
    setSelectedRecipient(null);
    setNewConversationMessage("");
  };

  const chargerConversations = async () => {
    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/chat/conversations"));
      const data = await res.json();

      if (res.ok) {
        setConversations(Array.isArray(data.donnees) ? data.donnees : []);
      } else {
        setStatus(data.message || t("messages.loadConversationsError"));
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.loadConversationsError"));
    }
  };

  const chargerSuggestions = async (query: string, roleFilter?: RecipientRole) => {
    setRecipientQuery(query);
    setSelectedRecipient((current) => {
      if (!query.trim()) {
        return current?.role === "admin" && roleFilter === "entreprise" ? current : null;
      }

      return current?.nom === query ? current : null;
    });

    if (!query.trim()) {
      setRecipientSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({ q: query });
      if (roleFilter) {
        params.set("role", roleFilter);
      }

      const res = await authenticatedFetch(construireUrlApi(`/api/chat/destinataires?${params.toString()}`));
      const data = await res.json();
      if (res.ok) {
        setRecipientSuggestions(Array.isArray(data.donnees) ? data.donnees : []);
      }
    } catch {}
  };

  const chargerContactsAdmin = async () => {
    try {
      const res = await authenticatedFetch(construireUrlApi("/api/chat/destinataires?role=admin"));
      const data = await res.json();
      if (res.ok) {
        setAdminContacts(Array.isArray(data.donnees) ? data.donnees : []);
      }
    } catch {}
  };

  const selectionnerDestinataire = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    if (recipient.role === "entreprise") {
      setRecipientQuery(recipient.nom);
      setRecipientSuggestions([]);
    }
  };

  const marquerConversationCommeLue = (conversationId: string, timestamp?: string | null) => {
    setReadState((current) => ({
      ...current,
      [conversationId]: timestamp || new Date().toISOString(),
    }));
  };

  const chargerMessages = async (id: string) => {
    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/chat/conversations/${id}/messages`));
      const data = await res.json();
      if (res.ok) {
        const loadedMessages = Array.isArray(data.donnees) ? data.donnees : [];
        setConvId(id);
        setMessages(loadedMessages);
        setReplyDraft("");
        marquerConversationCommeLue(id, loadedMessages.at(-1)?.created_at);
      } else {
        setStatus(data.message || t("messages.loadMessagesError"));
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.loadMessagesError"));
    }

    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    const sse = new EventSource(construireUrlApi(`/api/chat/conversations/${id}/stream?token=${token}`));
    sse.onmessage = (event) => {
      try {
        const batch = JSON.parse(event.data);
        if (Array.isArray(batch) && batch.length > 0) {
          setMessages((current) => {
            const existing = new Set(current.map((item) => item.id));
            return [...current, ...batch.filter((item) => !existing.has(item.id))];
          });
          marquerConversationCommeLue(id, batch[batch.length - 1]?.created_at);
          void chargerConversations();
        }
      } catch {}
    };
    sse.onerror = () => sse.close();
    sseRef.current = sse;
  };

  const creerConversation = async () => {
    if (!selectedRecipient) {
      setStatus(isCandidate ? t("messages.chooseRecipientCandidate") : t("messages.chooseRecipientGeneric"));
      return;
    }

    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi("/api/chat/conversations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: [selectedRecipient.id_utilisateur],
          message_initial: newConversationMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || t("messages.createConversationError"));
        return;
      }

      reinitialiserComposeur();
      setIsComposerOpen(false);
      await chargerConversations();
      if (data.donnees?.id) {
        await chargerMessages(data.donnees.id);
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.createConversationError"));
    }
  };

  const envoyerMessage = async () => {
    if (!convId) {
      setStatus(t("messages.chooseConversationFirst"));
      return;
    }

    if (!replyDraft.trim()) {
      return;
    }

    setStatus(null);

    try {
      const res = await authenticatedFetch(construireUrlApi(`/api/chat/conversations/${convId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: replyDraft }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || t("messages.sendMessageError"));
        return;
      }

      setReplyDraft("");
      setMessages((current) => [...current, data.donnees]);
      marquerConversationCommeLue(convId, data.donnees?.created_at);
      await chargerConversations();
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : t("messages.sendMessageError"));
    }
  };

  const chargerConversationsInitiales = useEffectEvent(() => {
    void chargerConversations();
  });
  const chargerContactsAdminInitial = useEffectEvent(() => {
    void chargerContactsAdmin();
  });

  useEffect(() => {
    chargerConversationsInitiales();
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!isCandidate) {
      return;
    }

    chargerContactsAdminInitial();
  }, [isCandidate]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === convId) ?? null,
    [convId, conversations],
  );

  const filteredConversations = useMemo(() => {
    const query = threadSearch.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = `${conversation.participant_names || ""} ${conversation.last_message || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [conversations, threadSearch]);

  const hasActiveConversation = Boolean(convId);
  const activeConversationInitial = (activeConversation?.participant_names || "C").slice(0, 1).toUpperCase();
  const activeConversationName = activeConversation?.participant_names || t("messages.messagingSpace");

  return (
    <div className="msg-v4">
      <section className="msg-shell">
        <header className="msg-header">
          <div className="msg-header-copy">
            <h1>{t("messages.badge")}</h1>
            <p>{t("messages.headerSubtitle")}</p>
          </div>

          <label className="msg-top-search">
            <span aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              value={threadSearch}
              onChange={(event) => setThreadSearch(event.target.value)}
              placeholder={t("messages.searchThreads")}
              aria-label={t("messages.searchThreads")}
            />
          </label>

          <div className="msg-header-actions">
            <button type="button" className="msg-accessibility" aria-label={t("messages.accessibilityAction")}>
              <span aria-hidden="true">
                <FilterIcon />
              </span>
              <span>{t("messages.accessibilityAction")}</span>
            </button>
            <button type="button" className="msg-icon-btn" aria-label={t("messages.notificationsAction")}>
              <BellIcon />
              <em>2</em>
            </button>
            <div className="msg-user-chip" aria-label={utilisateur?.nom || t("messages.messagingSpace")}>
              <span>{utilisateur?.nom?.slice(0, 2).toUpperCase() || "U"}</span>
            </div>
          </div>
        </header>

        {status ? <div className="message message-erreur">{status}</div> : null}

        <div className={`msg-grid ${hasActiveConversation ? "has-active" : "no-active"}`}>
          <aside className="msg-conversations">
            <div className="msg-panel-head">
              <h2>{t("messages.conversationsTitle")}</h2>
              <button type="button" className="msg-icon-btn" aria-label={t("messages.filtersAction")}>
                <FilterIcon />
              </button>
            </div>

            <label className="msg-search-input">
              <span aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                value={threadSearch}
                onChange={(event) => setThreadSearch(event.target.value)}
                placeholder={t("messages.searchThreads")}
                aria-label={t("messages.searchThreads")}
              />
            </label>

            <button type="button" className="msg-new-conversation" onClick={ouvrirComposeur}>
              <span aria-hidden="true">
                <PlusIcon />
              </span>
              {t("messages.newConversationTitle")}
            </button>

            <div className="msg-thread-list">
              {filteredConversations.length === 0 ? (
                <div className="msg-empty-list">
                  <strong>{t("messages.noConversationsTitle")}</strong>
                  <p>{t("messages.noConversationsDescription")}</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const lastSeen = readState[conversation.id];
                  const lastMessageAt = conversation.last_message_at ?? conversation.created_at;
                  const isUnread =
                    !lastSeen || new Date(lastSeen).getTime() < new Date(lastMessageAt).getTime();

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`msg-thread ${convId === conversation.id ? "is-active" : ""}`}
                      onClick={() => {
                        setIsComposerOpen(false);
                        void chargerMessages(conversation.id);
                      }}
                    >
                      <div className="msg-thread-avatar">
                        {(conversation.participant_names || "C").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="msg-thread-copy">
                        <div className="msg-thread-line">
                          <strong>{conversation.participant_names || t("messages.messagingSpace")}</strong>
                          <span>{formatTime(lastMessageAt)}</span>
                        </div>
                        <p>{conversation.last_message || t("messages.noMessageDescription")}</p>
                      </div>
                      {isUnread ? <span className="msg-thread-badge">1</span> : null}
                    </button>
                  );
                })
              )}
            </div>

            <button type="button" className="msg-view-all" onClick={() => setThreadSearch("")}>
              <span>{t("messages.viewAllConversations")}</span>
              <span aria-hidden="true">&gt;</span>
            </button>
          </aside>

          <main className="msg-chat">
            <div className="msg-chat-head">
              <div className="msg-chat-contact">
                <button
                  type="button"
                  className="msg-mobile-back"
                  onClick={() => {
                    setConvId(null);
                    setMessages([]);
                  }}
                  aria-label={t("messages.backToConversations")}
                >
                  <BackIcon />
                </button>
                <div className="msg-thread-avatar">{activeConversationInitial}</div>
                <div>
                  <h2>{activeConversationName}</h2>
                  <p>{hasActiveConversation ? t("messages.activeNow") : t("messages.workspaceDescription")}</p>
                </div>
              </div>

              <div className="msg-chat-actions">
                <button
                  type="button"
                  className="msg-icon-btn"
                  aria-label={t("messages.moreAction")}
                  disabled={!hasActiveConversation}
                >
                  <MoreIcon />
                </button>
              </div>
            </div>

            <div className={`msg-messages ${messages.length === 0 ? "is-empty" : ""}`}>
              {messages.length === 0 ? (
                <div className="msg-empty-chat">
                  <div className="msg-empty-visual" aria-hidden="true">
                    <EmptyChatIcon />
                  </div>
                  <strong>
                    {hasActiveConversation ? t("messages.noMessageTitle") : t("messages.emptySelectionTitle")}
                  </strong>
                  <p>
                    {hasActiveConversation
                      ? t("messages.noMessageDescription")
                      : t("messages.emptySelectionDescription")}
                  </p>
                  {!hasActiveConversation ? (
                    <button type="button" className="msg-new-conversation" onClick={ouvrirComposeur}>
                      <span aria-hidden="true">
                        <PlusIcon />
                      </span>
                      {t("messages.newConversationTitle")}
                    </button>
                  ) : null}
                </div>
              ) : (
                messages.map((item) => {
                  const mine = utilisateur?.id_utilisateur === item.id_utilisateur;

                  return (
                    <div key={item.id} className={`msg-bubble-row ${mine ? "is-mine" : ""}`}>
                      {!mine ? <div className="msg-bubble-avatar">{activeConversationInitial}</div> : null}
                      <div className={`msg-bubble ${mine ? "is-mine" : ""}`}>
                        <p>{item.contenu}</p>
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="msg-composer">
              <button
                type="button"
                className="msg-icon-btn"
                disabled={!hasActiveConversation}
                aria-label={t("messages.attachmentAction")}
              >
                <AttachmentIcon />
              </button>
              <input
                className="msg-composer-input"
                placeholder={t("messages.composerPlaceholder")}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && hasActiveConversation && replyDraft.trim()) {
                    event.preventDefault();
                    void envoyerMessage();
                  }
                }}
                disabled={!hasActiveConversation}
                aria-label={t("messages.composerPlaceholder")}
              />
              <button
                type="button"
                className="msg-icon-btn"
                disabled={!hasActiveConversation}
                aria-label={t("messages.emojiAction")}
              >
                <EmojiIcon />
              </button>
              <button
                type="button"
                className="msg-send"
                onClick={envoyerMessage}
                disabled={!hasActiveConversation || !replyDraft.trim()}
                aria-label={t("common.actions.send")}
              >
                <SendIcon />
              </button>
            </div>
          </main>
        </div>
      </section>

      <style jsx>{`
        .msg-v4 {
          --bg: #f8f6fb;
          --surface: #ffffff;
          --text: #20163f;
          --muted: #6e6590;
          --line: #e9e2f6;
          --accent: #6d2a95;
          --incoming: #f4f2f8;
          background: var(--bg);
          border-radius: 18px;
          block-size: max(100%, calc(100dvh - 24px));
          max-block-size: none;
          min-block-size: calc(100dvh - 24px);
          overflow: hidden;
          font-family: Inter, Poppins, system-ui, -apple-system, sans-serif;
        }

        .msg-shell {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
          block-size: 100%;
          padding: 6px;
          overflow: hidden;
        }

        .msg-header {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.15fr) auto;
          align-items: center;
          gap: 14px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--surface);
          padding: 14px 16px;
          box-shadow: 0 8px 18px rgba(48, 23, 89, 0.05);
        }

        .msg-header-copy h1 {
          margin: 0;
          font-size: 1.85rem;
          color: var(--text);
          line-height: 1.15;
        }

        .msg-header-copy p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 0.94rem;
        }

        .msg-top-search,
        .msg-search-input,
        .msg-composer {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          min-height: 46px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fff;
          padding: 0 12px;
        }

        .msg-top-search span,
        .msg-search-input span {
          color: #6d6290;
          inline-size: 20px;
          block-size: 20px;
        }

        .msg-top-search :global(svg),
        .msg-search-input :global(svg),
        .msg-icon-btn :global(svg),
        .msg-send :global(svg),
        .msg-new-conversation :global(svg) {
          display: block;
          inline-size: 18px;
          block-size: 18px;
        }

        .msg-top-search input,
        .msg-search-input input,
        .msg-composer-input {
          border: 0;
          outline: none;
          background: transparent;
          color: var(--text);
          font-size: 0.93rem;
          min-width: 0;
        }

        .msg-top-search input::placeholder,
        .msg-search-input input::placeholder,
        .msg-composer-input::placeholder {
          color: #9087ad;
        }

        .msg-header-actions {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .msg-accessibility {
          min-height: 44px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fff;
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .msg-accessibility span:first-child {
          display: inline-flex;
          color: #5e4b87;
        }

        .msg-icon-btn {
          inline-size: 40px;
          block-size: 40px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fff;
          color: #5e4b87;
          display: inline-grid;
          place-items: center;
          position: relative;
        }

        .msg-icon-btn em {
          position: absolute;
          top: -5px;
          right: -5px;
          min-inline-size: 16px;
          block-size: 16px;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          font-style: normal;
          font-size: 0.62rem;
          display: inline-grid;
          place-items: center;
        }

        .msg-user-chip {
          inline-size: 40px;
          block-size: 40px;
          border-radius: 999px;
          background: #efe9fb;
          color: #4e326f;
          display: inline-grid;
          place-items: center;
          overflow: hidden;
          font-weight: 700;
          font-size: 0.86rem;
        }

        .msg-user-avatar {
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
        }

        .msg-grid {
          display: grid;
          grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
          gap: 14px;
          min-block-size: 0;
          block-size: 100%;
          overflow: hidden;
        }

        .msg-conversations,
        .msg-chat {
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--surface);
          box-shadow: 0 8px 18px rgba(48, 23, 89, 0.05);
          min-block-size: 0;
        }

        .msg-conversations {
          display: grid;
          grid-template-rows: auto auto auto minmax(0, 1fr) auto;
          gap: 10px;
          padding: 14px;
          overflow: hidden;
        }

        .msg-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .msg-panel-head h2 {
          margin: 0;
          font-size: 1.05rem;
          color: var(--text);
        }

        .msg-new-conversation {
          min-height: 42px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #6d2a95, #7e42be);
          color: #fff;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
        }

        .msg-thread-list {
          display: grid;
          gap: 8px;
          align-content: start;
          min-block-size: 0;
          overflow: auto;
          padding-right: 2px;
        }

        .msg-thread {
          inline-size: 100%;
          border: 1px solid transparent;
          border-radius: 14px;
          background: #fcfbff;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 10px;
          text-align: left;
        }

        .msg-thread:hover {
          background: #faf8ff;
          border-color: #ddd2f0;
        }

        .msg-thread.is-active {
          border-color: #d6c8ee;
          background: #f6f1ff;
        }

        .msg-thread-avatar,
        .msg-bubble-avatar {
          inline-size: 36px;
          block-size: 36px;
          border-radius: 50%;
          background: #efe8fb;
          color: #4e326f;
          display: inline-grid;
          place-items: center;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .msg-thread-copy {
          min-width: 0;
        }

        .msg-thread-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .msg-thread-line strong {
          color: var(--text);
          font-size: 0.92rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .msg-thread-line span,
        .msg-thread-copy p {
          font-size: 0.79rem;
          color: var(--muted);
        }

        .msg-thread-copy p {
          margin: 4px 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .msg-thread-badge {
          min-inline-size: 20px;
          block-size: 20px;
          border-radius: 999px;
          padding: 0 6px;
          display: inline-grid;
          place-items: center;
          background: var(--accent);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .msg-empty-list {
          border: 1px dashed #d7caec;
          border-radius: 12px;
          padding: 12px;
          color: var(--muted);
          text-align: center;
        }

        .msg-empty-list strong {
          color: var(--text);
          display: block;
          margin-bottom: 4px;
        }

        .msg-empty-list p {
          margin: 0;
          font-size: 0.84rem;
          line-height: 1.45;
        }

        .msg-view-all {
          border: 0;
          background: transparent;
          color: var(--accent);
          font-size: 0.88rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 2px 0;
        }

        .msg-chat {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          gap: 10px;
          padding: 14px;
          overflow: hidden;
        }

        .msg-chat-head {
          min-height: 62px;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: #fff;
        }

        .msg-chat-contact {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .msg-chat-contact h2 {
          margin: 0;
          color: var(--text);
          font-size: 1.02rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .msg-chat-contact p {
          margin: 2px 0 0;
          color: #2f9f57;
          font-size: 0.8rem;
        }

        .msg-chat-actions {
          display: inline-flex;
          gap: 8px;
        }

        .msg-mobile-back {
          display: none;
          inline-size: 38px;
          block-size: 38px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fff;
          color: #5e4b87;
          place-items: center;
        }

        .msg-messages {
          min-block-size: 0;
          overflow: auto;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fff;
          padding: 16px;
          display: grid;
          align-content: start;
          gap: 14px;
        }

        .msg-empty-chat {
          align-self: center;
          justify-self: center;
          text-align: center;
          max-width: 420px;
          display: grid;
          gap: 8px;
        }

        .msg-empty-chat strong {
          color: var(--text);
        }

        .msg-empty-chat p {
          margin: 0;
          color: var(--muted);
          line-height: 1.5;
        }

        .msg-empty-visual {
          inline-size: 120px;
          block-size: 120px;
          margin-inline: auto;
          color: #7d57d6;
        }

        .msg-bubble-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .msg-bubble-row.is-mine {
          justify-content: flex-end;
        }

        .msg-bubble {
          max-inline-size: min(540px, 84%);
          border-radius: 16px;
          background: var(--incoming);
          border: 1px solid #ece5f8;
          padding: 12px 14px;
        }

        .msg-bubble.is-mine {
          background: linear-gradient(135deg, #6d2a95, #7e42be);
          color: #fff;
          border-color: transparent;
        }

        .msg-bubble p {
          margin: 0;
          line-height: 1.45;
          font-size: 0.92rem;
          overflow-wrap: anywhere;
        }

        .msg-bubble span {
          display: block;
          margin-top: 6px;
          font-size: 0.74rem;
          color: rgba(37, 27, 61, 0.54);
        }

        .msg-bubble.is-mine span {
          color: rgba(255, 255, 255, 0.82);
        }

        .msg-composer {
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          min-height: 54px;
          padding-inline: 8px;
          gap: 8px;
        }

        .msg-send {
          inline-size: 40px;
          block-size: 40px;
          border: 0;
          border-radius: 12px;
          background: #6d2a95;
          color: #fff;
          display: inline-grid;
          place-items: center;
        }

        .msg-icon-btn:focus-visible,
        .msg-mobile-back:focus-visible,
        .msg-send:focus-visible,
        .msg-thread:focus-visible,
        .msg-view-all:focus-visible,
        .msg-new-conversation:focus-visible,
        .msg-accessibility:focus-visible,
        .msg-top-search:focus-within,
        .msg-search-input:focus-within,
        .msg-composer:focus-within {
          outline: 3px solid rgba(109, 42, 149, 0.26);
          outline-offset: 1px;
        }

        .msg-send:disabled,
        .msg-icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 1160px) {
          .msg-header {
            grid-template-columns: minmax(0, 1fr) minmax(200px, 1fr);
          }

          .msg-top-search {
            order: 3;
            grid-column: 1 / -1;
          }

          .msg-header-actions {
            justify-self: end;
          }
        }

        @media (max-width: 960px) {
          .msg-v4 {
            min-block-size: 0;
            block-size: calc(100dvh - 18px);
          }

          .msg-grid {
            grid-template-columns: 1fr;
          }

          .msg-grid.has-active .msg-conversations {
            display: none;
          }

          .msg-grid.no-active .msg-chat {
            display: none;
          }

          .msg-mobile-back {
            display: inline-grid;
          }
        }

        @media (max-width: 640px) {
          .msg-v4 {
            border-radius: 12px;
          }

          .msg-header {
            padding: 12px;
          }

          .msg-header-copy h1 {
            font-size: 1.45rem;
          }

          .msg-accessibility span:last-child {
            display: none;
          }

          .msg-conversations,
          .msg-chat {
            padding: 12px;
          }

          .msg-bubble {
            max-inline-size: 92%;
          }
        }
      `}</style>

      {isComposerOpen ? (
        <div className="messages-studio-modal-backdrop" onClick={fermerComposeur}>
          <section
            className="messages-studio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-compose-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="messages-studio-modal-head">
              <div>
                <h3 id="messages-compose-title">{t("messages.newConversationTitle")}</h3>
                <p>
                  {isCandidate
                    ? t("messages.newConversationCandidateDescription")
                    : t("messages.newConversationGenericDescription")}
                </p>
              </div>
              <button type="button" className="messages-studio-modal-close" onClick={fermerComposeur}>
                {t("common.actions.close")}
              </button>
            </div>

            <label className="messages-studio-modal-field">
              <span>{isCandidate ? t("messages.searchRecipientCandidate") : t("messages.searchRecipientGeneric")}</span>
              <div className="messages-studio-searchshell">
                <span className="messages-studio-searchicon" aria-hidden="true">
                  <SearchIcon />
                </span>
                <input
                  className="messages-studio-searchinput"
                  value={recipientQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    void chargerSuggestions(value, isCandidate ? "entreprise" : undefined);
                  }}
                  placeholder={
                    isCandidate ? t("messages.searchRecipientCandidate") : t("messages.searchRecipientGeneric")
                  }
                />
              </div>
            </label>

            {recipientSuggestions.length > 0 ? (
              <div className="messages-studio-suggestions">
                {recipientSuggestions.map((recipient) => (
                  <button
                    key={recipient.id_utilisateur}
                    type="button"
                    className={`messages-studio-suggestion ${
                      selectedRecipient?.id_utilisateur === recipient.id_utilisateur ? "is-active" : ""
                    }`}
                    onClick={() => selectionnerDestinataire(recipient)}
                  >
                    <div className="messages-studio-suggestion-avatar">
                      {recipient.nom.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <strong>{recipient.nom}</strong>
                      <span>{translateRole(recipient.role)} • {recipient.subtitle || recipient.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {isCandidate && adminContacts.length > 0 ? (
              <div className="messages-studio-admin-bar">
                <span>{t("messages.adminContact")}</span>
                <div className="messages-studio-admin-list">
                  {adminContacts.map((admin) => (
                    <button
                      key={admin.id_utilisateur}
                      type="button"
                      className={`messages-studio-admin-chip ${
                        selectedRecipient?.id_utilisateur === admin.id_utilisateur ? "is-active" : ""
                      }`}
                      onClick={() => selectionnerDestinataire(admin)}
                    >
                      {admin.nom}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedRecipient ? (
              <div className="messages-studio-selected">
                <strong>{selectedRecipient.nom}</strong>
                <span>{translateRole(selectedRecipient.role)} • {selectedRecipient.email}</span>
              </div>
            ) : null}

            <label className="messages-studio-modal-field">
              <span>{t("messages.firstMessagePlaceholder")}</span>
              <textarea
                className="messages-studio-first-message"
                value={newConversationMessage}
                onChange={(event) => setNewConversationMessage(event.target.value)}
                placeholder={t("messages.firstMessagePlaceholder")}
              />
            </label>

            <div className="messages-studio-modal-actions">
              <button type="button" className="messages-studio-ghost" onClick={fermerComposeur}>
                {t("common.actions.cancel")}
              </button>
              <button type="button" className="messages-studio-primary" onClick={creerConversation}>
                {t("messages.startConversation")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
