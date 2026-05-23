"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type AccessibilitySettings = {
  activeQuickMode: AccessibilityMode | null;
  fontScale: number;
  lineHeight: number;
  readingLine: boolean;
  readingMask: boolean;
  keyboardMoveMode: boolean;
  readableFont: boolean;
  largeCursor: boolean;
  letterSpacing: boolean;
  centerAlign: boolean;
  boldText: boolean;
  lightContrast: boolean;
  highContrast: boolean;
  monochrome: boolean;
  hideImages: boolean;
  stopAnimations: boolean;
  highlightContent: boolean;
  underlineLinks: boolean;
  hideEmoji: boolean;
  highlightHover: boolean;
  highlightFocus: boolean;
  highSaturation: boolean;
  lowSaturation: boolean;
  muteSounds: boolean;
  cognitiveReading: boolean;
  virtualKeyboard: boolean;
  voiceNavigation: boolean;
  titleColor: string;
  textColor: string;
  backgroundColor: string;
};

type AccessibilityMode = "epilepsySafe" | "visuallyImpaired" | "cognitive" | "adhdFriendly" | "blindness";
type ToggleSettingKey = Exclude<
  keyof AccessibilitySettings,
  "fontScale" | "lineHeight" | "titleColor" | "textColor" | "backgroundColor"
>;

type AccessibilityContextValue = {
  settings: AccessibilitySettings;
  setFontScale: (value: number) => void;
  setLineHeight: (value: number) => void;
  toggleSetting: (key: ToggleSettingKey) => void;
  applyMode: (mode: AccessibilityMode) => void;
  setColorSetting: (key: "titleColor" | "textColor" | "backgroundColor", value: string) => void;
  resetSettings: () => void;
};

const STORAGE_KEY = "handitalents_accessibility_settings";

const defaultSettings: AccessibilitySettings = {
  activeQuickMode: null,
  fontScale: 1,
  lineHeight: 1.6,
  readingLine: false,
  readingMask: false,
  keyboardMoveMode: false,
  readableFont: false,
  largeCursor: false,
  letterSpacing: false,
  centerAlign: false,
  boldText: false,
  lightContrast: false,
  highContrast: false,
  monochrome: false,
  hideImages: false,
  stopAnimations: false,
  highlightContent: false,
  underlineLinks: false,
  hideEmoji: false,
  highlightHover: false,
  highlightFocus: false,
  highSaturation: false,
  lowSaturation: false,
  muteSounds: false,
  cognitiveReading: false,
  virtualKeyboard: false,
  voiceNavigation: false,
  titleColor: "",
  textColor: "",
  backgroundColor: "",
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [pointerY, setPointerY] = useState(-200);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
      setSettings({ ...defaultSettings, ...parsed });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    const body = document.body;
    body.style.setProperty("--accessibility-font-scale", String(settings.fontScale));
    body.style.setProperty("--accessibility-line-height", String(settings.lineHeight));

    body.dataset.readingLine = String(settings.readingLine);
    body.dataset.readingMask = String(settings.readingMask);
    body.dataset.keyboardMoveMode = String(settings.keyboardMoveMode);
    body.dataset.readableFont = String(settings.readableFont);
    body.dataset.largeCursor = String(settings.largeCursor);
    body.dataset.letterSpacing = String(settings.letterSpacing);
    body.dataset.centerAlign = String(settings.centerAlign);
    body.dataset.boldText = String(settings.boldText);
    body.dataset.lightContrast = String(settings.lightContrast);
    body.dataset.highContrast = String(settings.highContrast);
    body.dataset.monochrome = String(settings.monochrome);
    body.dataset.hideImages = String(settings.hideImages);
    body.dataset.stopAnimations = String(settings.stopAnimations);
    body.dataset.highlightContent = String(settings.highlightContent);
    body.dataset.underlineLinks = String(settings.underlineLinks);
    body.dataset.hideEmoji = String(settings.hideEmoji);
    body.dataset.highlightHover = String(settings.highlightHover);
    body.dataset.highlightFocus = String(settings.highlightFocus);
    body.dataset.highSaturation = String(settings.highSaturation);
    body.dataset.lowSaturation = String(settings.lowSaturation);
    body.dataset.muteSounds = String(settings.muteSounds);
    body.dataset.cognitiveReading = String(settings.cognitiveReading);
    body.dataset.virtualKeyboard = String(settings.virtualKeyboard);
    body.dataset.voiceNavigation = String(settings.voiceNavigation);
    body.dataset.colorAdjustActive = String(Boolean(settings.titleColor || settings.textColor || settings.backgroundColor));
    body.style.setProperty("--accessibility-title-color", settings.titleColor || "inherit");
    body.style.setProperty("--accessibility-text-color", settings.textColor || "inherit");
    body.style.setProperty("--accessibility-bg-color", settings.backgroundColor || "transparent");
  }, [settings]);

  useEffect(() => {
    if (!settings.muteSounds) {
      document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => {
        media.muted = false;
      });
      return;
    }

    const muteMedia = () => {
      document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => {
        media.muted = true;
        media.volume = 0;
      });
    };

    muteMedia();
    const observer = new MutationObserver(muteMedia);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [settings.muteSounds]);

  useEffect(() => {
    const updatePointer = (event: MouseEvent) => {
      setPointerY(event.clientY);
    };

    if (settings.readingLine || settings.readingMask) {
      window.addEventListener("mousemove", updatePointer);
      return () => window.removeEventListener("mousemove", updatePointer);
    }

    setPointerY(-200);
    return undefined;
  }, [settings.readingLine, settings.readingMask]);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      settings,
      setFontScale: (value) =>
        setSettings((current) => ({
          ...current,
          activeQuickMode: null,
          fontScale: Math.min(1.45, Math.max(0.9, Number(value.toFixed(2)))),
        })),
      setLineHeight: (value) =>
        setSettings((current) => ({
          ...current,
          activeQuickMode: null,
          lineHeight: Math.min(2.2, Math.max(1.3, Number(value.toFixed(2)))),
        })),
      toggleSetting: (key) =>
        setSettings((current) => {
          const nextValue = !current[key];

          if (key === "lightContrast" && nextValue) {
            return { ...current, activeQuickMode: null, lightContrast: true, highContrast: false };
          }

          if (key === "highContrast" && nextValue) {
            return { ...current, activeQuickMode: null, lightContrast: false, highContrast: true };
          }

          if (key === "highSaturation" && nextValue) {
            return { ...current, activeQuickMode: null, highSaturation: true, lowSaturation: false };
          }

          if (key === "lowSaturation" && nextValue) {
            return { ...current, activeQuickMode: null, highSaturation: false, lowSaturation: true };
          }

          return { ...current, activeQuickMode: null, [key]: nextValue };
        }),
      applyMode: (mode) =>
        setSettings((current) => {
          if (current.activeQuickMode === mode) {
            return { ...defaultSettings };
          }

          const base = {
            ...current,
            activeQuickMode: mode,
            fontScale: 1,
            lineHeight: 1.6,
            lightContrast: false,
            highContrast: false,
            monochrome: false,
            stopAnimations: false,
            hideImages: false,
            readableFont: false,
            letterSpacing: false,
            keyboardMoveMode: false,
            readingMask: false,
            readingLine: false,
            highlightContent: false,
            underlineLinks: false,
            boldText: false,
            hideEmoji: false,
            highlightHover: false,
            highlightFocus: false,
            highSaturation: false,
            lowSaturation: false,
            muteSounds: false,
            cognitiveReading: false,
            virtualKeyboard: false,
            voiceNavigation: false,
            titleColor: "",
            textColor: "",
            backgroundColor: "",
          };

          if (mode === "epilepsySafe") {
            return {
              ...base,
              stopAnimations: true,
              lowSaturation: true,
              highSaturation: false,
              muteSounds: true,
            };
          }

          if (mode === "visuallyImpaired") {
            return {
              ...base,
              readableFont: true,
              highContrast: true,
              underlineLinks: true,
              highlightFocus: true,
              fontScale: Math.max(base.fontScale, 1.12),
              lineHeight: Math.max(base.lineHeight, 1.75),
              highlightFocus: true,
            };
          }

          if (mode === "cognitive") {
            return {
              ...base,
              readableFont: true,
              letterSpacing: true,
              highlightContent: true,
              hideImages: true,
              lowSaturation: true,
              highSaturation: false,
              cognitiveReading: true,
            };
          }

          if (mode === "adhdFriendly") {
            return {
              ...base,
              stopAnimations: true,
              highlightFocus: true,
              readingMask: true,
              lowSaturation: true,
              highSaturation: false,
              highlightHover: true,
            };
          }

          return {
            ...base,
            readableFont: true,
            highContrast: true,
            monochrome: true,
            underlineLinks: true,
            keyboardMoveMode: true,
            hideImages: true,
            stopAnimations: true,
            voiceNavigation: true,
          };
        }),
      setColorSetting: (key, value) =>
        setSettings((current) => ({
          ...current,
          activeQuickMode: null,
          [key]: value.trim(),
        })),
      resetSettings: () => setSettings(defaultSettings),
    }),
    [settings],
  );

  const readingLineStyle: CSSProperties = {
    top: `${pointerY}px`,
    opacity: settings.readingLine ? 1 : 0,
  };

  const readingMaskStyle: CSSProperties = {
    opacity: settings.readingMask ? 1 : 0,
    background: `linear-gradient(
      to bottom,
      rgba(23, 18, 37, 0.58) 0,
      rgba(23, 18, 37, 0.58) ${Math.max(pointerY - 48, 0)}px,
      rgba(255, 255, 255, 0) ${Math.max(pointerY - 48, 0)}px,
      rgba(255, 255, 255, 0) ${Math.max(pointerY + 48, 0)}px,
      rgba(23, 18, 37, 0.58) ${Math.max(pointerY + 48, 0)}px,
      rgba(23, 18, 37, 0.58) 100%
    )`,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <div aria-hidden="true" className="accessibility-reading-line accessibility-reading-line-active" style={readingLineStyle} />
      <div aria-hidden="true" className="accessibility-reading-mask accessibility-reading-mask-active" style={readingMaskStyle} />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider.");
  }
  return context;
}
