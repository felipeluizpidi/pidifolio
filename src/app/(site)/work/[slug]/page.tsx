import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getPublishedProjects } from "@/lib/queries";
import { Media } from "@/components/media/Media";
import { AmbientVideo } from "@/components/media/Video";
import { CaseBlocks } from "@/components/site/CaseBlocks";
import { MaskLines, Reveal } from "@/components/site/Motion";
import { Contact } from "@/components/site/Contact";
import { cvHref } from "@/lib/cv";

export const revalidate = 300;

/** "131,582,404 impressions across the content" → ["131,582,404", "impressions across the content"]. */
function parseOutcomeLine(line: string): { value: string; label: string } {
  const m = /^([+-]?\d[\d.,]*(?:[KkMmBb])?%?\+?)\s+(.+)$/.exec(line.trim());
  return m ? { value: m[1], label: m[2] } : { value: "", label: line.trim() };
}

export async function generateStaticParams() {
  const { projects } = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await getProjectBySlug((await params).slug);
  if (!data) return {};
  const { project: p } = data;
  const description = (p.overview || p.subtitle || p.title).slice(0, 160);
  return {
    title: `${p.title}${p.subtitle ? ` — ${p.subtitle}` : ""}`,
    description,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { title: p.title, description, images: p.cover?.kind === "image" ? [{ url: p.cover.src }] : undefined },
  };
}

function Chapter({ n, label, text }: { n: number; label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <Reveal className="grid gap-5 border-t border-ivory/25 py-9 md:grid-cols-12 md:py-14">
      <p className="t-meta md:col-span-3">
        <span className="text-[var(--accent)]">Scene {String(n).padStart(2, "0")}</span>
        <br />
        {label}
      </p>
      <div className="space-y-6 text-[clamp(18px,1.7vw,25px)] leading-[1.4] md:col-span-8 md:col-start-5">
        {text.split(/\n{2,}/).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
    </Reveal>
  );
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getProjectBySlug((await params).slug);
  if (!data) notFound();
  const { project: p, next, settings: s, media } = data;
  const poster = p.coverVideo?.posterId ? media[p.coverVideo.posterId]?.src : p.cover?.src;
  const chapters = [
    ["Overview", p.overview],
    ["Creative Challenge", p.challenge],
    ["Concept & Direction", p.concept],
    ["Process", p.process],
  ] as const;
  let n = 0;

  return (
    <article style={{ ["--accent" as string]: p.accent }} className="bg-ink text-ivory">
      {/* Opening */}
      <header className="relative isolate flex h-[100svh] min-h-[560px] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Media asset={p.cover} sizes="100vw" priority emptyLabel="Cover image" />
          {p.coverVideo?.kind === "video" && <AmbientVideo src={p.coverVideo.src} poster={poster} />}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,11,.6),transparent_30%,transparent_45%,rgba(11,11,11,.92))]" />
        </div>
        <div className="gutter absolute inset-x-0 top-[calc(var(--nav-h)+8px)] flex justify-between">
          <Link href="/#work" className="t-meta link-wipe">
            ← Back to the index
          </Link>
          <span className="t-meta text-right">
            Project {p.number}
            {p.demo && (
              <>
                <br />
                <span className="bg-ivory px-1 text-ink">Demo content</span>
              </>
            )}
          </span>
        </div>
        <div className="gutter pb-6">
          <p className="t-meta mb-2.5">{p.categories.map((c) => c.title).join(" / ")}</p>
          <h1 className="t-display text-[clamp(61px,14.5vw,272px)] text-[var(--accent)]">
            <MaskLines inView={false} delay={0.35} lines={[p.title]} />
          </h1>
          {p.subtitle && <p className="t-heavy mt-2.5 text-[clamp(19px,2.6vw,41px)]">{p.subtitle}</p>}
        </div>
      </header>

      {/* Metadata */}
      <dl className="gutter t-meta grid grid-cols-2 gap-y-6 border-y border-ivory/25 py-6 md:grid-cols-4">
        {[
          ["Client", p.client || "—"],
          ["Year", String(p.year)],
          ["Role", p.role || "—"],
          ["Disciplines", p.disciplines.join(", ") || "—"],
        ].map(([k, v]) => (
          <div key={k} className="pr-4">
            <dt className="text-ivory/50">{k}</dt>
            <dd className="mt-1 normal-case tracking-normal text-[14px] font-sans">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="gutter py-14 md:py-24">
        {chapters.map(([label, text]) => (text.trim() ? <Chapter key={label} n={++n} label={label} text={text} /> : null))}
      </div>

      {p.blocks.length > 0 && (
        <section aria-label="Visual gallery" className="gutter pb-28">
          <p className="t-meta mb-9 border-t border-ivory/25 pt-5">
            <span className="text-[var(--accent)]">Scene {String(++n).padStart(2, "0")}</span> — Visual gallery
          </p>
          <CaseBlocks blocks={p.blocks} media={media} />
        </section>
      )}

      {p.outcomes.trim() && (
        <section aria-label="Outcomes" className="gutter pb-24">
          <div className="border-t border-ivory/25 pt-5">
            <p className="t-meta">
              <span className="text-[var(--accent)]">Scene {String(++n).padStart(2, "0")}</span> — Outcomes
            </p>
            <dl
              role="list"
              className={`mt-7 grid grid-cols-1 border-t border-ivory/25 sm:grid-cols-2 lg:grid-cols-3 ${
                p.outcomes.split("\n").filter((l) => l.trim()).length > 4 ? "xl:grid-cols-5" : "xl:grid-cols-4"
              }`}
            >
              {p.outcomes
                .split("\n")
                .filter((l) => l.trim())
                .map(parseOutcomeLine)
                .map((o, i) => (
                  <Reveal
                    key={i}
                    delay={i * 0.06}
                    role="listitem"
                    className="flex flex-col border-b border-ivory/15 py-6 pr-4 sm:py-7 xl:border-b-0 xl:border-r xl:px-5 xl:first:pl-0 xl:last:border-r-0"
                  >
                    <dt className="t-meta order-2 mt-3.5 max-w-[22ch] text-ivory/80">{o.label}</dt>
                    <dd className="t-display order-1 break-words text-[clamp(32px,4.8vw,80px)] leading-[0.95]" style={{ color: "var(--accent)" }}>
                      {o.value}
                    </dd>
                  </Reveal>
                ))}
            </dl>
          </div>
        </section>
      )}

      {p.credits.length > 0 && (() => {
        const mine = p.credits.find((c) => c.name === s.name.full);
        const others = p.credits.filter((c) => c !== mine);
        // Same role, several people (e.g. two models) — one row, names listed together.
        const grouped = others.reduce<{ role: string; people: typeof others }[]>((acc, c) => {
          const g = acc.find((x) => x.role === c.role);
          if (g) g.people.push(c);
          else acc.push({ role: c.role, people: [c] });
          return acc;
        }, []);
        const CreditLink = ({ c }: { c: (typeof p.credits)[number] }) =>
          c.url ? (
            <a href={c.url} target="_blank" rel="noreferrer" className="link-wipe">
              {c.name}
            </a>
          ) : (
            <>{c.name}</>
          );
        return (
          <section aria-label="Credits" className="gutter py-24">
            <p className="t-meta mb-9 text-center text-ivory/50">— Credits —</p>

            {mine && (
              <div className="mx-auto mb-16 max-w-[520px] text-center">
                <p className="t-heavy text-[clamp(17px,1.8vw,22px)]">
                  <CreditLink c={mine} />
                </p>
                <p className="t-meta mt-2 text-ivory/60">{mine.role}</p>
              </div>
            )}

            {grouped.length > 0 && (
              <ul className="mx-auto grid max-w-[920px] grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
                {grouped.map((g, i) => (
                  <li key={i} className="t-meta">
                    <p className="text-ivory/50">{g.role}</p>
                    <p className="mt-1">
                      {g.people.map((c, j) => (
                        <span key={j}>
                          <CreditLink c={c} />
                          {j < g.people.length - 1 && ", "}
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })()}

      {next && (
        <Link href={`/work/${next.slug}`} className="group relative block h-[80svh] min-h-[480px] overflow-hidden" aria-label={`Next project: ${next.title}`}>
          <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(.2,.7,.15,1)] group-hover:scale-[1.04]">
            <Media asset={next.cover} sizes="100vw" emptyLabel="Next project" />
          </div>
          <div className="absolute inset-0 bg-ink/50 transition-colors duration-700 group-hover:bg-ink/30" />
          <div className="gutter absolute inset-0 flex flex-col justify-between py-8">
            <p className="t-meta flex justify-between">
              <span>Next reel</span>
              <span>Project {next.number}</span>
            </p>
            <div>
              <p className="t-display text-[clamp(61px,13.6vw,255px)]" style={{ color: next.accent }}>
                {next.title}
              </p>
              <p className="t-meta mt-2.5">Continue →</p>
            </div>
          </div>
        </Link>
      )}

      <Contact s={s} cvHref={cvHref(s, media)} />
    </article>
  );
}
