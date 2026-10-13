"use client";

import { useActionState } from "react";
import clsx from "clsx";
import { sendContactMessage, type ContactState } from "@/lib/contact-action";
import type { Dict } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

const field =
  "mt-1.5 block w-full border-0 border-b-2 border-ink/40 bg-transparent px-0 py-2 text-[17px] text-ink placeholder:text-ink/45 focus:border-ink focus:outline-none focus:ring-0 md:text-[19px]";

function Err({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="t-meta mt-1.5 text-ivory">
      ↳ {children}
    </p>
  );
}

export function ContactForm({ email, locale, dict }: { email?: string; locale: Locale; dict: Dict }) {
  const action = (state: ContactState, form: FormData) => sendContactMessage(state, form, locale);
  const [state, formAction, pending] = useActionState<ContactState, FormData>(action, { status: "idle" });
  const fe = state.fieldErrors ?? {};

  if (state.status === "sent") {
    return (
      <div role="status" className="border-2 border-ink p-6 md:p-8">
        <p className="t-meta">{dict.messageReceived}</p>
        <p className="t-heavy mt-3 text-[clamp(22px,2.4vw,36px)]">{dict.thanksReply}</p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="relative grid gap-7" aria-describedby={state.error ? "contact-error" : undefined}>
      <p className="t-meta">{dict.sendAMessage}</p>
      <div className="grid gap-7 md:grid-cols-2">
        <label className="block">
          <span className="t-meta">{dict.name}</span>
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={state.values?.name}
            aria-invalid={!!fe.name}
            aria-describedby={fe.name ? "err-name" : undefined}
            className={field}
            placeholder={dict.namePlaceholder}
          />
          <Err id="err-name">{fe.name}</Err>
        </label>
        <label className="block">
          <span className="t-meta">{dict.email}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            defaultValue={state.values?.email}
            aria-invalid={!!fe.email}
            aria-describedby={fe.email ? "err-email" : undefined}
            className={field}
            placeholder={dict.emailPlaceholder}
          />
          <Err id="err-email">{fe.email}</Err>
        </label>
      </div>
      <label className="block">
        <span className="t-meta">{dict.message}</span>
        <textarea
          name="message"
          required
          rows={4}
          maxLength={4000}
          defaultValue={state.values?.message}
          aria-invalid={!!fe.message}
          aria-describedby={fe.message ? "err-message" : undefined}
          className={clsx(field, "resize-y")}
          placeholder={dict.messagePlaceholder}
        />
        <Err id="err-message">{fe.message}</Err>
      </label>
      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label>
          {dict.company} <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className="t-meta h-12 bg-ink px-6 text-ivory transition-colors hover:bg-ivory hover:text-ink disabled:opacity-60"
        >
          {pending ? dict.sending : dict.sendMessage}
        </button>
        {state.error && (
          <p id="contact-error" role="alert" className="t-meta text-ivory">
            {state.error}
            {email && (
              <>
                {" "}
                <a className="underline" href={`mailto:${email}`}>
                  {email}
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
