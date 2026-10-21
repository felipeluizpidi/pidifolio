import type { ClientLogo, MediaAsset } from "@/lib/types";
import type { Dict } from "@/lib/dictionary";

/** Auto-scrolling strip of client-brand logos — sits between the hero and the career numbers. */
export function ClientLogos({ clients, media, dict }: { clients: ClientLogo[]; media: Record<string, MediaAsset>; dict: Dict }) {
  const items = clients.map((c) => ({ ...c, logo: media[c.logoId] })).filter((c) => c.logo);
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <section aria-labelledby="clients-title" className="gutter border-t border-ivory/15 bg-ink pb-10 pt-10 text-ivory md:pb-12 md:pt-12">
      <h2 id="clients-title" className="t-meta text-ivory/60">
        {dict.clientsHeadline}
      </h2>
      <div className="relative mt-6 overflow-hidden">
        <div className="marquee-slow flex w-max items-center gap-16 whitespace-nowrap">
          {[...row, ...row].map((c, i) => (
            <img
              key={`${c.id}-${i}`}
              src={c.logo!.src}
              alt={c.name}
              className="h-6 w-auto shrink-0 opacity-90 grayscale md:h-7"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
