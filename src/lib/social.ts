import type { Settings } from "./types";

export const whatsappHref = (digits?: string) => (digits ? `https://wa.me/${digits}` : undefined);

/** 5511983829395 → +55 11 98382-9395 (falls back to +digits for other formats). */
export function formatWhatsapp(digits?: string) {
  if (!digits) return "";
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : `+${digits}`;
}

/** https://www.instagram.com/olhosdefelipe/ → @olhosdefelipe */
export function instagramHandle(url?: string) {
  const m = url ? /instagram\.com\/([\w.]+)/i.exec(url) : null;
  return m ? `@${m[1]}` : "Instagram";
}

/** Every social link that is set, in display order. */
export function socialLinks(s: Settings) {
  return [
    { key: "linkedin", label: "LinkedIn", value: "Profile ↗", href: s.social.linkedin },
    { key: "behance", label: "Behance", value: "Portfolio ↗", href: s.social.behance },
    { key: "instagram", label: "Instagram", value: `${instagramHandle(s.social.instagram)} ↗`, href: s.social.instagram },
    { key: "whatsapp", label: "WhatsApp", value: `${formatWhatsapp(s.social.whatsapp)} ↗`, href: whatsappHref(s.social.whatsapp) },
  ].filter((l): l is typeof l & { href: string } => !!l.href);
}
