"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AuthenticatedWorkspace } from "@/components/authenticated-workspace";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch, getAuthToken } from "@/lib/auth-utils";
import { construireUrlApi } from "@/lib/config";
import {
  isConversationUnread,
  readMessageReadState,
  writeMessageReadState,
} from "@/lib/message-read-state";

type Conversation = {
  id: string;
  created_at: string;
  participant_names?: string;
  last_message?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
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

type ComposerAttachment = {
  name: string;
  mimeType: string;
  dataUrl: string;
  size: number;
};

type ComposerPayload = {
  kind: "text" | "media" | "audio" | "mixed";
  text?: string;
  attachments?: ComposerAttachment[];
  audio?: ComposerAttachment | null;
};

const EMOJI_OPTIONS = [
  "😀",
  "🙂",
  "👋",
  "👍",
  "🙏",
  "✨",
  "💡",
  "✅",
  "📎",
  "🎤",
  "💬",
  "🚀",
  "💼",
  "🎯",
  "❤️",
  "🔥",
];

const MAX_ATTACHMENT_SIZE = 4 * 1024 * 1024;
const MAX_AUDIO_SIZE = 6 * 1024 * 1024;

function isComposerPayload(value: unknown): value is ComposerPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("kind" in value || "attachments" in value || "audio" in value || "text" in value),
  );
}

function decodeMessageContent(contenu: string): ComposerPayload {
  const raw = contenu.trim();
  if (!raw) {
    return { kind: "text", text: "" };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isComposerPayload(parsed)) {
      return {
        kind: parsed.kind,
        text: typeof parsed.text === "string" ? parsed.text : "",
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        audio: parsed.audio ?? null,
      };
    }
  } catch {
    // Not structured content, treat as plain text.
  }

  return { kind: "text", text: raw };
}

function stringifyMessageContent(payload: ComposerPayload | string) {
  return typeof payload === "string" ? payload : JSON.stringify(payload);
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsDataURL(file);
  });
}

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
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [composerAudio, setComposerAudio] = useState<ComposerAttachment | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [composerHint, setComposerHint] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [threadSearch, setThreadSearch] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [readState, setReadState] = useState<Record<string, string>>(() => readMessageReadState());
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
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

    writeMessageReadState(readState);
  }, [readState, utilisateur]);

  useEffect(() => {
    if (!emojiOpen) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [emojiOpen]);

  const formatTime = (value?: string | null) => (value ? timeFormatter.format(new Date(value)) : "");

  const translateRole = (role?: string | null) =>
    role ? t(`common.roles.${role}`) : t("messages.messagingSpace");

  const cleanupAudioRecorder = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    audioRecorderRef.current = null;
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    setRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const stopAudioRecording = () => {
    const recorder = audioRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      cleanupAudioRecorder();
    }
  };

  const startAudioRecording = async () => {
    if (recordingAudio) {
      stopAudioRecording();
      return;
    }

    try {
      setComposerHint(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];
      const mimeType = mimeTypeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      audioChunksRef.current = [];
      audioRecorderRef.current = recorder;
      audioStreamRef.current = stream;
      setRecordingAudio(true);
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          if (blob.size > MAX_AUDIO_SIZE) {
            setComposerHint("Le message audio est trop volumineux. Choisissez un enregistrement plus court.");
            return;
          }

          const dataUrl = await fileToDataUrl(new File([blob], `audio-${Date.now()}.webm`, { type: blob.type }));
          setComposerAudio({
            name: `audio-${Date.now()}.webm`,
            mimeType: blob.type || "audio/webm",
            dataUrl,
            size: blob.size,
          });
        } catch (error: unknown) {
          setComposerHint(error instanceof Error ? error.message : "Impossible de traiter le message audio.");
        } finally {
          cleanupAudioRecorder();
          audioChunksRef.current = [];
        }
      };

      recorder.start();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((current) => current + 1);
      }, 1000);
    } catch (error: unknown) {
      setComposerHint(error instanceof Error ? error.message : "Impossible d'acceder au micro.");
      cleanupAudioRecorder();
    }
  };

  const appendEmoji = (emoji: string) => {
    const input = composerInputRef.current;
    if (!input) {
      setReplyDraft((current) => `${current}${emoji}`);
      return;
    }

    const start = input.selectionStart ?? replyDraft.length;
    const end = input.selectionEnd ?? replyDraft.length;
    const next = `${replyDraft.slice(0, start)}${emoji}${replyDraft.slice(end)}`;
    setReplyDraft(next);
    requestAnimationFrame(() => {
      input.focus();
      const nextPosition = start + emoji.length;
      input.setSelectionRange(nextPosition, nextPosition);
    });
  };

  const handleAttachmentPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const oversized = files.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (oversized) {
      setComposerHint(`Le fichier ${oversized.name} est trop volumineux. Limite: 4 Mo.`);
      return;
    }

    try {
      const attachments = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          dataUrl: await fileToDataUrl(file),
          size: file.size,
        })),
      );
      setComposerAttachments((current) => [...current, ...attachments]);
      setComposerHint(null);
    } catch (error: unknown) {
      setComposerHint(error instanceof Error ? error.message : "Impossible de joindre le fichier.");
    }
  };

  const supprimerAttachment = (index: number) => {
    setComposerAttachments((current) => current.filter((_, position) => position !== index));
  };

  const resetComposer = () => {
    setReplyDraft("");
    setComposerAttachments([]);
    setComposerAudio(null);
    setEmojiOpen(false);
    setComposerHint(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

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
        setComposerAttachments([]);
        setComposerAudio(null);
        setEmojiOpen(false);
        setComposerHint(null);
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

    if (!replyDraft.trim() && composerAttachments.length === 0 && !composerAudio) {
      return;
    }

    setStatus(null);

    try {
      const payload: ComposerPayload | string =
        composerAttachments.length > 0 || composerAudio
          ? {
              kind: composerAttachments.length > 0 && composerAudio ? "mixed" : composerAudio ? "audio" : "media",
              text: replyDraft.trim() || undefined,
              attachments: composerAttachments.length > 0 ? composerAttachments : [],
              audio: composerAudio,
            }
          : replyDraft.trim();

      const res = await authenticatedFetch(construireUrlApi(`/api/chat/conversations/${convId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: stringifyMessageContent(payload) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || t("messages.sendMessageError"));
        return;
      }

      resetComposer();
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
                  const isUnread = isConversationUnread(conversation, readState, utilisateur?.id_utilisateur);

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
                          <span>{formatTime(conversation.last_message_at || conversation.created_at)}</span>
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
                  const payload = decodeMessageContent(item.contenu);

                  return (
                    <div key={item.id} className={`msg-bubble-row ${mine ? "is-mine" : ""}`}>
                      {!mine ? <div className="msg-bubble-avatar">{activeConversationInitial}</div> : null}
                      <div className={`msg-bubble ${mine ? "is-mine" : ""}`}>
                        {payload.text ? <p>{payload.text}</p> : null}
                        {payload.attachments?.length ? (
                          <div className="msg-bubble-assets">
                            {payload.attachments.map((asset) => (
                              <a
                                key={`${item.id}-${asset.name}`}
                                className="msg-attachment"
                                href={asset.dataUrl}
                                download={asset.name}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="msg-attachment-icon" aria-hidden="true">
                                  <AttachmentIcon />
                                </span>
                                <span className="msg-attachment-copy">
                                  <strong>{asset.name}</strong>
                                  <span>{formatFileSize(asset.size)}</span>
                                </span>
                              </a>
                            ))}
                          </div>
                        ) : null}
                        {payload.audio ? (
                          <div className="msg-bubble-assets">
                            <div className="msg-audio-card">
                              <div className="msg-attachment-icon" aria-hidden="true">
                                <SendIcon />
                              </div>
                              <div className="msg-attachment-copy">
                                <strong>Message audio</strong>
                                <span>{formatFileSize(payload.audio.size)}</span>
                              </div>
                            </div>
                            <audio className="msg-audio-player" controls src={payload.audio.dataUrl} />
                          </div>
                        ) : null}
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="msg-composer-wrap">
              <input
                ref={attachmentInputRef}
                type="file"
                className="msg-hidden-file"
                multiple
                accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.doc,.docx,.mp3,.wav,.m4a,.webm,.ogg"
                onChange={handleAttachmentPick}
                aria-hidden="true"
                tabIndex={-1}
              />

              {composerHint ? <div className="msg-composer-hint">{composerHint}</div> : null}

              {composerAttachments.length > 0 || composerAudio ? (
                <div className="msg-compose-previews">
                  {composerAttachments.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="msg-compose-preview">
                      <span className="msg-compose-preview-icon" aria-hidden="true">
                        <AttachmentIcon />
                      </span>
                      <div className="msg-compose-preview-copy">
                        <strong>{file.name}</strong>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        className="msg-preview-remove"
                        onClick={() => supprimerAttachment(index)}
                        aria-label={`Retirer ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {composerAudio ? (
                    <div className="msg-compose-preview msg-compose-preview-audio">
                      <span className="msg-compose-preview-icon" aria-hidden="true">
                        <SendIcon />
                      </span>
                      <div className="msg-compose-preview-copy">
                        <strong>Message audio</strong>
                        <span>{formatFileSize(composerAudio.size)}</span>
                      </div>
                      <button
                        type="button"
                        className="msg-preview-remove"
                        onClick={() => setComposerAudio(null)}
                        aria-label="Retirer le message audio"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="msg-composer">
                <button
                  type="button"
                  className="msg-icon-btn"
                  disabled={!hasActiveConversation}
                  aria-label={t("messages.attachmentAction")}
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <AttachmentIcon />
                </button>

                <textarea
                  ref={composerInputRef}
                  className="msg-composer-input msg-composer-textarea"
                  placeholder={t("messages.composerPlaceholder")}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && hasActiveConversation) {
                      if (replyDraft.trim() || composerAttachments.length > 0 || composerAudio) {
                        event.preventDefault();
                        void envoyerMessage();
                      }
                    }
                  }}
                  disabled={!hasActiveConversation}
                  aria-label={t("messages.composerPlaceholder")}
                  rows={2}
                />

                <div className="msg-emoji-area" ref={emojiPanelRef}>
                  <button
                    type="button"
                    className={`msg-icon-btn ${emojiOpen ? "is-active" : ""}`}
                    disabled={!hasActiveConversation}
                    aria-label={t("messages.emojiAction")}
                    onClick={() => setEmojiOpen((current) => !current)}
                  >
                    <EmojiIcon />
                  </button>

                  {emojiOpen ? (
                    <div className="msg-emoji-popover" role="listbox" aria-label={t("messages.emojiAction")}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="msg-emoji-item"
                          onClick={() => appendEmoji(emoji)}
                          aria-label={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={`msg-icon-btn ${recordingAudio ? "is-active is-recording" : ""}`}
                  disabled={!hasActiveConversation}
                  aria-label={recordingAudio ? "Arreter l'enregistrement audio" : "Enregistrer un message audio"}
                  onClick={startAudioRecording}
                >
                  <span aria-hidden="true">🎤</span>
                </button>

                <button
                  type="button"
                  className="msg-send"
                  onClick={envoyerMessage}
                  disabled={!hasActiveConversation || (!replyDraft.trim() && composerAttachments.length === 0 && !composerAudio)}
                  aria-label={t("common.actions.send")}
                >
                  <SendIcon />
                </button>
              </div>

              {recordingAudio ? (
                <div className="msg-recording-banner">
                  <span className="msg-recording-dot" />
                  Enregistrement audio en cours · {Math.floor(recordingSeconds / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(recordingSeconds % 60).toString().padStart(2, "0")}
                </div>
              ) : null}
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
        .msg-search-input {
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

        .msg-icon-btn {
          inline-size: 40px;
          block-size: 40px;
          border: 1px solid rgba(91, 45, 145, 0.18);
          border-radius: 12px;
          background: rgba(45, 23, 77, 0.04);
          color: #5b2d91;
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

        .msg-icon-btn.is-active {
          background: rgba(91, 45, 145, 0.12);
          border-color: rgba(91, 45, 145, 0.28);
          color: #2d174d;
        }

        .msg-icon-btn.is-recording {
          color: #fff;
          border-color: rgba(91, 45, 145, 0.4);
          background: linear-gradient(135deg, #2d174d, #5b2d91);
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
          border: 1px solid var(--app-primary);
          border-radius: 12px;
          background: var(--app-primary);
          color: #fff;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
          box-shadow: 0 14px 28px -16px rgba(var(--app-primary-rgb), 0.85);
        }

        .msg-new-conversation:hover {
          background: var(--app-primary-hover);
          border-color: var(--app-primary-hover);
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

        .msg-bubble-assets {
          display: grid;
          gap: 8px;
          margin-top: 10px;
        }

        .msg-attachment,
        .msg-audio-card {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
          border-radius: 12px;
          padding: 9px 10px;
          background: rgba(255, 255, 255, 0.42);
          border: 1px solid rgba(109, 42, 149, 0.12);
          text-decoration: none;
        }

        .msg-bubble.is-mine .msg-attachment,
        .msg-bubble.is-mine .msg-audio-card {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.16);
        }

        .msg-attachment-copy,
        .msg-audio-card .msg-attachment-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .msg-attachment-copy strong,
        .msg-audio-card .msg-attachment-copy strong {
          color: inherit;
          font-size: 0.84rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .msg-attachment-copy span,
        .msg-audio-card .msg-attachment-copy span {
          color: inherit;
          opacity: 0.8;
          font-size: 0.74rem;
        }

        .msg-audio-player {
          inline-size: 100%;
          max-inline-size: 100%;
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

        .msg-composer-wrap {
          position: relative;
          display: grid;
          gap: 8px;
        }

        .msg-hidden-file {
          display: none;
        }

        .msg-compose-previews {
          display: grid;
          gap: 8px;
        }

        .msg-compose-preview {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          border: 1px solid #eadff8;
          background: #fbf8ff;
          border-radius: 14px;
          padding: 8px 10px;
        }

        .msg-compose-preview-icon,
        .msg-attachment-icon {
          inline-size: 34px;
          block-size: 34px;
          border-radius: 10px;
          background: rgba(109, 42, 149, 0.08);
          color: var(--accent);
          display: inline-grid;
          place-items: center;
          flex: none;
        }

        .msg-preview-remove {
          inline-size: 28px;
          block-size: 28px;
          border: 0;
          border-radius: 999px;
          background: rgba(109, 42, 149, 0.08);
          color: var(--accent);
          font-size: 1rem;
          line-height: 1;
          display: inline-grid;
          place-items: center;
        }

        .msg-composer-hint {
          border: 1px solid #f0dbbf;
          background: #fff8ef;
          color: #8a5b12;
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 0.82rem;
        }

        .msg-composer {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto auto;
          min-height: 60px;
          padding: 8px;
          gap: 8px;
          align-items: center;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: #fff;
        }

        .msg-composer-textarea {
          resize: none;
          min-height: 40px;
          max-height: 120px;
          line-height: 1.45;
          padding-top: 10px;
          padding-bottom: 10px;
          align-self: center;
        }

        .msg-emoji-area {
          position: relative;
        }

        .msg-emoji-popover {
          position: absolute;
          left: 0;
          bottom: calc(100% + 10px);
          z-index: 30;
          width: min(320px, calc(100vw - 32px));
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 6px;
          padding: 10px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: #fff;
          box-shadow: 0 20px 50px rgba(48, 23, 89, 0.16);
        }

        .msg-emoji-item {
          border: 0;
          background: #f9f6ff;
          border-radius: 10px;
          min-height: 34px;
          font-size: 1rem;
          display: inline-grid;
          place-items: center;
        }

        .msg-recording-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: start;
          color: #b42318;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 2px 2px 0;
        }

        .msg-recording-dot {
          inline-size: 8px;
          block-size: 8px;
          border-radius: 999px;
          background: #e5484d;
          box-shadow: 0 0 0 4px rgba(229, 72, 77, 0.12);
        }

        .msg-send {
          inline-size: 40px;
          block-size: 40px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #2d174d, #5b2d91);
          color: #fff;
          display: inline-grid;
          place-items: center;
          align-self: center;
          box-shadow: 0 10px 24px rgba(45, 23, 77, 0.18);
        }

        .msg-send:hover {
          background: linear-gradient(135deg, #35205a, #6937a3);
        }

        .messages-studio-modal-close,
        .messages-studio-ghost {
          min-height: 40px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(91, 45, 145, 0.18);
          background: rgba(45, 23, 77, 0.04);
          color: #2d174d;
          font-weight: 600;
        }

        .messages-studio-modal-close:hover,
        .messages-studio-ghost:hover {
          background: rgba(91, 45, 145, 0.08);
          border-color: rgba(91, 45, 145, 0.26);
        }

        .messages-studio-primary {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid rgba(91, 45, 145, 0.18);
          background: linear-gradient(135deg, #2d174d, #5b2d91);
          color: #fff;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(45, 23, 77, 0.14);
        }

        .messages-studio-primary:hover {
          background: linear-gradient(135deg, #35205a, #6937a3);
        }

        .messages-studio-admin-chip {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(91, 45, 145, 0.14);
          background: rgba(45, 23, 77, 0.03);
          color: #2d174d;
          font-weight: 600;
        }

        .messages-studio-admin-chip.is-active {
          background: rgba(91, 45, 145, 0.12);
          border-color: rgba(91, 45, 145, 0.3);
        }

        .messages-studio-suggestion {
          border: 1px solid rgba(91, 45, 145, 0.12);
          background: #fff;
          color: #24163f;
        }

        .messages-studio-suggestion.is-active {
          border-color: rgba(91, 45, 145, 0.28);
          background: rgba(91, 45, 145, 0.06);
        }

        .messages-studio-selected {
          border: 1px solid rgba(91, 45, 145, 0.14);
          background: rgba(45, 23, 77, 0.04);
          color: #24163f;
        }

        .msg-icon-btn:focus-visible,
        .msg-mobile-back:focus-visible,
        .msg-send:focus-visible,
        .msg-thread:focus-visible,
        .msg-view-all:focus-visible,
        .msg-new-conversation:focus-visible,
        .msg-top-search:focus-within,
        .msg-search-input:focus-within,
        .msg-composer:focus-within,
        .msg-composer-wrap:focus-within {
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
