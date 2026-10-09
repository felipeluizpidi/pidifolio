import type { MediaAsset, Settings } from "@/lib/types";
import { socialLinks } from "@/lib/social";
import { Media } from "../media/Media";
import { ClipReveal, MaskLines, Reveal } from "./Motion";

export function About({ s, portrait, cvHref }: { s: Settings; portrait?: MediaAsset; cvHref?: string }) {
  const a = s.about;
  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-ink text-ivory">
      <div className="gutter pb-24 pt-[calc(var(--nav-h)+28px)] md:pb-32">
        <div className="t-meta flex justify-between">
          <span>Scene 04 / About</span>
          <span>Portrait — B&amp;W</span>
        </div>

        <h2 id="about-title" className="t-display mt-7 text-[clamp(54px,10.6vw,196px)]">
          <MaskLines lines={a.headline} accentIndex={1} accentClassName="text-red" />
        </h2>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-[var(--gutter)]">
          {/* Portrait */}
          <div className="relative lg:col-span-5 lg:col-start-1">
            <ClipReveal className="relative aspect-[4/5] overflow-hidden">
              <Media asset={portrait} sizes="(min-width:1024px) 42vw, 100vw" imgClassName="grayscale contrast-125" emptyLabel="About portrait" ratio="4:5" />
            </ClipReveal>
            <p className="t-meta-sm mt-2.5 flex justify-between text-ivory/60">
              <span>Fig. 01 — {s.name.full}</span>
              <span>{s.contact.location}</span>
            </p>
          </div>

          {/* Bio + disciplines */}
          <div className="flex flex-col gap-14 lg:col-span-7">
            <Reveal className="gap-[var(--gutter)] text-[16px] leading-[1.6] text-ivory/85 md:columns-2 md:text-[17px]">
              {a.bio.map((para, i) => (
                <p key={i} className={i === 0 ? "mb-5 break-inside-avoid text-ivory first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[68px] first-letter:leading-[0.8] first-letter:text-red" : "mb-5 break-inside-avoid"}>
                  {para}
                </p>
              ))}
            </Reveal>

            <div>
              <p className="t-meta mb-3.5 text-ivory/60">Disciplines</p>
              <div role="list" className="border-t border-ivory/25">
                {a.disciplines.map((d, i) => (
                  <Reveal key={d} delay={i * 0.04} role="listitem" className="group flex items-baseline justify-between border-b border-ivory/25 py-1.5">
                    <span className={`t-display text-[clamp(29px,3.7vw,65px)] transition-colors ${i % 2 ? "outline-type text-ivory group-hover:text-ivory" : "group-hover:text-orange"}`}>{d}</span>
                    <span className="t-meta text-ivory/50">{String(i + 1).padStart(2, "0")}</span>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="t-meta mt-14 flex flex-wrap items-center gap-x-8 gap-y-3.5">
          {socialLinks(s).map((l) => (
            <a key={l.key} href={l.href} target="_blank" rel="noreferrer" className="link-wipe">
              {l.label} ↗
            </a>
          ))}
          {cvHref && (
            <a href={cvHref} download className="bg-ivory px-3 py-2 text-ink transition-colors hover:bg-red hover:text-ivory">
              Download CV ↓
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
