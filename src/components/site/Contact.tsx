import type { Settings } from "@/lib/types";
import type { Dict } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import { socialLinks } from "@/lib/social";
import { MaskLines, Reveal } from "./Motion";
import { ContactForm } from "./ContactForm";

export function Contact({ s, cvHref, locale, dict }: { s: Settings; cvHref?: string; locale: Locale; dict: Dict }) {
  const c = s.contact;
  const links = socialLinks(s, dict);
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative flex min-h-[100svh] flex-col bg-red text-ink">
      <div className="gutter flex flex-1 flex-col pt-[calc(var(--nav-h)+28px)]">
        <div className="t-meta flex justify-between">
          <span>{dict.sceneContact}</span>
          <span className="flex items-center gap-2">
            <span className="rec-dot h-2 w-2 rounded-full bg-ink" /> {dict.nowCasting}
          </span>
        </div>

        <h2 id="contact-title" className="t-display mt-7 text-[clamp(44px,12.4vw,246px)]">
          <MaskLines lines={c.headline} stagger={0.1} accentIndex={c.headline.length - 1} accentClassName="text-ivory" />
        </h2>

        <div className="mt-14 grid flex-1 content-end gap-14 pb-12 lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <Reveal className="flex flex-col gap-9 lg:col-span-5">
            <p className="t-heavy text-[clamp(19px,1.9vw,29px)]">{c.copy}</p>
            {c.email ? (
              <a href={`mailto:${c.email}`} className="group block border-b-2 border-ink pb-2">
                <span className="t-meta block">{dict.writeTo}</span>
                <span className="mt-1.5 block break-all font-heavy text-[clamp(19px,2.2vw,34px)] leading-none tracking-tight transition-colors group-hover:text-ivory">
                  {c.email}
                </span>
              </a>
            ) : (
              <p className="t-meta">{dict.setContactEmail}</p>
            )}
            <dl className="t-meta grid grid-cols-2 gap-x-6 gap-y-5">
              {links.map((l) => (
                <div key={l.key}>
                  <dt className="opacity-60">{l.label}</dt>
                  <dd className="mt-0.5">
                    <a className="link-wipe" href={l.href} target="_blank" rel="noreferrer">
                      {l.value}
                    </a>
                  </dd>
                </div>
              ))}
              <div>
                <dt className="opacity-60">{dict.basedIn}</dt>
                <dd className="mt-0.5">{c.location}</dd>
              </div>
              <div>
                <dt className="opacity-60">{dict.availability}</dt>
                <dd className="mt-0.5">{c.availability}</dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <ContactForm email={c.email} locale={locale} dict={dict} />
          </Reveal>
        </div>
      </div>

      {/* End credits */}
      <footer className="gutter border-t border-ink bg-ink py-9 text-ivory">
        <div className="t-meta grid grid-cols-2 gap-7 md:grid-cols-4">
          <div>
            <p className="text-ivory/50">{dict.directedBy}</p>
            <p>{s.name.full}</p>
          </div>
          <div>
            <p className="text-ivory/50">{dict.role}</p>
            <p>{s.role}</p>
          </div>
          <div>
            <p className="text-ivory/50">{dict.shotIn}</p>
            <p>{c.location}</p>
          </div>
          <div className="md:text-right">
            <p className="text-ivory/50">{dict.reels}</p>
            <p className="flex flex-wrap gap-x-3 gap-y-1 md:justify-end">
              {links.map((l) => (
                <a key={l.key} className="link-wipe" href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
              {cvHref && (
                <a className="link-wipe" href={cvHref} download>
                  {dict.cv}
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-ivory/20 pt-5 md:flex-row md:items-end">
          <p className="t-display text-[clamp(34px,5.1vw,82px)] text-red">{s.footer.tagline}</p>
          <div className="t-meta md:text-right">
            <p>{s.footer.signature}</p>
            <p className="text-ivory/60">{s.role}</p>
            <a href="#home" className="link-wipe mt-2 inline-block">
              {dict.backToFrameUp}
            </a>
          </div>
        </div>
      </footer>
    </section>
  );
}
