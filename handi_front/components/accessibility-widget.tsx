"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibility } from "@/components/accessibility-provider";
import { useI18n } from "@/components/i18n-provider";
import { useAuth } from "@/hooks/useAuth";
import { TextToSpeechButton } from "@/components/text-to-speech-button";

const ACCESSIBILITY_PANEL_EVENT = "handitalents:accessibility-panel";

type AccessibilityPanelAction = "open" | "close" | "toggle";

export function triggerAccessibilityPanel(action: AccessibilityPanelAction = "toggle") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_PANEL_EVENT, { detail: { action } }));
}

function FeatureToggle({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`accessibility-tile ${active ? "accessibility-tile-active" : ""}`} onClick={onClick} aria-pressed={active}>
      <span className="accessibility-tile-icon" aria-hidden="true">{active ? "\u25cf" : "\u25cb"}</span>
      <span>{label}</span>
      {description ? <small style={{ color: "var(--app-muted)", fontSize: "0.76rem", lineHeight: 1.35 }}>{description}</small> : null}
    </button>
  );
}

function StepControl({ label, valueLabel, onDecrease, onIncrease }: { label: string; valueLabel: string; onDecrease: () => void; onIncrease: () => void }) {
  return (
    <div className="accessibility-step-card">
      <strong>{label}</strong>
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
        <button type="button" className="accessibility-step-button" aria-label={`Reset ${label}`} onClick={() => onChange("")}>×</button>
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
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
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
    const navigateTo = (path: string) => {
      if (window.location.pathname !== path) {
        window.location.assign(path);
      }
    };

    const isDown = /\b(down|bas|descendre|en bas)\b/.test(transcript);
    const isUp = /\b(up|haut|monter|en haut)\b/.test(transcript);
    const isHome =
      /\b(home|accueil|acceuil|menu principal|tableau de bord|dashboard)\b/.test(transcript) ||
      hasVoiceKeyword(transcript, ["page home", "go home", "aller home", "aller accueil", "page accueil"]);
    const isBack = /\b(back|retour|precedent|page precedente)\b/.test(transcript);
    const isTop = /\b(top|debut|start|commencer|haut de page)\b/.test(transcript);
    const isBottom = /\b(bottom|fin|bas de page)\b/.test(transcript);
    const isJobs = /\b(jobs|offres|explore jobs)\b/.test(transcript);
    const isApplications = /\b(applications|candidatures)\b/.test(transcript);
    const isProfile = /\b(profile|profil|mon profil)\b/.test(transcript);
    const isMessages = /\b(messages|inbox|boite)\b/.test(transcript);
    const isHelp = /\b(help|aide|commandes|show commands)\b/.test(transcript);
    const isStopListening = /\b(stop listening|arreter ecoute|stop voice|arreter voix)\b/.test(transcript);

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
    if (isJobs) {
      navigateTo("/offres");
    }
    if (isApplications) {
      navigateTo("/candidat/candidatures");
    }
    if (isProfile) {
      navigateTo("/candidat/profil");
    }
    if (isMessages) {
      navigateTo("/messages");
    }
    if (isHelp) {
      setShowVoiceGuide(true);
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
      isJobs ||
      isApplications ||
      isProfile ||
      isMessages ||
      isHelp ||
      isStopListening;

    setVoiceStatus(matched ? `Heard: ${rawTranscript}` : `Heard: ${rawTranscript} (no matching command)`);
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
      SpeechRecognition?: new () => {
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
      webkitSpeechRecognition?: new () => {
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
        <strong>{t("accessibility.title")}</strong>
        <button type="button" className="accessibility-close" onClick={() => setOpen(false)} aria-label={t("common.actions.close")}>{"\u00d7"}</button>
      </div>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Quick accessibility modes</p>
        <div className="accessibility-grid accessibility-grid-large">
          <FeatureToggle
            label="Epilepsy Safe Mode"
            description="Stops animations, lowers saturation and mutes sounds."
            active={settings.activeQuickMode === "epilepsySafe"}
            onClick={() => applyMode("epilepsySafe")}
          />
          <FeatureToggle
            label="Visually Impaired Mode"
            description="Boosts contrast, readable font, focus and larger text spacing."
            active={settings.activeQuickMode === "visuallyImpaired"}
            onClick={() => applyMode("visuallyImpaired")}
          />
          <FeatureToggle
            label="Cognitive Disability Mode"
            description="Reduces visual noise and improves reading comfort."
            active={settings.activeQuickMode === "cognitive"}
            onClick={() => applyMode("cognitive")}
          />
          <FeatureToggle
            label="ADHD Friendly Mode"
            description="Improves focus with reading mask, hover/focus highlights and less motion."
            active={settings.activeQuickMode === "adhdFriendly"}
            onClick={() => applyMode("adhdFriendly")}
          />
          <FeatureToggle
            label="Blindness Mode"
            description="Optimizes keyboard and voice navigation with high contrast."
            active={settings.activeQuickMode === "blindness"}
            onClick={() => applyMode("blindness")}
          />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">{t("accessibility.content")}</p>
        <div className="accessibility-grid accessibility-grid-large">
          <StepControl label={t("accessibility.fontSize")} valueLabel={fontLabel} onIncrease={() => setFontScale(settings.fontScale + 0.05)} onDecrease={() => setFontScale(settings.fontScale - 0.05)} />
          <FeatureToggle label={t("accessibility.readableFont")} active={settings.readableFont} onClick={() => toggleSetting("readableFont")} />
          <StepControl label={t("accessibility.lineHeight")} valueLabel={lineHeightLabel} onIncrease={() => setLineHeight(settings.lineHeight + 0.1)} onDecrease={() => setLineHeight(settings.lineHeight - 0.1)} />
          <FeatureToggle label={t("accessibility.largeCursor")} active={settings.largeCursor} onClick={() => toggleSetting("largeCursor")} />
          <FeatureToggle label={t("accessibility.letterSpacing")} active={settings.letterSpacing} onClick={() => toggleSetting("letterSpacing")} />
          <FeatureToggle label={t("accessibility.centerAlign")} active={settings.centerAlign} onClick={() => toggleSetting("centerAlign")} />
          <FeatureToggle label={t("accessibility.boldText")} active={settings.boldText} onClick={() => toggleSetting("boldText")} />
          <FeatureToggle label="Hide emoji" active={settings.hideEmoji} onClick={() => toggleSetting("hideEmoji")} />
          <FeatureToggle label="Cognitive reading" active={settings.cognitiveReading} onClick={() => toggleSetting("cognitiveReading")} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">{t("accessibility.colors")}</p>
        <div className="accessibility-grid">
          <FeatureToggle label={t("accessibility.lightContrast")} active={settings.lightContrast} onClick={() => toggleSetting("lightContrast")} />
          <FeatureToggle label={t("accessibility.highContrast")} active={settings.highContrast} onClick={() => toggleSetting("highContrast")} />
          <FeatureToggle label={t("accessibility.monochrome")} active={settings.monochrome} onClick={() => toggleSetting("monochrome")} />
          <FeatureToggle label="High saturation" active={settings.highSaturation} onClick={() => toggleSetting("highSaturation")} />
          <FeatureToggle label="Low saturation" active={settings.lowSaturation} onClick={() => toggleSetting("lowSaturation")} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">Color adjustments</p>
        <div className="accessibility-grid accessibility-grid-large">
          <ColorPicker label="Title colors" value={settings.titleColor} onChange={(value) => setColorSetting("titleColor", value)} />
          <ColorPicker label="Text colors" value={settings.textColor} onChange={(value) => setColorSetting("textColor", value)} />
          <ColorPicker label="Background colors" value={settings.backgroundColor} onChange={(value) => setColorSetting("backgroundColor", value)} />
        </div>
      </section>

      <section className="accessibility-module">
        <p className="accessibility-module-title">{t("accessibility.orientation")}</p>
        <div className="accessibility-grid">
          <FeatureToggle label={t("accessibility.keyboardMoveMode")} active={settings.keyboardMoveMode} onClick={() => toggleSetting("keyboardMoveMode")} />
          <FeatureToggle label={t("accessibility.readingLine")} active={settings.readingLine} onClick={() => toggleSetting("readingLine")} />
          <FeatureToggle label={t("accessibility.readingMask")} active={settings.readingMask} onClick={() => toggleSetting("readingMask")} />
          <FeatureToggle label={t("accessibility.hideImages")} active={settings.hideImages} onClick={() => toggleSetting("hideImages")} />
          <FeatureToggle label={t("accessibility.stopAnimations")} active={settings.stopAnimations} onClick={() => toggleSetting("stopAnimations")} />
          <FeatureToggle label={t("accessibility.highlightContent")} active={settings.highlightContent} onClick={() => toggleSetting("highlightContent")} />
          <FeatureToggle label={t("accessibility.underlineLinks")} active={settings.underlineLinks} onClick={() => toggleSetting("underlineLinks")} />
          <FeatureToggle label="Highlight hover" active={settings.highlightHover} onClick={() => toggleSetting("highlightHover")} />
          <FeatureToggle label="Highlight focus" active={settings.highlightFocus} onClick={() => toggleSetting("highlightFocus")} />
          <FeatureToggle label="Mute sounds" active={settings.muteSounds} onClick={() => toggleSetting("muteSounds")} />
          <FeatureToggle label="Virtual keyboard" active={settings.virtualKeyboard} onClick={() => toggleSetting("virtualKeyboard")} />
          <FeatureToggle label="Voice navigation" active={settings.voiceNavigation} onClick={() => toggleSetting("voiceNavigation")} />
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
              <p style={{ margin: "0 0 6px" }}><strong>Scroll:</strong> bas, haut, top, bottom</p>
              <p style={{ margin: "0 0 6px" }}><strong>Navigation:</strong> accueil/home/dashboard, retour/back</p>
              <p style={{ margin: "0 0 6px" }}><strong>Pages:</strong> offres/jobs, candidatures/applications, profil/profile, messages</p>
              <p style={{ margin: "0 0 6px" }}><strong>Help:</strong> aide/help/show commands</p>
              <p style={{ margin: 0 }}><strong>Stop:</strong> stop listening / arreter ecoute</p>
            </div>
            ) : null}
        </section>
      ) : null}
      <section className="accessibility-module">
        <p className="accessibility-module-title">Link navigator</p>
        <div style={{ display: "grid", gap: "8px" }}>
          <select value={selectedLink} onChange={(event) => setSelectedLink(event.target.value)} className="language-switcher-select" aria-label="Link navigator">
            <option value="">Select an option</option>
            {links.map((item) => <option key={item.href} value={item.href}>{item.label}</option>)}
          </select>
          <button type="button" className="accessibility-reset" onClick={() => selectedLink && window.location.assign(selectedLink)}>Open selected link</button>
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
              ⌫
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

        <button type="button" className="accessibility-reset" onClick={resetSettings}>{t("accessibility.reset")}</button>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
