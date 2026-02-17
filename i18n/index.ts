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

/** Apply RTL for Arabic. Returns true if RTL state changed (app should reload). */
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

// Don't apply RTL in init — detector runs async; apply in languageChanged so we reload once with correct RTL

i18n.on("languageChanged", (lng) => {
  const normalizedLng = lng.startsWith("ar") ? "ar-SA" : "en-US";
  const rtlChanged = applyRTL(normalizedLng);
  if (rtlChanged) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic to avoid load when unavailable
      const Updates = require("expo-updates");
      if (Updates.reloadAsync) Updates.reloadAsync();
    } catch {
      // expo-updates not available
    }
  }
});

export default i18n;
export { getDeviceLocale, LANG_STORAGE_KEY };
export { default as LanguageSwitcher } from "@/components/LanguageSwitcher";


