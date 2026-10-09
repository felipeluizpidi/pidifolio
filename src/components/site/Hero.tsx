"use client";

import { getImageProps } from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { MediaAsset, Settings } from "@/lib/types";
import { EASE, MaskLines } from "./Motion";

function ArtDirectedPortrait({ desktop, mobile }: { desktop?: MediaAsset; mobile?: MediaAsset }) {
  const d = desktop ?? mobile;
  const m = mobile ?? desktop;
  if (!d || !m) return <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_35%,#5a0d06,#0b0b0b_70%)]" />;
  const common = { alt: d.alt, fill: true, priority: true, quality: 82 } as const;
  const { props: dp } = getImageProps({ ...common, src: d.src, sizes: "100vw" });
  const { props: mp } = getImageProps({ ...common, src: m.src, sizes: "100vw" });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={dp.srcSet} sizes="100vw" />
      <source media="(max-width: 767px)" srcSet={mp.srcSet} sizes="100vw" />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...mp} className="absolute inset-0 h-full w-full object-cover object-[50%_30%] md:object-[60%_35%]" />
    </picture>
  );
}

export function Hero({ s, desktop, mobile }: { s: Settings; desktop?: MediaAsset; mobile?: MediaAsset }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const typeY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const [first, last] = [s.name.first, s.name.last];
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <section
      id="home"
      ref={ref}
      aria-label={`${s.name.full} — ${s.role}`}
      className="relative isolate h-[100svh] min-h-[620px] overflow-hidden bg-ink text-ivory"
    >
      {/* Portrait — opens through a horizontal gate */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ clipPath: "inset(48% 0% 48% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ duration: 1.25, ease: [0.7, 0, 0.15, 1], delay: 0.1 }}
      >
        <motion.div className="absolute inset-[-4%_0]" style={{ y: imgY }} initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease: EASE }}>
          <ArtDirectedPortrait desktop={desktop} mobile={mobile} />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,11,.55),transparent_28%,transparent_55%,rgba(11,11,11,.85))]" />
      </motion.div>

      {/* Top metadata */}
      <div className="gutter absolute inset-x-0 top-[calc(var(--nav-h)+8px)] flex justify-between">
        <motion.p className="t-meta" {...fade(1.0)}>
          Frame 001 / Creative Direction
          <br />
          <span className="text-ivory/60">35mm / Digital / Art Direction</span>
        </motion.p>
        <motion.ul className="t-meta text-right" {...fade(1.1)}>
          {s.hero.meta.slice(0, 2).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </motion.ul>
      </div>

      {/* The name — poster-scale, cut by the frame */}
      <motion.h1
        style={{ y: typeY }}
        className="pointer-events-none absolute inset-x-0 bottom-[212px] top-[calc(var(--nav-h)+64px)] text-red [--nm:min(34vw,23.8svh)] md:bottom-[74px] md:[--nm:min(23vw,35svh)]"
      >
        <span className="sr-only">{s.name.full}</span>
        <span aria-hidden className="t-display absolute bottom-[calc(var(--nm)*0.86)] left-[calc(var(--gutter)-0.04em)] text-[length:var(--nm)] md:bottom-auto md:top-0">
          <MaskLines inView={false} lines={[first]} delay={0.45} />
        </span>
        <span aria-hidden className="t-display absolute bottom-0 left-[calc(var(--gutter)-0.04em)] text-[length:var(--nm)] md:left-auto md:right-[calc(var(--gutter)-0.02em)]">
          <MaskLines inView={false} lines={[last]} delay={0.58} />
        </span>
      </motion.h1>

      {/* Role + lead — bottom-left, clear of the name on every breakpoint */}
      <div className="gutter absolute inset-x-0 bottom-0 flex items-end justify-between pb-6 md:bottom-[calc(74px+min(23vw,35svh)*0.2)] md:pb-0">
        <div className="md:max-w-[42%]">
          <motion.p {...fade(0.95)} className="t-heavy text-[clamp(19px,2.9vw,44px)] text-ivory">
            {s.hero.roleLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </motion.p>
          <motion.p {...fade(1.25)} className="mt-3.5 max-w-[38ch] text-[14px] leading-snug text-ivory/85 md:mt-5 md:text-[15px] lg:text-[17px]">
            {s.hero.lead}
          </motion.p>
        </div>
      </div>

      {/* Credit strip */}
      <motion.div
        {...fade(1.4)}
        className="gutter absolute inset-x-0 bottom-0 hidden h-[52px] items-center justify-between border-t border-ivory/20 md:flex"
      >
        <span className="t-meta">{s.hero.meta[2] ?? "Selected works / 2026"}</span>
        <a href="#work" className="t-meta group flex items-center gap-3">
          <span className="link-wipe">{s.hero.cta}</span> ↓
        </a>
        <span className="t-meta text-ivory/60">Aspect 2.39 : 1 — Scene 01</span>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#work"
        aria-label={s.hero.cta}
        {...fade(1.5)}
        className="absolute bottom-[132px] right-[var(--gutter)] flex flex-col items-center gap-2 md:bottom-[84px] md:left-1/2 md:right-auto"
      >
        <span className="scroll-cue relative block h-[72px] w-px bg-ivory/30" />
        <span className="t-meta-sm md:hidden">Scroll</span>
      </motion.a>
    </section>
  );
}
