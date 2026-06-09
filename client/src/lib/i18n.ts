/**
 * Lightweight i18n + RTL scaffolding (no external deps).
 * - Stores locale in localStorage
 * - Supports en (LTR) and ar (RTL)
 * - Exposes useT() hook with a simple key/string lookup + interpolation
 * - Sets <html lang> and <html dir> on locale change
 */
import { useEffect, useState, useCallback } from "react";

export type Locale = "en" | "ar";

const STORAGE_KEY = "app.locale";

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "nav.signin": "Sign in",
    "nav.startfree": "Start Free",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.docs": "API Docs",
    "hero.headline.a": "Your Entire HR Department.",
    "hero.headline.b": "Powered by AI.",
    "hero.cta.startfree": "Start Free",
    "hero.cta.bookdemo": "Book Demo",
  },
  ar: {
    "nav.signin": "تسجيل الدخول",
    "nav.startfree": "ابدأ مجانًا",
    "nav.features": "المزايا",
    "nav.pricing": "الأسعار",
    "nav.docs": "وثائق الواجهة البرمجية",
    "hero.headline.a": "قسم الموارد البشرية بأكمله.",
    "hero.headline.b": "مدعوم بالذكاء الاصطناعي.",
    "hero.cta.startfree": "ابدأ مجانًا",
    "hero.cta.bookdemo": "احجز عرضًا",
  },
};

export function isRTL(locale: Locale): boolean {
  return locale === "ar";
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  return stored === "ar" ? "ar" : "en";
}

export function applyLocaleToDocument(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const [locale, setLocale] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    applyLocaleToDocument(locale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  return [locale, setLocale];
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.keys(params).reduce(
    (acc, key) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(params[key])),
    template
  );
}

export function useT(): (key: string, params?: Record<string, string | number>) => string {
  const [locale] = useLocale();
  return useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale] || dictionaries.en;
      return interpolate(dict[key] ?? key, params);
    },
    [locale]
  );
}
