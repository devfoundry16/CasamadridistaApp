import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import translationEn from "./locales/en-US/translation.json";
import translationAr from "./locales/ar-SA/translation.json";

const LANG_STORAGE_KEY = "@app_language";

const resources = {
  "en-US": { translation: translationEn },
  "ar-SA": { translation: translationAr },
};

/** Map device locale to a supported app locale (en-US | ar-SA). Safe when expo-localization native module is missing. */
function getDeviceLocale(): "en-US" | "ar-SA" {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic require to avoid crash when native module missing
    const Localization = require("expo-localization");
    const tag = Localization.getLocales?.()?.[0]?.languageTag ?? "";
    if (tag.startsWith("ar")) return "ar-SA";
  } catch {
    // expo-localization native module not available (e.g. Expo Go, web, or dev client not rebuilt)
  }
  return "en-US";
}

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  init: () => {},
  detect: async (callback: (lng: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(LANG_STORAGE_KEY);
      if (stored === "en-US" || stored === "ar-SA") {
        callback(stored);
        return;
      }
    } catch {
      // ignore
    }
    callback(getDeviceLocale());
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANG_STORAGE_KEY, lng);
    } catch {
      // ignore
    }
  },
};

/**
 * Persist the layout direction for a language. Returns true when it changed.
 *
 * `allowRTL`/`forceRTL` write to native storage and are read once, at bridge
 * init. They do NOT change `I18nManager.isRTL` in the running process, so the
 * current session keeps rendering in the direction it started with — which is
 * exactly what we want.
 *
 * There is deliberately NO reload here. `Updates.reloadAsync()` restarts the JS
 * bundle but not the native process, and the header back chevron's direction
 * lives in process-global `UIAppearance` proxies that react-native-screens sets
 * once per process (`applySemanticContentAttributeIfNeededToNavCtrl:` in
 * RNSScreenStackHeaderConfig.mm). Flipping the flag and reloading JS therefore
 * left a half-applied process: LTR English strings next to a mirrored, forward
 * pointing back chevron, for the rest of the process's life. Direction changes
 * only take effect on a genuine cold start.
 */
function applyRTL(lng: string): boolean {
  const isRTL = lng === "ar-SA";
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    return true;
  }
  return false;
}

i18n.use(languageDetector).use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources,
  fallbackLng: "en-US",
  interpolation: {
    escapeValue: false,
  },
});

// Not applied in init: the detector is async, so the language is not known yet.
//
// This fires on the first detection of every cold start, and on any later
// `changeLanguage`. It only persists the direction for the NEXT launch; it never
// flips the running process. See `applyRTL` for why a reload is not used here.
//
// `pendingRestart` lets the UI tell the user their choice needs a relaunch. It is
// read, not awaited — nothing blocks on it.
let pendingRestart = false;

/** True when the persisted direction no longer matches the running process. */
export function needsRestartForDirection(): boolean {
  return pendingRestart;
}

i18n.on("languageChanged", (lng) => {
  const normalizedLng = lng.startsWith("ar") ? "ar-SA" : "en-US";
  if (applyRTL(normalizedLng)) pendingRestart = true;
});

export default i18n;
export { getDeviceLocale, LANG_STORAGE_KEY };
export { default as LanguageSwitcher } from "@/components/LanguageSwitcher";


