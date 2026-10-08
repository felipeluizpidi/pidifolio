import type { Settings } from "@/lib/types";
import { MaskLines, Reveal } from "./Motion";

export function Contact({ s, cvHref }: { s: Settings; cvHref?: string }) {
  const c = s.contact;
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative flex min-h-[100svh] flex-col bg-red text-ink">
      <div className="gutter flex flex-1 flex-col pt-[calc(var(--nav-h)+24px)]">
        <div className="t-meta flex justify-between">
          <span>Scene 05 / Contact</span>
          <span className="flex items-center gap-2">
            <span className="rec-dot h-2 w-2 rounded-full bg-ink" /> Now casting
          </span>
        </div>

        <h2 id="contact-title" className="t-display mt-6 text-[clamp(52px,14.6vw,290px)]">
          <MaskLines lines={c.headline} stagger={0.1} accentIndex={c.headline.length - 1} accentClassName="text-ivory" />
        </h2>

        <div className="mt-10 grid flex-1 content-end gap-10 pb-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="t-heavy text-[clamp(20px,2.2vw,34px)]">{c.copy}</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6">
            {c.email ? (
              <a href={`mailto:${c.email}`} className="group block border-b-2 border-ink pb-2">
                <span className="t-meta block">Write to</span>
                <span className="mt-1 block break-all font-heavy text-[clamp(22px,3.4vw,56px)] leading-none tracking-tight transition-colors group-hover:text-ivory">
                  {c.email}
                </span>
              </a>
            ) : (
              <p className="t-meta">Set a contact email in /admin → Settings.</p>
            )}
            <dl className="t-meta mt-6 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
              <div>
                <dt className="opacity-60">LinkedIn</dt>
                <dd><a className="link-wipe" href={s.social.linkedin} target="_blank" rel="noreferrer">Profile ↗</a></dd>
              </div>
              <div>
                <dt className="opacity-60">Behance</dt>
                <dd><a className="link-wipe" href={s.social.behance} target="_blank" rel="noreferrer">Portfolio ↗</a></dd>
              </div>
              <div>
                <dt className="opacity-60">Based in</dt>
                <dd>{c.location}</dd>
              </div>
              <div>
                <dt className="opacity-60">Availability</dt>
                <dd>{c.availability}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </div>

      {/* End credits */}
      <footer className="gutter border-t border-ink bg-ink py-8 text-ivory">
        <div className="t-meta grid grid-cols-2 gap-6 md:grid-cols-4">
          <div>
            <p className="text-ivory/50">Directed by</p>
            <p>{s.name.full}</p>
          </div>
          <div>
            <p className="text-ivory/50">Role</p>
            <p>{s.role}</p>
          </div>
          <div>
            <p className="text-ivory/50">Shot in</p>
            <p>{c.location}</p>
          </div>
          <div className="md:text-right">
            <p className="text-ivory/50">Reels</p>
            <p className="flex flex-wrap gap-3 md:justify-end">
              <a className="link-wipe" href={s.social.behance} target="_blank" rel="noreferrer">Behance</a>
              <a className="link-wipe" href={s.social.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              {cvHref && <a className="link-wipe" href={cvHref} download>CV</a>}
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-ivory/20 pt-4 md:flex-row md:items-end">
          <p className="t-display text-[clamp(40px,6vw,96px)] text-red">{s.footer.tagline}</p>
          <div className="t-meta md:text-right">
            <p>{s.footer.signature}</p>
            <p className="text-ivory/60">{s.role}</p>
            <a href="#home" className="link-wipe mt-2 inline-block">Back to frame 001 ↑</a>
          </div>
        </div>
      </footer>
    </section>
  );
}
