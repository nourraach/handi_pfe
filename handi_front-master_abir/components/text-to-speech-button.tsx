"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SpeechState = "stopped" | "reading" | "paused";

type TextToSpeechButtonProps = {
  text: string;
  lang?: "fr-FR" | "en-US" | "ar-SA";
  className?: string;
};

function detectSpeechLanguage(content: string): "fr-FR" | "en-US" | "ar-SA" {
  const text = content.trim();

  if (/[\u0600-\u06FF]/.test(text)) {
    return "ar-SA";
  }

  if (/[àâäçéèêëîïôöùûüÿœ]/i.test(text) || /\b(le|la|les|des|une|un|avec|pour|offre|poste|entreprise)\b/i.test(text)) {
    return "fr-FR";
  }

  return "en-US";
}

function getStateLabel(state: SpeechState, lang: "fr-FR" | "en-US" | "ar-SA") {
  if (lang === "ar-SA") {
    if (state === "reading") return "الحالة: قراءة";
    if (state === "paused") return "الحالة: متوقف مؤقتا";
    return "الحالة: متوقف";
  }

  if (lang === "en-US") {
    if (state === "reading") return "State: reading";
    if (state === "paused") return "State: paused";
    return "State: stopped";
  }

  if (state === "reading") return "Etat : lecture";
  if (state === "paused") return "Etat : en pause";
  return "Etat : arrete";
}

export function TextToSpeechButton({ text, lang, className }: TextToSpeechButtonProps) {
  const [speechState, setSpeechState] = useState<SpeechState>("stopped");
  const [error, setError] = useState<string | null>(null);
  const [voiceRate, setVoiceRate] = useState<0.85 | 1 | 1.15>(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);
  const queueIndexRef = useRef(0);
  const paragraphPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRequestedRef = useRef(false);

  const resolvedLang = useMemo(() => lang ?? detectSpeechLanguage(text), [lang, text]);
  const canUseSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasText = text.trim().length > 0;

  const stopReading = () => {
    if (!canUseSpeechSynthesis) {
      return;
    }

    stopRequestedRef.current = true;
    window.speechSynthesis.cancel();
    if (paragraphPauseTimeoutRef.current) {
      clearTimeout(paragraphPauseTimeoutRef.current);
      paragraphPauseTimeoutRef.current = null;
    }
    queueRef.current = [];
    queueIndexRef.current = 0;
    utteranceRef.current = null;
    setSpeechState("stopped");
  };

  const splitIntoSpeechChunks = (content: string) => {
    const paragraphs = content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const sentences = paragraph
        .split(/(?<=[.!?؟۔])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      if (sentences.length === 0) {
        chunks.push(paragraph);
      } else {
        chunks.push(...sentences);
      }

      if (paragraphIndex < paragraphs.length - 1) {
        // Marker for a longer pause between paragraphs.
        chunks.push("__PARAGRAPH_BREAK__");
      }
    });

    return chunks;
  };

  const speakNextChunk = () => {
    if (!canUseSpeechSynthesis || stopRequestedRef.current) {
      return;
    }

    while (queueIndexRef.current < queueRef.current.length && queueRef.current[queueIndexRef.current] === "__PARAGRAPH_BREAK__") {
      queueIndexRef.current += 1;
      paragraphPauseTimeoutRef.current = setTimeout(() => {
        speakNextChunk();
      }, 420);
      return;
    }

    if (queueIndexRef.current >= queueRef.current.length) {
      setSpeechState("stopped");
      utteranceRef.current = null;
      return;
    }

    const chunk = queueRef.current[queueIndexRef.current];
    queueIndexRef.current += 1;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = resolvedLang;
    utterance.rate = voiceRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeechState("reading");
    utterance.onend = () => {
      if (stopRequestedRef.current) {
        return;
      }
      // Small natural pause between sentences.
      paragraphPauseTimeoutRef.current = setTimeout(() => {
        speakNextChunk();
      }, 140);
    };
    utterance.onerror = () => {
      setSpeechState("stopped");
      setError(resolvedLang === "fr-FR" ? "Lecture audio indisponible." : resolvedLang === "ar-SA" ? "تعذر تشغيل القراءة الصوتية." : "Audio playback is unavailable.");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startReading = () => {
    if (!canUseSpeechSynthesis || !hasText) {
      return;
    }

    setError(null);
    stopRequestedRef.current = false;
    window.speechSynthesis.cancel();
    if (paragraphPauseTimeoutRef.current) {
      clearTimeout(paragraphPauseTimeoutRef.current);
      paragraphPauseTimeoutRef.current = null;
    }
    queueRef.current = splitIntoSpeechChunks(text);
    queueIndexRef.current = 0;
    speakNextChunk();
  };

  const pauseReading = () => {
    if (!canUseSpeechSynthesis) {
      return;
    }

    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setSpeechState("paused");
    }
  };

  const resumeReading = () => {
    if (!canUseSpeechSynthesis) {
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeechState("reading");
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (paragraphPauseTimeoutRef.current) {
        clearTimeout(paragraphPauseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className} style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <button
          type="button"
          className="tts-control-button tts-control-button-primary"
          onClick={startReading}
          disabled={!canUseSpeechSynthesis || !hasText}
          aria-label={resolvedLang === "fr-FR" ? "Ecouter le contenu" : resolvedLang === "ar-SA" ? "استمع إلى المحتوى" : "Listen to content"}
        >
          Ecouter le contenu
        </button>
        <button
          type="button"
          className="tts-control-button"
          onClick={pauseReading}
          disabled={!canUseSpeechSynthesis || speechState !== "reading"}
          aria-label={resolvedLang === "fr-FR" ? "Mettre en pause la lecture" : resolvedLang === "ar-SA" ? "إيقاف القراءة مؤقتا" : "Pause reading"}
        >
          Pause
        </button>
        <button
          type="button"
          className="tts-control-button"
          onClick={resumeReading}
          disabled={!canUseSpeechSynthesis || speechState !== "paused"}
          aria-label={resolvedLang === "fr-FR" ? "Reprendre la lecture" : resolvedLang === "ar-SA" ? "متابعة القراءة" : "Resume reading"}
        >
          Resume
        </button>
        <button
          type="button"
          className="tts-control-button tts-control-button-danger"
          onClick={stopReading}
          disabled={!canUseSpeechSynthesis || speechState === "stopped"}
          aria-label={resolvedLang === "fr-FR" ? "Arreter la lecture" : resolvedLang === "ar-SA" ? "إيقاف القراءة" : "Stop reading"}
        >
          Stop
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: "var(--app-text-soft)" }}>Speed</span>
        <button
          type="button"
          className={`tts-control-button ${voiceRate === 0.85 ? "tts-control-button-primary" : ""}`}
          onClick={() => setVoiceRate(0.85)}
          aria-label="Slow voice speed"
        >
          Slow
        </button>
        <button
          type="button"
          className={`tts-control-button ${voiceRate === 1 ? "tts-control-button-primary" : ""}`}
          onClick={() => setVoiceRate(1)}
          aria-label="Normal voice speed"
        >
          Normal
        </button>
        <button
          type="button"
          className={`tts-control-button ${voiceRate === 1.15 ? "tts-control-button-primary" : ""}`}
          onClick={() => setVoiceRate(1.15)}
          aria-label="Fast voice speed"
        >
          Fast
        </button>
      </div>

      <p aria-live="polite" style={{ margin: 0, color: "var(--app-muted)", fontWeight: 600 }}>
        {canUseSpeechSynthesis ? getStateLabel(speechState, resolvedLang) : "Speech API not supported in this browser."}
      </p>

      {error ? (
        <p role="alert" style={{ margin: 0, color: "#b91c1c", fontWeight: 700 }}>
          {error}
        </p>
      ) : null}

      <style jsx>{`
        .tts-control-button {
          border: 1px solid rgba(91, 63, 153, 0.2);
          background: #ffffff;
          color: #2f1d53;
          padding: 9px 14px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .tts-control-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .tts-control-button-primary {
          background: #5f2ac8;
          border-color: #5f2ac8;
          color: #ffffff;
        }
        .tts-control-button-danger {
          border-color: #efc7c7;
          color: #b94b4b;
        }
      `}</style>
    </div>
  );
}
