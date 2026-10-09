import type { Settings } from "@/lib/types";
import { Reveal } from "./Motion";

/** Opening-credit strip of career figures — sits between the hero and the first project. */
export function CareerStats({ s }: { s: Settings }) {
  const items = s.about.metrics.filter((m) => m.value.trim() && m.label.trim());
  if (!items.length) return null;
  return (
    <section aria-labelledby="numbers-title" className="gutter bg-ink pb-12 pt-10 text-ivory md:pb-16 md:pt-14">
      <div className="t-meta flex justify-between gap-6">
        <h2 id="numbers-title">Career in numbers</h2>
        <span className="text-ivory/60">{s.hero.meta[2] ?? ""}</span>
      </div>
      <dl className="mt-7 grid grid-cols-2 border-t border-ivory/25 md:grid-cols-3 xl:grid-cols-6">
        {items.map((m, i) => (
          <Reveal
            key={m.label}
            delay={i * 0.06}
            className="flex flex-col border-b border-ivory/15 py-6 pr-4 md:py-7 xl:border-b-0 xl:border-r xl:px-5 xl:first:pl-0 xl:last:border-r-0"
          >
            <dt className="t-meta order-2 mt-3.5 max-w-[22ch] text-ivory/80">{m.label}</dt>
            <dd className="t-display order-1 text-[clamp(48px,5.6vw,92px)] leading-[0.9] text-red">{m.value}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
