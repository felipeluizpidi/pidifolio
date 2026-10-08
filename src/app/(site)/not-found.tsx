import Link from "next/link";

export default function NotFound() {
  return (
    <section className="gutter flex min-h-[100svh] flex-col justify-between bg-ink pb-8 pt-[calc(var(--nav-h)+24px)] text-ivory">
      <p className="t-meta">Error 404 / Missing reel</p>
      <h1 className="t-display text-[clamp(96px,24vw,420px)] text-red">Cut.</h1>
      <div className="flex justify-between">
        <p className="t-meta">This scene isn&apos;t in the edit.</p>
        <Link href="/" className="t-meta link-wipe">Back to frame 001 →</Link>
      </div>
    </section>
  );
}
