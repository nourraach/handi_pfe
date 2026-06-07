"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Check, MessageSquarePlus, Send, Sparkles, Trash2, Loader2, HelpCircle, AlertTriangle } from "lucide-react";
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
  const [checking, setChecking] = useState(false);
  const [ollamaReady, setOllamaReady] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversationId) || null,
    [conversations, currentConversationId],
  );

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((left, right) => {
        const leftTime = new Date(left.lastUpdated).getTime();
        const rightTime = new Date(right.lastUpdated).getTime();
        return rightTime - leftTime;
      }),
    [conversations],
  );

  const totalMessages = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.messages.length, 0),
    [conversations],
  );

  const assistantCount = useMemo(
    () =>
      conversations.reduce(
        (sum, conversation) =>
          sum + conversation.messages.filter((message) => message.role === "assistant").length,
        0,
      ),
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
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
  }, [inputMessage]);

  useEffect(() => {
    const controller = new AbortController();

    const checkHealth = async () => {
      try {
        setChecking(true);
        const response = await fetch("/api/ollama", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        setOllamaReady(response.ok);
      } catch {
        if (!controller.signal.aborted) {
          setOllamaReady(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    };

    void checkHealth();
    return () => controller.abort();
  }, []);

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setError(null);
  };

  const createConversation = () => {
    const conversation = createWelcomeConversation();
    setConversations((current) => [conversation, ...current]);
    setCurrentConversationId(conversation.id);
    setError(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const removeConversation = (conversationId: string) => {
    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== conversationId);

      if (next.length === 0) {
        const fallback = createWelcomeConversation();
        setCurrentConversationId(fallback.id);
        return [fallback];
      }

      if (currentConversationId === conversationId) {
        setCurrentConversationId(next[0].id);
      }

      return next;
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
      <section className="chatbot-intro" aria-labelledby="chatbot-intro-title">
        <div className="chatbot-intro-copy">
          <p className="chatbot-kicker">Espace candidat</p>
          <h1 id="chatbot-intro-title">Assistant IA pour avancer plus clairement</h1>
          <p>
            Préparez vos candidatures, clarifiez une étape de la plateforme ou demandez un conseil ciblé avec un assistant local connecté à Ollama.
          </p>
        </div>

        <div className="chatbot-intro-metrics" aria-label="Résumé du chatbot">
          <div className="chatbot-intro-metric">
            <MessageSquarePlus size={17} aria-hidden="true" />
            <strong>{conversations.length}</strong>
            <span>discussion{conversations.length > 1 ? "s" : ""}</span>
          </div>
          <div className="chatbot-intro-metric">
            <Sparkles size={17} aria-hidden="true" />
            <strong>{assistantCount}</strong>
            <span>réponses IA</span>
          </div>
          <div className="chatbot-intro-metric chatbot-intro-metric-status">
            <Check size={17} aria-hidden="true" />
            <strong>{ollamaReady ? "Actif" : checking ? "Test" : "Local"}</strong>
            <span>{ollamaReady ? "moteur prêt" : checking ? "en cours" : "à vérifier"}</span>
          </div>
        </div>
      </section>

      <section className="chatbot-shell">
        <aside className="chatbot-sidebar">
          <Card padding="lg" tone="accent" className="chatbot-brand-card">
            <div className="chatbot-brand">
              <span className="chatbot-brand-icon" aria-hidden="true">
                <Bot size={20} />
              </span>
              <div>
                <p className="chatbot-kicker">Assistant IA</p>
                <h2>Chatbot Ollama</h2>
              </div>
            </div>

            <p className="chatbot-description">
              Un assistant contextuel pour les questions de CV, entretien, offres et navigation.
            </p>

            <div className="chatbot-health">
              <span className={`chatbot-health-dot ${ollamaReady ? "is-online" : ollamaReady === false ? "is-offline" : ""}`} aria-hidden="true" />
              <div>
                <strong>
                  {checking ? "Vérification du moteur" : ollamaReady ? "Ollama disponible" : "Ollama indisponible"}
                </strong>
                <p>
                  {checking
                    ? "Contrôle de l'API locale en cours..."
                    : ollamaReady
                      ? "Le moteur local répond correctement."
                      : "Le service local n'a pas répondu. Vérifiez Ollama."}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="chatbot-conversations-card">
            <div className="chatbot-card-head">
              <div>
                <p className="chatbot-kicker">Conversations</p>
                <h2>{conversations.length} discussion{conversations.length > 1 ? "s" : ""}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={createConversation}>
                <MessageSquarePlus size={16} />
                Nouveau
              </Button>
            </div>

            <div className="chatbot-conversations-list">
              {sortedConversations.map((conversation) => {
                const isActive = conversation.id === currentConversationId;
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`chatbot-conversation-item ${isActive ? "is-active" : ""}`}
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <div className="chatbot-conversation-copy">
                      <strong>{conversation.title}</strong>
                      <p>{conversation.preview || lastMessage?.content || "Nouvelle discussion"}</p>
                    </div>
                    <div className="chatbot-conversation-meta">
                      <span>{safeDateLabel(conversation.lastUpdated)}</span>
                      <button
                        type="button"
                        className="chatbot-delete-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeConversation(conversation.id);
                        }}
                        aria-label={`Supprimer ${conversation.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="lg" className="chatbot-tips-card">
            <div className="chatbot-tip">
              <HelpCircle size={18} />
              <div>
                <strong>Conseil</strong>
                <p>Posez une question courte, puis affinez avec le contexte de votre page.</p>
              </div>
            </div>
            <div className="chatbot-tip">
              <Sparkles size={18} />
              <div>
                <strong>Exemples</strong>
                <p>CV, entretien, offre, accessibilité, navigation ou aide à l&apos;utilisation.</p>
              </div>
            </div>
          </Card>
        </aside>

        <section className="chatbot-panel">
          <Card padding="lg" className="chatbot-panel-card">
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
              <label className="chatbot-textarea-label" htmlFor="chatbot-message">
                Votre message
              </label>
              <textarea
                id="chatbot-message"
                ref={inputRef}
                className="chatbot-textarea"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                placeholder="Posez votre question ici..."
                rows={3}
                disabled={sending}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />

              <div className="chatbot-composer-actions">
                <p className="chatbot-privacy">
                  Les échanges restent dans votre navigateur et sont transmis uniquement au moteur local choisi.
                </p>
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
        .chatbot-page {
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(circle at 12% 14%, rgba(183, 137, 255, 0.16), transparent 24%),
            linear-gradient(180deg, #fdfcff 0%, var(--app-bg) 52%, #f7f4fb 100%);
        }

        .chatbot-intro,
        .chatbot-shell {
          max-width: var(--app-max);
          margin: 0 auto;
        }

        .chatbot-intro {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 22px;
          align-items: center;
          margin-bottom: 14px;
          padding: 22px 24px;
          border-radius: 30px;
          background:
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.42), transparent 26%),
            radial-gradient(circle at 12% 18%, rgba(183, 137, 255, 0.18), transparent 28%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(247, 243, 255, 0.96));
          border: 1px solid rgba(91, 63, 153, 0.08);
          box-shadow: 0 22px 58px rgba(91, 63, 153, 0.1);
        }

        .chatbot-intro::before {
          content: "";
          position: absolute;
          inset: 12px;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 22px;
          pointer-events: none;
        }

        .chatbot-intro-copy,
        .chatbot-intro-metrics {
          position: relative;
          z-index: 1;
        }

        .chatbot-intro-copy {
          display: grid;
          gap: 8px;
        }

        .chatbot-intro-copy h1 {
          margin: 0;
          max-width: 760px;
          color: var(--app-text);
          font-family: var(--app-heading);
          font-size: 2.75rem;
          line-height: 0.98;
        }

        .chatbot-intro-copy p:not(.chatbot-kicker) {
          margin: 0;
          max-width: 760px;
          color: var(--app-muted);
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .chatbot-intro-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(118px, 1fr));
          gap: 10px;
          min-width: min(100%, 420px);
        }

        .chatbot-intro-metric {
          display: grid;
          gap: 5px;
          min-height: 112px;
          padding: 14px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(91, 63, 153, 0.1);
          box-shadow: var(--app-shadow-soft);
        }

        .chatbot-intro-metric svg {
          color: var(--app-primary);
        }

        .chatbot-intro-metric strong {
          color: var(--app-text);
          font-family: var(--app-heading);
          font-size: 1.45rem;
          line-height: 1;
        }

        .chatbot-intro-metric span {
          color: var(--app-muted);
          font-size: 0.82rem;
          line-height: 1.35;
        }

        .chatbot-shell {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 14px;
          min-height: calc(100vh - 254px);
        }

        .chatbot-sidebar,
        .chatbot-panel {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .chatbot-brand-card,
        .chatbot-conversations-card,
        .chatbot-tips-card,
        .chatbot-panel-card {
          border: 1px solid var(--app-border);
          background: var(--app-surface);
          backdrop-filter: blur(14px);
          box-shadow: var(--app-shadow);
          border-radius: 24px;
          padding: 20px;
        }

        .chatbot-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .chatbot-brand-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-hover) 100%);
          color: white;
          box-shadow: 0 14px 28px rgba(var(--app-primary-rgb), 0.18);
        }

        .chatbot-kicker {
          margin: 0 0 4px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.72rem;
          color: #746a81;
          font-weight: 700;
        }

        .chatbot-brand h2,
        .chatbot-panel-top h2,
        .chatbot-card-head h2 {
          margin: 0;
          color: var(--app-text);
          font-size: 1.15rem;
          line-height: 1.2;
        }

        .chatbot-description {
          margin: 14px 0 0;
          color: var(--app-text-soft);
          line-height: 1.55;
          font-size: 0.94rem;
        }

        .chatbot-health {
          margin-top: 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(var(--app-secondary-rgb), 0.26), rgba(var(--app-accent-rgb), 0.09));
          border: 1px solid rgba(var(--app-secondary-rgb), 0.7);
        }

        .chatbot-health-dot {
          width: 11px;
          height: 11px;
          margin-top: 5px;
          border-radius: 50%;
          background: #cbd5e1;
          flex-shrink: 0;
        }

        .chatbot-health-dot.is-online {
          background: #12b76a;
          box-shadow: 0 0 0 6px rgba(18, 183, 106, 0.14);
        }

        .chatbot-health-dot.is-offline {
          background: #f04438;
          box-shadow: 0 0 0 6px rgba(240, 68, 56, 0.12);
        }

        .chatbot-health strong,
        .chatbot-tip strong {
          display: block;
          color: var(--app-text);
          font-size: 0.94rem;
        }

        .chatbot-health p,
        .chatbot-tip p {
          margin: 4px 0 0;
          color: #655d78;
          line-height: 1.55;
          font-size: 0.88rem;
        }

        .chatbot-card-head,
        .chatbot-panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .chatbot-conversations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 360px;
          overflow: auto;
          padding-right: 4px;
        }

        .chatbot-conversation-item {
          width: 100%;
          border: 1px solid var(--app-border);
          border-radius: 16px;
          padding: 11px 12px;
          background: var(--app-surface-strong);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          text-align: left;
        }

        .chatbot-conversation-item:hover {
          transform: translateY(-1px);
          border-color: rgba(var(--app-secondary-rgb), 0.9);
          box-shadow: var(--shadow-1);
        }

        .chatbot-conversation-item.is-active {
          border-color: rgba(var(--app-secondary-rgb), 0.95);
          background: linear-gradient(135deg, rgba(var(--app-secondary-rgb), 0.24), rgba(var(--app-accent-rgb), 0.08));
        }

        .chatbot-conversation-copy {
          min-width: 0;
          flex: 1;
        }

        .chatbot-conversation-copy strong {
          display: block;
          color: var(--app-text);
          font-size: 0.9rem;
          margin-bottom: 4px;
        }

        .chatbot-conversation-copy p {
          margin: 0;
          color: #655d78;
          font-size: 0.83rem;
          line-height: 1.42;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .chatbot-conversation-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          color: #817693;
          font-size: 0.78rem;
          flex-shrink: 0;
        }

        .chatbot-delete-button {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid var(--app-border);
          background: var(--app-surface-strong);
          color: var(--app-danger);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chatbot-delete-button:hover {
          background: rgba(182, 69, 60, 0.06);
          border-color: rgba(182, 69, 60, 0.24);
        }

        .chatbot-tips-card {
          gap: 10px;
        }

        .chatbot-tip {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 9px 0;
        }

        .chatbot-tip + .chatbot-tip {
          border-top: 1px solid #eaecf0;
        }

        .chatbot-tip svg {
          color: var(--app-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .chatbot-panel-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        .chatbot-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--app-surface-strong);
          border: 1px solid var(--app-border);
          color: var(--app-text-soft);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .chatbot-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chatbot-chip {
          border: 1px solid var(--app-border);
          background: var(--app-surface-strong);
          color: var(--app-text-soft);
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.84rem;
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
          gap: 10px;
          padding: 12px 14px;
          border-radius: 16px;
          font-size: 0.92rem;
          line-height: 1.55;
        }

        .chatbot-banner-error {
          background: #fff5f5;
          border: 1px solid #fecaca;
          color: var(--app-danger);
        }

        .chatbot-messages {
          flex: 1;
          min-height: 360px;
          max-height: calc(100vh - 420px);
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 6px 2px 6px 0;
        }

        .chatbot-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .chatbot-message.user {
          flex-direction: row-reverse;
        }

        .chatbot-message-avatar {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-hover) 100%);
          flex-shrink: 0;
          font-size: 0.78rem;
          font-weight: 700;
          box-shadow: 0 10px 20px rgba(var(--app-primary-rgb), 0.16);
        }

        .chatbot-message.user .chatbot-message-avatar {
          background: linear-gradient(135deg, #344054 0%, #667085 100%);
        }

        .chatbot-message-body {
          max-width: min(780px, calc(100% - 60px));
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chatbot-message.user .chatbot-message-body {
          align-items: flex-end;
        }

        .chatbot-message-bubble {
          padding: 13px 15px;
          border-radius: 18px;
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
          line-height: 1.62;
          font-size: 0.94rem;
          white-space: pre-wrap;
        }

        .chatbot-message-time {
          color: #817693;
          font-size: 0.76rem;
        }

        .chatbot-composer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          border: 1px solid var(--app-border);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.72);
          border-top: 1px solid var(--app-border);
        }

        .chatbot-textarea-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--app-text-soft);
        }

        .chatbot-textarea {
          width: 100%;
          min-height: 92px;
          max-height: 180px;
          resize: vertical;
          border-radius: 18px;
          border: 1px solid var(--app-border);
          background: var(--app-surface-strong);
          color: var(--app-text);
          padding: 13px 15px;
          font: inherit;
          line-height: 1.55;
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
          gap: 14px;
          flex-wrap: wrap;
        }

        .chatbot-privacy {
          margin: 0;
          color: #655d78;
          line-height: 1.5;
          font-size: 0.86rem;
          flex: 1;
          min-width: 280px;
        }

        .chatbot-action-row {
          display: flex;
          gap: 10px;
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
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .chatbot-intro {
            grid-template-columns: 1fr;
          }

          .chatbot-intro-metrics {
            min-width: 0;
          }

          .chatbot-sidebar {
            order: 2;
          }

          .chatbot-panel {
            order: 1;
          }

          .chatbot-messages {
            max-height: 60vh;
            min-height: 420px;
          }
        }

        @media (max-width: 720px) {
          .chatbot-page {
            padding: 12px;
          }

          .chatbot-intro {
            padding: 20px;
            border-radius: 24px;
          }

          .chatbot-shell {
            gap: 12px;
          }

          .chatbot-intro-metrics {
            grid-template-columns: 1fr;
          }

          .chatbot-intro-copy h1 {
            font-size: 2rem;
            line-height: 1.04;
          }

          .chatbot-intro-metric {
            min-height: auto;
          }

          .chatbot-panel-top,
          .chatbot-card-head,
          .chatbot-composer-actions {
            align-items: flex-start;
            flex-direction: column;
          }

          .chatbot-status-pill,
          .chatbot-privacy,
          .chatbot-action-row {
            width: 100%;
          }

          .chatbot-action-row :global(.ui-button) {
            flex: 1;
          }

          .chatbot-conversation-meta {
            align-items: flex-end;
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
