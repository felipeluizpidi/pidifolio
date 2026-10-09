"use client";

import { useActionState } from "react";
import clsx from "clsx";
import { sendContactMessage, type ContactState } from "@/app/(site)/contact-action";

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

export function ContactForm({ email }: { email?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, { status: "idle" });
  const fe = state.fieldErrors ?? {};

  if (state.status === "sent") {
    return (
      <div role="status" className="border-2 border-ink p-6 md:p-8">
        <p className="t-meta">Message received</p>
        <p className="t-heavy mt-3 text-[clamp(22px,2.4vw,36px)]">Thanks — I&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative grid gap-7" aria-describedby={state.error ? "contact-error" : undefined}>
      <p className="t-meta">Send a message</p>
      <div className="grid gap-7 md:grid-cols-2">
        <label className="block">
          <span className="t-meta">Name</span>
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={state.values?.name}
            aria-invalid={!!fe.name}
            aria-describedby={fe.name ? "err-name" : undefined}
            className={field}
            placeholder="Your name"
          />
          <Err id="err-name">{fe.name}</Err>
        </label>
        <label className="block">
          <span className="t-meta">Email</span>
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
            placeholder="you@company.com"
          />
          <Err id="err-email">{fe.email}</Err>
        </label>
      </div>
      <label className="block">
        <span className="t-meta">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          maxLength={4000}
          defaultValue={state.values?.message}
          aria-invalid={!!fe.message}
          aria-describedby={fe.message ? "err-message" : undefined}
          className={clsx(field, "resize-y")}
          placeholder="Tell me about the project, the brief or the role."
        />
        <Err id="err-message">{fe.message}</Err>
      </label>
      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Company <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className="t-meta h-12 bg-ink px-6 text-ivory transition-colors hover:bg-ivory hover:text-ink disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send message →"}
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
