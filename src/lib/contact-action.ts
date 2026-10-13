"use server";

import { headers } from "next/headers";
import { addMessage, contactAllowed } from "@/lib/messages";
import { READ_ONLY } from "@/lib/store";
import { contactMessageInput } from "@/lib/types";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionary";

export type ContactState = {
  status: "idle" | "sent" | "error";
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
  values?: { name: string; email: string; message: string };
};

/** Public action — no session; validated, honeypotted and rate-limited. */
export async function sendContactMessage(_: ContactState, form: FormData, locale: Locale = defaultLocale): Promise<ContactState> {
  const dict = getDictionary(isLocale(locale) ? locale : defaultLocale);
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    message: String(form.get("message") ?? ""),
  };
  // Bots fill every field; people never see this one.
  if (String(form.get("company") ?? "").trim()) return { status: "sent" };

  const parsed = contactMessageInput.safeParse(values);
  if (!parsed.success) {
    const errByField = { name: dict.errName, email: dict.errEmail, message: dict.errMessage };
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof typeof errByField;
      fieldErrors[k] ??= errByField[k];
    }
    return { status: "error", fieldErrors, values };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (!contactAllowed(ip)) return { status: "error", error: dict.errRateLimit, values };
  if (READ_ONLY) return { status: "error", error: dict.errOffline, values };

  try {
    await addMessage(parsed.data);
    return { status: "sent" };
  } catch {
    return { status: "error", error: dict.errGeneric, values };
  }
}
