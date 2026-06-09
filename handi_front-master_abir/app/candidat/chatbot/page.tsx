"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Check, Send, Loader2, AlertTriangle } from "lucide-react";
import { RouteProtegee } from "@/components/route-protegee";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/layout";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  isError?: boolean;
};

type ChatConversation = {
  id: string;
  title: string;
  preview: string;
  messages: ChatMessage[];
  lastUpdated: string;
};

type ChatbotResponse = {
  reply?: string;
  error?: string;
  language?: "fr" | "en" | "ar";
};

const STORAGE_CONVERSATIONS = "handitalents_chatbot_conversations_v1";
const STORAGE_CURRENT_ID = "handitalents_chatbot_current_id_v1";
const MAX_HISTORY_MESSAGES = 8;
const SUGGESTIONS = [
  "Comment améliorer mon CV ?",
  "Comment préparer un entretien ?",
  "Quelles sont mes options si j'ai un handicap ?",
  "Aide-moi à utiliser la plateforme.",
];

function nowIso() {
  return new Date().toISOString();
}

function safeDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createWelcomeConversation(): ChatConversation {
  const welcomeMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      "Bonjour, je suis votre assistant IA HandiTalents.\n\nJe peux vous aider à comprendre la plateforme, préparer vos candidatures, améliorer votre CV ou vous orienter sur les prochaines étapes.\n\nPosez-moi votre question, je vous réponds simplement et de façon contextualisée.",
    timestamp: nowIso(),
  };

  return {
    id: crypto.randomUUID(),
    title: "Nouvelle conversation",
    preview: "Commencez une nouvelle discussion...",
    messages: [welcomeMessage],
    lastUpdated: welcomeMessage.timestamp,
  };
}

function normalizeConversation(raw: unknown): ChatConversation | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<ChatConversation>;
  if (typeof candidate.id !== "string" || !Array.isArray(candidate.messages)) {
    return null;
  }

  const messages = candidate.messages
    .filter((item): item is ChatMessage => Boolean(item) && typeof item === "object")
    .map((item): ChatMessage => ({
      id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
      role: (item.role === "assistant" ? "assistant" : "user") as ChatRole,
      content: typeof item.content === "string" ? item.content : "",
      timestamp: typeof item.timestamp === "string" ? item.timestamp : nowIso(),
      isError: Boolean(item.isError),
    }))
    .filter((item) => item.content.trim().length > 0);

  if (messages.length === 0) {
    return null;
  }

  return {
    id: candidate.id,
    title: typeof candidate.title === "string" ? candidate.title : "Conversation",
    preview: typeof candidate.preview === "string" ? candidate.preview : "",
    messages,
    lastUpdated: typeof candidate.lastUpdated === "string" ? candidate.lastUpdated : messages[messages.length - 1].timestamp,
  };
}

function extractPreview(value: string, fallback = "Nouvelle réponse...") {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return fallback;
  }
  return compact.length > 54 ? `${compact.slice(0, 54).trim()}…` : compact;
}

function messageHistory(messages: ChatMessage[]) {
  return messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function ChatbotContent() {
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversationId) || null,
    [conversations, currentConversationId],
  );

  const totalMessages = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.messages.length, 0),
    [conversations],
  );

  useEffect(() => {
    try {
      const savedConversations = window.localStorage.getItem(STORAGE_CONVERSATIONS);
      const savedCurrentId = window.localStorage.getItem(STORAGE_CURRENT_ID);

      const restored = savedConversations
        ? (JSON.parse(savedConversations) as unknown[])
            .map(normalizeConversation)
            .filter((item): item is ChatConversation => Boolean(item))
        : [];

      if (restored.length > 0) {
        setConversations(restored);
        setCurrentConversationId(
          restored.some((conversation) => conversation.id === savedCurrentId)
            ? savedCurrentId
            : restored[0].id,
        );
      } else {
        const welcome = createWelcomeConversation();
        setConversations([welcome]);
        setCurrentConversationId(welcome.id);
      }
    } catch {
      const welcome = createWelcomeConversation();
      setConversations([welcome]);
      setCurrentConversationId(welcome.id);
      setError("Impossible de restaurer l'historique local.");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    window.localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(conversations));
  }, [conversations, initialized]);

  useEffect(() => {
    if (!initialized || !currentConversationId) {
      return;
    }

    window.localStorage.setItem(STORAGE_CURRENT_ID, currentConversationId);
  }, [currentConversationId, initialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, sending]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    const node = inputRef.current;
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
  }, [inputMessage]);

  const createConversation = () => {
    const conversation = createWelcomeConversation();
    setConversations((current) => [conversation, ...current]);
    setCurrentConversationId(conversation.id);
    setError(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const updateConversationMessages = (conversationId: string, messages: ChatMessage[]) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages,
              title:
                conversation.title === "Nouvelle conversation" && messages.some((message) => message.role === "user")
                  ? extractPreview(messages.find((message) => message.role === "user")?.content || conversation.title, "Nouvelle conversation")
                  : conversation.title,
              preview: extractPreview(messages[messages.length - 1]?.content || conversation.preview),
              lastUpdated: nowIso(),
            }
          : conversation,
      ),
    );
  };

  const sendMessage = async (rawMessage?: string) => {
    const content = (rawMessage ?? inputMessage).trim();
    if (!content || sending) {
      return;
    }

    if (!currentConversation) {
      createConversation();
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: nowIso(),
    };

    const conversationMessages = [...currentConversation.messages, userMessage];
    updateConversationMessages(currentConversation.id, conversationMessages);
    setInputMessage("");
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          messages: messageHistory(conversationMessages),
          currentPath: pathname,
          pageTitle: "Chatbot IA",
          pageContext: currentConversation.title,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ChatbotResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Impossible de générer une réponse.");
      }

      const assistantText = (payload.reply || "").trim() || "Je n'ai pas pu générer de réponse exploitable.";
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
        timestamp: nowIso(),
      };

      updateConversationMessages(currentConversation.id, [...conversationMessages, assistantMessage]);
    } catch (cause) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          cause instanceof Error
            ? cause.message
            : "Une erreur est survenue lors de la communication avec l'assistant.",
        timestamp: nowIso(),
        isError: true,
      };

      updateConversationMessages(currentConversation.id, [...conversationMessages, assistantMessage]);
      setError(assistantMessage.content);
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  if (loading) {
    return (
      <main className="page-centree section-page app-theme">
        <LoadingState
          title="Chargement du chatbot"
          description="Préparation de votre assistant conversationnel local."
        />
      </main>
    );
  }

  return (
    <main className="chatbot-page app-theme">
      <section className="chatbot-shell">
        <section className="chatbot-panel">
          <Card padding="sm" className="chatbot-panel-card">
            <div className="chatbot-panel-top">
              <div>
                <p className="chatbot-kicker">Conversation active</p>
                <h2>{currentConversation?.title || "Nouvelle conversation"}</h2>
              </div>
              <div className="chatbot-status-pill">
                <Check size={14} />
                {totalMessages} messages
              </div>
            </div>

            <div className="chatbot-quick-actions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="chatbot-chip"
                  onClick={() => setInputMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {error ? (
              <div className="chatbot-banner chatbot-banner-error" role="alert">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="chatbot-messages" aria-live="polite">
              {currentConversation?.messages.map((message) => (
                <article key={message.id} className={`chatbot-message ${message.role} ${message.isError ? "is-error" : ""}`}>
                  <div className="chatbot-message-avatar" aria-hidden="true">
                    {message.role === "assistant" ? <Bot size={16} /> : "Vous"}
                  </div>
                  <div className="chatbot-message-body">
                    <div className={`chatbot-message-bubble ${message.isError ? "is-error" : ""}`}>
                      {message.content.split("\n").map((line, index) => (
                        <p key={`${message.id}-${index}`}>{line || "\u00A0"}</p>
                      ))}
                    </div>
                    <span className="chatbot-message-time">{safeDateLabel(message.timestamp)}</span>
                  </div>
                </article>
              ))}

              {sending ? (
                <article className="chatbot-message assistant">
                  <div className="chatbot-message-avatar" aria-hidden="true">
                    <Loader2 size={16} className="chatbot-spinner" />
                  </div>
                  <div className="chatbot-message-body">
                    <div className="chatbot-message-bubble">
                      <p>Réflexion en cours...</p>
                    </div>
                  </div>
                </article>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="chatbot-composer"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <label className="chatbot-textarea-label sr-only" htmlFor="chatbot-message">
                Votre message
              </label>
              <div className="chatbot-composer-actions">
                <textarea
                  id="chatbot-message"
                  ref={inputRef}
                  className="chatbot-textarea"
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  placeholder="Posez votre question ici..."
                  rows={1}
                  disabled={sending}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <div className="chatbot-action-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setInputMessage("");
                      inputRef.current?.focus();
                    }}
                    disabled={sending || !inputMessage}
                  >
                    Effacer
                  </Button>
                  <Button type="submit" disabled={sending || !inputMessage.trim()}>
                    {sending ? (
                      <>
                        <Loader2 size={16} className="chatbot-spinner" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </section>
      </section>

      <style jsx>{`
        :global(html:has(.chatbot-page)),
        :global(body:has(.chatbot-page)) {
          overflow: hidden;
        }

        :global(.app-shell-candidat:has(.chatbot-page)) {
          height: 100vh;
          min-height: 100vh;
          padding: 16px;
          gap: 16px;
          overflow: hidden;
        }

        :global(.app-shell-candidat:has(.chatbot-page) .app-header-inner) {
          top: 16px;
          min-height: calc(100vh - 32px);
          max-height: calc(100vh - 32px);
          overflow: hidden;
        }

        :global(.app-shell-candidat:has(.chatbot-page) .app-main) {
          height: calc(100vh - 32px);
          min-height: 0;
          padding: 0;
          overflow: hidden;
        }

        :global(.app-shell-candidat:has(.chatbot-page) .page-shell),
        :global(.app-shell-candidat:has(.chatbot-page) .app-workspace-page) {
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }

        .chatbot-page {
          height: 100%;
          max-height: 100%;
          padding: 0;
          overflow: hidden;
          display: grid;
          grid-template-rows: minmax(0, 1fr);
          background:
            radial-gradient(circle at 12% 14%, rgba(183, 137, 255, 0.16), transparent 24%),
            linear-gradient(180deg, #fdfcff 0%, var(--app-bg) 52%, #f7f4fb 100%);
        }

        .chatbot-shell {
          width: 100%;
          max-width: none;
          margin: 0;
        }

        .chatbot-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }

        .chatbot-panel {
          min-width: 0;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }

        :global(.chatbot-panel-card) {
          border: 1px solid var(--app-border);
          background: var(--app-surface);
          backdrop-filter: blur(14px);
          box-shadow: var(--app-shadow);
          border-radius: 16px;
          padding: 12px;
          min-height: 0;
        }

        .chatbot-kicker {
          margin: 0 0 2px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.66rem;
          color: #746a81;
          font-weight: 700;
        }

        .chatbot-panel-top h2,
        .chatbot-card-head h2 {
          margin: 0;
          color: var(--app-text);
          font-size: 1rem;
          line-height: 1.15;
        }


        .chatbot-card-head,
        .chatbot-panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-shrink: 0;
          min-height: 44px;
          max-height: 66px;
        }

        :global(.chatbot-panel-card) {
          flex: 1 1 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
          overflow: hidden;
        }

        .chatbot-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--app-surface-strong);
          border: 1px solid var(--app-border);
          color: var(--app-text-soft);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .chatbot-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          flex-shrink: 0;
        }

        .chatbot-chip {
          border: 1px solid var(--app-border);
          background: var(--app-surface-strong);
          color: var(--app-text-soft);
          min-height: 36px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chatbot-chip:hover {
          border-color: rgba(var(--app-secondary-rgb), 0.95);
          color: var(--app-primary);
          transform: translateY(-1px);
        }

        .chatbot-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 9px 11px;
          border-radius: 14px;
          font-size: 0.86rem;
          line-height: 1.42;
        }

        .chatbot-banner-error {
          background: #fff5f5;
          border: 1px solid #fecaca;
          color: var(--app-danger);
        }

        .chatbot-messages {
          flex: 1;
          height: 0;
          min-height: 0;
          overflow-y: scroll;
          overflow-x: hidden;
          scrollbar-gutter: stable;
          scrollbar-color: rgba(var(--app-primary-rgb), 0.5) rgba(255, 255, 255, 0.64);
          scrollbar-width: thin;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 2px 2px 2px 0;
        }

        .chatbot-messages::-webkit-scrollbar {
          width: 10px;
        }

        .chatbot-messages::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.64);
          border-radius: 999px;
        }

        .chatbot-messages::-webkit-scrollbar-thumb {
          background: rgba(var(--app-primary-rgb), 0.42);
          border: 2px solid rgba(255, 255, 255, 0.72);
          border-radius: 999px;
        }

        .chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--app-primary-rgb), 0.62);
        }

        .chatbot-message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          flex-shrink: 0;
        }

        .chatbot-message.user {
          flex-direction: row-reverse;
        }

        .chatbot-message-avatar {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-hover) 100%);
          flex-shrink: 0;
          font-size: 0.68rem;
          font-weight: 700;
          box-shadow: 0 10px 20px rgba(var(--app-primary-rgb), 0.16);
        }

        .chatbot-message.user .chatbot-message-avatar {
          background: linear-gradient(135deg, #344054 0%, #667085 100%);
        }

        .chatbot-message-body {
          max-width: min(75%, 760px);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .chatbot-message.user .chatbot-message-body {
          align-items: flex-end;
        }

        .chatbot-message-bubble {
          padding: 9px 11px;
          border-radius: 14px;
          background: var(--app-surface-strong);
          border: 1px solid var(--app-border);
          color: var(--app-text);
          box-shadow: var(--app-shadow);
        }

        .chatbot-message.user .chatbot-message-bubble {
          background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-hover) 100%);
          color: white;
          border-color: rgba(var(--app-primary-rgb), 0.35);
        }

        .chatbot-message-bubble.is-error {
          background: #fff5f5;
          color: var(--app-danger);
          border-color: #fecaca;
        }

        .chatbot-message-bubble p {
          margin: 0;
          line-height: 1.46;
          font-size: 0.9rem;
          white-space: pre-wrap;
        }

        .chatbot-message-time {
          color: #817693;
          font-size: 0.68rem;
          line-height: 1.1;
        }

        .chatbot-composer {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
          border: 1px solid var(--app-border);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.72);
          border-top: 1px solid var(--app-border);
          flex-shrink: 0;
        }

        .chatbot-textarea-label {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--app-text-soft);
        }

        .chatbot-textarea {
          width: 100%;
          height: 48px;
          min-height: 48px;
          max-height: 120px;
          resize: none;
          border-radius: 12px;
          border: 1px solid var(--app-border);
          background: var(--app-surface-strong);
          color: var(--app-text);
          padding: 8px 10px;
          font: inherit;
          line-height: 1.38;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .chatbot-textarea:focus {
          border-color: rgba(var(--app-secondary-rgb), 0.95);
          box-shadow: var(--ring-focus);
        }

        .chatbot-textarea:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .chatbot-composer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: nowrap;
        }

        .chatbot-privacy {
          margin: 0;
          color: #655d78;
          line-height: 1.25;
          font-size: 0.72rem;
          flex: 1;
          min-width: 0;
        }

        .chatbot-action-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }

        .chatbot-spinner {
          animation: chatbot-spin 1s linear infinite;
        }

        @keyframes chatbot-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .chatbot-shell {
            grid-template-columns: minmax(0, 1fr);
            min-height: 0;
          }

          .chatbot-panel {
            min-height: 0;
            overflow: hidden;
          }
        }

        @media (max-width: 720px) {
          .chatbot-shell {
            gap: 12px;
          }

          .chatbot-panel-top,
          .chatbot-card-head,
          .chatbot-composer-actions {
            align-items: flex-start;
            flex-direction: column;
            max-height: none;
          }

          .chatbot-status-pill,
          .chatbot-privacy,
          .chatbot-action-row {
            width: 100%;
          }

          .chatbot-action-row :global(.ui-button) {
            flex: 1;
          }

        }
      `}</style>
    </main>
  );
}

export default function CandidateChatbotPage() {
  return (
    <RouteProtegee rolesAutorises={["candidat"]}>
      <ChatbotContent />
    </RouteProtegee>
  );
}
