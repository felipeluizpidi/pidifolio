"use client";

import clsx from "clsx";
import { forwardRef } from "react";

export function Section({ title, hint, children, aside }: { title: string; hint?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border border-ivory/15 bg-[#121110]">
      <header className="flex items-center justify-between gap-4 border-b border-ivory/15 px-4 py-3">
        <div>
          <h2 className="t-meta text-ivory">{title}</h2>
          {hint && <p className="mt-0.5 text-[12px] text-ash">{hint}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="t-meta-sm mb-1.5 block text-ash">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ash/80">{hint}</span>}
    </label>
  );
}

const base =
  "w-full border border-ivory/20 bg-ink px-3 py-2 text-[14px] text-ivory placeholder:text-ash/60 transition-colors focus:border-orange focus:outline-none";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={clsx(base, "h-10", className)} {...p} />;
});

export function Textarea({ className, rows = 4, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={clsx(base, "leading-relaxed", className)} {...p} />;
}

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(base, "h-10", className)} {...p}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx("t-meta-sm inline-flex h-8 items-center gap-2 border px-2.5 transition-colors disabled:opacity-40", checked ? "border-red bg-red text-ivory" : "border-ivory/25 text-ash hover:border-ivory/60")}
    >
      <span className={clsx("h-2 w-2", checked ? "bg-ivory" : "border border-ash")} />
      {label}
    </button>
  );
}

export function Button({
  variant = "default",
  className,
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger" | "ghost" }) {
  return (
    <button
      type="button"
      className={clsx(
        "t-meta inline-flex h-10 items-center justify-center gap-2 px-4 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-red text-ivory hover:bg-orange",
        variant === "default" && "border border-ivory/25 text-ivory hover:border-ivory",
        variant === "danger" && "border border-red/60 text-red hover:bg-red hover:text-ivory",
        variant === "ghost" && "text-ash hover:text-ivory",
        className,
      )}
      {...p}
    />
  );
}

export function Notice({ kind, children }: { kind: "ok" | "error" | "info"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={clsx(
        "border px-3 py-2 text-[13px]",
        kind === "ok" && "border-mint/40 text-mint",
        kind === "error" && "border-red/60 bg-red/10 text-[#ff8a7a]",
        kind === "info" && "border-ivory/20 text-ash",
      )}
    >
      {children}
    </p>
  );
}

/** Edit a list of strings as lines. */
export function LinesInput({ value, onChange, rows = 3, placeholder }: { value: string[]; onChange: (v: string[]) => void; rows?: number; placeholder?: string }) {
  return (
    <Textarea
      rows={rows}
      placeholder={placeholder}
      value={value.join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      onBlur={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
    />
  );
}
