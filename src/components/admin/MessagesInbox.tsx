"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Mail, Trash2 } from "lucide-react";
import type { ContactMessage } from "@/lib/types";
import { deleteMessage, setMessageRead } from "@/app/admin/actions";
import { Button, Notice } from "./ui";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function MessagesInbox({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const unread = messages.filter((m) => !m.read).length;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong");
      else {
        setError(null);
        router.refresh();
      }
    });

  return (
    <div className="space-y-6 pb-16">
      <header>
        <p className="t-meta text-ash">Contact form · {unread} unread</p>
        <h1 className="t-display text-[56px] md:text-[80px]">Messages</h1>
      </header>
      {error && <Notice kind="error">{error}</Notice>}
      {messages.length === 0 ? (
        <p className="text-[14px] text-ash">No messages yet. Anything sent through the contact form on the site lands here.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={clsx("border p-4 md:p-5", m.read ? "border-ivory/15" : "border-orange/60 bg-ivory/[0.03]")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[15px] font-medium">
                  {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-orange align-middle" aria-label="Unread" />}
                  {m.name}{" "}
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`} className="text-ash underline-offset-2 hover:text-ivory hover:underline">
                    &lt;{m.email}&gt;
                  </a>
                </p>
                <time className="t-meta-sm text-ash" dateTime={m.createdAt}>
                  {fmt(m.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ivory/85">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`} className="t-meta inline-flex h-9 items-center gap-2 border border-ivory/25 px-3 hover:border-ivory">
                  <Mail className="h-3.5 w-3.5" /> Reply
                </a>
                <Button variant="ghost" disabled={pending} onClick={() => run(() => setMessageRead(m.id, !m.read))}>
                  Mark as {m.read ? "unread" : "read"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending}
                  aria-label={`Delete message from ${m.name}`}
                  onClick={() => confirm(`Delete the message from ${m.name}?`) && run(() => deleteMessage(m.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
