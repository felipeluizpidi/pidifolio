export const locales = ["pt", "en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = { pt: "Português", en: "English", es: "Español" };
/** Flag shown by the switcher — Brazil for pt-BR, US for en, Spain for es. */
export const localeFlags: Record<Locale, string> = { pt: "🇧🇷", en: "🇺🇸", es: "🇪🇸" };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

/** Parse an Accept-Language header and pick the best supported locale, defaulting to English. */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const prefs = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.toLowerCase().split("-")[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { base } of prefs) {
    if (base === "pt") return "pt";
    if (base === "es") return "es";
    if (base === "en") return "en";
  }
  return defaultLocale;
}
