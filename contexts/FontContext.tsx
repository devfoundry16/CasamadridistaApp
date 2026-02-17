import React, { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";

export const FONT_CAIRO_REGULAR = "Cairo_400Regular";
export const FONT_CAIRO_BOLD = "Cairo_700Bold";

type FontContextValue = {
  isArabic: boolean;
  fontFamily: string | undefined;
  fontFamilyBold: string | undefined;
};

const FontContext = createContext<FontContextValue>({
  isArabic: false,
  fontFamily: undefined,
  fontFamilyBold: undefined,
});

export function FontProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar") ?? false;
  const value: FontContextValue = {
    isArabic,
    fontFamily: isArabic ? FONT_CAIRO_REGULAR : undefined,
    fontFamilyBold: isArabic ? FONT_CAIRO_BOLD : undefined,
  };
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useFont() {
  return useContext(FontContext);
}
