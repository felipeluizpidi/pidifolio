import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { defaultLocale } from "@/lib/i18n";

// Next.js renders not-found.tsx without the segment's params, so this falls back to the default locale.
export default function NotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <section className="gutter flex min-h-[100svh] flex-col justify-between bg-ink pb-8 pt-[calc(var(--nav-h)+24px)] text-ivory">
      <p className="t-meta">{dict.error404}</p>
      <h1 className="t-display text-[clamp(96px,24vw,420px)] text-red">{dict.cut}</h1>
      <div className="flex justify-between">
        <p className="t-meta">{dict.notInTheEdit}</p>
        <Link href={`/${defaultLocale}`} className="t-meta link-wipe">{dict.backToFrameArrow}</Link>
      </div>
    </section>
  );
}
