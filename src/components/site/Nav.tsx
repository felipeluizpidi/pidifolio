"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { EASE } from "./Motion";

export const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "work", label: "Selected Work" },
  { id: "archive", label: "Archive" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

function Timecode() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const s = (performance.now() - start) / 1000;
      const f = Math.floor((s % 1) * 24);
      const pad = (n: number) => String(n).padStart(2, "0");
      setT(`${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}:${pad(f)}`);
      raf = requestAnimationFrame(tick);
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) setT("00:00:00:00");
    else raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span className="tabular-nums">{t ?? "00:00:00:00"}</span>;
}

export function Nav({ name, email, links }: { name: string; email: string; links: { key: string; label: string; href: string }[] }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [active, setActive] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!onHome) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [onHome]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <>
      <header className="gutter fixed inset-x-0 top-0 z-50 flex h-[var(--nav-h)] items-center justify-between text-ivory mix-blend-difference">
        <Link href={href("home")} className="t-meta flex items-center gap-2" aria-label={`${name} — home`}>
          <span className="font-heavy text-[15px] tracking-tight">{initials}®</span>
          <span className="hidden sm:inline">— Portfolio 2026</span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ol className="flex items-center gap-7">
            {SECTIONS.map((s, i) => {
              const isActive = onHome && active === s.id;
              return (
                <li key={s.id}>
                  <a href={href(s.id)} className="t-meta group flex items-center gap-2" aria-current={isActive ? "true" : undefined}>
                    <span className={clsx("h-[6px] w-[6px] transition-colors", isActive ? "bg-ivory" : "bg-transparent outline outline-1 outline-ivory/50")} />
                    <span className="opacity-60">{String(i + 1).padStart(2, "0")}</span>
                    <span className="link-wipe">{s.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="t-meta hidden items-center gap-2 lg:flex" aria-hidden>
          <span className="rec-dot h-2 w-2 rounded-full bg-ivory" />
          REC <Timecode />
        </div>

        <button
          type="button"
          className="t-meta flex h-11 items-center gap-2 lg:hidden"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          Menu <span className="flex flex-col gap-[3px]"><span className="block h-[1.5px] w-5 bg-ivory" /><span className="block h-[1.5px] w-5 bg-ivory" /></span>
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="gutter fixed inset-0 z-[60] flex flex-col bg-red pb-6 text-ink"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="flex h-[var(--nav-h)] items-center justify-between">
              <span className="t-meta">Scene index</span>
              <button type="button" className="t-meta h-11" onClick={() => setOpen(false)} autoFocus>
                Close ✕
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center">
              <ol>
                {SECTIONS.map((s, i) => (
                  <li key={s.id} className="overflow-hidden border-t border-ink/25 last:border-b">
                    <motion.a
                      href={href(s.id)}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline justify-between py-2"
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.05 }}
                    >
                      <span className="t-display text-[clamp(41px,12.8vw,102px)]">{s.label}</span>
                      <span className="t-meta">{String(i + 1).padStart(2, "0")}</span>
                    </motion.a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="t-meta grid grid-cols-2 gap-3">
              {email && <a href={`mailto:${email}`} className="col-span-2 normal-case tracking-normal">{email}</a>}
              {links.map((l) => (
                <a key={l.key} href={l.href} target="_blank" rel="noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
