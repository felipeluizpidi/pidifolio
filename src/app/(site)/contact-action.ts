"use server";

import { headers } from "next/headers";
import { addMessage, contactAllowed } from "@/lib/messages";
import { READ_ONLY } from "@/lib/store";
import { contactMessageInput } from "@/lib/types";

export type ContactState = {
  status: "idle" | "sent" | "error";
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
  values?: { name: string; email: string; message: string };
};

/** Public action — no session; validated, honeypotted and rate-limited. */
export async function sendContactMessage(_: ContactState, form: FormData): Promise<ContactState> {
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    message: String(form.get("message") ?? ""),
  };
  // Bots fill every field; people never see this one.
  if (String(form.get("company") ?? "").trim()) return { status: "sent" };

  const parsed = contactMessageInput.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      fieldErrors[k] ??= issue.message;
    }
    return { status: "error", fieldErrors, values };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (!contactAllowed(ip)) return { status: "error", error: "Too many messages in a row — please try again in a few minutes.", values };
  if (READ_ONLY) return { status: "error", error: "The form is offline on this deployment — please use the email or WhatsApp links.", values };

  try {
    await addMessage(parsed.data);
    return { status: "sent" };
  } catch {
    return { status: "error", error: "Couldn't send right now — please use the email or WhatsApp links.", values };
  }
}
