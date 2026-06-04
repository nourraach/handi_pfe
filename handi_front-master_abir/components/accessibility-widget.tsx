"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "@/components/accessibility-provider";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { TextToSpeechButton } from "@/components/text-to-speech-button";

const ACCESSIBILITY_PANEL_EVENT = "handitalents:accessibility-panel";

type AccessibilityPanelAction = "open" | "close" | "toggle";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

export function triggerAccessibilityPanel(action: AccessibilityPanelAction = "toggle") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_PANEL_EVENT, { detail: { action } }));
}

function FeatureToggle({
  label,
  description,
  active,
  onClick,
  compact = false,
  chip = false,
  icon,
  tone,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  chip?: boolean;
  icon?: ReactNode;
  tone?: "epilepsy" | "vision" | "dyslexia" | "adhd" | "blindness" | "mobility" | "hearing";
}) {
  if (chip) {
    return (
      <button
        type="button"
        className={`accessibility-chip ${active ? "accessibility-chip-active" : ""}`}
        onClick={onClick}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        className={`accessibility-toggle-row ${active ? "accessibility-toggle-row-active" : ""}`}
        onClick={onClick}
        aria-pressed={active}
      >
        <span className="accessibility-toggle-row-icon" aria-hidden="true">{icon || "\u2022"}</span>
        <span className="accessibility-toggle-row-copy">
          <strong>{label}</strong>
          {description ? <small>{description}</small> : null}
        </span>
        <span className={`accessibility-switch ${active ? "is-active" : ""}`} aria-hidden="true">
          <span />
        </span>
      </button>
    );
  }

  return (
    <button type="button" className={`accessibility-tile ${tone ? `accessibility-tile-${tone}` : ""} ${active ? "accessibility-tile-active" : ""}`} onClick={onClick} aria-pressed={active}>
      <span className="accessibility-tile-icon" aria-hidden="true">{icon || (active ? "\u25cf" : "\u25cb")}</span>
      <span className="accessibility-tile-label">{label}</span>
      {description ? <small className="accessibility-tile-description">{description}</small> : null}
      <span className={`accessibility-switch ${active ? "is-active" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function InlineIcon({ name }: { name: "keyboard" | "line" | "mask" | "highlight" | "link" | "focus" | "image" | "virtualKeyboard" | "voice" | "hover" | "audio" | "pause" | "fontScale" | "readableFont" | "lineHeight" | "cursor" | "letterSpacing" | "centerAlign" | "bold" | "emoji" | "reading" }) {
  const baseProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "accessibility-inline-icon",
  };

  if (name === "keyboard") {
    return <svg {...baseProps}><rect x="3.5" y="6.5" width="17" height="11" rx="2.5" /><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 13h7M16 13h.01" /></svg>;
  }
  if (name === "fontScale") {
    return <svg {...baseProps}><path d="M6 18l4-10 4 10M7.5 14h5M15.5 10h4M17.5 8v6" /></svg>;
  }
  if (name === "readableFont") {
    return <svg {...baseProps}><path d="M4 18l4-12 4 12M5.8 13h4.4M14 16h6M17 10v6" /></svg>;
  }
  if (name === "lineHeight") {
    return <svg {...baseProps}><path d="M7 6v12M5 8l2-2 2 2M5 16l2 2 2-2M11 8h8M11 12h8M11 16h8" /></svg>;
  }
  if (name === "cursor") {
    return <svg {...baseProps}><path d="M6 4l9 9-4 1 2 5-2 .8-2-5-3 3z" /></svg>;
  }
  if (name === "letterSpacing") {
    return <svg {...baseProps}><path d="M5 17l3-10 3 10M6 13h4M15 8v8M12 12h6" /></svg>;
  }
  if (name === "centerAlign") {
    return <svg {...baseProps}><path d="M5 8h14M8 12h8M6 16h12" /></svg>;
  }
  if (name === "bold") {
    return <svg {...baseProps}><path d="M8 6h5a3 3 0 010 6H8zm0 6h6a3 3 0 010 6H8z" /></svg>;
  }
  if (name === "emoji") {
    return <svg {...baseProps}><circle cx="12" cy="12" r="8" /><path d="M9.5 10h.01M14.5 10h.01M9 14c.8 1 2 1.6 3 1.6s2.2-.6 3-1.6" /></svg>;
  }
  if (name === "reading") {
    return <svg {...baseProps}><path d="M5 7h14v10H5zM9 7v10M11 11h6" /></svg>;
  }
  if (name === "line") {
    return <svg {...baseProps}><path d="M5 8h14M5 12h10M5 16h14" /></svg>;
  }
  if (name === "mask") {
    return <svg {...baseProps}><rect x="4" y="7" width="16" height="10" rx="2" /><path d="M8 12h8M9.5 10.5h.01M14.5 10.5h.01" /></svg>;
  }
  if (name === "highlight") {
    return <svg {...baseProps}><path d="M6 18l4-4m0 0 6-6 3 3-6 6m-3-3 3 3M5 19h4" /></svg>;
  }
  if (name === "link") {
    return <svg {...baseProps}><path d="M10 14l4-4M8.5 16.5l-1.8 1.8a3 3 0 104.2 4.2l1.8-1.8M15.5 7.5l1.8-1.8a3 3 0 114.2 4.2l-1.8 1.8" /></svg>;
  }
  if (name === "focus") {
    return <svg {...baseProps}><path d="M8 4H6a2 2 0 00-2 2v2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M4 16v2a2 2 0 002 2h2" /></svg>;
  }
  if (name === "image") {
    return <svg {...baseProps}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8.5 10h.01M6.5 16l4-4 3 3 2-2 2 3" /></svg>;
  }
  if (name === "virtualKeyboard") {
    return <svg {...baseProps}><rect x="3.5" y="8" width="17" height="9" rx="2" /><path d="M7 11h.01M10 11h.01M13 11h.01M16 11h.01M7 14h10" /></svg>;
  }
  if (name === "voice") {
    return <svg {...baseProps}><rect x="9" y="4" width="6" height="10" rx="3" /><path d="M6 11a6 6 0 0012 0M12 17v3M9 20h6" /></svg>;
  }
  if (name === "hover") {
    return <svg {...baseProps}><path d="M6 6l8 8m0-5v5h5M18 18H6V6" /></svg>;
  }
  if (name === "audio") {
    return <svg {...baseProps}><path d="M10 9L7.5 11H5v2h2.5l2.5 2V9zM15 10.5a3 3 0 010 3M17.5 8a6.5 6.5 0 010 8" /></svg>;
  }
  return <svg {...baseProps}><path d="M9 8v8M15 8v8" /></svg>;
}

function StepControl({
  label,
  valueLabel,
  onDecrease,
  onIncrease,
  icon,
}: {
  label: string;
  valueLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="accessibility-step-card">
      <div className="accessibility-step-head">
        <span className="accessibility-toggle-row-icon" aria-hidden="true">{icon || "\u2022"}</span>
        <strong>{label}</strong>
      </div>
      <div className="accessibility-step-row">
        <button type="button" className="accessibility-step-button" onClick={onIncrease} aria-label={`Increase ${label}`}>+</button>
        <span>{valueLabel}</span>
        <button type="button" className="accessibility-step-button" onClick={onDecrease} aria-label={`Decrease ${label}`}>-</button>
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const colors = ["#7f1d1d", "#dc2626", "#f59e0b", "#84cc16", "#059669", "#0ea5e9", "#2563eb", "#7c3aed", "#db2777", "#111827", "#ffffff"];
  return (
    <div className="accessibility-step-card" style={{ minHeight: "auto" }}>
      <strong>{label}</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            onClick={() => onChange(color)}
            style={{ width: 22, height: 22, borderRadius: 999, border: value === color ? "2px solid #1f1435" : "1px solid #d7cee9", background: color }}
          />
        ))}
        <button type="button" className="accessibility-step-button" aria-label={`Reset ${label}`} onClick={() => onChange("")}>{"\u00d7"}</button>
      </div>
    </div>
  );
}

export function AccessibilityWidget() {
  const { t } = useI18n();
  const { settings, setFontScale, setLineHeight, toggleSetting, applyMode, setColorSetting, resetSettings } = useAccessibility();
  const { utilisateur } = useAuth();
  const [open, setOpen] = useState(false);
  const [pageSpeechText, setPageSpeechText] = useState("");
  const [links, setLinks] = useState<Array<{ href: string; label: string }>>([]);
  const [selectedLink, setSelectedLink] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [lastVoiceCommand, setLastVoiceCommand] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [microphonePermission, setMicrophonePermission] = useState<"unknown" | "prompt" | "granted" | "denied" | "unsupported">("unknown");
  const [isListening, setIsListening] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState("");
  const [portalReady, setPortalReady] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const virtualKeyboardTargetRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const fontLabel = settings.fontScale === 1 ? t("accessibility.default") : `${Math.round(settings.fontScale * 100)}%`;
  const lineHeightLabel = `${Math.round((settings.lineHeight - 1) * 100)}%`;
  const isCandidate = utilisateur?.role === "candidat";
  const speechLang: "fr-FR" | "en-US" | "ar-SA" = useMemo(() => {
    if (typeof document === "undefined") return "fr-FR";
    const htmlLang = document.documentElement.lang.toLowerCase();
    if (htmlLang.startsWith("ar")) return "ar-SA";
    if (htmlLang.startsWith("en")) return "en-US";
    return "fr-FR";
  }, []);

  const resolveHomeRoute = () => {
    if (!utilisateur) {
      return "/";
    }

    if (
      utilisateur.role === "candidat" ||
      utilisateur.role === "entreprise" ||
      utilisateur.role === "admin" ||
      utilisateur.role === "inspecteur" ||
      utilisateur.role === "aneti"
    ) {
      return "/home";
    }

    return "/";
  };

  const normalizeVoiceText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const hasVoiceKeyword = (transcript: string, keywords: string[]) =>
    keywords.some((keyword) => transcript.includes(normalizeVoiceText(keyword)));

  const executeVoiceCommand = (rawTranscript: string) => {
    const transcript = normalizeVoiceText(rawTranscript);
    const scrollTarget = getScrollableContainer();
    const clickButtonByText = (labels: string[]) => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      const target = buttons.find((button) => {
        if (button.disabled) return false;
        const text = normalizeVoiceText(button.textContent || "");
        return labels.some((label) => text.includes(normalizeVoiceText(label)));
      });
      if (!target) return false;
      target.click();
      return true;
    };
    const navigateTo = (path: string) => {
      if (window.location.pathname !== path) {
        window.location.assign(path);
      }
    };

    const isDown = hasVoiceKeyword(transcript, ["down", "bas", "descendre", "plus bas", "scroll bas"]);
    const isUp = hasVoiceKeyword(transcript, ["up", "haut", "monter", "plus haut", "scroll haut"]);
    const isTop = hasVoiceKeyword(transcript, ["top", "debut", "start", "haut de page", "tout en haut"]);
    const isBottom = hasVoiceKeyword(transcript, ["bottom", "fin", "bas de page", "tout en bas"]);

    const isNextStep = hasVoiceKeyword(transcript, ["suivant", "etape suivante", "continue", "continuer", "next"]);
    const isPreviousStep = hasVoiceKeyword(transcript, ["precedent", "etape precedente", "retour etape", "back step"]);
    const isBack = hasVoiceKeyword(transcript, ["retour page", "page precedente", "go back", "history back"]);

    const isHome = hasVoiceKeyword(transcript, [
      "home",
      "accueil",
      "acceuil",
      "menu principal",
      "tableau de bord",
      "dashboard",
      "aller accueil",
      "page accueil",
    ]);
    const isCandidateDashboard = hasVoiceKeyword(transcript, ["dashboard candidat", "tableau candidat", "espace candidat"]);
    const isJobs = hasVoiceKeyword(transcript, ["jobs", "offres", "emplois", "explore jobs"]);
    const isApplications = hasVoiceKeyword(transcript, ["applications", "candidatures", "mes candidatures"]);
    const isProfile = hasVoiceKeyword(transcript, ["profile", "profil", "mon profil", "profil candidat"]);
    const isMessages = hasVoiceKeyword(transcript, ["messages", "messagerie", "inbox", "boite de reception", "chat"]);
    const isCv = hasVoiceKeyword(transcript, ["cv", "cv builder", "cv manager", "curriculum"]);
    const isInterviews = hasVoiceKeyword(transcript, ["entretiens", "interviews"]);
    const isInterviewTests = hasVoiceKeyword(transcript, ["test entretien", "tests entretien", "quiz"]);
    const isPsychologicalTests = hasVoiceKeyword(transcript, ["test psychologique", "tests psychologiques", "psychologique"]);

    const isOpenAccessibility = hasVoiceKeyword(transcript, ["ouvrir accessibilite", "open accessibility", "ouvrir panneau accessibilite"]);
    const isCloseAccessibility = hasVoiceKeyword(transcript, ["fermer accessibilite", "close accessibility", "fermer panneau"]);
    const isHelp = hasVoiceKeyword(transcript, ["help", "aide", "commandes", "show commands", "guide vocal"]);
    const isHideGuide = hasVoiceKeyword(transcript, ["masquer guide", "hide guide"]);
    const isStopListening = hasVoiceKeyword(transcript, ["stop listening", "arreter ecoute", "stop voice", "arreter voix", "couper micro"]);

    if (isDown && scrollTarget) {
      scrollTarget.scrollBy({ top: 320, behavior: "smooth" });
    }
    if (isUp && scrollTarget) {
      scrollTarget.scrollBy({ top: -320, behavior: "smooth" });
    }
    if (isHome) {
      navigateTo(resolveHomeRoute());
    }
    if (isBack) {
      window.history.back();
    }
    if (isTop && scrollTarget) {
      scrollTarget.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (isBottom && scrollTarget) {
      scrollTarget.scrollTo({ top: scrollTarget.scrollHeight, behavior: "smooth" });
    }
    if (isNextStep) {
      clickButtonByText(["suivant", "continuer", "next", "envoyer", "soumettre", "submit"]);
    }
    if (isPreviousStep) {
      clickButtonByText(["retour", "precedent", "back", "annuler", "cancel"]);
    }
    if (isCandidateDashboard) {
      navigateTo("/candidat/dashboard");
    }
    if (isJobs) {
      navigateTo("/offres");
    }
    if (isApplications) {
      navigateTo("/candidat/candidatures");
    }
    if (isProfile) {
      navigateTo("/profil");
    }
    if (isMessages) {
      navigateTo("/messages");
    }
    if (isCv) {
      navigateTo("/candidat/cv");
    }
    if (isInterviews) {
      navigateTo("/candidat/entretiens");
    }
    if (isInterviewTests) {
      navigateTo("/candidat/tests-entretien");
    }
    if (isPsychologicalTests) {
      navigateTo("/candidat/tests-psychologiques");
    }
    if (isOpenAccessibility) {
      triggerAccessibilityPanel("open");
    }
    if (isCloseAccessibility) {
      setOpen(false);
    }
    if (isHelp) {
      setShowVoiceGuide(true);
    }
    if (isHideGuide) {
      setShowVoiceGuide(false);
    }
    if (isStopListening) {
      setIsListening(false);
    }

    setLastVoiceCommand(rawTranscript);
    const matched =
      isDown ||
      isUp ||
      isHome ||
      isBack ||
      isTop ||
      isBottom ||
      isNextStep ||
      isPreviousStep ||
      isJobs ||
      isApplications ||
      isProfile ||
      isMessages ||
      isCv ||
      isInterviews ||
      isInterviewTests ||
      isPsychologicalTests ||
      isCandidateDashboard ||
      isOpenAccessibility ||
      isCloseAccessibility ||
      isHelp ||
      isHideGuide ||
      isStopListening;

    setVoiceStatus(matched ? `Commande reconnue: ${rawTranscript}` : `Commande non reconnue: ${rawTranscript}`);
    return matched;
  };

  const getScrollableContainer = () => {
    const appMain = document.querySelector<HTMLElement>("main.app-main");
    if (appMain && appMain.scrollHeight > appMain.clientHeight) {
      return appMain;
    }
    return document.scrollingElement as HTMLElement | null;
  };

  const checkMicrophonePermission = async () => {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) {
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setMicrophonePermission(permissionStatus.state as "prompt" | "granted" | "denied");
      permissionStatus.onchange = () => {
        setMicrophonePermission(permissionStatus.state as "prompt" | "granted" | "denied");
      };
    } catch {
      setMicrophonePermission("unknown");
    }
  };

  const requestMicrophoneAccess = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicrophonePermission("unsupported");
      setVoiceStatus("Microphone API not supported in this browser.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophonePermission("granted");
      return true;
    } catch {
      setMicrophonePermission("denied");
      setVoiceStatus("Microphone permission denied. Please allow microphone access.");
      return false;
    }
  };

  useEffect(() => {
    setPortalReady(true);
    void checkMicrophonePermission();
  }, []);

  useEffect(() => {
    const handlePanelEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: AccessibilityPanelAction }>;
      const action = customEvent.detail?.action ?? "toggle";
      setOpen((current) => (action === "open" ? true : action === "close" ? false : !current));
    };
    window.addEventListener(ACCESSIBILITY_PANEL_EVENT, handlePanelEvent);
    return () => window.removeEventListener(ACCESSIBILITY_PANEL_EVENT, handlePanelEvent);
  }, []);

  useEffect(() => {
    if (!open || !isCandidate) return;
    const readPageContent = () => {
      const main = document.querySelector("main.app-main");
      setPageSpeechText(main?.textContent?.replace(/\s+/g, " ").trim() || "");
    };
    readPageContent();
    const timeoutId = window.setTimeout(readPageContent, 220);
    const observer = new MutationObserver(readPageContent);
    const main = document.querySelector("main.app-main");
    if (main) observer.observe(main, { childList: true, subtree: true, characterData: true });
    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [open, isCandidate]);

  useEffect(() => {
    if (!open) return;
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("main.app-main a[href]"))
      .map((a) => ({ href: a.href, label: a.textContent?.trim() || a.href }))
      .filter((item) => item.label)
      .slice(0, 150);
    setLinks(anchors);
  }, [open, pageSpeechText]);

  useEffect(() => {
    if (!open || !settings.virtualKeyboard) {
      virtualKeyboardTargetRef.current = null;
      setKeyboardStatus("");
      return;
    }

    const updateTarget = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        virtualKeyboardTargetRef.current = target;
        setKeyboardStatus("Target selected");
      }
    };

    document.addEventListener("focusin", updateTarget);
    return () => document.removeEventListener("focusin", updateTarget);
  }, [open, settings.virtualKeyboard]);

  useEffect(() => {
    if (!settings.voiceNavigation || !isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop errors
        }
        recognitionRef.current = null;
      }
      setVoiceStatus("");
      return;
    }
    const maybeWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = maybeWindow.SpeechRecognition || maybeWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      setMicrophonePermission("unsupported");
      setVoiceStatus("Voice navigation not supported in this browser.");
      return;
    }
    setVoiceSupported(true);
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    let shouldRestart = true;
    let stoppedByUser = false;

    recognition.onstart = () => setVoiceStatus("Voice navigation listening...");
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (!result || result.length === 0) {
        return;
      }

      // Try all alternatives, from most confident to less confident.
      for (let i = 0; i < result.length; i += 1) {
        const candidate = result[i]?.transcript || "";
        if (candidate && executeVoiceCommand(candidate)) {
          return;
        }
      }

      const fallback = result[0]?.transcript || "";
      executeVoiceCommand(fallback);
    };
    recognition.onerror = (event) => {
      const error = event.error || "unknown";
      if (error === "not-allowed" || error === "service-not-allowed") {
        shouldRestart = false;
        setVoiceStatus("Microphone permission denied. Please allow microphone access.");
        return;
      }
      setVoiceStatus(`Voice error: ${error}`);
    };
    recognition.onend = () => {
      if (shouldRestart && !stoppedByUser && settings.voiceNavigation && isListening) {
        try {
          recognition.start();
        } catch {
          setVoiceStatus("Voice navigation stopped. Click again to retry.");
          setIsListening(false);
        }
      }
    };

    try {
      recognition.start();
      setVoiceStatus("Voice navigation starting...");
    } catch {
      setVoiceStatus("Unable to start voice navigation. Try again and allow microphone.");
      setIsListening(false);
    }

    return () => {
      shouldRestart = false;
      stoppedByUser = true;
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    };
  }, [settings.voiceNavigation, speechLang, isListening]);

  useEffect(() => {
    if (!settings.voiceNavigation) {
      setIsListening(false);
    }
  }, [settings.voiceNavigation]);

  if (!open || !portalReady) return null;

  const panel = (
    <>
      <style jsx global>{`
        #accessibility-panel {
          position: fixed !important;
          top: 16px !important;
          right: 16px !important;
          left: auto !important;
          bottom: auto !important;
          z-index: 2147483647 !important;
          margin: 0 !important;
          transform: none !important;
          max-height: calc(100dvh - 32px) !important;
          overflow: auto !important;
        }

        @keyframes handitalents-voice-pulse {
          0%, 100% { transform: scaleY(0.35); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
      <div
        id="accessibility-panel"
        className="accessibility-panel"
        role="dialog"
        aria-label={t("accessibility.title")}
      >
      <div className="accessibility-panel-head">
        <div className="accessibility-panel-head-copy">
          <span className="accessibility-panel-head-icon" aria-hidden="true">A</span>
          <div>
            <strong>Accessibilite</strong>
            <p className="accessibility-panel-subtitle">Personnalisez votre experience</p>
          </div>
        </div>
        <button type="button" className="accessibility-close" onClick={() => setOpen(false)} aria-label={t("common.actions.close")}>{"\u00d7"}</button>
      </div>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Modes rapides</p>
        <p className="accessibility-module-subtitle">Activez un mode predefini pour adapter instantanement l interface.</p>
        <div className="accessibility-grid accessibility-grid-scroll">
          <FeatureToggle
            label="Epilepsie"
            description="Reduit les animations, la saturation et les sons."
            active={settings.activeQuickMode === "epilepsySafe"}
            onClick={() => applyMode("epilepsySafe")}
            icon="EP"
            tone="epilepsy"
          />
          <FeatureToggle
            label="Malvoyance"
            description="Ameliore le contraste et agrandit les contenus."
            active={settings.activeQuickMode === "visuallyImpaired"}
            onClick={() => applyMode("visuallyImpaired")}
            icon="MV"
            tone="vision"
          />
          <FeatureToggle
            label="Mobilite"
            description="Active clavier, gros curseur et navigation vocale."
            active={settings.activeQuickMode === "mobility"}
            onClick={() => applyMode("mobility")}
            icon="MO"
            tone="mobility"
          />
          <FeatureToggle
            label="Dyslexie & Cognitif"
            description="Reduit le bruit visuel et facilite la lecture."
            active={settings.activeQuickMode === "cognitive"}
            onClick={() => applyMode("cognitive")}
            icon="DX"
            tone="dyslexia"
          />
          <FeatureToggle
            label="Concentration (ADHD)"
            description="Aide a se concentrer avec masque et surbrillance."
            active={settings.activeQuickMode === "adhdFriendly"}
            onClick={() => applyMode("adhdFriendly")}
            icon="AD"
            tone="adhd"
          />
          <FeatureToggle
            label="Non-voyants"
            description="Optimise clavier et navigation vocale."
            active={settings.activeQuickMode === "blindness"}
            onClick={() => applyMode("blindness")}
            icon="NV"
            tone="blindness"
          />
          <FeatureToggle
            label="Auditif"
            description="Renforce les reperes visuels et coupe les sons."
            active={settings.activeQuickMode === "hearing"}
            onClick={() => applyMode("hearing")}
            icon="AU"
            tone="hearing"
          />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Contenu</p>
        <p className="accessibility-module-subtitle">Ajustez la lisibilite du texte et la presentation.</p>
        <div className="accessibility-grid accessibility-grid-large">
          <StepControl icon={<InlineIcon name="fontScale" />} label={t("accessibility.fontSize")} valueLabel={fontLabel} onIncrease={() => setFontScale(settings.fontScale + 0.05)} onDecrease={() => setFontScale(settings.fontScale - 0.05)} />
          <FeatureToggle compact icon={<InlineIcon name="readableFont" />} label={t("accessibility.readableFont")} active={settings.readableFont} onClick={() => toggleSetting("readableFont")} />
          <StepControl icon={<InlineIcon name="lineHeight" />} label={t("accessibility.lineHeight")} valueLabel={lineHeightLabel} onIncrease={() => setLineHeight(settings.lineHeight + 0.1)} onDecrease={() => setLineHeight(settings.lineHeight - 0.1)} />
          <FeatureToggle compact icon={<InlineIcon name="cursor" />} label={t("accessibility.largeCursor")} active={settings.largeCursor} onClick={() => toggleSetting("largeCursor")} />
          <FeatureToggle compact icon={<InlineIcon name="letterSpacing" />} label={t("accessibility.letterSpacing")} active={settings.letterSpacing} onClick={() => toggleSetting("letterSpacing")} />
          <FeatureToggle compact icon={<InlineIcon name="bold" />} label={t("accessibility.boldText")} active={settings.boldText} onClick={() => toggleSetting("boldText")} />
          <FeatureToggle compact icon={<InlineIcon name="emoji" />} label="Masquer les emojis" active={settings.hideEmoji} onClick={() => toggleSetting("hideEmoji")} />
          <FeatureToggle compact icon={<InlineIcon name="reading" />} label="Lecture cognitive" active={settings.cognitiveReading} onClick={() => toggleSetting("cognitiveReading")} />
          <FeatureToggle compact icon={<InlineIcon name="centerAlign" />} label={t("accessibility.centerAlign")} active={settings.centerAlign} onClick={() => toggleSetting("centerAlign")} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Couleurs</p>
        <p className="accessibility-module-subtitle">Choisissez un contraste adapte puis personnalisez les couleurs.</p>
        <div className="accessibility-chip-row">
          <FeatureToggle chip label={t("accessibility.lightContrast")} active={settings.lightContrast} onClick={() => toggleSetting("lightContrast")} />
          <FeatureToggle chip label={t("accessibility.highContrast")} active={settings.highContrast} onClick={() => toggleSetting("highContrast")} />
          <FeatureToggle chip label={t("accessibility.monochrome")} active={settings.monochrome} onClick={() => toggleSetting("monochrome")} />
          <FeatureToggle chip label="Haute saturation" active={settings.highSaturation} onClick={() => toggleSetting("highSaturation")} />
          <FeatureToggle chip label="Basse saturation" active={settings.lowSaturation} onClick={() => toggleSetting("lowSaturation")} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Personnaliser les couleurs</p>
        <div className="accessibility-grid accessibility-grid-large">
          <ColorPicker label="Couleur des titres" value={settings.titleColor} onChange={(value) => setColorSetting("titleColor", value)} />
          <ColorPicker label="Couleur du texte" value={settings.textColor} onChange={(value) => setColorSetting("textColor", value)} />
          <ColorPicker label="Couleur de fond" value={settings.backgroundColor} onChange={(value) => setColorSetting("backgroundColor", value)} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Orientation</p>
        <p className="accessibility-module-subtitle">Facilitez la navigation clavier, focus et lecture guidee.</p>
        <div className="accessibility-grid accessibility-grid-rows">
          <FeatureToggle compact icon={<InlineIcon name="keyboard" />} label="Mode navigation clavier" active={settings.keyboardMoveMode} onClick={() => toggleSetting("keyboardMoveMode")} />
          <FeatureToggle compact icon={<InlineIcon name="line" />} label="Ligne de lecture" active={settings.readingLine} onClick={() => toggleSetting("readingLine")} />
          <FeatureToggle compact icon={<InlineIcon name="mask" />} label="Masque de lecture" active={settings.readingMask} onClick={() => toggleSetting("readingMask")} />
          <FeatureToggle compact icon={<InlineIcon name="highlight" />} label="Surligner le contenu" active={settings.highlightContent} onClick={() => toggleSetting("highlightContent")} />
          <FeatureToggle compact icon={<InlineIcon name="link" />} label="Surligner les liens" active={settings.underlineLinks} onClick={() => toggleSetting("underlineLinks")} />
          <FeatureToggle compact icon={<InlineIcon name="focus" />} label="Surligner le focus" active={settings.highlightFocus} onClick={() => toggleSetting("highlightFocus")} />
          <FeatureToggle compact icon={<InlineIcon name="image" />} label="Masquer les images" active={settings.hideImages} onClick={() => toggleSetting("hideImages")} />
          <FeatureToggle compact icon={<InlineIcon name="virtualKeyboard" />} label="Clavier virtuel" active={settings.virtualKeyboard} onClick={() => toggleSetting("virtualKeyboard")} />
          <FeatureToggle compact icon={<InlineIcon name="voice" />} label="Navigation vocale" active={settings.voiceNavigation} onClick={() => toggleSetting("voiceNavigation")} />
          <FeatureToggle compact icon={<InlineIcon name="hover" />} label="Surlignage au survol" active={settings.highlightHover} onClick={() => toggleSetting("highlightHover")} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Audio & animations</p>
        <p className="accessibility-module-subtitle">Controlez les elements sonores et les mouvements.</p>
        <div className="accessibility-grid accessibility-grid-rows">
          <FeatureToggle compact icon={<InlineIcon name="audio" />} label="Couper les sons" active={settings.muteSounds} onClick={() => toggleSetting("muteSounds")} />
          <FeatureToggle compact icon={<InlineIcon name="pause" />} label="Arreter les animations" active={settings.stopAnimations} onClick={() => toggleSetting("stopAnimations")} />
        </div>
      </section>

      {settings.voiceNavigation ? (
        <section className="accessibility-module">
          <p className="accessibility-module-title">Voice controls</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
              padding: "10px 12px",
              borderRadius: "16px",
              background: isListening ? "rgba(109,42,149,0.08)" : "rgba(220,38,38,0.06)",
              border: `1px solid ${isListening ? "rgba(109,42,149,0.16)" : "rgba(220,38,38,0.12)"}`,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "4px",
                height: "28px",
              }}
            >
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  style={{
                    width: "5px",
                    height: `${12 + index * 4}px`,
                    borderRadius: "999px",
                    background: isListening ? "linear-gradient(180deg, #a855f7, #6d2a95)" : "#d1c5ea",
                    transformOrigin: "bottom center",
                    animation: isListening ? `handitalents-voice-pulse 0.9s ease-in-out ${index * 0.12}s infinite` : "none",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "grid", gap: "2px" }}>
              <strong style={{ fontSize: "0.92rem", color: "#24163f" }}>{isListening ? "Listening now" : "Not listening"}</strong>
              <span style={{ fontSize: "0.82rem", color: "var(--app-muted)" }}>
                {isListening ? "Le micro ecoute vos commandes vocales." : "Activez l'ecoute pour utiliser les commandes vocales."}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              aria-hidden="true"
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: isListening ? "#16a34a" : "#dc2626",
                boxShadow: isListening ? "0 0 0 6px rgba(22,163,74,0.18)" : "0 0 0 6px rgba(220,38,38,0.16)",
                display: "inline-block",
              }}
            />
            <strong style={{ fontSize: "0.9rem" }}>{isListening ? "Voice active" : "Voice stopped"}</strong>
          </div>
          <div className="page-header-actions" style={{ gap: "10px" }}>
            <button
              type="button"
              className="accessibility-reset"
              style={{ minHeight: "40px", width: "auto", padding: "0 14px" }}
              onClick={async () => {
                const granted = await requestMicrophoneAccess();
                if (granted) {
                  setVoiceStatus("Microphone ready. Starting voice navigation...");
                  setIsListening(true);
                }
              }}
              disabled={isListening || !voiceSupported}
            >
              Start listening
            </button>
            <button
              type="button"
              className="accessibility-close"
              style={{ width: "auto", minWidth: "130px", height: "40px", borderRadius: "12px", padding: "0 14px" }}
              onClick={() => setIsListening(false)}
              disabled={!isListening}
            >
              Stop listening
            </button>
            <button
              type="button"
              className="accessibility-close"
              style={{ width: "auto", minWidth: "110px", height: "40px", borderRadius: "12px", padding: "0 14px" }}
              onClick={() => setShowVoiceGuide((value) => !value)}
            >
              {showVoiceGuide ? "Hide guide" : "Show guide"}
            </button>
          </div>
          {showVoiceGuide ? (
            <div style={{ marginTop: "12px", border: "1px solid var(--app-border)", borderRadius: "12px", padding: "10px", background: "#fff" }}>
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Say a command...</p>
              <p style={{ margin: "0 0 6px" }}><strong>Defilement:</strong> bas, haut, tout en haut, tout en bas</p>
              <p style={{ margin: "0 0 6px" }}><strong>Navigation:</strong> accueil/home, retour page</p>
              <p style={{ margin: "0 0 6px" }}><strong>Etapes formulaire:</strong> suivant, precedent</p>
              <p style={{ margin: "0 0 6px" }}><strong>Pages candidat:</strong> dashboard candidat, offres, candidatures, profil, messages, cv, entretiens, test psychologique</p>
              <p style={{ margin: "0 0 6px" }}><strong>Panneau:</strong> ouvrir accessibilite, fermer accessibilite, guide vocal, masquer guide</p>
              <p style={{ margin: 0 }}><strong>Micro:</strong> stop listening / arreter ecoute</p>
            </div>
            ) : null}
        </section>
      ) : null}
      <section className="accessibility-module">
        <p className="accessibility-module-title">Lien rapide</p>
        <div style={{ display: "grid", gap: "8px" }}>
          <select value={selectedLink} onChange={(event) => setSelectedLink(event.target.value)} className="language-switcher-select" aria-label="Link navigator">
            <option value="">Selectionnez une option</option>
            {links.map((item) => <option key={item.href} value={item.href}>{item.label}</option>)}
          </select>
          <button type="button" className="accessibility-reset" onClick={() => selectedLink && window.location.assign(selectedLink)}>Ouvrir le lien</button>
        </div>
      </section>

      {isCandidate ? (
        <section className="accessibility-module">
          <p className="accessibility-module-title">Lecture vocale</p>
          <TextToSpeechButton text={pageSpeechText} lang={speechLang} />
        </section>
      ) : null}

      {settings.voiceNavigation ? (
        <section className="accessibility-module">
          <p className="accessibility-module-title">Commande entendue</p>
          <div
            style={{
              minHeight: "64px",
              padding: "12px 14px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid rgba(91, 63, 153, 0.1)",
              display: "grid",
              gap: "6px",
            }}
          >
            <strong style={{ fontSize: "0.88rem", color: "#24163f" }}>
              {lastVoiceCommand ? `"${lastVoiceCommand}"` : "Aucune commande entendue pour le moment"}
            </strong>
            <span style={{ fontSize: "0.8rem", color: "var(--app-muted)" }}>
              {lastVoiceCommand ? "Derniere commande captee par le micro." : "Parlez apres avoir clique sur Start listening."}
            </span>
          </div>
        </section>
      ) : null}
      {settings.voiceNavigation && voiceStatus ? <p className="texte-secondaire" style={{ marginTop: 0 }}>{voiceStatus}</p> : null}
      {settings.voiceNavigation ? (
        <p className="texte-secondaire" style={{ marginTop: 0 }}>
          State: {isListening ? "Listening" : "Stopped"}
        </p>
      ) : null}
      {settings.voiceNavigation && !voiceSupported ? (
        <p className="texte-secondaire" style={{ marginTop: 0 }}>
          Use Chrome or Edge for voice commands.
        </p>
      ) : null}

      {settings.virtualKeyboard ? (
        <section className="accessibility-module">
          <p className="accessibility-module-title">Virtual keyboard</p>
          <p className="texte-secondaire" style={{ marginTop: 0 }}>
            {keyboardStatus || "Focus an input or textarea first, then type with this keyboard."}
          </p>
          <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}>
            {"1234567890QWERTYUIOPASDFGHJKLZXCVBNM".split("").map((key) => (
              <button
                key={key}
                type="button"
                className="accessibility-step-button"
                style={{ width: "100%", borderRadius: "8px" }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const target = virtualKeyboardTargetRef.current;
                  if (!target) {
                    setKeyboardStatus("Select a target field first.");
                    return;
                  }
                  const start = target.selectionStart ?? target.value.length;
                  const end = target.selectionEnd ?? target.value.length;
                  target.value = `${target.value.slice(0, start)}${key}${target.value.slice(end)}`;
                  target.dispatchEvent(new Event("input", { bubbles: true }));
                  target.setSelectionRange(start + 1, start + 1);
                  target.focus();
                  setKeyboardStatus(`Typed: ${key}`);
                }}
              >
                {key}
              </button>
            ))}
            <button
              type="button"
              className="accessibility-step-button"
              style={{ width: "100%", borderRadius: "8px", gridColumn: "span 2" }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const target = virtualKeyboardTargetRef.current;
                if (!target) {
                  setKeyboardStatus("Select a target field first.");
                  return;
                }
                const start = target.selectionStart ?? target.value.length;
                const end = target.selectionEnd ?? target.value.length;
                if (start === 0 && end === 0) return;
                const from = start === end ? Math.max(start - 1, 0) : start;
                target.value = `${target.value.slice(0, from)}${target.value.slice(end)}`;
                target.dispatchEvent(new Event("input", { bubbles: true }));
                target.setSelectionRange(from, from);
                target.focus();
                setKeyboardStatus("Backspace");
              }}
            >
              {"\u232b"}
            </button>
            <button
              type="button"
              className="accessibility-step-button"
              style={{ width: "100%", borderRadius: "8px", gridColumn: "span 4" }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const target = virtualKeyboardTargetRef.current;
                if (!target) {
                  setKeyboardStatus("Select a target field first.");
                  return;
                }
                const start = target.selectionStart ?? target.value.length;
                const end = target.selectionEnd ?? target.value.length;
                target.value = `${target.value.slice(0, start)} ${target.value.slice(end)}`;
                target.dispatchEvent(new Event("input", { bubbles: true }));
                target.setSelectionRange(start + 1, start + 1);
                target.focus();
                setKeyboardStatus("Space");
              }}
            >
              Space
            </button>
          </div>
        </section>
      ) : null}

        <div className="accessibility-panel-footer">
          <button type="button" className="accessibility-reset" onClick={resetSettings}>{t("accessibility.reset")}</button>
          <p className="accessibility-footer-note">Vos preferences sont sauvegardees automatiquement.</p>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
